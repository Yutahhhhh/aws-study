import type { ChallengeConfig } from '../../types/challenge';
import type { DiagramConfig, DiagramNode, DiagramZone } from '../../types/diagram';
import {
  ICON,
  makeNode,
  makeServiceFactory,
  makeZone,
  makeZoneServiceFactory,
  nodeStyle,
  pickNodes,
} from '../shared';

const zones: DiagramZone[] = [
  makeZone('vpc', 'VPC (SaaS App)', { x: 235, y: 150, width: 760, height: 470 }),
  makeZone('public-subnet', 'Public Subnet', { x: 24, y: 60, width: 330, height: 380 }, 'public', 'vpc'),
  makeZone('private-subnet', 'Private Subnet', { x: 390, y: 60, width: 330, height: 380 }, 'private', 'vpc'),
];

const answerNodes: DiagramNode[] = [
  makeNode('user-pc', '会員ユーザー', 'ブラウザ', 'Users', { x: 20, y: 320, width: 145, height: 88 }, nodeStyle.external, { category: 'external' }),
  makeNode('cloudfront', 'CloudFront', 'SaaS入口', ICON.cloudfront, { x: 235, y: 20, width: 170, height: 88 }, nodeStyle.edge, { category: 'external' }),
  makeNode('waf', 'AWS WAF', '攻撃/不正Bot対策', 'ShieldCheck', { x: 430, y: 20, width: 150, height: 82 }, nodeStyle.security, { category: 'external' }),
  makeNode('cognito', 'Cognito', 'ログイン/トークン', 'LockKeyhole', { x: 610, y: 20, width: 150, height: 82 }, nodeStyle.security, { category: 'external' }),
  makeNode('audit-log', 'CloudWatch Logs', '監査/アプリログ', 'Activity', { x: 790, y: 20, width: 160, height: 82 }, nodeStyle.observability, { category: 'external' }),
  makeNode('igw', 'Internet Gateway', 'VPC境界', ICON.igw, { x: 42, y: -28, width: 130, height: 64 }, nodeStyle.gateway, { category: 'gateway', parentId: 'zone-vpc' }),
  makeNode('alb', 'ALB', 'API入口', ICON.alb, { x: 72, y: 150, width: 170, height: 88 }, nodeStyle.edge, { category: 'placement', parentId: 'zone-public-subnet' }),
  makeNode('ecs', 'ECS Fargate', '会員向けAPI', ICON.ecs, { x: 55, y: 118, width: 180, height: 88 }, nodeStyle.app, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('rds', 'RDS PostgreSQL', '会員/契約データ', ICON.rds, { x: 55, y: 255, width: 180, height: 88 }, nodeStyle.data, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('secrets', 'Secrets Manager', 'DB接続情報', 'KeyRound', { x: 610, y: 620, width: 170, height: 82 }, nodeStyle.security, { category: 'external' }),
  makeNode('public-rt', 'Public Route Table', '0.0.0.0/0 -> IGW', ICON.routeTable, { x: 145, y: 26, width: 170, height: 34 }, nodeStyle.routeTable, { category: 'association', parentId: 'zone-public-subnet' }),
  makeNode('private-rt', 'Private Route Table', 'local', ICON.routeTable, { x: 145, y: 26, width: 170, height: 34 }, nodeStyle.routeTable, { category: 'association', parentId: 'zone-private-subnet' }),
  makeNode('sg-alb', 'SG: ALB', 'inbound 443', 'Shield', { x: 30, y: -22, width: 112, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'alb' }),
  makeNode('sg-ecs', 'SG: ECS', 'from ALB SG', 'Shield', { x: 34, y: -22, width: 112, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'ecs' }),
  makeNode('sg-rds', 'SG: RDS', 'from ECS SG', 'Shield', { x: 34, y: -22, width: 112, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'rds' }),
];

const createService = makeServiceFactory(answerNodes);
const createZoneService = makeZoneServiceFactory(zones);

const answerDiagram: DiagramConfig = {
  viewport: { width: 1040, height: 720, padding: 48 },
  zones,
  nodes: answerNodes,
  connections: [
    { id: 'user-to-cf', from: 'user-pc', to: 'cloudfront', kind: 'traffic', fromAnchor: 'top', toAnchor: 'left' },
    { id: 'cf-to-waf', from: 'cloudfront', to: 'waf', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'waf-to-cognito', from: 'waf', to: 'cognito', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'waf-to-igw', from: 'waf', to: 'igw', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'igw-to-alb', from: 'igw', to: 'alb', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'alb-to-ecs', from: 'alb', to: 'ecs', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'ecs-to-rds', from: 'ecs', to: 'rds', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'ecs-to-secrets', from: 'ecs', to: 'secrets', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'ecs-to-audit', from: 'ecs', to: 'audit-log', kind: 'traffic', fromAnchor: 'top', toAnchor: 'bottom' },
    { id: 'igw-to-public-rt', from: 'igw', to: 'public-rt', kind: 'attachment', label: 'route', fromAnchor: 'right', toAnchor: 'top' },
    { id: 'sg-alb-to-sg-ecs', from: 'sg-alb', to: 'sg-ecs', kind: 'association', label: '許可元', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'sg-ecs-to-sg-rds', from: 'sg-ecs', to: 'sg-rds', kind: 'association', label: '許可元', fromAnchor: 'bottom', toAnchor: 'top' },
  ],
};

const challenge: ChallengeConfig = {
  slug: 'member-saas-app',
  title: '会員制SaaSアプリを設計する',
  description: 'ログイン、API、Private DB、秘密情報、監査ログを含む会員制SaaSの完成構成を組み立てる',
  headerLabel: 'AWS DESIGN CHALLENGE',
  badge: '設計演習',
  icon: 'LockKeyhole',
  color: 'rose',
  scenario:
    '会員ログインが必要なSaaSを公開します。利用者はCloudFrontから入り、ログイン後にAPIを呼びます。APIとDBはPrivate側に置き、DB接続情報はSecrets Managerから取得し、監査ログを残せる構成にしてください。',
  requirements: [
    { id: 'network', title: 'AWSネットワークの土台', description: 'VPC、Public/Private Subnet、Route Table、Internet Gatewayを明示し、ALBだけをPublic Subnetに置く。' },
    { id: 'auth', title: '会員ログイン', description: 'ログインとトークン発行をCognitoで担う。' },
    { id: 'protection', title: '入口保護', description: 'CloudFrontの後段でWAFを通し、不正なリクエストを入口で抑える。' },
    { id: 'db', title: '会員データ', description: '会員/契約データはRDSへ保存し、APIからだけ接続できるようにする。' },
    { id: 'secrets', title: '秘密情報', description: 'DB接続情報はコードではなくSecrets ManagerからAPIが取得する。' },
    { id: 'audit', title: '監査ログ', description: '重要操作やアプリログをCloudWatch Logsに残す。' },
  ],
  initialDiagram: {
    viewport: { ...answerDiagram.viewport },
    zones,
    nodes: pickNodes(answerNodes, ['user-pc', 'cloudfront', 'waf', 'cognito', 'igw', 'alb', 'public-rt', 'private-rt', 'sg-alb']),
    connections: [
      { id: 'user-to-cf', from: 'user-pc', to: 'cloudfront', kind: 'traffic', fromAnchor: 'top', toAnchor: 'left' },
      { id: 'cf-to-waf', from: 'cloudfront', to: 'waf', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
      { id: 'waf-to-cognito', from: 'waf', to: 'cognito', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
      { id: 'waf-to-igw', from: 'waf', to: 'igw', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
      { id: 'igw-to-alb', from: 'igw', to: 'alb', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
      { id: 'igw-to-public-rt', from: 'igw', to: 'public-rt', kind: 'attachment', label: 'route', fromAnchor: 'right', toAnchor: 'top' },
    ],
  },
  lockedNodeIds: ['user-pc', 'cloudfront', 'waf', 'cognito', 'igw', 'alb', 'public-rt', 'private-rt', 'sg-alb'],
  services: [
    createZoneService('vpc', 'SaaSを動かすネットワーク境界'),
    createZoneService('public-subnet', '公開入口を置くSubnet'),
    createZoneService('private-subnet', 'APIとDBを置くSubnet'),
    createService('cloudfront', 'SaaSの公開入口'),
    createService('waf', '入口で不正アクセスを抑える保護層'),
    createService('cognito', '会員ログインとトークン発行'),
    createService('igw', 'VPCを外部へ接続する境界'),
    createService('alb', 'APIへの公開受信口'),
    createService('ecs', '会員向けAPIを動かすECS Fargate'),
    createService('rds', '会員/契約データのDB'),
    createService('secrets', 'DB接続情報の保管先'),
    createService('audit-log', '監査ログとアプリログの出力先'),
    createService('public-rt', 'Public Subnetの外部経路'),
    createService('private-rt', 'Private Subnetの内部経路'),
    createService('sg-alb', 'ALBに関連付けるSG'),
    createService('sg-ecs', 'ECSに関連付けるSG'),
    createService('sg-rds', 'RDSに関連付けるSG'),
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
    { id: 'has-cloudfront', type: 'node-exists', nodeId: 'cloudfront', label: '公開入口がある', failureMessage: '利用者を受けるCloudFrontがありません。' },
    { id: 'has-waf', type: 'node-exists', nodeId: 'waf', label: 'WAFがある', failureMessage: '入口で不正リクエストを抑えるWAFがありません。' },
    { id: 'has-cognito', type: 'node-exists', nodeId: 'cognito', label: '認証基盤がある', failureMessage: '会員ログインを担うCognitoがありません。' },
    { id: 'has-alb', type: 'node-exists', nodeId: 'alb', label: 'API受信口がある', failureMessage: 'APIリクエストを受けるALBがありません。' },
    { id: 'has-ecs', type: 'node-exists', nodeId: 'ecs', label: 'ECS Fargateがある', failureMessage: '会員向けAPIを動かすECS Fargateがありません。' },
    { id: 'has-rds', type: 'node-exists', nodeId: 'rds', label: '会員DBがある', failureMessage: '会員/契約データを保存するRDSがありません。' },
    { id: 'has-secrets', type: 'node-exists', nodeId: 'secrets', label: '秘密情報の保管先がある', failureMessage: 'DB接続情報を保管するSecrets Managerがありません。' },
    { id: 'has-audit', type: 'node-exists', nodeId: 'audit-log', label: '監査ログの出力先がある', failureMessage: '監査ログやアプリログを出すCloudWatch Logsがありません。' },
    { id: 'auth-path', type: 'path-exists', path: ['user-pc', 'cloudfront', 'waf', 'cognito'], label: 'ログイン経路が成立する', failureMessage: '利用者が入口を通って認証基盤へ到達する流れが途切れています。' },
    { id: 'api-path', type: 'path-exists', path: ['user-pc', 'cloudfront', 'waf', 'igw', 'alb', 'ecs'], label: 'API経路が成立する', failureMessage: '利用者のAPIリクエストがPrivate SubnetのECSまで届く流れが途切れています。' },
    { id: 'db-path', type: 'connection-exists', from: 'ecs', to: 'rds', label: 'ECSからDBへ接続できる', failureMessage: 'ECS FargateからRDSへ接続する経路がありません。' },
    { id: 'secret-path', type: 'connection-exists', from: 'ecs', to: 'secrets', label: 'ECSが秘密情報を読める', failureMessage: 'ECS FargateからSecrets Managerへ接続する関係がありません。' },
    { id: 'audit-path', type: 'connection-exists', from: 'ecs', to: 'audit-log', label: 'ECSがログを出せる', failureMessage: 'ECS FargateからCloudWatch Logsへログを出す経路がありません。' },
    { id: 'alb-public', type: 'node-in-zone', nodeId: 'alb', zoneId: 'public-subnet', label: 'ALBはPublic Subnetにある', failureMessage: 'ALBがPublic Subnetに配置されていません。' },
    { id: 'ecs-private', type: 'node-in-zone', nodeId: 'ecs', zoneId: 'private-subnet', label: 'ECS FargateはPrivate Subnetにある', failureMessage: 'ECS FargateがPrivate Subnetに配置されていません。' },
    { id: 'rds-private', type: 'node-in-zone', nodeId: 'rds', zoneId: 'private-subnet', label: 'RDSはPrivate Subnetにある', failureMessage: 'RDSがPrivate Subnetに配置されていません。' },
    { id: 'rds-only-ecs', type: 'incoming-only-from', nodeId: 'rds', allowedSourceIds: ['ecs'], label: 'DBはECS Fargateからだけ使う', failureMessage: 'RDSへECS Fargate以外から入る経路があります。' },
  ],
  actions: [
    { id: 'login', title: '会員がログインする', description: '入口とWAFを通り、Cognitoでログインする。', checkIds: ['has-cloudfront', 'has-waf', 'has-cognito', 'auth-path'], successMessage: '会員ログインの入口と認証基盤が成立しています。', failureMessage: 'ログイン経路の確認に失敗しました。' },
    { id: 'call-api', title: '会員がAPIを呼ぶ', description: '認証後のAPIリクエストがPrivate SubnetのECSへ届く。', checkIds: ['has-alb', 'has-ecs', 'api-path', 'alb-public', 'ecs-private'], successMessage: 'APIリクエストは公開入口からPrivate APIまで届きます。', failureMessage: 'API経路の確認に失敗しました。' },
    { id: 'query-db', title: 'APIが会員データを読む', description: 'ECS FargateがRDSへ接続する。', checkIds: ['has-rds', 'db-path', 'rds-private', 'rds-only-ecs'], successMessage: '会員データはPrivate DBに置かれ、ECS Fargateからだけ利用できます。', failureMessage: 'DB接続の確認に失敗しました。' },
    { id: 'operate', title: '秘密情報と監査ログを扱う', description: 'APIがDB秘密情報を読み、重要操作をログに残す。', checkIds: ['has-secrets', 'has-audit', 'secret-path', 'audit-path'], successMessage: '秘密情報と監査ログの扱いが構成に含まれています。', failureMessage: '運用要件の確認に失敗しました。' },
  ],
  answerDiagram,
  answerTrace: [
    { id: 'network', title: 'SaaSのネットワーク土台を作る', description: 'VPC内にPublic/Private Subnetを作り、IGWとRoute Tableを関連付けます。', visibleNodeIds: ['user-pc', 'igw', 'public-rt', 'private-rt'], visibleConnectionIds: ['igw-to-public-rt'], activeNodeIds: ['igw', 'public-rt', 'private-rt'], activeConnectionIds: ['igw-to-public-rt'] },
    { id: 'auth', title: '入口保護とログインを置く', description: 'CloudFrontの後段にWAFを置き、会員ログインはCognitoが担います。', visibleNodeIds: ['user-pc', 'cloudfront', 'waf', 'cognito', 'igw', 'public-rt', 'private-rt'], visibleConnectionIds: ['user-to-cf', 'cf-to-waf', 'waf-to-cognito', 'igw-to-public-rt'], activeNodeIds: ['user-pc', 'cloudfront', 'waf', 'cognito'], activeConnectionIds: ['user-to-cf', 'cf-to-waf', 'waf-to-cognito'] },
    { id: 'api', title: 'APIをPrivate Subnetへ届ける', description: 'WAFを通ったAPIリクエストをIGW、ALB、ECS Fargateへ渡します。ALBだけPublic、ECS FargateはPrivateに配置します。', visibleNodeIds: ['user-pc', 'cloudfront', 'waf', 'cognito', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs', 'sg-ecs'], visibleConnectionIds: ['user-to-cf', 'cf-to-waf', 'waf-to-cognito', 'waf-to-igw', 'igw-to-alb', 'alb-to-ecs', 'igw-to-public-rt', 'sg-alb-to-sg-ecs'], activeNodeIds: ['waf', 'igw', 'alb', 'ecs', 'sg-alb', 'sg-ecs'], activeConnectionIds: ['waf-to-igw', 'igw-to-alb', 'alb-to-ecs', 'sg-alb-to-sg-ecs'] },
    { id: 'data', title: 'DB、秘密情報、監査ログをつなぐ', description: 'RDSはPrivate Subnetに置き、ECSからだけ接続します。DB接続情報はSecrets Managerから読み、操作ログはCloudWatch Logsへ出します。', visibleNodeIds: ['user-pc', 'cloudfront', 'waf', 'cognito', 'audit-log', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs', 'sg-ecs', 'rds', 'sg-rds', 'secrets'], visibleConnectionIds: ['user-to-cf', 'cf-to-waf', 'waf-to-cognito', 'waf-to-igw', 'igw-to-alb', 'alb-to-ecs', 'ecs-to-rds', 'ecs-to-secrets', 'ecs-to-audit', 'igw-to-public-rt', 'sg-alb-to-sg-ecs', 'sg-ecs-to-sg-rds'], activeNodeIds: ['ecs', 'rds', 'secrets', 'audit-log', 'sg-rds'], activeConnectionIds: ['ecs-to-rds', 'ecs-to-secrets', 'ecs-to-audit', 'sg-ecs-to-sg-rds'] },
  ],
};

export default challenge;
