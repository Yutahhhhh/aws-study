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

const PROXY_ICON = 'Cable';
const CACHE_ICON = 'Zap';

const zones: DiagramZone[] = [
  makeZone('vpc', 'VPC (Data Layer)', { x: 230, y: 150, width: 820, height: 640 }),
  makeZone('public-subnet', 'Public Subnet', { x: 24, y: 60, width: 330, height: 220 }, 'public', 'vpc'),
  makeZone('private-subnet', 'Private Subnet', { x: 396, y: 60, width: 390, height: 540 }, 'private', 'vpc'),
];

const answerNodes: DiagramNode[] = [
  makeNode('user-pc', '利用者', 'ブラウザ', 'Users', { x: 20, y: 380, width: 145, height: 86 }, nodeStyle.external, { category: 'external' }),
  makeNode('cloudfront', 'CloudFront', '静的配信/入口', ICON.cloudfront, { x: 240, y: 20, width: 170, height: 86 }, nodeStyle.edge, { category: 'external' }),
  makeNode('s3', 'S3', '静的ファイル', ICON.s3, { x: 450, y: 20, width: 150, height: 82 }, nodeStyle.data, { category: 'external' }),
  makeNode('igw', 'Internet Gateway', 'VPC境界', ICON.igw, { x: 300, y: -32, width: 180, height: 78 }, nodeStyle.gateway, { category: 'gateway', parentId: 'zone-vpc' }),
  makeNode('alb', 'ALB', 'API入口', ICON.alb, { x: 70, y: 120, width: 175, height: 84 }, nodeStyle.edge, { category: 'placement', parentId: 'zone-public-subnet' }),
  makeNode('ecs', 'ECS Fargate', 'アプリAPI', ICON.ecs, { x: 80, y: 86, width: 210, height: 82 }, nodeStyle.app, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('rds-proxy', 'RDS Proxy', '接続プール', PROXY_ICON, { x: 80, y: 196, width: 210, height: 72 }, nodeStyle.edge, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('rds', 'RDS PostgreSQL', 'Primary', ICON.rds, { x: 80, y: 296, width: 210, height: 82 }, nodeStyle.data, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('cache', 'ElastiCache', 'Redis / キャッシュ', CACHE_ICON, { x: 80, y: 408, width: 210, height: 82 }, nodeStyle.queue, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('public-rt', 'Public Route Table', '0.0.0.0/0 -> IGW', ICON.routeTable, { x: 120, y: 26, width: 175, height: 34 }, nodeStyle.routeTable, { category: 'association', parentId: 'zone-public-subnet' }),
  makeNode('private-rt', 'Private Route Table', 'local', ICON.routeTable, { x: 160, y: 26, width: 175, height: 34 }, nodeStyle.routeTable, { category: 'association', parentId: 'zone-private-subnet' }),
  makeNode('sg-alb', 'SG: ALB', 'inbound 443', 'Shield', { x: 28, y: -22, width: 118, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'alb' }),
  makeNode('sg-ecs', 'SG: ECS', 'from ALB SG', 'Shield', { x: 32, y: -22, width: 118, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'ecs' }),
  makeNode('sg-proxy', 'SG: RDS Proxy', 'from ECS SG', 'Shield', { x: 32, y: -22, width: 138, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'rds-proxy' }),
  makeNode('sg-rds', 'SG: RDS', 'from Proxy SG', 'Shield', { x: 32, y: -22, width: 130, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'rds' }),
  makeNode('sg-cache', 'SG: Cache', 'from ECS SG', 'Shield', { x: 32, y: -22, width: 126, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'cache' }),
];

const createService = makeServiceFactory(answerNodes);
const createZoneService = makeZoneServiceFactory(zones);

const answerDiagram: DiagramConfig = {
  viewport: { width: 1080, height: 840, padding: 48 },
  zones,
  nodes: answerNodes,
  connections: [
    { id: 'user-to-cf', from: 'user-pc', to: 'cloudfront', kind: 'traffic', fromAnchor: 'top', toAnchor: 'left' },
    { id: 'cf-to-s3', from: 'cloudfront', to: 's3', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'cf-to-igw', from: 'cloudfront', to: 'igw', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'igw-to-alb', from: 'igw', to: 'alb', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'alb-to-ecs', from: 'alb', to: 'ecs', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'ecs-to-proxy', from: 'ecs', to: 'rds-proxy', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'proxy-to-rds', from: 'rds-proxy', to: 'rds', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'ecs-to-cache', from: 'ecs', to: 'cache', kind: 'traffic', fromAnchor: 'right', toAnchor: 'top' },
    { id: 'igw-to-public-rt', from: 'igw', to: 'public-rt', kind: 'attachment', label: 'route', fromAnchor: 'right', toAnchor: 'top' },
    { id: 'sg-alb-to-sg-ecs', from: 'sg-alb', to: 'sg-ecs', kind: 'association', label: '許可元', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'sg-ecs-to-sg-proxy', from: 'sg-ecs', to: 'sg-proxy', kind: 'association', label: '許可元', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'sg-proxy-to-sg-rds', from: 'sg-proxy', to: 'sg-rds', kind: 'association', label: '許可元', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'sg-ecs-to-sg-cache', from: 'sg-ecs', to: 'sg-cache', kind: 'association', label: '許可元', fromAnchor: 'right', toAnchor: 'top' },
  ],
};

const challenge: ChallengeConfig = {
  slug: 'data-layer-app',
  title: 'データ層を設計する（RDS Proxy / キャッシュ）',
  description: 'ECSの急増で接続が枯渇しないようRDS Proxyを挟み、読み取りをElastiCacheで受けるデータ層を組み立てる',
  headerLabel: 'AWS DATA LAYER DESIGN',
  badge: '設計演習',
  icon: 'Database',
  color: 'amber',
  scenario:
    'アクセス増でECS Fargateがスケールアウトすると、各TaskがRDSへ直接大量の接続を張り、接続数を食い潰して障害になります。ECSとRDSの間にRDS Proxyを挟んで接続をプールし、繰り返し読まれるデータはElastiCacheで受ける、枯渇に強いデータ層を設計してください。DBへはProxy経由でだけ到達させます。',
  requirements: [
    { id: 'network', title: 'AWSネットワークの土台', description: 'VPC、Public/Private Subnet、Route Table、Internet Gatewayを明示し、ALBだけをPublic Subnetに置く。' },
    { id: 'api', title: 'API層', description: 'ECS FargateはPrivate Subnetに配置し、ALBのSGからだけ受ける。' },
    { id: 'proxy', title: '接続プール', description: 'ECSとRDSの間にRDS Proxyを置き、ECSはProxy経由でDBへ接続する。' },
    { id: 'db', title: 'DB保護', description: 'RDSはPrivate Subnetに置き、RDS ProxyのSGからだけ接続を許可する（ECSから直結させない）。' },
    { id: 'cache', title: 'キャッシュ', description: '繰り返しの読み取りをElastiCacheで受け、ECSのSGからだけ許可する。' },
  ],
  initialDiagram: {
    viewport: { ...answerDiagram.viewport },
    zones: [],
    nodes: pickNodes(answerNodes, ['user-pc']),
    connections: [],
  },
  lockedNodeIds: ['user-pc'],
  services: [
    createZoneService('vpc', 'データ層を動かすネットワーク境界'),
    createZoneService('public-subnet', 'ALBを置くSubnet'),
    createZoneService('private-subnet', 'ECS/Proxy/DB/キャッシュを置くSubnet'),
    createService('cloudfront', '静的配信とAPIの入口'),
    createService('s3', '静的ファイルの配置先'),
    createService('igw', 'VPCの外部接続点'),
    createService('alb', 'ECSへの公開受信口'),
    createService('ecs', 'アプリAPIを動かすECS Fargate'),
    createService('rds-proxy', '接続をプールするRDS Proxy'),
    createService('rds', '永続データのRDS Primary'),
    createService('cache', '読み取りを受けるElastiCache'),
    createService('public-rt', 'Public SubnetのRoute Table'),
    createService('private-rt', 'Private SubnetのRoute Table'),
    createService('sg-alb', 'ALBに関連付けるSG'),
    createService('sg-ecs', 'ECSに関連付けるSG'),
    createService('sg-proxy', 'RDS Proxyに関連付けるSG'),
    createService('sg-rds', 'RDSに関連付けるSG'),
    createService('sg-cache', 'ElastiCacheに関連付けるSG'),
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
      { securityGroupNodeId: 'sg-proxy', attachedToNodeId: 'rds-proxy', label: 'RDS Proxy Security Group', allowedSourceSecurityGroupIds: ['sg-ecs'] },
      { securityGroupNodeId: 'sg-rds', attachedToNodeId: 'rds', label: 'RDS Security Group', allowedSourceSecurityGroupIds: ['sg-proxy'] },
      { securityGroupNodeId: 'sg-cache', attachedToNodeId: 'cache', label: 'Cache Security Group', allowedSourceSecurityGroupIds: ['sg-ecs'] },
    ],
  },
  checks: [
    { id: 'static-path', type: 'path-exists', path: ['user-pc', 'cloudfront', 's3'], label: '静的配信経路が成立する', failureMessage: '利用者がCloudFront経由で静的ファイルへ到達する経路がありません。' },
    { id: 'api-path', type: 'path-exists', path: ['user-pc', 'cloudfront', 'igw', 'alb', 'ecs'], label: 'API経路が成立する', failureMessage: '利用者のAPIリクエストがPrivate SubnetのECS Fargateまで届く流れが途切れています。' },
    { id: 'db-via-proxy', type: 'path-exists', path: ['ecs', 'rds-proxy', 'rds'], label: 'Proxy経由でDBへ到達できる', failureMessage: 'ECSがRDS Proxyを経由してRDSへ接続する流れが途切れています。接続枯渇を防ぐため、DBへはProxy経由で到達させます。' },
    { id: 'cache-path', type: 'connection-exists', from: 'ecs', to: 'cache', label: 'キャッシュを読める', failureMessage: 'ECSからElastiCacheへの接続がありません。繰り返しの読み取りはキャッシュで受けます。' },
    { id: 'alb-public', type: 'node-in-zone', nodeId: 'alb', zoneId: 'public-subnet', label: 'ALBはPublic Subnetにある', failureMessage: 'ALBがPublic Subnetに配置されていません。' },
    { id: 'ecs-private', type: 'node-in-zone', nodeId: 'ecs', zoneId: 'private-subnet', label: 'ECSはPrivate Subnetにある', failureMessage: 'ECS FargateがPrivate Subnetに配置されていません。' },
    { id: 'proxy-private', type: 'node-in-zone', nodeId: 'rds-proxy', zoneId: 'private-subnet', label: 'RDS ProxyはPrivate Subnetにある', failureMessage: 'RDS ProxyがPrivate Subnetに配置されていません。' },
    { id: 'rds-private', type: 'node-in-zone', nodeId: 'rds', zoneId: 'private-subnet', label: 'RDSはPrivate Subnetにある', failureMessage: 'RDSがPrivate Subnetに配置されていません。' },
    { id: 'cache-private', type: 'node-in-zone', nodeId: 'cache', zoneId: 'private-subnet', label: 'ElastiCacheはPrivate Subnetにある', failureMessage: 'ElastiCacheがPrivate Subnetに配置されていません。' },
    { id: 'rds-only-proxy', type: 'incoming-only-from', nodeId: 'rds', allowedSourceIds: ['rds-proxy'], label: 'DBへはProxy経由でだけ入る', failureMessage: 'RDSへRDS Proxy以外から入る経路があります。ECSからDBへ直結せず、Proxyを必ず通します。' },
  ],
  actions: [
    { id: 'open-web', title: '利用者がWeb画面を開く', description: 'CloudFront経由で静的ファイルを取得する。', checkIds: ['static-path'], successMessage: '静的配信が成立しています。', failureMessage: 'Web画面の表示に失敗しました。' },
    { id: 'call-api', title: '利用者がAPIを呼ぶ', description: 'ALB経由でPrivate SubnetのECSへ到達する。', checkIds: ['api-path', 'alb-public', 'ecs-private'], successMessage: 'APIリクエストはPrivate APIまで届きます。', failureMessage: 'API経路の確認に失敗しました。' },
    { id: 'scale-and-query', title: 'ECSが急増してもDBへ接続できる', description: 'スケールアウトしたECSがRDS Proxy経由でDBへ接続する。', checkIds: ['db-via-proxy', 'proxy-private', 'rds-private', 'rds-only-proxy'], successMessage: 'ECSはRDS Proxyで接続をプールし、DBはProxy経由でだけ使えます。接続枯渇に強い構成です。', failureMessage: 'Proxy経由のDB接続の確認に失敗しました。' },
    { id: 'read-cache', title: '繰り返しの読み取りをキャッシュで受ける', description: 'ECSがElastiCacheから結果を読む。', checkIds: ['cache-path', 'cache-private'], successMessage: '繰り返しの読み取りをElastiCacheで受け、DB負荷を下げられます。', failureMessage: 'キャッシュ経路の確認に失敗しました。' },
  ],
  answerDiagram,
  answerTrace: [
    { id: 'network', title: 'VPCの土台を作る', description: 'VPCにPublic/Private Subnetを作り、ALBはPublic、ECS/Proxy/DB/キャッシュはPrivateに置ける土台を用意します。', visibleNodeIds: ['user-pc', 'igw', 'public-rt', 'private-rt'], visibleConnectionIds: ['igw-to-public-rt'], activeNodeIds: ['igw', 'public-rt', 'private-rt'], activeConnectionIds: ['igw-to-public-rt'] },
    { id: 'api', title: '入口とAPIをつなぐ', description: '利用者はCloudFrontから入り、APIはIGW・ALBを経由してPrivate SubnetのECS Fargateへ届きます。', visibleNodeIds: ['user-pc', 'cloudfront', 's3', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs', 'sg-ecs'], visibleConnectionIds: ['user-to-cf', 'cf-to-s3', 'cf-to-igw', 'igw-to-alb', 'alb-to-ecs', 'igw-to-public-rt', 'sg-alb-to-sg-ecs'], activeNodeIds: ['cloudfront', 'alb', 'ecs', 'sg-alb', 'sg-ecs'], activeConnectionIds: ['cf-to-igw', 'igw-to-alb', 'alb-to-ecs', 'sg-alb-to-sg-ecs'] },
    { id: 'proxy', title: 'RDS Proxyを挟んで接続枯渇を防ぐ', description: 'ECSはRDS Proxyへ接続し、Proxyが少数の実接続にまとめてRDSへ渡します。RDSのSGはProxyのSGからだけ許可し、ECSから直結させません。', visibleNodeIds: ['user-pc', 'cloudfront', 's3', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs', 'sg-ecs', 'rds-proxy', 'sg-proxy', 'rds', 'sg-rds'], visibleConnectionIds: ['user-to-cf', 'cf-to-s3', 'cf-to-igw', 'igw-to-alb', 'alb-to-ecs', 'ecs-to-proxy', 'proxy-to-rds', 'igw-to-public-rt', 'sg-alb-to-sg-ecs', 'sg-ecs-to-sg-proxy', 'sg-proxy-to-sg-rds'], activeNodeIds: ['ecs', 'rds-proxy', 'rds', 'sg-proxy', 'sg-rds'], activeConnectionIds: ['ecs-to-proxy', 'proxy-to-rds', 'sg-ecs-to-sg-proxy', 'sg-proxy-to-sg-rds'] },
    { id: 'cache', title: 'キャッシュで読み取りを受ける', description: '繰り返し読まれるデータはElastiCacheから返し、DBへの読み取りを減らします。キャッシュのSGはECSのSGからだけ許可します。', visibleNodeIds: ['user-pc', 'cloudfront', 's3', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs', 'sg-ecs', 'rds-proxy', 'sg-proxy', 'rds', 'sg-rds', 'cache', 'sg-cache'], visibleConnectionIds: ['user-to-cf', 'cf-to-s3', 'cf-to-igw', 'igw-to-alb', 'alb-to-ecs', 'ecs-to-proxy', 'proxy-to-rds', 'ecs-to-cache', 'igw-to-public-rt', 'sg-alb-to-sg-ecs', 'sg-ecs-to-sg-proxy', 'sg-proxy-to-sg-rds', 'sg-ecs-to-sg-cache'], activeNodeIds: ['ecs', 'cache', 'sg-cache'], activeConnectionIds: ['ecs-to-cache', 'sg-ecs-to-sg-cache'] },
  ],
};

export default challenge;
