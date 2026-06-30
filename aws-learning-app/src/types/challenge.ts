import type {
  DiagramConfig,
  DiagramNode,
  DiagramPosition,
  DiagramZone,
  ResourceCategory,
} from './diagram';

export interface ChallengeRequirement {
  id: string;
  title: string;
  description: string;
}

export type ChallengeService =
  | {
      serviceId: string;
      label: string;
      description: string;
      kind: 'node';
      /** パレットのグループ化と操作モデル（配置/境界/関連付け/外部）の切替に使う */
      category: ResourceCategory;
      defaultPosition: DiagramPosition;
      node: Omit<DiagramNode, 'id' | 'position'>;
    }
  | {
      serviceId: string;
      label: string;
      description: string;
      kind: 'zone';
      category: 'network';
      icon: string;
      zone: DiagramZone;
    };

export type ChallengeCheck =
  | {
      id: string;
      type: 'zone-exists';
      zoneId: string;
      label: string;
      failureMessage: string;
    }
  | {
      id: string;
      type: 'zone-in-zone';
      zoneId: string;
      parentZoneId: string;
      label: string;
      failureMessage: string;
    }
  | {
      id: string;
      type: 'node-exists';
      nodeId: string;
      label: string;
      failureMessage: string;
    }
  | {
      id: string;
      type: 'path-exists';
      path: string[];
      label: string;
      failureMessage: string;
    }
  | {
      id: string;
      type: 'connection-exists';
      from: string;
      to: string;
      label: string;
      failureMessage: string;
    }
  | {
      id: string;
      type: 'node-in-zone';
      nodeId: string;
      zoneId: string;
      label: string;
      failureMessage: string;
    }
  | {
      id: string;
      type: 'node-attached-to';
      nodeId: string;
      /** 関連付け対象。リソースノードID もしくは Subnet ゾーンID。 */
      targetId: string;
      /** 対象がゾーンか否か（ゾーンなら parentId は `zone-<targetId>` を期待） */
      targetIsZone?: boolean;
      label: string;
      failureMessage: string;
    }
  | {
      id: string;
      type: 'incoming-only-from';
      nodeId: string;
      allowedSourceIds: string[];
      label: string;
      failureMessage: string;
    };

export interface AwsRouteTableRule {
  routeTableNodeId: string;
  subnetZoneId: string;
  label: string;
  requiresInternetGatewayConnection?: {
    internetGatewayNodeId: string;
  };
  requiresNatGatewayConnection?: {
    natGatewayNodeId: string;
  };
}

export interface AwsSecurityGroupRule {
  securityGroupNodeId: string;
  attachedToNodeId: string;
  label: string;
  allowedSourceSecurityGroupIds?: string[];
}

export interface AwsArchitectureRules {
  vpcZoneId: string;
  publicSubnetZoneIds: string[];
  privateSubnetZoneIds: string[];
  internetGatewayNodeId?: string;
  routeTables: AwsRouteTableRule[];
  securityGroups: AwsSecurityGroupRule[];
}

export interface ChallengeAction {
  id: string;
  title: string;
  description: string;
  checkIds: string[];
  successMessage: string;
  failureMessage: string;
}

export interface AnswerTraceStep {
  id: string;
  title: string;
  description: string;
  visibleNodeIds: string[];
  visibleConnectionIds: string[];
  activeNodeIds: string[];
  activeConnectionIds: string[];
}

export interface ChallengeConfig {
  slug: string;
  title: string;
  description: string;
  headerLabel: string;
  badge: string;
  icon: string;
  color: string;
  scenario: string;
  requirements: ChallengeRequirement[];
  initialDiagram: DiagramConfig;
  lockedNodeIds: string[];
  services: ChallengeService[];
  awsRules?: AwsArchitectureRules;
  checks: ChallengeCheck[];
  actions: ChallengeAction[];
  answerDiagram: DiagramConfig;
  answerTrace: AnswerTraceStep[];
}

export interface ChallengeActionResult {
  actionId: string;
  title: string;
  status: 'success' | 'failure';
  message: string;
  failedChecks: ChallengeCheck[];
  activeNodeIds: string[];
  activeConnectionIds: string[];
}

export interface ChallengeRunResult {
  status: 'success' | 'failure';
  title: string;
  message: string;
  actionResults: ChallengeActionResult[];
  activeNodeIds: string[];
  activeConnectionIds: string[];
}

export interface ChallengeManifest {
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  badge: string;
  path: string;
}
