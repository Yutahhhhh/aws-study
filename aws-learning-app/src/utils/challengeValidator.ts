import type { DiagramConfig, DiagramConnection } from '../types/diagram';
import type {
  AwsArchitectureRules,
  ChallengeAction,
  ChallengeActionResult,
  ChallengeCheck,
  ChallengeConfig,
  ChallengeRunResult,
} from '../types/challenge';

const findConnection = (
  connections: DiagramConnection[],
  from: string,
  to: string,
) => connections.find((connection) => connection.from === from && connection.to === to);

const getPathProgress = (diagram: DiagramConfig, path: string[]) => {
  const activeNodeIds: string[] = [];
  const activeConnectionIds: string[] = [];

  for (let index = 0; index < path.length; index += 1) {
    const nodeId = path[index];
    if (!diagram.nodes.some((node) => node.id === nodeId)) break;

    activeNodeIds.push(nodeId);

    const nextNodeId = path[index + 1];
    if (!nextNodeId) continue;

    const connection = findConnection(diagram.connections, nodeId, nextNodeId);
    if (!connection) break;
    activeConnectionIds.push(connection.id);
  }

  return {
    complete: activeNodeIds.length === path.length && activeConnectionIds.length === path.length - 1,
    activeNodeIds,
    activeConnectionIds,
  };
};

const toZoneParentId = (zoneId: string) => `zone-${zoneId}`;

/**
 * ノードが Subnet 内にあるか。
 * 構造モデル（parentId / parentZoneId 使用時）は親子関係で判定し、
 * 旧フラットモデルのみ座標の包含で判定する。
 */
const isNodeInZone = (diagram: DiagramConfig, nodeId: string, zoneId: string) => {
  const node = diagram.nodes.find((item) => item.id === nodeId);
  const zone = diagram.zones.find((item) => item.id === zoneId);
  if (!node || !zone) return false;

  if (node.parentId !== undefined || zone.parentZoneId !== undefined) {
    return node.parentId === toZoneParentId(zoneId);
  }

  const nodeCenter = {
    x: node.position.x + node.position.width / 2,
    y: node.position.y + node.position.height / 2,
  };

  return (
    nodeCenter.x >= zone.position.x &&
    nodeCenter.x <= zone.position.x + zone.position.width &&
    nodeCenter.y >= zone.position.y &&
    nodeCenter.y <= zone.position.y + zone.position.height
  );
};

const isZoneInZone = (diagram: DiagramConfig, zoneId: string, parentZoneId: string) => {
  const zone = diagram.zones.find((item) => item.id === zoneId);
  const parentZone = diagram.zones.find((item) => item.id === parentZoneId);
  if (!zone || !parentZone) return false;

  if (zone.parentZoneId !== undefined) {
    return zone.parentZoneId === parentZoneId;
  }

  return (
    zone.position.x >= parentZone.position.x &&
    zone.position.y >= parentZone.position.y &&
    zone.position.x + zone.position.width <= parentZone.position.x + parentZone.position.width &&
    zone.position.y + zone.position.height <= parentZone.position.y + parentZone.position.height
  );
};

/** 関連付け（SG→リソース / RT→Subnet）が parentId で成立しているか。 */
const isNodeAttachedTo = (
  diagram: DiagramConfig,
  nodeId: string,
  targetId: string,
  targetIsZone: boolean,
) => {
  const node = diagram.nodes.find((item) => item.id === nodeId);
  if (!node) return false;
  const expected = targetIsZone ? toZoneParentId(targetId) : targetId;
  return node.parentId === expected;
};

const evaluateCheck = (diagram: DiagramConfig, check: ChallengeCheck) => {
  switch (check.type) {
    case 'zone-exists': {
      const exists = diagram.zones.some((zone) => zone.id === check.zoneId);
      return {
        passed: exists,
        activeNodeIds: [],
        activeConnectionIds: [],
      };
    }
    case 'zone-in-zone':
      return {
        passed: isZoneInZone(diagram, check.zoneId, check.parentZoneId),
        activeNodeIds: [],
        activeConnectionIds: [],
      };
    case 'node-exists': {
      const exists = diagram.nodes.some((node) => node.id === check.nodeId);
      return {
        passed: exists,
        activeNodeIds: exists ? [check.nodeId] : [],
        activeConnectionIds: [],
      };
    }
    case 'path-exists':
      return {
        passed: getPathProgress(diagram, check.path).complete,
        ...getPathProgress(diagram, check.path),
      };
    case 'connection-exists': {
      const connection = findConnection(diagram.connections, check.from, check.to);
      return {
        passed: Boolean(connection),
        activeNodeIds: [check.from, check.to].filter((nodeId) =>
          diagram.nodes.some((node) => node.id === nodeId),
        ),
        activeConnectionIds: connection ? [connection.id] : [],
      };
    }
    case 'node-in-zone':
      return {
        passed: isNodeInZone(diagram, check.nodeId, check.zoneId),
        activeNodeIds: diagram.nodes.some((node) => node.id === check.nodeId) ? [check.nodeId] : [],
        activeConnectionIds: [],
      };
    case 'node-attached-to':
      return {
        passed: isNodeAttachedTo(diagram, check.nodeId, check.targetId, check.targetIsZone ?? false),
        activeNodeIds: diagram.nodes.some((node) => node.id === check.nodeId) ? [check.nodeId] : [],
        activeConnectionIds: [],
      };
    case 'incoming-only-from': {
      const incomingConnections = diagram.connections.filter((connection) => connection.to === check.nodeId);
      const invalidConnections = incomingConnections.filter(
        (connection) => !check.allowedSourceIds.includes(connection.from),
      );
      return {
        passed: invalidConnections.length === 0,
        activeNodeIds: [
          check.nodeId,
          ...invalidConnections.map((connection) => connection.from),
        ].filter((nodeId, index, array) => array.indexOf(nodeId) === index),
        activeConnectionIds: invalidConnections.map((connection) => connection.id),
      };
    }
  }
};

const mergeUnique = (...groups: string[][]) =>
  groups.flat().filter((item, index, array) => array.indexOf(item) === index);

const createAwsFoundationChecks = (rules: AwsArchitectureRules): ChallengeCheck[] => {
  const checks: ChallengeCheck[] = [
    {
      id: 'aws-foundation-vpc',
      type: 'zone-exists',
      zoneId: rules.vpcZoneId,
      label: 'VPCが定義されている',
      failureMessage:
        'VPCがない構成では、Subnet、Route Table、Security Groupを関連付けられません。VPC内にネットワーク境界を作ってから各リソースを配置します。',
    },
    ...rules.publicSubnetZoneIds.map<ChallengeCheck>((zoneId) => ({
      id: `aws-foundation-public-subnet-${zoneId}`,
      type: 'zone-exists',
      zoneId,
      label: 'Public Subnetが定義されている',
      failureMessage:
        '外部公開する入口を置くPublic Subnetがありません。インターネットから受けるリソースは公開用のSubnetに分離します。',
    })),
    ...rules.publicSubnetZoneIds.map<ChallengeCheck>((zoneId) => ({
      id: `aws-foundation-public-subnet-in-vpc-${zoneId}`,
      type: 'zone-in-zone',
      zoneId,
      parentZoneId: rules.vpcZoneId,
      label: 'Public SubnetがVPC内にある',
      failureMessage:
        'Public SubnetがVPCの外にあります。AWSのSubnetは必ずVPC内に作成され、VPCのCIDR範囲から切り出されます。',
    })),
    ...rules.privateSubnetZoneIds.map<ChallengeCheck>((zoneId) => ({
      id: `aws-foundation-private-subnet-${zoneId}`,
      type: 'zone-exists',
      zoneId,
      label: 'Private Subnetが定義されている',
      failureMessage:
        'アプリケーションやDBを置くPrivate Subnetがありません。直接公開しない処理層とデータ層を分離する必要があります。',
    })),
    ...rules.privateSubnetZoneIds.map<ChallengeCheck>((zoneId) => ({
      id: `aws-foundation-private-subnet-in-vpc-${zoneId}`,
      type: 'zone-in-zone',
      zoneId,
      parentZoneId: rules.vpcZoneId,
      label: 'Private SubnetがVPC内にある',
      failureMessage:
        'Private SubnetがVPCの外にあります。AWSのSubnetは必ずVPC内に作成され、VPCのCIDR範囲から切り出されます。',
    })),
  ];

  if (rules.internetGatewayNodeId) {
    checks.push({
      id: 'aws-foundation-internet-gateway',
      type: 'node-exists',
      nodeId: rules.internetGatewayNodeId,
      label: 'Internet Gatewayが定義されている',
      failureMessage:
        'Public Subnetをインターネットと接続するInternet Gatewayがありません。公開入口を置く構成ではVPCに外部接続点が必要です。',
    });
  }

  for (const routeTable of rules.routeTables) {
    checks.push(
      {
        id: `aws-foundation-route-table-${routeTable.routeTableNodeId}`,
        type: 'node-exists',
        nodeId: routeTable.routeTableNodeId,
        label: `${routeTable.label} が定義されている`,
        failureMessage:
          'SubnetにはRoute Tableの関連付けが必要です。どの宛先へ通信を流すかが決まらないため、このままではネットワーク経路として成立しません。',
      },
      {
        id: `aws-foundation-route-table-zone-${routeTable.routeTableNodeId}`,
        type: 'node-attached-to',
        nodeId: routeTable.routeTableNodeId,
        targetId: routeTable.subnetZoneId,
        targetIsZone: true,
        label: `${routeTable.label} が対象Subnetに関連付けられている`,
        failureMessage:
          'Route Tableが対象Subnetに関連付けられていません。Route TableはSubnetの中に置く部品ではなく、Subnetに「関連付ける」設定です。対象Subnetへ関連付けてください。',
      },
    );

    if (routeTable.requiresInternetGatewayConnection) {
      checks.push({
        id: `aws-foundation-public-route-${routeTable.routeTableNodeId}`,
        type: 'connection-exists',
        from: routeTable.requiresInternetGatewayConnection.internetGatewayNodeId,
        to: routeTable.routeTableNodeId,
        label: `${routeTable.label} がInternet Gatewayへ向いている`,
        failureMessage:
          'Public SubnetのRoute TableからInternet Gatewayへの経路がありません。公開入口は外部から到達できる経路を持つ必要があります。',
      });
    }

    if (routeTable.requiresNatGatewayConnection) {
      checks.push({
        id: `aws-foundation-private-route-${routeTable.routeTableNodeId}`,
        type: 'connection-exists',
        from: routeTable.routeTableNodeId,
        to: routeTable.requiresNatGatewayConnection.natGatewayNodeId,
        label: `${routeTable.label} がNAT Gatewayへ向いている`,
        failureMessage:
          'Private Subnetから外部サービスへ出ていく経路がありません。Private Subnetのリソースがインターネット側のAPIやレジストリを使う場合は、NAT GatewayまたはVPC Endpointなどの出口が必要です。',
      });
    }
  }

  for (const securityGroup of rules.securityGroups) {
    checks.push(
      {
        id: `aws-foundation-security-group-${securityGroup.securityGroupNodeId}`,
        type: 'node-exists',
        nodeId: securityGroup.securityGroupNodeId,
        label: `${securityGroup.label} が定義されている`,
        failureMessage:
          'Security Groupがありません。AWSではALB、ECS、RDSなどの通信許可をSecurity Groupで明示する必要があります。',
      },
      {
        id: `aws-foundation-security-group-attachment-${securityGroup.securityGroupNodeId}`,
        type: 'node-attached-to',
        nodeId: securityGroup.securityGroupNodeId,
        targetId: securityGroup.attachedToNodeId,
        targetIsZone: false,
        label: `${securityGroup.label} が対象リソースに関連付けられている`,
        failureMessage:
          'Security Groupが対象リソースに関連付けられていません。Security GroupはSubnet内に置く箱ではなく、リソース（ENI）に「関連付ける」通信制御です。対象リソースへ関連付けてください。',
      },
    );

    for (const sourceSecurityGroupId of securityGroup.allowedSourceSecurityGroupIds ?? []) {
      checks.push({
        id: `aws-foundation-security-group-source-${sourceSecurityGroupId}-to-${securityGroup.securityGroupNodeId}`,
        type: 'connection-exists',
        from: sourceSecurityGroupId,
        to: securityGroup.securityGroupNodeId,
        label: `${securityGroup.label} が許可元Security Groupを参照している`,
        failureMessage:
          'Security Group間の許可関係がありません。内部通信ではCIDRで広く開けるのではなく、前段のSecurity Groupを許可元として参照する構成が基本です。',
      });
    }
  }

  return checks;
};

const evaluateAction = (
  diagram: DiagramConfig,
  action: ChallengeAction,
  checksById: Map<string, ChallengeCheck>,
): ChallengeActionResult => {
  const failedChecks: ChallengeCheck[] = [];
  const activeNodeGroups: string[][] = [];
  const activeConnectionGroups: string[][] = [];

  for (const checkId of action.checkIds) {
    const check = checksById.get(checkId);
    if (!check) continue;

    const result = evaluateCheck(diagram, check);
    if (result.passed) {
      activeNodeGroups.push(result.activeNodeIds);
      activeConnectionGroups.push(result.activeConnectionIds);
      continue;
    }

    failedChecks.push(check);
    if (activeNodeGroups.length === 0 && result.activeNodeIds.length > 0) {
      activeNodeGroups.push(result.activeNodeIds);
      activeConnectionGroups.push(result.activeConnectionIds);
    }
  }

  const passed = failedChecks.length === 0;

  return {
    actionId: action.id,
    title: action.title,
    status: passed ? 'success' : 'failure',
    message: passed
      ? action.successMessage
      : `${action.failureMessage}\n\n${failedChecks[0]?.failureMessage ?? ''}`,
    failedChecks,
    activeNodeIds: mergeUnique(...activeNodeGroups),
    activeConnectionIds: mergeUnique(...activeConnectionGroups),
  };
};

const evaluateAwsFoundation = (
  diagram: DiagramConfig,
  rules: AwsArchitectureRules,
): ChallengeActionResult => {
  const checks = createAwsFoundationChecks(rules);
  const checksById = new Map(checks.map((check) => [check.id, check]));

  return evaluateAction(
    diagram,
    {
      id: 'aws-foundation',
      title: 'AWS構成の前提を確認する',
      description: 'VPC、Subnet、Route Table、Security Groupなど、AWSとして成立するための土台を確認する。',
      checkIds: checks.map((check) => check.id),
      successMessage:
        'VPC、Subnet、Route Table、Security Groupの前提が成立しています。アプリケーション要件の動作確認へ進めます。',
      failureMessage: 'AWS構成の前提確認に失敗しました。',
    },
    checksById,
  );
};

export const runChallenge = (
  challenge: ChallengeConfig,
  diagram: DiagramConfig,
): ChallengeRunResult => {
  const checksById = new Map(challenge.checks.map((check) => [check.id, check]));
  const foundationResult = challenge.awsRules
    ? evaluateAwsFoundation(diagram, challenge.awsRules)
    : null;

  if (foundationResult?.status === 'failure') {
    return {
      status: 'failure',
      title: 'AWS構成として成立していません',
      message:
        'アプリケーションの動作確認に進む前に、VPC、Subnet、Route Table、Security Groupなどの基本構成を満たす必要があります。',
      actionResults: [foundationResult],
      activeNodeIds: foundationResult.activeNodeIds,
      activeConnectionIds: foundationResult.activeConnectionIds,
    };
  }

  const scenarioActionResults = challenge.actions.map((action) =>
    evaluateAction(diagram, action, checksById),
  );
  const actionResults = foundationResult
    ? [foundationResult, ...scenarioActionResults]
    : scenarioActionResults;
  const failedAction = actionResults.find((result) => result.status === 'failure');
  const successfulActions = actionResults.filter((result) => result.status === 'success');

  if (failedAction) {
    return {
      status: 'failure',
      title: '動作確認に失敗しました',
      message: 'この構成では、想定された業務アクションのどこかで通信または配置条件が成立しません。',
      actionResults,
      activeNodeIds: failedAction.activeNodeIds,
      activeConnectionIds: failedAction.activeConnectionIds,
    };
  }

  return {
    status: 'success',
    title: '動作確認に成功しました',
    message: 'すべての想定アクションが成立します。この構成は今回の要件を満たしています。',
    actionResults,
    activeNodeIds: mergeUnique(...successfulActions.map((result) => result.activeNodeIds)),
    activeConnectionIds: mergeUnique(...successfulActions.map((result) => result.activeConnectionIds)),
  };
};
