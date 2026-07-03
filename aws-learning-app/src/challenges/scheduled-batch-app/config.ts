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
  eventbridge: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_App-Integration/48/Arch_Amazon-EventBridge_48.svg',
  ses: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Business-Applications/48/Arch_Amazon-Simple-Email-Service_48.svg',
  sns: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_App-Integration/48/Arch_Amazon-Simple-Notification-Service_48.svg',
  cloudwatch: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Management-Governance/48/Arch_Amazon-CloudWatch_48.svg',
  nat: '/src/assets/aws/Resource-Icons_07312025/Res_Networking-Content-Delivery/Res_Amazon-VPC_NAT-Gateway_48.svg',
};

const zones: DiagramZone[] = [
  makeZone('vpc', 'VPC (Batch)', { x: 230, y: 150, width: 780, height: 540 }),
  makeZone('public-subnet', 'Public Subnet', { x: 24, y: 58, width: 340, height: 450 }, 'public', 'vpc'),
  makeZone('private-subnet', 'Private Subnet', { x: 398, y: 58, width: 340, height: 450 }, 'private', 'vpc'),
];

const answerNodes: DiagramNode[] = [
  makeNode('scheduler', 'EventBridge Scheduler', 'cron(0 2 * * ? *)', ICON_EXTRA.eventbridge, { x: 20, y: 60, width: 185, height: 86 }, nodeStyle.worker, { category: 'external' }),
  makeNode('oncall', 'オンコール担当', '失敗に気づく人', 'UserRoundCog', { x: 20, y: 560, width: 145, height: 82 }, nodeStyle.external, { category: 'external' }),
  makeNode('customer', '顧客', 'レポートメール受信', 'Users', { x: 20, y: 340, width: 145, height: 82 }, nodeStyle.external, { category: 'external' }),
  makeNode('igw', 'Internet Gateway', 'VPC境界', ICON.igw, { x: 300, y: -32, width: 180, height: 78 }, nodeStyle.gateway, { category: 'gateway', parentId: 'zone-vpc' }),
  makeNode('nat', 'NAT Gateway', '外向き通信の出口', ICON_EXTRA.nat, { x: 70, y: 160, width: 165, height: 84 }, nodeStyle.gateway, { category: 'placement', parentId: 'zone-public-subnet' }),
  makeNode('ecs-batch', 'ECS Task (バッチ)', '日次売上集計', ICON.ecs, { x: 58, y: 100, width: 180, height: 84 }, nodeStyle.app, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('rds', 'RDS PostgreSQL', '売上データ', ICON.rds, { x: 58, y: 300, width: 180, height: 84 }, nodeStyle.data, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('s3-report', 'S3 Report Bucket', 'レポート成果物', ICON.s3, { x: 1050, y: 60, width: 175, height: 82 }, nodeStyle.data, { category: 'external' }),
  makeNode('ses', 'SES', 'メール配信', ICON_EXTRA.ses, { x: 1050, y: 185, width: 175, height: 82 }, nodeStyle.edge, { category: 'external' }),
  makeNode('cloudwatch', 'CloudWatch Logs', 'バッチ実行ログ', ICON_EXTRA.cloudwatch, { x: 1050, y: 330, width: 175, height: 78 }, nodeStyle.observability, { category: 'external' }),
  makeNode('cw-alarm', 'CloudWatch Alarm', 'エラー/未実行検知', ICON_EXTRA.cloudwatch, { x: 1050, y: 450, width: 175, height: 78 }, nodeStyle.security, { category: 'external' }),
  makeNode('sns', 'SNS', '通知トピック', ICON_EXTRA.sns, { x: 1050, y: 570, width: 175, height: 78 }, nodeStyle.queue, { category: 'external' }),
  makeNode('public-rt', 'Public Route Table', '0.0.0.0/0 -> IGW', ICON.routeTable, { x: 145, y: 26, width: 175, height: 34 }, nodeStyle.routeTable, { category: 'association', parentId: 'zone-public-subnet' }),
  makeNode('private-rt', 'Private Route Table', '0.0.0.0/0 -> NAT', ICON.routeTable, { x: 145, y: 26, width: 175, height: 34 }, nodeStyle.routeTable, { category: 'association', parentId: 'zone-private-subnet' }),
  makeNode('sg-batch', 'SG: Batch', 'egress only', 'Shield', { x: 32, y: -22, width: 126, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'ecs-batch' }),
  makeNode('sg-rds', 'SG: RDS', 'from Batch SG', 'Shield', { x: 32, y: -22, width: 126, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'rds' }),
];

const createService = makeServiceFactory(answerNodes);
const createZoneService = makeZoneServiceFactory(zones);

const answerDiagram: DiagramConfig = {
  viewport: { width: 1260, height: 740, padding: 48 },
  zones,
  nodes: answerNodes,
  connections: [
    { id: 'scheduler-to-batch', from: 'scheduler', to: 'ecs-batch', kind: 'traffic', label: 'RunTask', fromAnchor: 'right', toAnchor: 'top' },
    { id: 'batch-to-rds', from: 'ecs-batch', to: 'rds', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'batch-to-nat', from: 'ecs-batch', to: 'nat', kind: 'traffic', fromAnchor: 'left', toAnchor: 'right' },
    { id: 'nat-to-igw', from: 'nat', to: 'igw', kind: 'traffic', fromAnchor: 'top', toAnchor: 'bottom' },
    { id: 'igw-to-s3', from: 'igw', to: 's3-report', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'igw-to-ses', from: 'igw', to: 'ses', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'ses-to-customer', from: 'ses', to: 'customer', kind: 'traffic', label: 'レポートメール', fromAnchor: 'bottom', toAnchor: 'right' },
    { id: 'batch-to-logs', from: 'ecs-batch', to: 'cloudwatch', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'logs-to-alarm', from: 'cloudwatch', to: 'cw-alarm', kind: 'association', label: 'メトリクスフィルター', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'alarm-to-sns', from: 'cw-alarm', to: 'sns', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'sns-to-oncall', from: 'sns', to: 'oncall', kind: 'traffic', label: '通知', fromAnchor: 'left', toAnchor: 'right' },
    { id: 'igw-to-public-rt', from: 'igw', to: 'public-rt', kind: 'attachment', label: 'route', fromAnchor: 'right', toAnchor: 'top' },
    { id: 'nat-to-private-rt', from: 'nat', to: 'private-rt', kind: 'attachment', label: 'route', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'sg-batch-to-sg-rds', from: 'sg-batch', to: 'sg-rds', kind: 'association', label: '許可元', fromAnchor: 'bottom', toAnchor: 'top' },
  ],
};

const challenge: ChallengeConfig = {
  slug: 'scheduled-batch-app',
  title: '定期バッチとメール配信を設計する',
  description: 'EventBridge Schedulerで深夜バッチを起動し、集計・レポート保存・メール配信・失敗検知の通知まで含む運用構成を作る',
  headerLabel: 'AWS DESIGN CHALLENGE',
  badge: '設計演習',
  icon: 'CalendarClock',
  color: 'rose',
  scenario:
    '毎日深夜2時に売上を集計し、レポートをS3へ保存して顧客へメールで送るバッチ処理を作ります。常駐サーバーは持たず、EventBridge SchedulerがECS Task(Fargate)を都度起動する方式にします。バッチはPrivate Subnetで動かし、外向き通信はNAT Gateway経由にしてください。バッチは「失敗に気づけない」ことが最大のリスクなので、ログからアラーム、オンコール通知までの導線も必須です。',
  requirements: [
    { id: 'network', title: 'ネットワークの土台', description: 'VPC、Public/Private Subnet、Route Table、IGW、NAT Gatewayを配置する。Private SubnetのデフォルトルートはNATへ向ける。' },
    { id: 'schedule', title: 'スケジュール起動', description: 'EventBridge Schedulerがcron式でECS Task(バッチ)をPrivate Subnetに起動する。常駐させない。' },
    { id: 'aggregate', title: '売上集計', description: 'バッチがRDSから売上データを読み取る。RDSはSGでバッチからのみ許可する。' },
    { id: 'deliver', title: 'レポート保存とメール配信', description: 'バッチがNAT経由でS3へレポートを保存し、SESで顧客へメールを送る。' },
    { id: 'observe', title: '失敗に気づける', description: 'バッチのログをCloudWatch Logsへ出し、エラーをメトリクスフィルターでAlarm化し、SNS経由でオンコール担当へ通知する。' },
  ],
  initialDiagram: {
    viewport: { ...answerDiagram.viewport },
    zones: [],
    nodes: pickNodes(answerNodes, ['oncall', 'customer']),
    connections: [],
  },
  lockedNodeIds: ['oncall', 'customer'],
  services: [
    createZoneService('vpc', 'バッチを動かすネットワーク境界'),
    createZoneService('public-subnet', 'NAT Gatewayを置くSubnet'),
    createZoneService('private-subnet', 'バッチとDBを置くSubnet'),
    createService('igw', 'VPCの外部接続点'),
    createService('nat', 'Private Subnetからの外向き通信の出口'),
    createService('scheduler', 'cron式でバッチを起動するスケジューラ'),
    createService('ecs-batch', '深夜だけ起動する集計バッチのECS Task'),
    createService('rds', '売上データを持つRDS'),
    createService('s3-report', 'レポート成果物の保存先'),
    createService('ses', 'レポートメールの配信サービス'),
    createService('cloudwatch', 'バッチ実行ログの出力先'),
    createService('cw-alarm', 'エラーログを検知するアラーム'),
    createService('sns', 'アラームを通知に変えるトピック'),
    createService('public-rt', 'Public SubnetのRoute Table'),
    createService('private-rt', 'Private SubnetのRoute Table (NATへのルート)'),
    createService('sg-batch', 'バッチTaskに関連付けるSG'),
    createService('sg-rds', 'RDSに関連付けるSG'),
  ],
  awsRules: {
    vpcZoneId: 'vpc',
    publicSubnetZoneIds: ['public-subnet'],
    privateSubnetZoneIds: ['private-subnet'],
    internetGatewayNodeId: 'igw',
    routeTables: [
      { routeTableNodeId: 'public-rt', subnetZoneId: 'public-subnet', label: 'Public Route Table', requiresInternetGatewayConnection: { internetGatewayNodeId: 'igw' } },
      { routeTableNodeId: 'private-rt', subnetZoneId: 'private-subnet', label: 'Private Route Table', requiresNatGatewayConnection: { natGatewayNodeId: 'nat' } },
    ],
    securityGroups: [
      { securityGroupNodeId: 'sg-batch', attachedToNodeId: 'ecs-batch', label: 'Batch Security Group' },
      { securityGroupNodeId: 'sg-rds', attachedToNodeId: 'rds', label: 'RDS Security Group', allowedSourceSecurityGroupIds: ['sg-batch'] },
    ],
  },
  checks: [
    { id: 'schedule-trigger', type: 'connection-exists', from: 'scheduler', to: 'ecs-batch', label: 'スケジュールで起動できる', failureMessage: 'EventBridge SchedulerからECS Taskを起動(RunTask)する経路がありません。' },
    { id: 'batch-private', type: 'node-in-zone', nodeId: 'ecs-batch', zoneId: 'private-subnet', label: 'バッチはPrivate Subnetにある', failureMessage: 'バッチのECS TaskがPrivate Subnetに配置されていません。' },
    { id: 'rds-private', type: 'node-in-zone', nodeId: 'rds', zoneId: 'private-subnet', label: 'RDSはPrivate Subnetにある', failureMessage: 'RDSがPrivate Subnetに配置されていません。' },
    { id: 'nat-public', type: 'node-in-zone', nodeId: 'nat', zoneId: 'public-subnet', label: 'NATはPublic Subnetにある', failureMessage: 'NAT GatewayがPublic Subnetに配置されていません。' },
    { id: 'read-db', type: 'connection-exists', from: 'ecs-batch', to: 'rds', label: '売上データを読める', failureMessage: 'バッチからRDSへの接続経路がありません。' },
    { id: 'rds-only-batch', type: 'incoming-only-from', nodeId: 'rds', allowedSourceIds: ['ecs-batch'], label: 'RDSはバッチからだけ使う', failureMessage: 'RDSへバッチ以外から入る経路があります。' },
    { id: 'egress-s3', type: 'path-exists', path: ['ecs-batch', 'nat', 'igw', 's3-report'], label: 'レポートをS3へ置ける', failureMessage: 'バッチがNAT、IGW経由でS3 Report Bucketへ書き込む経路が途切れています。' },
    { id: 'egress-ses', type: 'path-exists', path: ['ecs-batch', 'nat', 'igw', 'ses'], label: 'SESでメールを送れる', failureMessage: 'バッチがNAT、IGW経由でSESを呼ぶ経路が途切れています。' },
    { id: 'mail-to-customer', type: 'connection-exists', from: 'ses', to: 'customer', label: '顧客へメールが届く', failureMessage: 'SESから顧客へメールを届ける経路がありません。' },
    { id: 'batch-logs', type: 'connection-exists', from: 'ecs-batch', to: 'cloudwatch', label: '実行ログを出せる', failureMessage: 'バッチからCloudWatch Logsへのログ出力経路がありません。' },
    { id: 'logs-to-alarm', type: 'connection-exists', from: 'cloudwatch', to: 'cw-alarm', label: 'エラーを検知できる', failureMessage: 'CloudWatch Logsのエラーをメトリクスフィルターでアラーム化する関係がありません。' },
    { id: 'alarm-to-sns', type: 'connection-exists', from: 'cw-alarm', to: 'sns', label: 'アラームを通知に変えられる', failureMessage: 'AlarmからSNSトピックへの経路がありません。' },
    { id: 'notify-oncall', type: 'connection-exists', from: 'sns', to: 'oncall', label: 'オンコール担当へ届く', failureMessage: 'SNSからオンコール担当への通知経路がありません。' },
  ],
  actions: [
    { id: 'run-batch', title: '深夜2時にバッチが起動する', description: 'Schedulerが都度ECS Taskを起動する(常駐なし)。', checkIds: ['schedule-trigger', 'batch-private'], successMessage: 'スケジュール起動の構成ができています。実行時間分だけの課金で済みます。', failureMessage: 'スケジュール起動の構成が不足しています。' },
    { id: 'aggregate', title: '売上を集計する', description: 'バッチがRDSから売上データを読み取る。', checkIds: ['read-db', 'rds-private', 'rds-only-batch'], successMessage: 'RDSからの集計と最小権限のSG設計ができています。', failureMessage: '集計に必要なDB接続や保護が不足しています。' },
    { id: 'deliver-report', title: 'レポートを保存しメールを配る', description: 'NAT経由でS3へ保存し、SESで顧客へ送信する。', checkIds: ['nat-public', 'egress-s3', 'egress-ses', 'mail-to-customer'], successMessage: 'レポートの保存とメール配信の経路ができています。', failureMessage: 'レポート配信の経路が不足しています。' },
    { id: 'detect-failure', title: '失敗に気づける', description: 'エラーログをアラーム化し、オンコールへ通知する。', checkIds: ['batch-logs', 'logs-to-alarm', 'alarm-to-sns', 'notify-oncall'], successMessage: '「静かに失敗する」バッチになっていません。通知導線が完成です。', failureMessage: '失敗検知から通知までの導線が不足しています。' },
  ],
  answerDiagram,
  answerTrace: [
    { id: 'network', title: 'ネットワークの土台を作る', description: 'VPCにPublic/Private Subnetを作り、Public SubnetにNAT Gatewayを置きます。Private SubnetのRoute Tableは0.0.0.0/0をNATへ向けます。', visibleNodeIds: ['oncall', 'customer', 'igw', 'nat', 'public-rt', 'private-rt'], visibleConnectionIds: ['igw-to-public-rt', 'nat-to-igw', 'nat-to-private-rt'], activeNodeIds: ['igw', 'nat', 'public-rt', 'private-rt'], activeConnectionIds: ['igw-to-public-rt', 'nat-to-private-rt'] },
    { id: 'schedule', title: 'スケジューラでバッチを起動する', description: 'EventBridge Schedulerのcron(0 2 * * ? *)がECSのRunTaskを呼び、Private SubnetにバッチTaskが起動します。処理が終わればTaskは終了し、課金も止まります。', visibleNodeIds: ['oncall', 'customer', 'igw', 'nat', 'public-rt', 'private-rt', 'scheduler', 'ecs-batch', 'sg-batch'], visibleConnectionIds: ['igw-to-public-rt', 'nat-to-private-rt', 'nat-to-igw', 'scheduler-to-batch'], activeNodeIds: ['scheduler', 'ecs-batch'], activeConnectionIds: ['scheduler-to-batch'] },
    { id: 'work', title: '集計してレポートを配る', description: 'バッチはRDSから売上を読み(SGはバッチからのみ許可)、NAT経由でS3へレポートを保存、SESでメールを配信します。S3やSESはVPC外のサービスなので、Private Subnetからは外向き経路(NAT)が必要です。', visibleNodeIds: ['oncall', 'customer', 'igw', 'nat', 'public-rt', 'private-rt', 'scheduler', 'ecs-batch', 'sg-batch', 'rds', 'sg-rds', 's3-report', 'ses'], visibleConnectionIds: ['igw-to-public-rt', 'nat-to-private-rt', 'scheduler-to-batch', 'batch-to-rds', 'batch-to-nat', 'nat-to-igw', 'igw-to-s3', 'igw-to-ses', 'ses-to-customer', 'sg-batch-to-sg-rds'], activeNodeIds: ['ecs-batch', 'rds', 'nat', 's3-report', 'ses', 'customer'], activeConnectionIds: ['batch-to-rds', 'batch-to-nat', 'nat-to-igw', 'igw-to-s3', 'igw-to-ses', 'ses-to-customer'] },
    { id: 'observe', title: '失敗に気づける導線を張る', description: 'バッチのログをCloudWatch Logsへ出し、ERRORをメトリクスフィルターでAlarm化、SNS経由でオンコールへ通知します。「そもそも起動しなかった」事故に備え、実行成功メトリクスの欠落を検知するアラームも実務では有効です。', visibleNodeIds: ['oncall', 'customer', 'igw', 'nat', 'public-rt', 'private-rt', 'scheduler', 'ecs-batch', 'sg-batch', 'rds', 'sg-rds', 's3-report', 'ses', 'cloudwatch', 'cw-alarm', 'sns'], visibleConnectionIds: ['igw-to-public-rt', 'nat-to-private-rt', 'scheduler-to-batch', 'batch-to-rds', 'batch-to-nat', 'nat-to-igw', 'igw-to-s3', 'igw-to-ses', 'ses-to-customer', 'batch-to-logs', 'logs-to-alarm', 'alarm-to-sns', 'sns-to-oncall', 'sg-batch-to-sg-rds'], activeNodeIds: ['cloudwatch', 'cw-alarm', 'sns', 'oncall'], activeConnectionIds: ['batch-to-logs', 'logs-to-alarm', 'alarm-to-sns', 'sns-to-oncall'] },
  ],
};

export default challenge;
