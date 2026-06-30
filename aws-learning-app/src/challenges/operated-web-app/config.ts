import type { ChallengeConfig } from '../../types/challenge';
import type { DiagramConfig, DiagramNode, DiagramZone } from '../../types/diagram';
import { ICON, makeNode, makeServiceFactory, makeZone, nodeStyle, pickNodes } from '../shared';

const zones: DiagramZone[] = [
  makeZone('vpc', 'VPC (Production App)', { x: 245, y: 160, width: 680, height: 410 }),
  makeZone('public-subnet', 'Public Subnet', { x: 24, y: 58, width: 292, height: 320 }, 'public', 'vpc'),
  makeZone('private-subnet', 'Private Subnet', { x: 356, y: 58, width: 292, height: 320 }, 'private', 'vpc'),
];

const answerNodes: DiagramNode[] = [
  makeNode('user-pc', '利用者', 'ブラウザ', 'Users', { x: 20, y: 330, width: 135, height: 82 }, nodeStyle.external, { category: 'external' }),
  makeNode('cloudfront', 'CloudFront', '公開入口', ICON.cloudfront, { x: 230, y: 20, width: 160, height: 82 }, nodeStyle.edge, { category: 'external' }),
  makeNode('s3', 'S3', '静的ファイル', ICON.s3, { x: 430, y: 20, width: 135, height: 82 }, nodeStyle.data, { category: 'external' }),
  makeNode('igw', 'Internet Gateway', 'VPC境界', ICON.igw, { x: 250, y: -32, width: 180, height: 78 }, nodeStyle.gateway, { category: 'gateway', parentId: 'zone-vpc' }),
  makeNode('alb', 'ALB', 'API入口', ICON.alb, { x: 62, y: 145, width: 155, height: 82 }, nodeStyle.edge, { category: 'placement', parentId: 'zone-public-subnet' }),
  makeNode('ecs', 'ECS Fargate', 'アプリAPI', ICON.ecs, { x: 52, y: 105, width: 165, height: 82 }, nodeStyle.app, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('rds', 'RDS', 'アプリDB', ICON.rds, { x: 52, y: 220, width: 165, height: 82 }, nodeStyle.data, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('public-rt', 'Public Route Table', '0.0.0.0/0 -> IGW', ICON.routeTable, { x: 110, y: 26, width: 165, height: 34 }, nodeStyle.routeTable, { category: 'association', parentId: 'zone-public-subnet' }),
  makeNode('private-rt', 'Private Route Table', 'local', ICON.routeTable, { x: 110, y: 26, width: 165, height: 34 }, nodeStyle.routeTable, { category: 'association', parentId: 'zone-private-subnet' }),
  makeNode('sg-alb', 'SG: ALB', 'inbound 443', 'Shield', { x: 24, y: -22, width: 112, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'alb' }),
  makeNode('sg-ecs', 'SG: ECS', 'from ALB SG', 'Shield', { x: 24, y: -22, width: 112, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'ecs' }),
  makeNode('sg-rds', 'SG: RDS', 'from ECS SG', 'Shield', { x: 24, y: -22, width: 112, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'rds' }),
  makeNode('cloudwatch', 'CloudWatch', 'Logs / Metrics', 'Activity', { x: 620, y: 20, width: 170, height: 82 }, nodeStyle.observability, { category: 'external' }),
  makeNode('dashboard', 'Dashboard', '運用ビュー', 'LayoutDashboard', { x: 840, y: 20, width: 160, height: 82 }, nodeStyle.observability, { category: 'external' }),
  makeNode('alb-alarm', 'ALB Alarm', '5xx / Target', 'Siren', { x: 980, y: 190, width: 145, height: 76 }, nodeStyle.queue, { category: 'external' }),
  makeNode('ecs-alarm', 'ECS Alarm', 'CPU / Memory', 'Gauge', { x: 980, y: 310, width: 145, height: 76 }, nodeStyle.queue, { category: 'external' }),
  makeNode('rds-alarm', 'RDS Alarm', '接続数 / 容量', 'DatabaseZap', { x: 980, y: 430, width: 145, height: 76 }, nodeStyle.queue, { category: 'external' }),
  makeNode('sns', 'SNS Topic', '通知集約', 'Bell', { x: 760, y: 610, width: 150, height: 76 }, nodeStyle.security, { category: 'external' }),
  makeNode('oncall', '運用担当', 'メール/ChatOps', 'Headphones', { x: 980, y: 610, width: 145, height: 76 }, nodeStyle.external, { category: 'external' }),
];

const createService = makeServiceFactory(answerNodes);

const baseConnections = [
  { id: 'user-to-cf', from: 'user-pc', to: 'cloudfront', kind: 'traffic' as const, fromAnchor: 'top' as const, toAnchor: 'left' as const },
  { id: 'cf-to-s3', from: 'cloudfront', to: 's3', kind: 'traffic' as const, fromAnchor: 'right' as const, toAnchor: 'left' as const },
  { id: 'cf-to-igw', from: 'cloudfront', to: 'igw', kind: 'traffic' as const, fromAnchor: 'bottom' as const, toAnchor: 'top' as const },
  { id: 'igw-to-alb', from: 'igw', to: 'alb', kind: 'traffic' as const, fromAnchor: 'bottom' as const, toAnchor: 'top' as const },
  { id: 'alb-to-ecs', from: 'alb', to: 'ecs', kind: 'traffic' as const, fromAnchor: 'right' as const, toAnchor: 'left' as const },
  { id: 'ecs-to-rds', from: 'ecs', to: 'rds', kind: 'traffic' as const, fromAnchor: 'bottom' as const, toAnchor: 'top' as const },
  { id: 'igw-to-public-rt', from: 'igw', to: 'public-rt', kind: 'attachment' as const, label: 'route', fromAnchor: 'right' as const, toAnchor: 'top' as const },
  { id: 'sg-alb-to-sg-ecs', from: 'sg-alb', to: 'sg-ecs', kind: 'association' as const, label: '許可元', fromAnchor: 'right' as const, toAnchor: 'left' as const },
  { id: 'sg-ecs-to-sg-rds', from: 'sg-ecs', to: 'sg-rds', kind: 'association' as const, label: '許可元', fromAnchor: 'bottom' as const, toAnchor: 'top' as const },
];

const answerDiagram: DiagramConfig = {
  viewport: { width: 1160, height: 740, padding: 48 },
  zones,
  nodes: answerNodes,
  connections: [
    ...baseConnections,
    { id: 'cf-to-cw', from: 'cloudfront', to: 'cloudwatch', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'alb-to-cw', from: 'alb', to: 'cloudwatch', kind: 'traffic', fromAnchor: 'top', toAnchor: 'bottom' },
    { id: 'ecs-to-cw', from: 'ecs', to: 'cloudwatch', kind: 'traffic', fromAnchor: 'top', toAnchor: 'bottom' },
    { id: 'rds-to-cw', from: 'rds', to: 'cloudwatch', kind: 'traffic', fromAnchor: 'right', toAnchor: 'bottom' },
    { id: 'cw-to-dashboard', from: 'cloudwatch', to: 'dashboard', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'alb-to-alarm', from: 'alb', to: 'alb-alarm', kind: 'association', label: '5xx', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'ecs-to-alarm', from: 'ecs', to: 'ecs-alarm', kind: 'association', label: 'CPU', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'rds-to-alarm', from: 'rds', to: 'rds-alarm', kind: 'association', label: 'DB', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'alb-alarm-to-sns', from: 'alb-alarm', to: 'sns', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'right' },
    { id: 'ecs-alarm-to-sns', from: 'ecs-alarm', to: 'sns', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'right' },
    { id: 'rds-alarm-to-sns', from: 'rds-alarm', to: 'sns', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'right' },
    { id: 'sns-to-oncall', from: 'sns', to: 'oncall', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
  ],
};

const challenge: ChallengeConfig = {
  slug: 'operated-web-app',
  title: '本番運用するWebアプリを設計する',
  description: '完成済みのWebアプリにログ、メトリクス、アラーム、通知、ダッシュボードを組み込んだ運用構成を作る',
  headerLabel: 'AWS DESIGN CHALLENGE',
  badge: '設計演習',
  icon: 'Activity',
  color: 'rose',
  scenario:
    'Webアプリの基本構成はすでに動いています。次は本番運用できる状態にします。各レイヤのログとメトリクスを集約し、ALB/ECS/RDSの異常をアラームで検知し、運用担当へ通知できる完成構成にしてください。',
  requirements: [
    { id: 'base-network', title: '既存の本番アプリ土台', description: 'VPC、Public/Private Subnet、Route Table、Internet Gateway、ALB、ECS、RDS、Security Groupは完成済みの前提として明示する。' },
    { id: 'logs', title: 'ログ/メトリクス集約', description: 'CloudFront、ALB、ECS、RDSのログやメトリクスをCloudWatchへ集める。' },
    { id: 'dashboard', title: '運用ビュー', description: '主要な状態をDashboardで確認できるようにする。' },
    { id: 'alb-alert', title: '入口/API異常の通知', description: 'ALBの5xxやTarget異常をアラームで検知する。' },
    { id: 'ecs-alert', title: 'アプリ負荷の通知', description: 'ECSのCPU/Memory異常をアラームで検知する。' },
    { id: 'rds-alert', title: 'DB異常の通知', description: 'RDSの接続数や容量異常をアラームで検知する。' },
    { id: 'notify', title: '運用担当への通知', description: 'アラーム通知をSNSに集約し、運用担当へ届ける。' },
  ],
  initialDiagram: {
    viewport: { ...answerDiagram.viewport },
    zones,
    nodes: pickNodes(answerNodes, ['user-pc', 'cloudfront', 's3', 'igw', 'alb', 'ecs', 'rds', 'public-rt', 'private-rt', 'sg-alb', 'sg-ecs', 'sg-rds']),
    connections: baseConnections,
  },
  lockedNodeIds: ['user-pc', 'cloudfront', 's3', 'igw', 'alb', 'ecs', 'rds', 'public-rt', 'private-rt', 'sg-alb', 'sg-ecs', 'sg-rds'],
  services: [
    createService('cloudwatch', 'ログとメトリクスを集約する'),
    createService('dashboard', '主要状態を一覧する運用ビュー'),
    createService('alb-alarm', '入口/API異常を検知するアラーム'),
    createService('ecs-alarm', 'アプリ負荷を検知するアラーム'),
    createService('rds-alarm', 'DB異常を検知するアラーム'),
    createService('sns', 'アラーム通知を集約するTopic'),
    createService('oncall', '通知を受ける運用担当'),
  ],
  awsRules: {
    vpcZoneId: 'vpc',
    publicSubnetZoneIds: ['public-subnet'],
    privateSubnetZoneIds: ['private-subnet'],
    internetGatewayNodeId: 'igw',
    routeTables: [
      { routeTableNodeId: 'public-rt', subnetZoneId: 'public-subnet', label: 'Public Route Table', requiresInternetGatewayConnection: { internetGatewayNodeId: 'igw' } },
      { routeTableNodeId: 'private-rt', subnetZoneId: 'private-subnet', label: 'Private Route Table' },
    ],
    securityGroups: [
      { securityGroupNodeId: 'sg-alb', attachedToNodeId: 'alb', label: 'ALB Security Group' },
      { securityGroupNodeId: 'sg-ecs', attachedToNodeId: 'ecs', label: 'ECS Security Group', allowedSourceSecurityGroupIds: ['sg-alb'] },
      { securityGroupNodeId: 'sg-rds', attachedToNodeId: 'rds', label: 'RDS Security Group', allowedSourceSecurityGroupIds: ['sg-ecs'] },
    ],
  },
  checks: [
    { id: 'has-cw', type: 'node-exists', nodeId: 'cloudwatch', label: 'CloudWatchがある', failureMessage: 'ログとメトリクスを集約するCloudWatchがありません。' },
    { id: 'has-dashboard', type: 'node-exists', nodeId: 'dashboard', label: 'Dashboardがある', failureMessage: '本番状態を一覧するDashboardがありません。' },
    { id: 'has-alb-alarm', type: 'node-exists', nodeId: 'alb-alarm', label: 'ALBアラームがある', failureMessage: 'ALBの異常を検知するアラームがありません。' },
    { id: 'has-ecs-alarm', type: 'node-exists', nodeId: 'ecs-alarm', label: 'ECSアラームがある', failureMessage: 'ECSの負荷異常を検知するアラームがありません。' },
    { id: 'has-rds-alarm', type: 'node-exists', nodeId: 'rds-alarm', label: 'RDSアラームがある', failureMessage: 'RDSの異常を検知するアラームがありません。' },
    { id: 'has-sns', type: 'node-exists', nodeId: 'sns', label: '通知Topicがある', failureMessage: 'アラーム通知を集約するSNS Topicがありません。' },
    { id: 'has-oncall', type: 'node-exists', nodeId: 'oncall', label: '通知先がある', failureMessage: '通知を受ける運用担当がありません。' },
    { id: 'cf-logs', type: 'connection-exists', from: 'cloudfront', to: 'cloudwatch', label: 'CloudFrontを観測できる', failureMessage: 'CloudFrontからCloudWatchへの観測経路がありません。' },
    { id: 'alb-logs', type: 'connection-exists', from: 'alb', to: 'cloudwatch', label: 'ALBを観測できる', failureMessage: 'ALBからCloudWatchへの観測経路がありません。' },
    { id: 'ecs-logs', type: 'connection-exists', from: 'ecs', to: 'cloudwatch', label: 'ECSを観測できる', failureMessage: 'ECSからCloudWatchへのログ/メトリクス経路がありません。' },
    { id: 'rds-logs', type: 'connection-exists', from: 'rds', to: 'cloudwatch', label: 'RDSを観測できる', failureMessage: 'RDSからCloudWatchへのメトリクス経路がありません。' },
    { id: 'dashboard-path', type: 'connection-exists', from: 'cloudwatch', to: 'dashboard', label: 'Dashboardへ表示できる', failureMessage: 'CloudWatchの情報をDashboardへ表示する関係がありません。' },
    { id: 'alb-alarm-path', type: 'path-exists', path: ['alb', 'alb-alarm', 'sns', 'oncall'], label: 'ALB異常を通知できる', failureMessage: 'ALB異常をアラームからSNS経由で運用担当へ届ける流れが途切れています。' },
    { id: 'ecs-alarm-path', type: 'path-exists', path: ['ecs', 'ecs-alarm', 'sns', 'oncall'], label: 'ECS異常を通知できる', failureMessage: 'ECS異常をアラームからSNS経由で運用担当へ届ける流れが途切れています。' },
    { id: 'rds-alarm-path', type: 'path-exists', path: ['rds', 'rds-alarm', 'sns', 'oncall'], label: 'RDS異常を通知できる', failureMessage: 'RDS異常をアラームからSNS経由で運用担当へ届ける流れが途切れています。' },
  ],
  actions: [
    { id: 'inspect-logs', title: 'API異常時にログを見る', description: 'CloudFront/ALB/ECS/RDSの状態をCloudWatchとDashboardで確認する。', checkIds: ['has-cw', 'has-dashboard', 'cf-logs', 'alb-logs', 'ecs-logs', 'rds-logs', 'dashboard-path'], successMessage: '各レイヤの状態をCloudWatchとDashboardで確認できます。', failureMessage: 'ログ/メトリクス確認の経路が不足しています。' },
    { id: 'alb-notify', title: 'ALB 5xxを通知する', description: '入口/API異常を検知して運用担当へ知らせる。', checkIds: ['has-alb-alarm', 'has-sns', 'has-oncall', 'alb-alarm-path'], successMessage: 'ALB異常はアラームから運用担当へ通知できます。', failureMessage: 'ALB異常通知の確認に失敗しました。' },
    { id: 'ecs-notify', title: 'ECS高負荷を通知する', description: 'CPU/Memory異常を検知して運用担当へ知らせる。', checkIds: ['has-ecs-alarm', 'has-sns', 'has-oncall', 'ecs-alarm-path'], successMessage: 'ECS高負荷はアラームから運用担当へ通知できます。', failureMessage: 'ECS異常通知の確認に失敗しました。' },
    { id: 'rds-notify', title: 'RDS異常を通知する', description: '接続数や容量の異常を検知して運用担当へ知らせる。', checkIds: ['has-rds-alarm', 'has-sns', 'has-oncall', 'rds-alarm-path'], successMessage: 'RDS異常はアラームから運用担当へ通知できます。', failureMessage: 'RDS異常通知の確認に失敗しました。' },
  ],
  answerDiagram,
  answerTrace: [
    { id: 'base', title: '稼働中のWebアプリから始める', description: 'CloudFront、S3、ALB、ECS、RDS、Route Table、Security Groupの基本構成はすでに動いています。ここに運用系リソースを足します。', visibleNodeIds: ['user-pc', 'cloudfront', 's3', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs', 'sg-ecs', 'rds', 'sg-rds'], visibleConnectionIds: ['user-to-cf', 'cf-to-s3', 'cf-to-igw', 'igw-to-alb', 'alb-to-ecs', 'ecs-to-rds', 'igw-to-public-rt', 'sg-alb-to-sg-ecs', 'sg-ecs-to-sg-rds'], activeNodeIds: ['cloudfront', 'alb', 'ecs', 'rds', 'sg-alb', 'sg-ecs', 'sg-rds'], activeConnectionIds: ['cf-to-igw', 'igw-to-alb', 'alb-to-ecs', 'ecs-to-rds', 'sg-alb-to-sg-ecs', 'sg-ecs-to-sg-rds'] },
    { id: 'observe', title: 'ログとメトリクスを集める', description: '各レイヤのログ/メトリクスをCloudWatchへ集め、Dashboardで見られるようにします。', visibleNodeIds: ['user-pc', 'cloudfront', 's3', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs', 'sg-ecs', 'rds', 'sg-rds', 'cloudwatch', 'dashboard'], visibleConnectionIds: ['user-to-cf', 'cf-to-s3', 'cf-to-igw', 'igw-to-alb', 'alb-to-ecs', 'ecs-to-rds', 'igw-to-public-rt', 'sg-alb-to-sg-ecs', 'sg-ecs-to-sg-rds', 'cf-to-cw', 'alb-to-cw', 'ecs-to-cw', 'rds-to-cw', 'cw-to-dashboard'], activeNodeIds: ['cloudfront', 'alb', 'ecs', 'rds', 'cloudwatch', 'dashboard'], activeConnectionIds: ['cf-to-cw', 'alb-to-cw', 'ecs-to-cw', 'rds-to-cw', 'cw-to-dashboard'] },
    { id: 'alarms', title: '主要な異常をアラームにする', description: '入口、アプリ、DBの代表的な異常をそれぞれアラームとして表現します。', visibleNodeIds: ['user-pc', 'cloudfront', 's3', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs', 'sg-ecs', 'rds', 'sg-rds', 'cloudwatch', 'dashboard', 'alb-alarm', 'ecs-alarm', 'rds-alarm'], visibleConnectionIds: ['user-to-cf', 'cf-to-s3', 'cf-to-igw', 'igw-to-alb', 'alb-to-ecs', 'ecs-to-rds', 'igw-to-public-rt', 'sg-alb-to-sg-ecs', 'sg-ecs-to-sg-rds', 'cf-to-cw', 'alb-to-cw', 'ecs-to-cw', 'rds-to-cw', 'cw-to-dashboard', 'alb-to-alarm', 'ecs-to-alarm', 'rds-to-alarm'], activeNodeIds: ['alb-alarm', 'ecs-alarm', 'rds-alarm'], activeConnectionIds: ['alb-to-alarm', 'ecs-to-alarm', 'rds-to-alarm'] },
    { id: 'notify', title: '通知を運用担当へ届ける', description: 'アラーム通知はSNS Topicへ集約し、運用担当のメールやChatOpsへ送ります。', visibleNodeIds: ['user-pc', 'cloudfront', 's3', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs', 'sg-ecs', 'rds', 'sg-rds', 'cloudwatch', 'dashboard', 'alb-alarm', 'ecs-alarm', 'rds-alarm', 'sns', 'oncall'], visibleConnectionIds: ['user-to-cf', 'cf-to-s3', 'cf-to-igw', 'igw-to-alb', 'alb-to-ecs', 'ecs-to-rds', 'igw-to-public-rt', 'sg-alb-to-sg-ecs', 'sg-ecs-to-sg-rds', 'cf-to-cw', 'alb-to-cw', 'ecs-to-cw', 'rds-to-cw', 'cw-to-dashboard', 'alb-to-alarm', 'ecs-to-alarm', 'rds-to-alarm', 'alb-alarm-to-sns', 'ecs-alarm-to-sns', 'rds-alarm-to-sns', 'sns-to-oncall'], activeNodeIds: ['alb-alarm', 'ecs-alarm', 'rds-alarm', 'sns', 'oncall'], activeConnectionIds: ['alb-alarm-to-sns', 'ecs-alarm-to-sns', 'rds-alarm-to-sns', 'sns-to-oncall'] },
  ],
};

export default challenge;
