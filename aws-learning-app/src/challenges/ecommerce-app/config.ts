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
  makeZone('vpc', 'VPC (Commerce)', { x: 230, y: 155, width: 760, height: 520 }),
  makeZone('public-subnet', 'Public Subnet', { x: 24, y: 60, width: 330, height: 430 }, 'public', 'vpc'),
  makeZone('private-subnet', 'Private Subnet', { x: 390, y: 60, width: 330, height: 430 }, 'private', 'vpc'),
];

const answerNodes: DiagramNode[] = [
  makeNode('customer', '購入者', 'ブラウザ', 'ShoppingCart', { x: 20, y: 340, width: 140, height: 86 }, nodeStyle.external, { category: 'external' }),
  makeNode('cloudfront', 'CloudFront', 'ストア入口', ICON.cloudfront, { x: 230, y: 20, width: 170, height: 86 }, nodeStyle.edge, { category: 'external' }),
  makeNode('frontend-bucket', 'S3 Frontend Bucket', '静的フロント', ICON.s3, { x: 430, y: 20, width: 170, height: 82 }, nodeStyle.data, { category: 'external' }),
  makeNode('payment', '外部決済サービス', 'カード決済', 'CreditCard', { x: 630, y: 20, width: 150, height: 82 }, nodeStyle.external, { category: 'external' }),
  makeNode('email', 'Email Service', '注文メール', 'Mail', { x: 810, y: 20, width: 150, height: 82 }, nodeStyle.external, { category: 'external' }),
  makeNode('igw', 'Internet Gateway', 'VPC境界', ICON.igw, { x: 40, y: -28, width: 128, height: 62 }, nodeStyle.gateway, { category: 'gateway', parentId: 'zone-vpc' }),
  makeNode('alb', 'ALB', '注文API入口', ICON.alb, { x: 68, y: 155, width: 165, height: 84 }, nodeStyle.edge, { category: 'placement', parentId: 'zone-public-subnet' }),
  makeNode('ecs-service', 'ECS Fargate', '商品/注文API', ICON.ecs, { x: 52, y: 82, width: 180, height: 84 }, nodeStyle.app, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('order-worker', 'ECS Fargate', '注文Worker', ICON.ecs, { x: 52, y: 206, width: 180, height: 84 }, nodeStyle.worker, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('product-db', 'RDS PostgreSQL', '商品/注文DB', ICON.rds, { x: 52, y: 330, width: 180, height: 84 }, nodeStyle.data, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('order-queue', 'SQS Order Queue', '注文イベント', 'ListTodo', { x: 1030, y: 250, width: 170, height: 78 }, nodeStyle.queue, { category: 'external' }),
  makeNode('dlq', 'Order DLQ', '失敗注文イベント', 'ArchiveX', { x: 1030, y: 380, width: 150, height: 78 }, nodeStyle.security, { category: 'external' }),
  makeNode('public-rt', 'Public Route Table', '0.0.0.0/0 -> IGW', ICON.routeTable, { x: 145, y: 26, width: 175, height: 34 }, nodeStyle.routeTable, { category: 'association', parentId: 'zone-public-subnet' }),
  makeNode('private-rt', 'Private Route Table', 'local / endpoints', ICON.routeTable, { x: 145, y: 26, width: 175, height: 34 }, nodeStyle.routeTable, { category: 'association', parentId: 'zone-private-subnet' }),
  makeNode('sg-alb', 'SG: ALB', 'inbound 443', 'Shield', { x: 28, y: -22, width: 118, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'alb' }),
  makeNode('sg-service', 'SG: ECS Service', 'from ALB SG', 'Shield', { x: 30, y: -22, width: 136, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'ecs-service' }),
  makeNode('sg-worker', 'SG: Worker', 'egress AWS svc', 'Shield', { x: 30, y: -22, width: 128, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'order-worker' }),
  makeNode('sg-rds', 'SG: RDS', 'from ECS SG', 'Shield', { x: 30, y: -22, width: 128, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'product-db' }),
];

const createService = makeServiceFactory(answerNodes);
const createZoneService = makeZoneServiceFactory(zones);

const answerDiagram: DiagramConfig = {
  viewport: { width: 1240, height: 740, padding: 48 },
  zones,
  nodes: answerNodes,
  connections: [
    { id: 'customer-to-cf', from: 'customer', to: 'cloudfront', kind: 'traffic', fromAnchor: 'top', toAnchor: 'left' },
    { id: 'cf-to-frontend', from: 'cloudfront', to: 'frontend-bucket', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'cf-to-igw', from: 'cloudfront', to: 'igw', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'igw-to-alb', from: 'igw', to: 'alb', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'alb-to-service', from: 'alb', to: 'ecs-service', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'service-to-db', from: 'ecs-service', to: 'product-db', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'service-to-payment', from: 'ecs-service', to: 'payment', kind: 'traffic', fromAnchor: 'top', toAnchor: 'bottom' },
    { id: 'service-to-queue', from: 'ecs-service', to: 'order-queue', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'queue-to-worker', from: 'order-queue', to: 'order-worker', kind: 'traffic', fromAnchor: 'left', toAnchor: 'right' },
    { id: 'worker-to-db', from: 'order-worker', to: 'product-db', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'right' },
    { id: 'worker-to-email', from: 'order-worker', to: 'email', kind: 'traffic', fromAnchor: 'top', toAnchor: 'bottom' },
    { id: 'queue-to-dlq', from: 'order-queue', to: 'dlq', kind: 'association', label: '失敗時', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'igw-to-public-rt', from: 'igw', to: 'public-rt', kind: 'attachment', label: 'route', fromAnchor: 'right', toAnchor: 'top' },
    { id: 'sg-alb-to-sg-service', from: 'sg-alb', to: 'sg-service', kind: 'association', label: '許可元', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'sg-service-to-sg-rds', from: 'sg-service', to: 'sg-rds', kind: 'association', label: '許可元', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'sg-worker-to-sg-rds', from: 'sg-worker', to: 'sg-rds', kind: 'association', label: '許可元', fromAnchor: 'bottom', toAnchor: 'right' },
  ],
};

const challenge: ChallengeConfig = {
  slug: 'ecommerce-app',
  title: 'ECサイトを設計する',
  description: '静的配信、ECS商品/注文API、RDS、決済連携、注文Worker、SQS/DLQ、SGを含むECサイト構成を組み立てる',
  headerLabel: 'AWS DESIGN CHALLENGE',
  badge: '設計演習',
  icon: 'ShoppingCart',
  color: 'amber',
  scenario:
    '商品一覧と購入機能を持つECサイトを作ります。フロントエンドはCloudFront/S3、商品/注文処理はPrivate SubnetのECS Fargate、商品/注文データはRDSです。決済後の在庫更新やメール通知は注文イベントとして非同期処理できる構成にしてください。',
  requirements: [
    { id: 'network', title: 'AWSネットワークの土台', description: 'VPC、Public/Private Subnet、Route Table、Internet Gatewayを明示する。' },
    { id: 'storefront', title: 'ストア画面', description: '購入者がCloudFront経由でS3のストア画面を取得できる。' },
    { id: 'service', title: '商品/注文API', description: 'ALBをPublic Subnet、ECS FargateをPrivate Subnetに配置する。' },
    { id: 'db', title: '商品/注文DB', description: '商品情報と注文情報をRDS PostgreSQLへ保存する。' },
    { id: 'payment', title: '決済連携', description: 'ECS Fargateから外部決済APIへ決済リクエストを送る。' },
    { id: 'async-order', title: '注文後処理', description: '注文確定後の在庫更新やメール通知をSQS経由でECS Workerが非同期処理する。' },
    { id: 'security', title: 'Security Group', description: 'ALB、ECS、RDSにSGを関連付け、RDSはECSからだけ許可する。' },
  ],
  initialDiagram: {
    viewport: { ...answerDiagram.viewport },
    zones,
    nodes: pickNodes(answerNodes, ['customer', 'cloudfront', 'frontend-bucket', 'igw', 'alb', 'public-rt', 'private-rt', 'sg-alb']),
    connections: [
      { id: 'customer-to-cf', from: 'customer', to: 'cloudfront', kind: 'traffic', fromAnchor: 'top', toAnchor: 'left' },
      { id: 'cf-to-frontend', from: 'cloudfront', to: 'frontend-bucket', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
      { id: 'cf-to-igw', from: 'cloudfront', to: 'igw', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
      { id: 'igw-to-alb', from: 'igw', to: 'alb', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
      { id: 'igw-to-public-rt', from: 'igw', to: 'public-rt', kind: 'attachment', label: 'route', fromAnchor: 'right', toAnchor: 'top' },
    ],
  },
  lockedNodeIds: ['customer', 'cloudfront', 'frontend-bucket', 'igw', 'alb', 'public-rt', 'private-rt', 'sg-alb'],
  services: [
    createZoneService('vpc', 'ECサイトを動かすネットワーク境界'),
    createZoneService('public-subnet', 'ALBを置くSubnet'),
    createZoneService('private-subnet', 'ECSとDBを置くSubnet'),
    createService('cloudfront', 'ストア画面とAPIの入口'),
    createService('frontend-bucket', '静的フロントエンドの配置先'),
    createService('payment', '決済処理を担う外部API'),
    createService('email', '注文完了メールの送信先'),
    createService('igw', 'VPCの外部接続点'),
    createService('alb', 'ECS Fargateへの公開受信口'),
    createService('ecs-service', '商品/注文APIを動かすECS Fargate'),
    createService('order-worker', '注文後処理を行うECS Fargate'),
    createService('product-db', '商品情報と注文情報のRDS'),
    createService('order-queue', '注文後処理を非同期化するQueue'),
    createService('dlq', '失敗した注文イベントの退避先'),
    createService('public-rt', 'Public SubnetのRoute Table'),
    createService('private-rt', 'Private SubnetのRoute Table'),
    createService('sg-alb', 'ALBに関連付けるSG'),
    createService('sg-service', '商品/注文APIに関連付けるSG'),
    createService('sg-worker', '注文Workerに関連付けるSG'),
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
      { securityGroupNodeId: 'sg-service', attachedToNodeId: 'ecs-service', label: 'ECS Service Security Group', allowedSourceSecurityGroupIds: ['sg-alb'] },
      { securityGroupNodeId: 'sg-worker', attachedToNodeId: 'order-worker', label: 'ECS Worker Security Group' },
      { securityGroupNodeId: 'sg-rds', attachedToNodeId: 'product-db', label: 'RDS Security Group', allowedSourceSecurityGroupIds: ['sg-service', 'sg-worker'] },
    ],
  },
  checks: [
    { id: 'static-path', type: 'path-exists', path: ['customer', 'cloudfront', 'frontend-bucket'], label: 'ストア画面を表示できる', failureMessage: '購入者がCloudFront経由でストア画面へ到達する経路がありません。' },
    { id: 'service-path', type: 'path-exists', path: ['customer', 'cloudfront', 'igw', 'alb', 'ecs-service'], label: '商品/注文APIへ到達できる', failureMessage: '購入者のAPIリクエストがPrivate SubnetのECS Fargateまで届く流れが途切れています。' },
    { id: 'db-path', type: 'connection-exists', from: 'ecs-service', to: 'product-db', label: 'ECSからDBへ接続できる', failureMessage: 'ECS FargateからRDSへの接続がありません。' },
    { id: 'payment-path', type: 'connection-exists', from: 'ecs-service', to: 'payment', label: '決済APIへ接続できる', failureMessage: 'ECS Fargateから外部決済APIへの経路がありません。' },
    { id: 'order-path', type: 'path-exists', path: ['ecs-service', 'order-queue', 'order-worker', 'email'], label: '注文後処理が成立する', failureMessage: '注文イベントをSQSに積み、ECS Workerがメール通知まで処理する流れが途切れています。' },
    { id: 'inventory-path', type: 'connection-exists', from: 'order-worker', to: 'product-db', label: '在庫更新ができる', failureMessage: 'ECS WorkerからRDSへ在庫/注文状態を更新する経路がありません。' },
    { id: 'dlq-path', type: 'connection-exists', from: 'order-queue', to: 'dlq', label: '失敗イベントを退避できる', failureMessage: '注文後処理の失敗イベントをDLQへ退避する関係がありません。' },
    { id: 'alb-public', type: 'node-in-zone', nodeId: 'alb', zoneId: 'public-subnet', label: 'ALBはPublic Subnetにある', failureMessage: 'ALBがPublic Subnetに配置されていません。' },
    { id: 'service-private', type: 'node-in-zone', nodeId: 'ecs-service', zoneId: 'private-subnet', label: 'ECS ServiceはPrivate Subnetにある', failureMessage: 'ECS Fargateの商品/注文APIがPrivate Subnetに配置されていません。' },
    { id: 'worker-private', type: 'node-in-zone', nodeId: 'order-worker', zoneId: 'private-subnet', label: 'ECS WorkerはPrivate Subnetにある', failureMessage: 'ECS Fargateの注文WorkerがPrivate Subnetに配置されていません。' },
    { id: 'db-private', type: 'node-in-zone', nodeId: 'product-db', zoneId: 'private-subnet', label: 'RDSはPrivate Subnetにある', failureMessage: 'RDSがPrivate Subnetに配置されていません。' },
    { id: 'rds-only-ecs', type: 'incoming-only-from', nodeId: 'product-db', allowedSourceIds: ['ecs-service', 'order-worker'], label: 'RDSはECSからだけ使う', failureMessage: 'RDSへECS以外から入る経路があります。' },
  ],
  actions: [
    { id: 'open-store', title: '購入者がストア画面を開く', description: 'CloudFrontから静的フロントエンドを取得する。', checkIds: ['static-path'], successMessage: '購入者はストア画面を表示できます。', failureMessage: 'ストア画面表示に失敗しました。' },
    { id: 'browse-product', title: '購入者が商品一覧を見る', description: 'ECS FargateがRDSから商品情報を取得する。', checkIds: ['service-path', 'db-path', 'alb-public', 'service-private', 'db-private'], successMessage: '商品一覧APIはPrivate側のRDSまで到達できます。', failureMessage: '商品一覧APIの確認に失敗しました。' },
    { id: 'checkout', title: '購入者が決済する', description: 'ECS Fargateが外部決済APIへ決済リクエストを送る。', checkIds: ['payment-path'], successMessage: 'ECS Fargateから外部決済APIへ連携できます。', failureMessage: '決済連携の確認に失敗しました。' },
    { id: 'after-order', title: '注文後処理を実行する', description: '注文イベントから在庫更新とメール通知を非同期に処理する。', checkIds: ['order-path', 'inventory-path', 'worker-private', 'dlq-path', 'rds-only-ecs'], successMessage: '注文後処理はSQSとECS Workerで非同期に実行できます。', failureMessage: '注文後処理の確認に失敗しました。' },
  ],
  answerDiagram,
  answerTrace: [
    { id: 'network', title: 'ECサイトのVPC土台を作る', description: 'VPCにPublic/Private Subnetを作り、ALBはPublic、ECS/RDSはPrivateに配置します。', visibleNodeIds: ['customer', 'igw', 'public-rt', 'private-rt'], visibleConnectionIds: ['igw-to-public-rt'], activeNodeIds: ['igw', 'public-rt', 'private-rt'], activeConnectionIds: ['igw-to-public-rt'] },
    { id: 'entry', title: 'ストア画面とAPI入口を作る', description: '購入者はCloudFrontから画面を取得し、APIリクエストはIGW、ALB、ECS Fargateへ届きます。', visibleNodeIds: ['customer', 'cloudfront', 'frontend-bucket', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs-service', 'sg-service'], visibleConnectionIds: ['customer-to-cf', 'cf-to-frontend', 'cf-to-igw', 'igw-to-alb', 'alb-to-service', 'igw-to-public-rt', 'sg-alb-to-sg-service'], activeNodeIds: ['customer', 'cloudfront', 'frontend-bucket', 'alb', 'ecs-service', 'sg-alb', 'sg-service'], activeConnectionIds: ['customer-to-cf', 'cf-to-frontend', 'cf-to-igw', 'igw-to-alb', 'alb-to-service', 'sg-alb-to-sg-service'] },
    { id: 'data-payment', title: '商品/注文DBと決済をつなぐ', description: 'ECS FargateはRDSへ商品/注文情報を読み書きし、購入時は外部決済APIへ連携します。', visibleNodeIds: ['customer', 'cloudfront', 'frontend-bucket', 'payment', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs-service', 'sg-service', 'product-db', 'sg-rds'], visibleConnectionIds: ['customer-to-cf', 'cf-to-frontend', 'cf-to-igw', 'igw-to-alb', 'alb-to-service', 'service-to-db', 'service-to-payment', 'igw-to-public-rt', 'sg-alb-to-sg-service', 'sg-service-to-sg-rds'], activeNodeIds: ['ecs-service', 'product-db', 'payment', 'sg-rds'], activeConnectionIds: ['service-to-db', 'service-to-payment', 'sg-service-to-sg-rds'] },
    { id: 'async-order', title: '注文後処理を非同期化する', description: '注文確定後はSQSへイベントを積み、Private SubnetのECS Workerが在庫更新とメール通知を行います。失敗はDLQへ退避します。', visibleNodeIds: ['customer', 'cloudfront', 'frontend-bucket', 'payment', 'email', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs-service', 'sg-service', 'order-worker', 'sg-worker', 'product-db', 'sg-rds', 'order-queue', 'dlq'], visibleConnectionIds: ['customer-to-cf', 'cf-to-frontend', 'cf-to-igw', 'igw-to-alb', 'alb-to-service', 'service-to-db', 'service-to-payment', 'service-to-queue', 'queue-to-worker', 'worker-to-db', 'worker-to-email', 'queue-to-dlq', 'igw-to-public-rt', 'sg-alb-to-sg-service', 'sg-service-to-sg-rds', 'sg-worker-to-sg-rds'], activeNodeIds: ['ecs-service', 'order-queue', 'order-worker', 'product-db', 'email', 'dlq', 'sg-worker'], activeConnectionIds: ['service-to-queue', 'queue-to-worker', 'worker-to-db', 'worker-to-email', 'queue-to-dlq', 'sg-worker-to-sg-rds'] },
  ],
};

export default challenge;
