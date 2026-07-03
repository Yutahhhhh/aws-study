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

const ICON_EXTRA = {
  codedeploy: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Developer-Tools/48/Arch_AWS-CodeDeploy_48.svg',
  cloudwatch: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Management-Governance/48/Arch_Amazon-CloudWatch_48.svg',
};

const zones: DiagramZone[] = [
  makeZone('vpc', 'VPC (Blue/Green)', { x: 230, y: 150, width: 780, height: 560 }),
  makeZone('public-subnet', 'Public Subnet', { x: 24, y: 58, width: 340, height: 470 }, 'public', 'vpc'),
  makeZone('private-subnet', 'Private Subnet', { x: 398, y: 58, width: 340, height: 470 }, 'private', 'vpc'),
];

const answerNodes: DiagramNode[] = [
  makeNode('user-pc', '利用者', '常にアクセス中', 'Users', { x: 20, y: 350, width: 145, height: 86 }, nodeStyle.external, { category: 'external' }),
  makeNode('github', 'GitHub Actions', 'build & test', 'Github', { x: 250, y: 20, width: 170, height: 82 }, nodeStyle.external, { category: 'external' }),
  makeNode('ecr', 'ECR', '新イメージ置き場', ICON.ecr, { x: 460, y: 20, width: 160, height: 82 }, nodeStyle.data, { category: 'external' }),
  makeNode('codedeploy', 'CodeDeploy', 'Blue/Green制御', ICON_EXTRA.codedeploy, { x: 660, y: 20, width: 175, height: 82 }, nodeStyle.worker, { category: 'external' }),
  makeNode('cw-alarm', 'CloudWatch Alarm', '5xx/レイテンシ監視', ICON_EXTRA.cloudwatch, { x: 1050, y: 240, width: 175, height: 82 }, nodeStyle.observability, { category: 'external' }),
  makeNode('igw', 'Internet Gateway', 'VPC境界', ICON.igw, { x: 300, y: -32, width: 180, height: 78 }, nodeStyle.gateway, { category: 'gateway', parentId: 'zone-vpc' }),
  makeNode('alb', 'ALB', '切替の要', ICON.alb, { x: 70, y: 170, width: 165, height: 84 }, nodeStyle.edge, { category: 'placement', parentId: 'zone-public-subnet' }),
  makeNode('ecs-blue', 'ECS Blue (v1)', '現行バージョン', ICON.ecs, { x: 58, y: 96, width: 180, height: 84 }, nodeStyle.app, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('ecs-green', 'ECS Green (v2)', '新バージョン', ICON.ecs, { x: 58, y: 220, width: 180, height: 84 }, nodeStyle.worker, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('rds', 'RDS PostgreSQL', '共有DB (互換必須)', ICON.rds, { x: 58, y: 350, width: 180, height: 84 }, nodeStyle.data, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('public-rt', 'Public Route Table', '0.0.0.0/0 -> IGW', ICON.routeTable, { x: 145, y: 26, width: 175, height: 34 }, nodeStyle.routeTable, { category: 'association', parentId: 'zone-public-subnet' }),
  makeNode('private-rt', 'Private Route Table', 'local / endpoints', ICON.routeTable, { x: 145, y: 26, width: 175, height: 34 }, nodeStyle.routeTable, { category: 'association', parentId: 'zone-private-subnet' }),
  makeNode('tg-blue', 'TG: Blue', '現行の振り分け先', 'Target', { x: -20, y: 96, width: 120, height: 30 }, nodeStyle.app, { category: 'association', parentId: 'alb' }),
  makeNode('tg-green', 'TG: Green', '切替先', 'Target', { x: 108, y: 96, width: 110, height: 30 }, nodeStyle.worker, { category: 'association', parentId: 'alb' }),
  makeNode('sg-alb', 'SG: ALB', 'inbound 443', 'Shield', { x: 28, y: -22, width: 118, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'alb' }),
  makeNode('sg-blue', 'SG: Blue', 'from ALB SG', 'Shield', { x: 32, y: -22, width: 126, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'ecs-blue' }),
  makeNode('sg-green', 'SG: Green', 'from ALB SG', 'Shield', { x: 32, y: -22, width: 126, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'ecs-green' }),
  makeNode('sg-rds', 'SG: RDS', 'from ECS SG', 'Shield', { x: 32, y: -22, width: 126, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'rds' }),
];

const createService = makeServiceFactory(answerNodes);
const createZoneService = makeZoneServiceFactory(zones);

const answerDiagram: DiagramConfig = {
  viewport: { width: 1260, height: 760, padding: 48 },
  zones,
  nodes: answerNodes,
  connections: [
    { id: 'user-to-igw', from: 'user-pc', to: 'igw', kind: 'traffic', fromAnchor: 'top', toAnchor: 'left' },
    { id: 'igw-to-alb', from: 'igw', to: 'alb', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'alb-to-blue', from: 'alb', to: 'ecs-blue', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'alb-to-green', from: 'alb', to: 'ecs-green', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'blue-to-rds', from: 'ecs-blue', to: 'rds', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'green-to-rds', from: 'ecs-green', to: 'rds', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'left' },
    { id: 'github-to-ecr', from: 'github', to: 'ecr', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'github-to-codedeploy', from: 'github', to: 'codedeploy', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'codedeploy-to-green', from: 'codedeploy', to: 'ecs-green', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'codedeploy-to-alb', from: 'codedeploy', to: 'alb', kind: 'association', label: '切替指示', fromAnchor: 'left', toAnchor: 'top' },
    { id: 'green-to-alarm', from: 'ecs-green', to: 'cw-alarm', kind: 'traffic', fromAnchor: 'right', toAnchor: 'bottom' },
    { id: 'alarm-to-codedeploy', from: 'cw-alarm', to: 'codedeploy', kind: 'association', label: '異常でロールバック', fromAnchor: 'top', toAnchor: 'right' },
    { id: 'igw-to-public-rt', from: 'igw', to: 'public-rt', kind: 'attachment', label: 'route', fromAnchor: 'right', toAnchor: 'top' },
    { id: 'sg-alb-to-sg-blue', from: 'sg-alb', to: 'sg-blue', kind: 'association', label: '許可元', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'sg-alb-to-sg-green', from: 'sg-alb', to: 'sg-green', kind: 'association', label: '許可元', fromAnchor: 'bottom', toAnchor: 'left' },
    { id: 'sg-blue-to-sg-rds', from: 'sg-blue', to: 'sg-rds', kind: 'association', label: '許可元', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'sg-green-to-sg-rds', from: 'sg-green', to: 'sg-rds', kind: 'association', label: '許可元', fromAnchor: 'bottom', toAnchor: 'top' },
  ],
};

const challenge: ChallengeConfig = {
  slug: 'blue-green-release',
  title: 'Blue/Greenデプロイを設計する',
  description: '現行(Blue)と新版(Green)を並行稼働させ、ALBのTarget Group切替でゼロダウンタイムリリースと自動ロールバックを実現する',
  headerLabel: 'AWS DESIGN CHALLENGE',
  badge: '設計演習',
  icon: 'Repeat2',
  color: 'blue',
  scenario:
    '毎週リリースするWebアプリで「リリースのたびに数分エラーが出る」「不具合時に戻すのに30分かかる」ことが問題になっています。CodeDeployのBlue/Greenデプロイを導入し、新旧バージョンを並行稼働させてALBのTarget Groupで一括切替、CloudWatch Alarm連動の自動ロールバックまで含めた構成を設計してください。DBは新旧バージョンで共有します。',
  requirements: [
    { id: 'network', title: 'AWSネットワークの土台', description: 'VPC、Public Subnet、Private Subnet、Route Table、Internet Gatewayを明示する。' },
    { id: 'blue', title: '現行系(Blue)の配信', description: '利用者のリクエストがIGW、ALBを経由してPrivate SubnetのECS Blueへ届く。' },
    { id: 'green', title: '新版(Green)の準備', description: 'GitHub ActionsがECRへイメージをpushし、CodeDeployがECS Greenを並行に立ち上げる。' },
    { id: 'switch', title: 'Target Groupでの切替', description: 'ALBにTG: BlueとTG: Greenを関連付け、ALBからGreenへの経路を用意して一括切替できるようにする。' },
    { id: 'rollback', title: '自動ロールバック', description: 'GreenのメトリクスをCloudWatch Alarmで監視し、異常時はCodeDeployが切り戻す関係を作る。' },
    { id: 'db', title: '共有DBとSG', description: 'RDSはBlue/Green両方から使えるようにし、SGでECSからのみ許可する。' },
  ],
  initialDiagram: {
    viewport: { ...answerDiagram.viewport },
    zones: [],
    nodes: pickNodes(answerNodes, ['user-pc']),
    connections: [],
  },
  lockedNodeIds: ['user-pc'],
  services: [
    createZoneService('vpc', 'アプリを動かすネットワーク境界'),
    createZoneService('public-subnet', '公開入口を置くSubnet'),
    createZoneService('private-subnet', 'ECSとDBを置くSubnet'),
    createService('igw', 'VPCの外部接続点'),
    createService('alb', 'Blue/Green切替の要になる入口'),
    createService('ecs-blue', '現行バージョン(v1)のECS Service'),
    createService('ecs-green', '新バージョン(v2)のECS Service'),
    createService('rds', '新旧で共有するRDS'),
    createService('github', 'ビルドとデプロイ開始のトリガー'),
    createService('ecr', '新イメージのレジストリ'),
    createService('codedeploy', 'Blue/Greenの進行とロールバックを制御'),
    createService('cw-alarm', 'Greenの5xx/レイテンシを監視するアラーム'),
    createService('tg-blue', '現行系へのTarget Group'),
    createService('tg-green', '新版へのTarget Group'),
    createService('public-rt', 'Public SubnetのRoute Table'),
    createService('private-rt', 'Private SubnetのRoute Table'),
    createService('sg-alb', 'ALBに関連付けるSG'),
    createService('sg-blue', 'ECS Blueに関連付けるSG'),
    createService('sg-green', 'ECS Greenに関連付けるSG'),
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
      { securityGroupNodeId: 'sg-blue', attachedToNodeId: 'ecs-blue', label: 'ECS Blue Security Group', allowedSourceSecurityGroupIds: ['sg-alb'] },
      { securityGroupNodeId: 'sg-green', attachedToNodeId: 'ecs-green', label: 'ECS Green Security Group', allowedSourceSecurityGroupIds: ['sg-alb'] },
      { securityGroupNodeId: 'sg-rds', attachedToNodeId: 'rds', label: 'RDS Security Group', allowedSourceSecurityGroupIds: ['sg-blue', 'sg-green'] },
    ],
  },
  checks: [
    { id: 'prod-path', type: 'path-exists', path: ['user-pc', 'igw', 'alb', 'ecs-blue'], label: '現行系(Blue)に到達できる', failureMessage: '利用者のリクエストがIGW、ALB経由でECS Blueへ届く経路がありません。' },
    { id: 'alb-public', type: 'node-in-zone', nodeId: 'alb', zoneId: 'public-subnet', label: 'ALBはPublic Subnetにある', failureMessage: 'ALBがPublic Subnetに配置されていません。' },
    { id: 'blue-private', type: 'node-in-zone', nodeId: 'ecs-blue', zoneId: 'private-subnet', label: 'BlueはPrivate Subnetにある', failureMessage: 'ECS BlueがPrivate Subnetに配置されていません。' },
    { id: 'green-private', type: 'node-in-zone', nodeId: 'ecs-green', zoneId: 'private-subnet', label: 'GreenはPrivate Subnetにある', failureMessage: 'ECS GreenがPrivate Subnetに配置されていません。' },
    { id: 'db-private', type: 'node-in-zone', nodeId: 'rds', zoneId: 'private-subnet', label: 'RDSはPrivate Subnetにある', failureMessage: 'RDSがPrivate Subnetに配置されていません。' },
    { id: 'image-path', type: 'connection-exists', from: 'github', to: 'ecr', label: '新イメージをECRへ置ける', failureMessage: 'GitHub ActionsからECRへイメージをpushする経路がありません。' },
    { id: 'deploy-trigger', type: 'connection-exists', from: 'github', to: 'codedeploy', label: 'デプロイを開始できる', failureMessage: 'GitHub ActionsからCodeDeployへデプロイを開始する経路がありません。' },
    { id: 'green-provision', type: 'connection-exists', from: 'codedeploy', to: 'ecs-green', label: 'Greenを立ち上げられる', failureMessage: 'CodeDeployがECS Green(新版)を立ち上げる経路がありません。' },
    { id: 'tg-blue-attached', type: 'node-attached-to', nodeId: 'tg-blue', targetId: 'alb', label: 'TG: BlueがALBにある', failureMessage: 'TG: BlueがALBに関連付けられていません。' },
    { id: 'tg-green-attached', type: 'node-attached-to', nodeId: 'tg-green', targetId: 'alb', label: 'TG: GreenがALBにある', failureMessage: 'TG: GreenがALBに関連付けられていません。' },
    { id: 'switch-path', type: 'connection-exists', from: 'alb', to: 'ecs-green', label: 'Greenへ切替できる', failureMessage: 'ALBからECS Greenへの振り分け経路が無く、切替ができません。' },
    { id: 'switch-control', type: 'connection-exists', from: 'codedeploy', to: 'alb', label: '切替を指示できる', failureMessage: 'CodeDeployがALB(Target Group)の切替を制御する関係がありません。' },
    { id: 'green-metrics', type: 'connection-exists', from: 'ecs-green', to: 'cw-alarm', label: 'Greenを監視できる', failureMessage: 'ECS GreenのメトリクスがCloudWatch Alarmへ届く経路がありません。' },
    { id: 'auto-rollback', type: 'connection-exists', from: 'cw-alarm', to: 'codedeploy', label: '異常時に自動で戻せる', failureMessage: 'CloudWatch AlarmからCodeDeployへロールバックを起動する関係がありません。' },
    { id: 'blue-db', type: 'connection-exists', from: 'ecs-blue', to: 'rds', label: 'BlueがDBを使える', failureMessage: 'ECS BlueからRDSへの経路がありません。' },
    { id: 'green-db', type: 'connection-exists', from: 'ecs-green', to: 'rds', label: 'GreenがDBを使える', failureMessage: 'ECS GreenからRDSへの経路がありません。' },
    { id: 'rds-only-ecs', type: 'incoming-only-from', nodeId: 'rds', allowedSourceIds: ['ecs-blue', 'ecs-green'], label: 'RDSはECSからだけ使う', failureMessage: 'RDSへECS以外から入る経路があります。' },
  ],
  actions: [
    { id: 'serve-blue', title: '現行バージョンを配信する', description: '利用者のリクエストがALB経由でBlueへ届く。', checkIds: ['prod-path', 'alb-public', 'blue-private', 'blue-db', 'db-private'], successMessage: '現行系(Blue)が本番トラフィックを受けられています。', failureMessage: '現行系の配信経路が成立していません。' },
    { id: 'provision-green', title: '新版(Green)を並行に立ち上げる', description: 'CIがイメージをpushし、CodeDeployがGreen環境を作る。', checkIds: ['image-path', 'deploy-trigger', 'green-provision', 'green-private', 'green-db'], successMessage: '本番トラフィックに影響なくGreenを立ち上げられます。', failureMessage: 'Green環境の準備経路が不足しています。' },
    { id: 'switch-traffic', title: 'トラフィックを一括切替する', description: 'ALBのTarget GroupをBlueからGreenへ切り替える。', checkIds: ['tg-blue-attached', 'tg-green-attached', 'switch-path', 'switch-control'], successMessage: 'Target Group切替によるゼロダウンタイムリリースができます。', failureMessage: '切替に必要なTarget Groupや経路が不足しています。' },
    { id: 'rollback', title: '異常時に自動ロールバックする', description: 'Greenの5xx増加をアラームが検知し、CodeDeployが切り戻す。', checkIds: ['green-metrics', 'auto-rollback', 'rds-only-ecs'], successMessage: '異常検知から自動ロールバックまでの導線が確認できました。', failureMessage: '監視とロールバックの導線が不足しています。' },
  ],
  answerDiagram,
  answerTrace: [
    { id: 'network', title: 'ネットワークの土台を作る', description: 'VPCにPublic/Private Subnetを用意し、ALBをPublic、ECS 2系統とRDSをPrivateに置ける状態にします。', visibleNodeIds: ['user-pc', 'igw', 'public-rt', 'private-rt'], visibleConnectionIds: ['igw-to-public-rt'], activeNodeIds: ['igw', 'public-rt', 'private-rt'], activeConnectionIds: ['igw-to-public-rt'] },
    { id: 'blue', title: '現行系(Blue)を配信する', description: '利用者はIGW、ALB、TG: Blue経由でECS Blueに到達します。RDSはSGでECSからのみ許可します。', visibleNodeIds: ['user-pc', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'tg-blue', 'ecs-blue', 'sg-blue', 'rds', 'sg-rds'], visibleConnectionIds: ['user-to-igw', 'igw-to-alb', 'alb-to-blue', 'blue-to-rds', 'igw-to-public-rt', 'sg-alb-to-sg-blue', 'sg-blue-to-sg-rds'], activeNodeIds: ['user-pc', 'alb', 'tg-blue', 'ecs-blue', 'rds'], activeConnectionIds: ['user-to-igw', 'igw-to-alb', 'alb-to-blue', 'blue-to-rds'] },
    { id: 'green', title: '新版(Green)を並行に立ち上げる', description: 'GitHub ActionsがECRへイメージをpushし、CodeDeployがGreenを起動します。この間もBlueは本番トラフィックを受け続けています。GreenもRDSへ接続します(スキーマは新旧互換に保つ)。', visibleNodeIds: ['user-pc', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'tg-blue', 'ecs-blue', 'sg-blue', 'rds', 'sg-rds', 'github', 'ecr', 'codedeploy', 'ecs-green', 'sg-green'], visibleConnectionIds: ['user-to-igw', 'igw-to-alb', 'alb-to-blue', 'blue-to-rds', 'github-to-ecr', 'github-to-codedeploy', 'codedeploy-to-green', 'green-to-rds', 'igw-to-public-rt', 'sg-alb-to-sg-blue', 'sg-alb-to-sg-green', 'sg-blue-to-sg-rds', 'sg-green-to-sg-rds'], activeNodeIds: ['github', 'ecr', 'codedeploy', 'ecs-green'], activeConnectionIds: ['github-to-ecr', 'github-to-codedeploy', 'codedeploy-to-green', 'green-to-rds'] },
    { id: 'switch-rollback', title: '切替と自動ロールバックを備える', description: 'ALBにTG: Blue/Greenを関連付け、CodeDeployが切替を制御します。GreenのメトリクスをCloudWatch Alarmが監視し、異常ならCodeDeployが自動で切り戻します。', visibleNodeIds: ['user-pc', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'tg-blue', 'tg-green', 'ecs-blue', 'sg-blue', 'ecs-green', 'sg-green', 'rds', 'sg-rds', 'github', 'ecr', 'codedeploy', 'cw-alarm'], visibleConnectionIds: ['user-to-igw', 'igw-to-alb', 'alb-to-blue', 'alb-to-green', 'blue-to-rds', 'green-to-rds', 'github-to-ecr', 'github-to-codedeploy', 'codedeploy-to-green', 'codedeploy-to-alb', 'green-to-alarm', 'alarm-to-codedeploy', 'igw-to-public-rt', 'sg-alb-to-sg-blue', 'sg-alb-to-sg-green', 'sg-blue-to-sg-rds', 'sg-green-to-sg-rds'], activeNodeIds: ['alb', 'tg-blue', 'tg-green', 'codedeploy', 'cw-alarm', 'ecs-green'], activeConnectionIds: ['alb-to-green', 'codedeploy-to-alb', 'green-to-alarm', 'alarm-to-codedeploy'] },
  ],
};

export default challenge;
