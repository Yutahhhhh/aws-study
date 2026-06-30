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
  makeZone('vpc', 'VPC (Media Site)', { x: 245, y: 150, width: 760, height: 500 }),
  makeZone('public-subnet', 'Public Subnet', { x: 24, y: 58, width: 330, height: 410 }, 'public', 'vpc'),
  makeZone('private-subnet', 'Private Subnet', { x: 390, y: 58, width: 330, height: 410 }, 'private', 'vpc'),
];

const answerNodes: DiagramNode[] = [
  makeNode('reader', '読者', 'ブラウザ', 'Users', { x: 20, y: 270, width: 135, height: 82 }, nodeStyle.external, { category: 'external' }),
  makeNode('crawler', '検索クローラー', 'Googlebot等', 'SearchCheck', { x: 20, y: 405, width: 135, height: 82 }, nodeStyle.external, { category: 'external' }),
  makeNode('route53', 'Route 53', '独自ドメイン', 'Globe2', { x: 210, y: 20, width: 145, height: 82 }, nodeStyle.edge, { category: 'external' }),
  makeNode('cloudfront', 'CloudFront', '公開入口/キャッシュ', ICON.cloudfront, { x: 390, y: 20, width: 175, height: 86 }, nodeStyle.edge, { category: 'external' }),
  makeNode('asset-bucket', 'S3 Asset Bucket', '画像/OGP', ICON.s3, { x: 600, y: 20, width: 170, height: 82 }, nodeStyle.data, { category: 'external' }),
  makeNode('seo-bucket', 'S3 SEO Bucket', 'sitemap / robots', ICON.s3, { x: 805, y: 20, width: 170, height: 82 }, nodeStyle.data, { category: 'external' }),
  makeNode('igw', 'Internet Gateway', 'VPC境界', ICON.igw, { x: 40, y: -28, width: 128, height: 62 }, nodeStyle.gateway, { category: 'gateway', parentId: 'zone-vpc' }),
  makeNode('alb', 'ALB', '記事アプリ入口', ICON.alb, { x: 70, y: 152, width: 165, height: 84 }, nodeStyle.edge, { category: 'placement', parentId: 'zone-public-subnet' }),
  makeNode('ecs-renderer', 'ECS Fargate', '記事Renderer', ICON.ecs, { x: 56, y: 92, width: 180, height: 84 }, nodeStyle.app, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('ecs-ogp', 'ECS Fargate', 'OGP生成Worker', ICON.ecs, { x: 56, y: 216, width: 180, height: 84 }, nodeStyle.worker, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('content-db', 'RDS PostgreSQL', '記事本文/メタ', ICON.rds, { x: 56, y: 340, width: 180, height: 84 }, nodeStyle.data, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('redirect-function', 'CloudFront Function', '正規URLへ統一', 'CornerDownRight', { x: 1015, y: 155, width: 180, height: 78 }, nodeStyle.worker, { category: 'external' }),
  makeNode('public-rt', 'Public Route Table', '0.0.0.0/0 -> IGW', ICON.routeTable, { x: 145, y: 26, width: 175, height: 34 }, nodeStyle.routeTable, { category: 'association', parentId: 'zone-public-subnet' }),
  makeNode('private-rt', 'Private Route Table', 'local', ICON.routeTable, { x: 145, y: 26, width: 175, height: 34 }, nodeStyle.routeTable, { category: 'association', parentId: 'zone-private-subnet' }),
  makeNode('sg-alb', 'SG: ALB', 'inbound 443', 'Shield', { x: 28, y: -22, width: 118, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'alb' }),
  makeNode('sg-renderer', 'SG: Renderer', 'from ALB SG', 'Shield', { x: 30, y: -22, width: 128, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'ecs-renderer' }),
  makeNode('sg-ogp', 'SG: OGP', 'egress S3/RDS', 'Shield', { x: 30, y: -22, width: 128, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'ecs-ogp' }),
  makeNode('sg-rds', 'SG: RDS', 'from ECS SG', 'Shield', { x: 30, y: -22, width: 128, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'content-db' }),
];

const createService = makeServiceFactory(answerNodes);
const createZoneService = makeZoneServiceFactory(zones);

const answerDiagram: DiagramConfig = {
  viewport: { width: 1240, height: 700, padding: 48 },
  zones,
  nodes: answerNodes,
  connections: [
    { id: 'reader-to-route53', from: 'reader', to: 'route53', kind: 'traffic', fromAnchor: 'top', toAnchor: 'left' },
    { id: 'crawler-to-route53', from: 'crawler', to: 'route53', kind: 'traffic', fromAnchor: 'top', toAnchor: 'left' },
    { id: 'route53-to-cf', from: 'route53', to: 'cloudfront', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'cf-to-assets', from: 'cloudfront', to: 'asset-bucket', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'cf-to-seo', from: 'cloudfront', to: 'seo-bucket', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'cf-to-redirect', from: 'cloudfront', to: 'redirect-function', kind: 'association', label: '正規化', fromAnchor: 'right', toAnchor: 'top' },
    { id: 'cf-to-igw', from: 'cloudfront', to: 'igw', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'igw-to-alb', from: 'igw', to: 'alb', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'alb-to-renderer', from: 'alb', to: 'ecs-renderer', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'renderer-to-db', from: 'ecs-renderer', to: 'content-db', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'renderer-to-ogp', from: 'ecs-renderer', to: 'ecs-ogp', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'ogp-to-assets', from: 'ecs-ogp', to: 'asset-bucket', kind: 'traffic', fromAnchor: 'top', toAnchor: 'bottom' },
    { id: 'ogp-to-db', from: 'ecs-ogp', to: 'content-db', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'right' },
    { id: 'igw-to-public-rt', from: 'igw', to: 'public-rt', kind: 'attachment', label: 'route', fromAnchor: 'right', toAnchor: 'top' },
    { id: 'sg-alb-to-sg-renderer', from: 'sg-alb', to: 'sg-renderer', kind: 'association', label: '許可元', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'sg-renderer-to-sg-rds', from: 'sg-renderer', to: 'sg-rds', kind: 'association', label: '許可元', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'sg-ogp-to-sg-rds', from: 'sg-ogp', to: 'sg-rds', kind: 'association', label: '許可元', fromAnchor: 'bottom', toAnchor: 'right' },
  ],
};

const challenge: ChallengeConfig = {
  slug: 'media-site',
  title: '記事メディアサイトを設計する',
  description: '独自ドメイン、CloudFront、ECS記事Renderer、RDS、画像配信、SEOファイル、OGP生成を含む構成を組み立てる',
  headerLabel: 'AWS DESIGN CHALLENGE',
  badge: '設計演習',
  icon: 'Newspaper',
  color: 'amber',
  scenario:
    '記事メディアを公開します。読者と検索クローラーが独自ドメインから記事本文へ到達でき、画像やSEOファイルをCloudFrontから配信し、OGP画像も生成できる完成構成にしてください。記事RendererとDBはVPC内に置き、Security Groupで入口を絞ります。',
  requirements: [
    { id: 'network', title: 'AWSネットワークの土台', description: 'VPC、Public/Private Subnet、Route Table、Internet Gatewayを明示する。' },
    { id: 'article', title: '記事ページ配信', description: 'CloudFrontからALBを経由し、Private SubnetのECS Fargate記事Rendererへ届ける。' },
    { id: 'seo', title: '検索向け公開ファイル', description: 'sitemap.xml と robots.txt をCloudFront経由で配信する。' },
    { id: 'assets', title: '画像配信', description: '記事画像とOGP画像をS3 Asset BucketからCloudFront経由で配信する。' },
    { id: 'ogp', title: 'OGP生成', description: '記事RendererからECS OGP Workerを呼び、生成画像をS3に保存する。' },
    { id: 'security', title: 'Security Group', description: 'ALB、ECS、RDSにSGを関連付け、RDSはECSからだけ許可する。' },
  ],
  initialDiagram: {
    viewport: { ...answerDiagram.viewport },
    zones: [],
    nodes: pickNodes(answerNodes, ['reader', 'crawler']),
    connections: [],
  },
  lockedNodeIds: ['reader', 'crawler'],
  services: [
    createZoneService('vpc', '記事メディアを動かすネットワーク境界'),
    createZoneService('public-subnet', 'ALBを置くSubnet'),
    createZoneService('private-subnet', 'ECSとRDSを置くSubnet'),
    createService('route53', '独自ドメインの名前解決'),
    createService('cloudfront', '記事、画像、SEOファイルの公開入口'),
    createService('asset-bucket', '記事画像とOGP画像の保存先'),
    createService('seo-bucket', 'sitemap.xml / robots.txt の保存先'),
    createService('redirect-function', 'URL正規化を担うCloudFront Function'),
    createService('igw', 'VPCの外部接続点'),
    createService('alb', '記事Rendererへの公開受信口'),
    createService('ecs-renderer', '記事本文を返すECS Fargate'),
    createService('ecs-ogp', 'OGP画像を生成するECS Fargate'),
    createService('content-db', '記事本文とメタ情報のRDS'),
    createService('public-rt', 'Public SubnetのRoute Table'),
    createService('private-rt', 'Private SubnetのRoute Table'),
    createService('sg-alb', 'ALBに関連付けるSG'),
    createService('sg-renderer', '記事Rendererに関連付けるSG'),
    createService('sg-ogp', 'OGP Workerに関連付けるSG'),
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
      { securityGroupNodeId: 'sg-renderer', attachedToNodeId: 'ecs-renderer', label: 'Renderer Security Group', allowedSourceSecurityGroupIds: ['sg-alb'] },
      { securityGroupNodeId: 'sg-ogp', attachedToNodeId: 'ecs-ogp', label: 'OGP Worker Security Group' },
      { securityGroupNodeId: 'sg-rds', attachedToNodeId: 'content-db', label: 'RDS Security Group', allowedSourceSecurityGroupIds: ['sg-renderer', 'sg-ogp'] },
    ],
  },
  checks: [
    { id: 'article-path', type: 'path-exists', path: ['crawler', 'route53', 'cloudfront', 'igw', 'alb', 'ecs-renderer', 'content-db'], label: 'クローラーが記事本文へ到達できる', failureMessage: '検索クローラーが独自ドメインから記事RendererとRDSへ到達する流れが途切れています。' },
    { id: 'reader-path', type: 'path-exists', path: ['reader', 'route53', 'cloudfront', 'igw', 'alb', 'ecs-renderer'], label: '読者が記事を読める', failureMessage: '読者がCloudFront/ALB経由でECS Fargateの記事Rendererへ到達する流れが途切れています。' },
    { id: 'redirect-path', type: 'connection-exists', from: 'cloudfront', to: 'redirect-function', label: 'URLを正規化できる', failureMessage: 'CloudFrontとURL正規化処理の関連付けがありません。' },
    { id: 'asset-path', type: 'connection-exists', from: 'cloudfront', to: 'asset-bucket', label: '画像を配信できる', failureMessage: 'CloudFrontから画像保存先へ到達する経路がありません。' },
    { id: 'seo-path', type: 'connection-exists', from: 'cloudfront', to: 'seo-bucket', label: 'SEOファイルを配信できる', failureMessage: 'sitemap.xml / robots.txt をCloudFrontから返す経路がありません。' },
    { id: 'ogp-path', type: 'path-exists', path: ['ecs-renderer', 'ecs-ogp', 'asset-bucket'], label: 'OGP画像を生成して保存できる', failureMessage: '記事RendererからOGP Workerを呼び、生成画像をS3へ保存する流れが途切れています。' },
    { id: 'ogp-db-path', type: 'connection-exists', from: 'ecs-ogp', to: 'content-db', label: 'OGP Workerが記事メタ情報を読める', failureMessage: 'OGP WorkerからRDSへ記事メタ情報を読む経路がありません。' },
    { id: 'alb-public', type: 'node-in-zone', nodeId: 'alb', zoneId: 'public-subnet', label: 'ALBはPublic Subnetにある', failureMessage: 'ALBがPublic Subnetに配置されていません。' },
    { id: 'renderer-private', type: 'node-in-zone', nodeId: 'ecs-renderer', zoneId: 'private-subnet', label: '記事RendererはPrivate Subnetにある', failureMessage: 'ECS Fargateの記事RendererがPrivate Subnetに配置されていません。' },
    { id: 'ogp-private', type: 'node-in-zone', nodeId: 'ecs-ogp', zoneId: 'private-subnet', label: 'OGP WorkerはPrivate Subnetにある', failureMessage: 'ECS FargateのOGP WorkerがPrivate Subnetに配置されていません。' },
    { id: 'db-private', type: 'node-in-zone', nodeId: 'content-db', zoneId: 'private-subnet', label: 'RDSはPrivate Subnetにある', failureMessage: 'RDSがPrivate Subnetに配置されていません。' },
    { id: 'rds-only-ecs', type: 'incoming-only-from', nodeId: 'content-db', allowedSourceIds: ['ecs-renderer', 'ecs-ogp'], label: 'RDSはECSからだけ使う', failureMessage: 'RDSへECS以外から入る経路があります。' },
  ],
  actions: [
    { id: 'crawl-article', title: '検索クローラーが記事を取得する', description: '独自ドメインから記事本文とメタ情報へ到達する。', checkIds: ['article-path', 'renderer-private', 'db-private'], successMessage: 'クローラーは公開ドメインから記事本文へ到達できます。', failureMessage: '記事取得の確認に失敗しました。' },
    { id: 'read-page', title: '読者が記事ページを開く', description: 'CloudFront経由で記事ページと画像を取得する。', checkIds: ['reader-path', 'asset-path', 'alb-public'], successMessage: '読者は記事本文と画像をCloudFront経由で取得できます。', failureMessage: '読者向けページ表示に失敗しました。' },
    { id: 'seo-files', title: '検索エンジンがSEOファイルを見る', description: 'sitemap.xml と robots.txt を取得し、URL正規化も通る。', checkIds: ['seo-path', 'redirect-path'], successMessage: 'SEOファイルとURL正規化の入口が揃っています。', failureMessage: 'SEOファイル公開の確認に失敗しました。' },
    { id: 'ogp', title: 'SNS共有用画像を生成する', description: '記事メタ情報からOGP画像を作成し、画像保存先へ置く。', checkIds: ['ogp-path', 'ogp-db-path', 'ogp-private', 'rds-only-ecs'], successMessage: '記事ごとのOGP画像をECS Workerで生成して配信対象にできます。', failureMessage: 'OGP画像生成の確認に失敗しました。' },
  ],
  answerDiagram,
  answerTrace: [
    { id: 'network', title: 'メディアサイトのVPC土台を作る', description: 'ALBはPublic Subnet、ECS FargateとRDSはPrivate Subnetに置く前提でVPCを作ります。', visibleNodeIds: ['reader', 'crawler', 'igw', 'public-rt', 'private-rt'], visibleConnectionIds: ['igw-to-public-rt'], activeNodeIds: ['igw', 'public-rt', 'private-rt'], activeConnectionIds: ['igw-to-public-rt'] },
    { id: 'entry', title: '公開入口と記事Rendererをつなぐ', description: 'Route 53、CloudFront、IGW、ALBを経由し、Private SubnetのECS Fargate記事Rendererへ到達します。', visibleNodeIds: ['reader', 'crawler', 'route53', 'cloudfront', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs-renderer', 'sg-renderer'], visibleConnectionIds: ['reader-to-route53', 'crawler-to-route53', 'route53-to-cf', 'cf-to-igw', 'igw-to-alb', 'alb-to-renderer', 'igw-to-public-rt', 'sg-alb-to-sg-renderer'], activeNodeIds: ['route53', 'cloudfront', 'alb', 'ecs-renderer', 'sg-alb', 'sg-renderer'], activeConnectionIds: ['route53-to-cf', 'cf-to-igw', 'igw-to-alb', 'alb-to-renderer', 'sg-alb-to-sg-renderer'] },
    { id: 'content', title: '記事本文とSEO/画像配信を用意する', description: '記事本文とメタ情報はRDSから取得し、画像とSEOファイルはCloudFrontからS3へ配信します。', visibleNodeIds: ['reader', 'crawler', 'route53', 'cloudfront', 'asset-bucket', 'seo-bucket', 'redirect-function', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs-renderer', 'sg-renderer', 'content-db', 'sg-rds'], visibleConnectionIds: ['reader-to-route53', 'crawler-to-route53', 'route53-to-cf', 'cf-to-assets', 'cf-to-seo', 'cf-to-redirect', 'cf-to-igw', 'igw-to-alb', 'alb-to-renderer', 'renderer-to-db', 'igw-to-public-rt', 'sg-alb-to-sg-renderer', 'sg-renderer-to-sg-rds'], activeNodeIds: ['cloudfront', 'asset-bucket', 'seo-bucket', 'redirect-function', 'content-db', 'sg-rds'], activeConnectionIds: ['cf-to-assets', 'cf-to-seo', 'cf-to-redirect', 'renderer-to-db', 'sg-renderer-to-sg-rds'] },
    { id: 'ogp', title: 'OGP生成Workerを加える', description: 'ECS FargateのOGP Workerが記事メタ情報をRDSから読み、生成画像をS3 Asset Bucketへ保存します。', visibleNodeIds: ['reader', 'crawler', 'route53', 'cloudfront', 'asset-bucket', 'seo-bucket', 'redirect-function', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs-renderer', 'sg-renderer', 'ecs-ogp', 'sg-ogp', 'content-db', 'sg-rds'], visibleConnectionIds: ['reader-to-route53', 'crawler-to-route53', 'route53-to-cf', 'cf-to-assets', 'cf-to-seo', 'cf-to-redirect', 'cf-to-igw', 'igw-to-alb', 'alb-to-renderer', 'renderer-to-db', 'renderer-to-ogp', 'ogp-to-assets', 'ogp-to-db', 'igw-to-public-rt', 'sg-alb-to-sg-renderer', 'sg-renderer-to-sg-rds', 'sg-ogp-to-sg-rds'], activeNodeIds: ['ecs-renderer', 'ecs-ogp', 'asset-bucket', 'content-db', 'sg-ogp', 'sg-rds'], activeConnectionIds: ['renderer-to-ogp', 'ogp-to-assets', 'ogp-to-db', 'sg-ogp-to-sg-rds'] },
  ],
};

export default challenge;
