import type { ChallengeConfig, ChallengeService } from '../../types/challenge';
import type {
  DiagramConfig,
  DiagramNode,
  DiagramPosition,
  DiagramZone,
  ResourceCategory,
} from '../../types/diagram';

const ICON = {
  cloudfront: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Amazon-CloudFront_48.svg',
  s3: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Storage/48/Arch_Amazon-Simple-Storage-Service_48.svg',
  alb: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Elastic-Load-Balancing_48.svg',
  ecs: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.svg',
  rds: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Database/48/Arch_Amazon-RDS_48.svg',
  asg: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Compute/48/Arch_Amazon-EC2-Auto-Scaling_48.svg',
  igw: '/src/assets/aws/Resource-Icons_07312025/Res_Networking-Content-Delivery/Res_Amazon-VPC_Internet-Gateway_48.svg',
  rt: '/src/assets/aws/Resource-Icons_07312025/Res_Networking-Content-Delivery/Res_Amazon-Route-53_Route-Table_48.svg',
};

const sgStyle = { bgColor: 'bg-rose-950', borderColor: 'border-rose-500', textColor: 'text-rose-100', accentColor: 'text-rose-300' };
const rtStyle = { bgColor: 'bg-cyan-950', borderColor: 'border-cyan-500', textColor: 'text-cyan-100', accentColor: 'text-cyan-300' };

interface NodeExtra {
  category: ResourceCategory;
  parentId?: string;
  glossaryTermId?: string;
}

const makeNode = (
  id: string,
  label: string,
  sublabel: string,
  icon: string,
  position: DiagramPosition,
  style: DiagramNode['style'],
  extra: NodeExtra,
  metadata?: string,
): DiagramNode => ({ id, label, sublabel, metadata, icon, position, style, ...extra });

const ecsStyle = { bgColor: 'bg-emerald-950', borderColor: 'border-emerald-500', textColor: 'text-emerald-200', accentColor: 'text-emerald-400' };
const albStyle = { bgColor: 'bg-indigo-950', borderColor: 'border-indigo-500', textColor: 'text-indigo-200', accentColor: 'text-indigo-400' };
const rdsStyle = { bgColor: 'bg-sky-950', borderColor: 'border-sky-500', textColor: 'text-sky-200', accentColor: 'text-sky-400' };
const extStyle = { bgColor: 'bg-slate-800', borderColor: 'border-slate-500', textColor: 'text-slate-200', accentColor: 'text-slate-400' };

const challengeZones: DiagramZone[] = [
  {
    id: 'vpc',
    label: 'VPC (10.4.0.0/16)',
    position: { x: 230, y: 150, width: 780, height: 560 },
    contentPadding: { top: 46, right: 18, bottom: 18, left: 18 },
    style: { borderColor: 'border-slate-600', borderStyle: 'border-dashed', bgColor: 'bg-transparent', labelColor: 'text-slate-500' },
  },
  {
    id: 'public-a',
    label: 'Public Subnet (AZ-a)',
    parentZoneId: 'vpc',
    position: { x: 24, y: 56, width: 350, height: 175 },
    contentPadding: { top: 50, right: 16, bottom: 16, left: 16 },
    style: { borderColor: 'border-emerald-600', borderStyle: 'border-dashed', bgColor: 'bg-emerald-500/[0.03]', labelColor: 'text-emerald-400' },
  },
  {
    id: 'public-c',
    label: 'Public Subnet (AZ-c)',
    parentZoneId: 'vpc',
    position: { x: 396, y: 56, width: 350, height: 175 },
    contentPadding: { top: 50, right: 16, bottom: 16, left: 16 },
    style: { borderColor: 'border-emerald-600', borderStyle: 'border-dashed', bgColor: 'bg-emerald-500/[0.03]', labelColor: 'text-emerald-400' },
  },
  {
    id: 'private-a',
    label: 'Private Subnet (AZ-a)',
    parentZoneId: 'vpc',
    position: { x: 24, y: 245, width: 350, height: 290 },
    contentPadding: { top: 50, right: 16, bottom: 16, left: 16 },
    style: { borderColor: 'border-blue-500', borderStyle: 'border-dashed', bgColor: 'bg-blue-500/[0.03]', labelColor: 'text-blue-400' },
  },
  {
    id: 'private-c',
    label: 'Private Subnet (AZ-c)',
    parentZoneId: 'vpc',
    position: { x: 396, y: 245, width: 350, height: 290 },
    contentPadding: { top: 50, right: 16, bottom: 16, left: 16 },
    style: { borderColor: 'border-blue-500', borderStyle: 'border-dashed', bgColor: 'bg-blue-500/[0.03]', labelColor: 'text-blue-400' },
  },
];

const answerNodes: DiagramNode[] = [
  // 外部 (VPC外)
  makeNode('user-pc', '利用者', 'ブラウザ', 'Users', { x: 20, y: 330, width: 150, height: 96 }, extStyle, { category: 'external' }),
  makeNode('cloudfront', 'CloudFront', '静的配信/入口', ICON.cloudfront, { x: 250, y: 20, width: 180, height: 96 }, albStyle, { category: 'external', glossaryTermId: 'scale-out-stateless' }),
  makeNode('s3', 'S3', '静的ファイル', ICON.s3, { x: 450, y: 20, width: 140, height: 96 }, ecsStyle, { category: 'external' }),
  makeNode('autoscaling', 'Application Auto Scaling', 'Desired Count 自動増減', ICON.asg, { x: 770, y: 20, width: 230, height: 96 }, { bgColor: 'bg-amber-950', borderColor: 'border-amber-500', textColor: 'text-amber-200', accentColor: 'text-amber-400' }, { category: 'external', glossaryTermId: 'app-auto-scaling' }),
  // 境界
  makeNode('igw', 'Internet Gateway', 'VPCの外部接続点', ICON.igw, { x: 40, y: -28, width: 130, height: 64 }, { bgColor: 'bg-orange-950', borderColor: 'border-orange-500', textColor: 'text-orange-100', accentColor: 'text-orange-300' }, { category: 'gateway', parentId: 'zone-vpc' }),
  // 配置: Public AZ-a の ALB
  makeNode('alb', 'ALB (Multi-AZ)', '2AZの健全Taskへ分散', ICON.alb, { x: 70, y: 80, width: 200, height: 80 }, albStyle, { category: 'placement', parentId: 'zone-public-a', glossaryTermId: 'alb-cross-az' }),
  // 配置: ECS Tasks 2AZ
  makeNode('ecs-a', 'ECS Task (AZ-a)', 'Fargate', ICON.ecs, { x: 30, y: 70, width: 180, height: 78 }, ecsStyle, { category: 'placement', parentId: 'zone-private-a', glossaryTermId: 'multi-az-spread' }),
  makeNode('ecs-c', 'ECS Task (AZ-c)', 'Fargate', ICON.ecs, { x: 30, y: 70, width: 180, height: 78 }, ecsStyle, { category: 'placement', parentId: 'zone-private-c', glossaryTermId: 'multi-az-spread' }),
  // 配置: RDS primary/standby
  makeNode('rds-primary', 'RDS Primary (AZ-a)', '読み書き', ICON.rds, { x: 30, y: 175, width: 180, height: 78 }, rdsStyle, { category: 'placement', parentId: 'zone-private-a', glossaryTermId: 'rds-multi-az' }),
  makeNode('rds-standby', 'RDS Standby (AZ-c)', '同期/failover用', ICON.rds, { x: 30, y: 175, width: 180, height: 78 }, { bgColor: 'bg-slate-800', borderColor: 'border-slate-500', textColor: 'text-slate-300', accentColor: 'text-slate-400' }, { category: 'placement', parentId: 'zone-private-c', glossaryTermId: 'rds-multi-az' }),
  // 関連付け: Route Table → Subnet
  makeNode('public-rt', 'Public Route Table', '0.0.0.0/0 → IGW', ICON.rt, { x: 150, y: 26, width: 175, height: 34 }, rtStyle, { category: 'association', parentId: 'zone-public-a' }),
  makeNode('private-rt', 'Private Route Table', 'local', ICON.rt, { x: 150, y: 26, width: 175, height: 34 }, rtStyle, { category: 'association', parentId: 'zone-private-a' }),
  // 関連付け: Security Group → リソース
  makeNode('sg-alb', 'SG: ALB', 'inbound 443', 'Shield', { x: 30, y: -22, width: 112, height: 30 }, sgStyle, { category: 'association', parentId: 'alb' }),
  makeNode('sg-ecs', 'SG: ECS', 'from ALB SG', 'Shield', { x: 30, y: -22, width: 112, height: 30 }, sgStyle, { category: 'association', parentId: 'ecs-a' }),
  makeNode('sg-rds', 'SG: RDS', 'from ECS SG', 'Shield', { x: 30, y: -22, width: 112, height: 30 }, sgStyle, { category: 'association', parentId: 'rds-primary' }),
];

const answerNodeById = new Map(answerNodes.map((node) => [node.id, node]));
const getAnswerNode = (nodeId: string): DiagramNode => {
  const node = answerNodeById.get(nodeId);
  if (!node) throw new Error(`Unknown challenge node: ${nodeId}`);
  return node;
};

const pickAnswerNodes = (ids: string[]) =>
  ids.map((id) => {
    const node = getAnswerNode(id);
    return { ...node, position: { ...node.position }, style: { ...node.style } };
  });

const createService = (
  serviceId: string,
  description: string,
  category: Exclude<ResourceCategory, 'network'>,
): ChallengeService => {
  const node = getAnswerNode(serviceId);
  return {
    serviceId,
    label: node.label,
    description,
    kind: 'node',
    category,
    defaultPosition: { ...node.position },
    node: {
      label: node.label,
      sublabel: node.sublabel,
      metadata: node.metadata,
      icon: node.icon,
      glossaryTermId: node.glossaryTermId,
      category,
      style: { ...node.style },
    },
  };
};

const createZoneService = (serviceId: string, description: string, icon: string): ChallengeService => {
  const zone = challengeZones.find((item) => item.id === serviceId);
  if (!zone) throw new Error(`Unknown challenge zone: ${serviceId}`);
  return {
    serviceId,
    label: zone.label,
    description,
    kind: 'zone',
    category: 'network',
    icon,
    zone: {
      ...zone,
      position: { ...zone.position },
      contentPadding: zone.contentPadding ? { ...zone.contentPadding } : undefined,
      style: { ...zone.style },
    },
  };
};

const answerDiagram: DiagramConfig = {
  viewport: { width: 1040, height: 760, padding: 48 },
  zones: challengeZones,
  nodes: answerNodes,
  connections: [
    { id: 'user-to-cf', from: 'user-pc', to: 'cloudfront', kind: 'traffic', fromAnchor: 'top', toAnchor: 'left' },
    { id: 'cf-to-s3', from: 'cloudfront', to: 's3', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'cf-to-igw', from: 'cloudfront', to: 'igw', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'igw-to-alb', from: 'igw', to: 'alb', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'alb-to-ecs-a', from: 'alb', to: 'ecs-a', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'alb-to-ecs-c', from: 'alb', to: 'ecs-c', kind: 'traffic', fromAnchor: 'right', toAnchor: 'top' },
    { id: 'ecs-a-to-rds', from: 'ecs-a', to: 'rds-primary', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'ecs-c-to-rds', from: 'ecs-c', to: 'rds-primary', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'right' },
    { id: 'rds-sync', from: 'rds-primary', to: 'rds-standby', kind: 'association', label: '同期', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'igw-to-public-rt', from: 'igw', to: 'public-rt', kind: 'attachment', label: 'route', fromAnchor: 'right', toAnchor: 'top' },
    { id: 'sg-alb-to-sg-ecs', from: 'sg-alb', to: 'sg-ecs', kind: 'association', label: '許可元', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'sg-ecs-to-sg-rds', from: 'sg-ecs', to: 'sg-rds', kind: 'association', label: '許可元', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'as-to-ecs-a', from: 'autoscaling', to: 'ecs-a', kind: 'association', label: 'Desired Count', fromAnchor: 'bottom', toAnchor: 'right' },
    { id: 'as-to-ecs-c', from: 'autoscaling', to: 'ecs-c', kind: 'association', label: 'Desired Count', fromAnchor: 'bottom', toAnchor: 'top' },
  ],
};

const initialNodeIds = ['user-pc', 'igw', 'public-rt', 'private-rt'];

const challenge: ChallengeConfig = {
  slug: 'scalable-web-app',
  title: 'スケーラブルWebアプリを設計する',
  description: 'Multi-AZ で冗長化し、Auto Scaling で負荷追従する本番Webアプリ構成を要件から組み立てる',
  headerLabel: 'AWS SCALABLE DESIGN',
  badge: '設計演習',
  icon: 'Gauge',
  color: 'blue',
  scenario:
    'アクセスの増減が激しいWebアプリを、AZ障害でも止まらず・負荷に応じて自動でスケールする構成にします。2つのAZにPublic/Private Subnetを作り、ALBで分散、ECSは両AZに配置してAuto Scalingで増減、RDSはMulti-AZにします。配置・関連付け・経路を意識して組み立ててください。',
  requirements: [
    { id: 'multi-az-network', title: '2AZのネットワーク', description: 'VPC内に Public/Private Subnet を2つのAZ分(計4つ)作り、VPCに入れ子で配置する。' },
    { id: 'alb-entry', title: '冗長な入口', description: 'ALBを公開し、両AZの健全なTaskへ分散する。' },
    { id: 'multi-az-app', title: 'アプリのAZ分散', description: 'ECS Taskを AZ-a と AZ-c の両Private Subnetに配置する。' },
    { id: 'auto-scaling', title: '自動スケール', description: 'Application Auto Scaling を ECS に関連付け、負荷でTask数を増減できるようにする。' },
    { id: 'rds-ha', title: 'DBの高可用性', description: 'RDSはPrimary(AZ-a)とStandby(AZ-c)のMulti-AZにし、SGはECSからだけ許可する。' },
    { id: 'static', title: '静的配信', description: '静的ファイルはCloudFront経由でS3から配信する。' },
  ],
  initialDiagram: {
    viewport: { ...answerDiagram.viewport },
    zones: challengeZones,
    nodes: pickAnswerNodes(initialNodeIds),
    connections: [
      { id: 'igw-to-public-rt', from: 'igw', to: 'public-rt', kind: 'attachment', label: 'route', fromAnchor: 'right', toAnchor: 'top' },
    ],
  },
  lockedNodeIds: initialNodeIds,
  services: [
    createZoneService('vpc', 'AWS内のネットワーク境界', 'Network'),
    createZoneService('public-a', '入口を置くSubnet (AZ-a)', 'Network'),
    createZoneService('public-c', '入口を置くSubnet (AZ-c)', 'Network'),
    createZoneService('private-a', 'アプリ/DBのSubnet (AZ-a)', 'Network'),
    createZoneService('private-c', 'アプリ/DBのSubnet (AZ-c)', 'Network'),
    createService('alb', '2AZにまたがる公開入口', 'placement'),
    createService('ecs-a', 'AZ-aのコンテナTask', 'placement'),
    createService('ecs-c', 'AZ-cのコンテナTask', 'placement'),
    createService('rds-primary', '読み書きするPrimary DB', 'placement'),
    createService('rds-standby', 'failover用Standby DB', 'placement'),
    createService('igw', 'VPCをインターネットへ接続', 'gateway'),
    createService('public-rt', 'Public Subnetに関連付ける経路(→IGW)', 'association'),
    createService('private-rt', 'Private Subnetに関連付ける内部経路', 'association'),
    createService('sg-alb', 'ALBに関連付ける通信許可', 'association'),
    createService('sg-ecs', 'ECSに関連付ける通信許可', 'association'),
    createService('sg-rds', 'RDSに関連付ける通信許可', 'association'),
    createService('autoscaling', 'ECSに関連付けるスケール制御', 'external'),
    createService('cloudfront', '静的配信の入口', 'external'),
    createService('s3', '静的ファイル配置先', 'external'),
  ],
  awsRules: {
    vpcZoneId: 'vpc',
    publicSubnetZoneIds: ['public-a', 'public-c'],
    privateSubnetZoneIds: ['private-a', 'private-c'],
    internetGatewayNodeId: 'igw',
    routeTables: [
      { routeTableNodeId: 'public-rt', subnetZoneId: 'public-a', label: 'Public Route Table', requiresInternetGatewayConnection: { internetGatewayNodeId: 'igw' } },
      { routeTableNodeId: 'private-rt', subnetZoneId: 'private-a', label: 'Private Route Table' },
    ],
    securityGroups: [
      { securityGroupNodeId: 'sg-alb', attachedToNodeId: 'alb', label: 'ALB Security Group' },
      { securityGroupNodeId: 'sg-ecs', attachedToNodeId: 'ecs-a', label: 'ECS Security Group', allowedSourceSecurityGroupIds: ['sg-alb'] },
      { securityGroupNodeId: 'sg-rds', attachedToNodeId: 'rds-primary', label: 'RDS Security Group', allowedSourceSecurityGroupIds: ['sg-ecs'] },
    ],
  },
  checks: [
    { id: 'has-alb', type: 'node-exists', nodeId: 'alb', label: '公開入口(ALB)がある', failureMessage: 'リクエストを受けるALBがありません。' },
    { id: 'has-ecs-a', type: 'node-exists', nodeId: 'ecs-a', label: 'AZ-aのTaskがある', failureMessage: 'AZ-aのECS Taskがありません。' },
    { id: 'has-ecs-c', type: 'node-exists', nodeId: 'ecs-c', label: 'AZ-cのTaskがある', failureMessage: 'AZ-cのECS Taskがありません。片方のAZだけでは冗長になりません。' },
    { id: 'has-rds-primary', type: 'node-exists', nodeId: 'rds-primary', label: 'Primary DBがある', failureMessage: '読み書きするRDS Primaryがありません。' },
    { id: 'has-rds-standby', type: 'node-exists', nodeId: 'rds-standby', label: 'Standby DBがある', failureMessage: 'failover用のStandbyがありません。Multi-AZになっていません。' },
    { id: 'has-autoscaling', type: 'node-exists', nodeId: 'autoscaling', label: 'Auto Scalingがある', failureMessage: '負荷でTask数を増減するApplication Auto Scalingがありません。' },
    { id: 'has-cloudfront', type: 'node-exists', nodeId: 'cloudfront', label: '静的配信の入口がある', failureMessage: 'CloudFrontがありません。' },
    { id: 'has-s3', type: 'node-exists', nodeId: 's3', label: '静的ファイル配置先がある', failureMessage: 'S3がありません。' },
    { id: 'alb-public', type: 'node-in-zone', nodeId: 'alb', zoneId: 'public-a', label: 'ALBはPublic Subnetにある', failureMessage: 'ALBがPublic Subnet(AZ-a)に配置されていません。' },
    { id: 'ecs-a-zone', type: 'node-in-zone', nodeId: 'ecs-a', zoneId: 'private-a', label: 'TaskはAZ-aのPrivateにある', failureMessage: 'ECS Task(AZ-a)がPrivate Subnet(AZ-a)に配置されていません。' },
    { id: 'ecs-c-zone', type: 'node-in-zone', nodeId: 'ecs-c', zoneId: 'private-c', label: 'TaskはAZ-cのPrivateにある', failureMessage: 'ECS Task(AZ-c)がPrivate Subnet(AZ-c)に配置されていません。AZを分けて初めて冗長になります。' },
    { id: 'rds-primary-zone', type: 'node-in-zone', nodeId: 'rds-primary', zoneId: 'private-a', label: 'PrimaryはAZ-aのPrivateにある', failureMessage: 'RDS PrimaryがPrivate Subnet(AZ-a)に配置されていません。' },
    { id: 'rds-standby-zone', type: 'node-in-zone', nodeId: 'rds-standby', zoneId: 'private-c', label: 'StandbyはAZ-cのPrivateにある', failureMessage: 'RDS StandbyがPrivate Subnet(AZ-c)に配置されていません。別AZに置かないとAZ障害で共倒れです。' },
    { id: 'static-path', type: 'path-exists', path: ['user-pc', 'cloudfront', 's3'], label: '静的配信経路が成立する', failureMessage: '静的配信の経路が途切れています。' },
    { id: 'api-path-a', type: 'path-exists', path: ['user-pc', 'cloudfront', 'igw', 'alb', 'ecs-a'], label: 'AZ-aへのAPI経路が成立する', failureMessage: 'CloudFront→IGW→ALB→AZ-aのTask の経路が途切れています。' },
    { id: 'alb-to-c', type: 'connection-exists', from: 'alb', to: 'ecs-c', label: 'ALBがAZ-cのTaskへも分散する', failureMessage: 'ALBがAZ-cのTaskへつながっていません。両AZへ分散させます。' },
    { id: 'db-path', type: 'path-exists', path: ['ecs-a', 'rds-primary'], label: 'アプリからDBへ到達できる', failureMessage: 'ECS(AZ-a)からRDS Primaryへ到達できません。' },
    { id: 'as-to-ecs', type: 'connection-exists', from: 'autoscaling', to: 'ecs-a', label: 'Auto ScalingがECSに関連付く', failureMessage: 'Auto ScalingがECSに関連付いていません。Task数を増減できません。' },
  ],
  actions: [
    { id: 'open-web', title: '利用者がWeb画面を開く', description: 'CloudFront経由で静的ファイルを取得する。', checkIds: ['has-cloudfront', 'has-s3', 'static-path'], successMessage: '静的配信が成立しています。', failureMessage: 'Web画面の表示に失敗しました。' },
    { id: 'call-api', title: '利用者がAPIを呼ぶ(両AZ)', description: 'ALBが両AZの健全なTaskへ分散する。', checkIds: ['has-alb', 'has-ecs-a', 'has-ecs-c', 'api-path-a', 'alb-to-c', 'alb-public', 'ecs-a-zone', 'ecs-c-zone'], successMessage: 'ALBが2つのAZのTaskへ分散できています。片方のAZが落ちても入口は維持されます。', failureMessage: 'API処理に失敗しました。' },
    { id: 'scale-out', title: '負荷が急増しscale-outする', description: 'Auto ScalingがDesired Countを増やしTaskを増設する。', checkIds: ['has-autoscaling', 'as-to-ecs', 'has-ecs-a', 'has-ecs-c'], successMessage: 'Auto ScalingがECSに関連付き、負荷に応じてTaskを増減できます。', failureMessage: 'スケール構成の確認に失敗しました。' },
    { id: 'az-failure', title: 'AZ-aが障害になっても継続する', description: '残ったAZ-cのTaskとStandby昇格で処理を継続する。', checkIds: ['has-ecs-c', 'ecs-c-zone', 'has-rds-standby', 'rds-standby-zone'], successMessage: 'AZ-cにTaskとStandbyがあり、AZ-a障害でもサービスを継続できます。', failureMessage: 'AZ障害耐性の確認に失敗しました。' },
    { id: 'query-db', title: 'アプリがDBを読み書きする', description: 'ECSがRDS Primaryへ接続する。', checkIds: ['has-rds-primary', 'db-path', 'rds-primary-zone'], successMessage: 'アプリからDBへ到達でき、DBはPrivateで保護されています。', failureMessage: 'DB参照に失敗しました。' },
  ],
  answerDiagram,
  answerTrace: [
    {
      id: 'network',
      title: '2AZのネットワークと境界を作る',
      description: 'VPC内にPublic/Privateを2AZ分(計4つ)入れ子で作り、IGWをVPC境界に取り付け、Public Route TableをIGWへ向けます。',
      visibleNodeIds: ['user-pc', 'igw', 'public-rt', 'private-rt'],
      visibleConnectionIds: ['igw-to-public-rt'],
      activeNodeIds: ['igw', 'public-rt', 'private-rt'],
      activeConnectionIds: ['igw-to-public-rt'],
    },
    {
      id: 'entry',
      title: '冗長な入口(ALB)を配置する',
      description: 'CloudFront→IGW→ALBで入口を作り、ALBにはSecurity Groupを関連付けます。ALBは2AZにまたがって配置します。',
      visibleNodeIds: ['user-pc', 'cloudfront', 's3', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb'],
      visibleConnectionIds: ['user-to-cf', 'cf-to-s3', 'cf-to-igw', 'igw-to-alb', 'igw-to-public-rt'],
      activeNodeIds: ['cloudfront', 'igw', 'alb', 'sg-alb'],
      activeConnectionIds: ['cf-to-igw', 'igw-to-alb'],
    },
    {
      id: 'app-multi-az',
      title: 'アプリを2AZに配置しscale対応',
      description: 'ECS Taskを AZ-a と AZ-c の両Private Subnetに配置し、ALBが両方へ分散。Auto Scalingを関連付けてTask数を自動増減します。',
      visibleNodeIds: ['user-pc', 'cloudfront', 's3', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs-a', 'ecs-c', 'sg-ecs', 'autoscaling'],
      visibleConnectionIds: ['user-to-cf', 'cf-to-igw', 'igw-to-alb', 'igw-to-public-rt', 'alb-to-ecs-a', 'alb-to-ecs-c', 'sg-alb-to-sg-ecs', 'as-to-ecs-a', 'as-to-ecs-c'],
      activeNodeIds: ['alb', 'ecs-a', 'ecs-c', 'autoscaling', 'sg-ecs'],
      activeConnectionIds: ['alb-to-ecs-a', 'alb-to-ecs-c', 'as-to-ecs-a', 'as-to-ecs-c'],
    },
    {
      id: 'db',
      title: 'DBをMulti-AZにする',
      description: 'RDS PrimaryをAZ-a、StandbyをAZ-cに置き同期。SGはECSからだけ許可します。AZ-a障害でもStandby昇格で継続できます。',
      visibleNodeIds: ['user-pc', 'cloudfront', 's3', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs-a', 'ecs-c', 'sg-ecs', 'autoscaling', 'rds-primary', 'rds-standby', 'sg-rds'],
      visibleConnectionIds: ['user-to-cf', 'cf-to-igw', 'igw-to-alb', 'igw-to-public-rt', 'alb-to-ecs-a', 'alb-to-ecs-c', 'sg-alb-to-sg-ecs', 'as-to-ecs-a', 'as-to-ecs-c', 'ecs-a-to-rds', 'ecs-c-to-rds', 'rds-sync', 'sg-ecs-to-sg-rds'],
      activeNodeIds: ['ecs-a', 'ecs-c', 'rds-primary', 'rds-standby', 'sg-rds'],
      activeConnectionIds: ['ecs-a-to-rds', 'ecs-c-to-rds', 'rds-sync'],
    },
  ],
};

export default challenge;
