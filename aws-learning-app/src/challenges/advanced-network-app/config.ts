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

const IFACE_ICON = 'Plug';
const GW_ENDPOINT_ICON = 'Share2';

const zones: DiagramZone[] = [
  makeZone('vpc', 'VPC (Closed Egress)', { x: 230, y: 160, width: 820, height: 520 }),
  makeZone('public-subnet', 'Public Subnet', { x: 24, y: 60, width: 330, height: 200 }, 'public', 'vpc'),
  makeZone('private-subnet', 'Private Subnet', { x: 396, y: 60, width: 390, height: 440 }, 'private', 'vpc'),
];

const answerNodes: DiagramNode[] = [
  makeNode('user-pc', '利用者', 'ブラウザ', 'Users', { x: 20, y: 360, width: 145, height: 86 }, nodeStyle.external, { category: 'external' }),
  makeNode('cloudfront', 'CloudFront', '公開入口', ICON.cloudfront, { x: 240, y: 20, width: 170, height: 86 }, nodeStyle.edge, { category: 'external' }),
  makeNode('ecr', 'ECR', 'イメージ(AWSサービス)', ICON.ecr, { x: 1080, y: 40, width: 165, height: 82 }, nodeStyle.data, { category: 'external' }),
  makeNode('secrets', 'Secrets Manager', 'DB接続情報(AWSサービス)', 'KeyRound', { x: 1080, y: 165, width: 165, height: 82 }, nodeStyle.security, { category: 'external' }),
  makeNode('s3-assets', 'S3', 'オブジェクト(AWSサービス)', ICON.s3, { x: 1080, y: 290, width: 165, height: 82 }, nodeStyle.data, { category: 'external' }),
  makeNode('igw', 'Internet Gateway', 'VPC境界(inbound)', ICON.igw, { x: 290, y: -32, width: 180, height: 78 }, nodeStyle.gateway, { category: 'gateway', parentId: 'zone-vpc' }),
  makeNode('s3-gw-endpoint', 'S3 Gateway Endpoint', 'route tableに経路', GW_ENDPOINT_ICON, { x: 540, y: -32, width: 200, height: 78 }, nodeStyle.gateway, { category: 'gateway', parentId: 'zone-vpc' }),
  makeNode('alb', 'ALB', 'API入口', ICON.alb, { x: 70, y: 120, width: 175, height: 84 }, nodeStyle.edge, { category: 'placement', parentId: 'zone-public-subnet' }),
  makeNode('ecs', 'ECS Fargate', 'アプリAPI', ICON.ecs, { x: 80, y: 86, width: 210, height: 82 }, nodeStyle.app, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('ecr-endpoint', 'ECR Interface Endpoint', 'PrivateLink(ENI)', IFACE_ICON, { x: 80, y: 200, width: 210, height: 74 }, nodeStyle.edge, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('secrets-endpoint', 'Secrets Interface Endpoint', 'PrivateLink(ENI)', IFACE_ICON, { x: 80, y: 312, width: 210, height: 74 }, nodeStyle.edge, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('public-rt', 'Public Route Table', '0.0.0.0/0 -> IGW', ICON.routeTable, { x: 120, y: 26, width: 175, height: 34 }, nodeStyle.routeTable, { category: 'association', parentId: 'zone-public-subnet' }),
  makeNode('private-rt', 'Private Route Table', 'local / S3 prefix', ICON.routeTable, { x: 160, y: 26, width: 185, height: 34 }, nodeStyle.routeTable, { category: 'association', parentId: 'zone-private-subnet' }),
  makeNode('sg-alb', 'SG: ALB', 'inbound 443', 'Shield', { x: 28, y: -22, width: 118, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'alb' }),
  makeNode('sg-ecs', 'SG: ECS', 'from ALB SG', 'Shield', { x: 32, y: -22, width: 118, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'ecs' }),
];

const createService = makeServiceFactory(answerNodes);
const createZoneService = makeZoneServiceFactory(zones);

const answerDiagram: DiagramConfig = {
  viewport: { width: 1290, height: 720, padding: 48 },
  zones,
  nodes: answerNodes,
  connections: [
    { id: 'user-to-cf', from: 'user-pc', to: 'cloudfront', kind: 'traffic', fromAnchor: 'top', toAnchor: 'left' },
    { id: 'cf-to-igw', from: 'cloudfront', to: 'igw', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'igw-to-alb', from: 'igw', to: 'alb', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'alb-to-ecs', from: 'alb', to: 'ecs', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'ecs-to-ecr-ep', from: 'ecs', to: 'ecr-endpoint', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'ecr-ep-to-ecr', from: 'ecr-endpoint', to: 'ecr', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'ecs-to-secrets-ep', from: 'ecs', to: 'secrets-endpoint', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'left' },
    { id: 'secrets-ep-to-secrets', from: 'secrets-endpoint', to: 'secrets', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'ecs-to-s3-ep', from: 'ecs', to: 's3-gw-endpoint', kind: 'traffic', fromAnchor: 'top', toAnchor: 'bottom' },
    { id: 's3-ep-to-s3', from: 's3-gw-endpoint', to: 's3-assets', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'igw-to-public-rt', from: 'igw', to: 'public-rt', kind: 'attachment', label: 'route', fromAnchor: 'left', toAnchor: 'top' },
    { id: 'private-rt-to-s3-ep', from: 'private-rt', to: 's3-gw-endpoint', kind: 'attachment', label: 'route', fromAnchor: 'top', toAnchor: 'bottom' },
    { id: 'sg-alb-to-sg-ecs', from: 'sg-alb', to: 'sg-ecs', kind: 'association', label: '許可元', fromAnchor: 'right', toAnchor: 'left' },
  ],
};

const challenge: ChallengeConfig = {
  slug: 'advanced-network-app',
  title: 'NATを使わずVPC Endpointで閉じる',
  description: 'Private SubnetのECSが、NATを使わずVPC Endpoint（Interface/Gateway）だけでAWSサービスへ出る閉じた構成を作る',
  headerLabel: 'AWS NETWORK DESIGN',
  badge: '設計演習',
  icon: 'Cable',
  color: 'blue',
  scenario:
    'Private SubnetのECS Fargateは、コンテナイメージ取得(ECR)・秘密情報取得(Secrets Manager)・オブジェクト取得(S3)のためにAWSサービスへ出る必要があります。これをNAT Gateway経由でインターネットへ出すのではなく、VPC Endpointだけで経路をAWS内部に閉じてください。ECR/SecretsはInterface Endpoint（Private SubnetのENI）、S3はGateway Endpoint（Route Tableに経路）を使います。NATは置きません。',
  requirements: [
    { id: 'network', title: 'AWSネットワークの土台', description: 'VPC、Public/Private Subnet、Route Table、Internet Gatewayを明示。ALBだけPublic、ECSはPrivateに置く。' },
    { id: 'inbound', title: '公開入口', description: '利用者はCloudFront・IGW・ALBを経由してECSへ到達する。' },
    { id: 'iface-endpoints', title: 'Interface Endpoint', description: 'ECRとSecrets ManagerへはPrivate Subnet内のInterface Endpoint経由で到達する。' },
    { id: 'gw-endpoint', title: 'Gateway Endpoint', description: 'S3へはGateway Endpointを使い、Private Route Tableに経路を向ける。' },
    { id: 'no-nat', title: 'NATを使わない', description: 'インターネットへ出るNAT Gatewayを置かず、egressをVPC Endpointだけで成立させる。' },
  ],
  initialDiagram: {
    viewport: { ...answerDiagram.viewport },
    zones: [],
    nodes: pickNodes(answerNodes, ['user-pc']),
    connections: [],
  },
  lockedNodeIds: ['user-pc'],
  services: [
    createZoneService('vpc', 'egressを閉じるネットワーク境界'),
    createZoneService('public-subnet', 'ALBを置くSubnet'),
    createZoneService('private-subnet', 'ECSとInterface Endpointを置くSubnet'),
    createService('cloudfront', '公開入口'),
    createService('ecr', 'コンテナイメージのレジストリ'),
    createService('secrets', 'DB接続情報の保管先'),
    createService('s3-assets', 'オブジェクトストレージ'),
    createService('igw', 'VPCの外部接続点（inbound用）'),
    createService('s3-gw-endpoint', 'S3向けGateway Endpoint'),
    createService('alb', 'ECSへの公開受信口'),
    createService('ecs', 'アプリAPIを動かすECS Fargate'),
    createService('ecr-endpoint', 'ECR向けInterface Endpoint'),
    createService('secrets-endpoint', 'Secrets向けInterface Endpoint'),
    createService('public-rt', 'Public SubnetのRoute Table'),
    createService('private-rt', 'Private SubnetのRoute Table'),
    createService('sg-alb', 'ALBに関連付けるSG'),
    createService('sg-ecs', 'ECSに関連付けるSG'),
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
    ],
  },
  checks: [
    { id: 'inbound-path', type: 'path-exists', path: ['user-pc', 'cloudfront', 'igw', 'alb', 'ecs'], label: '公開入口からECSへ到達できる', failureMessage: '利用者のリクエストがCloudFront・IGW・ALB経由でPrivate SubnetのECSへ届く流れが途切れています。' },
    { id: 'alb-public', type: 'node-in-zone', nodeId: 'alb', zoneId: 'public-subnet', label: 'ALBはPublic Subnetにある', failureMessage: 'ALBがPublic Subnetに配置されていません。' },
    { id: 'ecs-private', type: 'node-in-zone', nodeId: 'ecs', zoneId: 'private-subnet', label: 'ECSはPrivate Subnetにある', failureMessage: 'ECS FargateがPrivate Subnetに配置されていません。' },
    { id: 'ecr-ep-private', type: 'node-in-zone', nodeId: 'ecr-endpoint', zoneId: 'private-subnet', label: 'ECR EndpointはPrivate Subnetにある', failureMessage: 'ECR Interface EndpointがPrivate Subnetに配置されていません。Interface EndpointはSubnet内のENIです。' },
    { id: 'secrets-ep-private', type: 'node-in-zone', nodeId: 'secrets-endpoint', zoneId: 'private-subnet', label: 'Secrets EndpointはPrivate Subnetにある', failureMessage: 'Secrets Interface EndpointがPrivate Subnetに配置されていません。' },
    { id: 'pull-image-path', type: 'path-exists', path: ['ecs', 'ecr-endpoint', 'ecr'], label: 'Interface Endpoint経由でECRへ出られる', failureMessage: 'ECSがECR Interface Endpoint経由でECRへ到達する流れが途切れています。' },
    { id: 'read-secret-path', type: 'path-exists', path: ['ecs', 'secrets-endpoint', 'secrets'], label: 'Interface Endpoint経由でSecretsへ出られる', failureMessage: 'ECSがSecrets Interface Endpoint経由でSecrets Managerへ到達する流れが途切れています。' },
    { id: 's3-route', type: 'connection-exists', from: 'private-rt', to: 's3-gw-endpoint', label: 'Gateway EndpointがRoute Tableに向く', failureMessage: 'Private Route TableからS3 Gateway Endpointへの経路がありません。Gateway EndpointはRoute Tableにルートを足して使います。' },
    { id: 's3-path', type: 'path-exists', path: ['ecs', 's3-gw-endpoint', 's3-assets'], label: 'Gateway Endpoint経由でS3へ出られる', failureMessage: 'ECSがS3 Gateway Endpoint経由でS3へ到達する流れが途切れています。' },
  ],
  actions: [
    { id: 'serve', title: '利用者がアプリを使う', description: 'CloudFront・IGW・ALB経由でECSへ到達する。', checkIds: ['inbound-path', 'alb-public', 'ecs-private'], successMessage: '公開入口からPrivate SubnetのECSまで到達できます。', failureMessage: '公開入口の確認に失敗しました。' },
    { id: 'pull-image', title: 'ECSがコンテナイメージを取得する', description: 'Interface Endpoint経由でECRからイメージをPullする。', checkIds: ['pull-image-path', 'ecr-ep-private'], successMessage: 'NATを使わず、Interface Endpoint経由でECRへ到達できます。', failureMessage: 'ECR取得経路の確認に失敗しました。' },
    { id: 'read-secret', title: 'ECSが秘密情報を読む', description: 'Interface Endpoint経由でSecrets Managerから取得する。', checkIds: ['read-secret-path', 'secrets-ep-private'], successMessage: 'Interface Endpoint経由でSecrets Managerへ到達できます。', failureMessage: 'Secrets取得経路の確認に失敗しました。' },
    { id: 'reach-s3', title: 'ECSがS3オブジェクトを取得する', description: 'Gateway Endpoint経由でS3へ到達する。', checkIds: ['s3-route', 's3-path'], successMessage: 'Gateway EndpointをRoute Tableに向け、S3へAWS内部経路で到達できます。NATは不要です。', failureMessage: 'S3 Gateway Endpoint経路の確認に失敗しました。' },
  ],
  answerDiagram,
  answerTrace: [
    { id: 'network', title: 'VPCの土台と公開入口を作る', description: 'VPCにPublic/Private Subnetを作り、IGW・ALB経由でECSへ届く入口を用意します。egress用のNATは置きません。', visibleNodeIds: ['user-pc', 'cloudfront', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs', 'sg-ecs'], visibleConnectionIds: ['user-to-cf', 'cf-to-igw', 'igw-to-alb', 'alb-to-ecs', 'igw-to-public-rt', 'sg-alb-to-sg-ecs'], activeNodeIds: ['cloudfront', 'igw', 'alb', 'ecs', 'sg-alb', 'sg-ecs'], activeConnectionIds: ['cf-to-igw', 'igw-to-alb', 'alb-to-ecs'] },
    { id: 'iface', title: 'Interface EndpointでECR/Secretsへ出る', description: 'ECR・Secrets ManagerへはPrivate Subnet内のInterface Endpoint(ENI)を経由します。インターネットには出ず、PrivateLinkでAWS内部に閉じます。', visibleNodeIds: ['user-pc', 'cloudfront', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs', 'sg-ecs', 'ecr-endpoint', 'ecr', 'secrets-endpoint', 'secrets'], visibleConnectionIds: ['user-to-cf', 'cf-to-igw', 'igw-to-alb', 'alb-to-ecs', 'igw-to-public-rt', 'sg-alb-to-sg-ecs', 'ecs-to-ecr-ep', 'ecr-ep-to-ecr', 'ecs-to-secrets-ep', 'secrets-ep-to-secrets'], activeNodeIds: ['ecs', 'ecr-endpoint', 'ecr', 'secrets-endpoint', 'secrets'], activeConnectionIds: ['ecs-to-ecr-ep', 'ecr-ep-to-ecr', 'ecs-to-secrets-ep', 'secrets-ep-to-secrets'] },
    { id: 'gw', title: 'Gateway EndpointでS3へ出る', description: 'S3はGateway Endpointを使い、Private Route Tableに経路(S3のprefix list宛)を足します。ECSはその経路でS3へ到達します。Gateway Endpointは追加料金なしで使えます。', visibleNodeIds: ['user-pc', 'cloudfront', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs', 'sg-ecs', 'ecr-endpoint', 'ecr', 'secrets-endpoint', 'secrets', 's3-gw-endpoint', 's3-assets'], visibleConnectionIds: ['user-to-cf', 'cf-to-igw', 'igw-to-alb', 'alb-to-ecs', 'igw-to-public-rt', 'sg-alb-to-sg-ecs', 'ecs-to-ecr-ep', 'ecr-ep-to-ecr', 'ecs-to-secrets-ep', 'secrets-ep-to-secrets', 'ecs-to-s3-ep', 's3-ep-to-s3', 'private-rt-to-s3-ep'], activeNodeIds: ['ecs', 's3-gw-endpoint', 's3-assets', 'private-rt'], activeConnectionIds: ['ecs-to-s3-ep', 's3-ep-to-s3', 'private-rt-to-s3-ep'] },
  ],
};

export default challenge;
