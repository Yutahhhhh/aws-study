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
  makeZone('vpc', 'VPC (Internal Admin)', { x: 260, y: 150, width: 650, height: 430 }),
  makeZone('private-subnet', 'Private Subnet', { x: 42, y: 72, width: 560, height: 310 }, 'private', 'vpc'),
];

const answerNodes: DiagramNode[] = [
  makeNode('admin-pc', '管理者', 'ローカルPC', 'Laptop', { x: 20, y: 320, width: 140, height: 86 }, nodeStyle.external, { category: 'external' }),
  makeNode('admin-role', 'IAM Admin Role', 'SSM許可', 'BadgeCheck', { x: 210, y: 40, width: 160, height: 78 }, nodeStyle.security, { category: 'external' }),
  makeNode('ssm-service', 'SSM Session Manager', 'ポートフォワード', 'PlugZap', { x: 420, y: 40, width: 190, height: 78 }, nodeStyle.edge, { category: 'external' }),
  makeNode('ssm-endpoint', 'SSM VPC Endpoints', 'ssm/ec2messages', 'Cable', { x: 70, y: -28, width: 165, height: 64 }, nodeStyle.gateway, { category: 'gateway', parentId: 'zone-vpc' }),
  makeNode('admin-ec2', 'Admin EC2', 'SSM Agent', 'ServerCog', { x: 90, y: 105, width: 165, height: 86 }, nodeStyle.worker, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('rds', 'Private RDS', 'PostgreSQL', ICON.rds, { x: 335, y: 105, width: 165, height: 86 }, nodeStyle.data, { category: 'placement', parentId: 'zone-private-subnet' }),
  makeNode('session-logs', 'Session Logs', '監査ログ', 'Activity', { x: 690, y: 40, width: 155, height: 78 }, nodeStyle.observability, { category: 'external' }),
  makeNode('private-rt', 'Private Route Table', 'local / endpoints', ICON.routeTable, { x: 360, y: 26, width: 175, height: 34 }, nodeStyle.routeTable, { category: 'association', parentId: 'zone-private-subnet' }),
  makeNode('sg-admin', 'SG: Admin EC2', 'SSMのみ', 'Shield', { x: 26, y: -22, width: 122, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'admin-ec2' }),
  makeNode('sg-rds', 'SG: RDS', 'from Admin SG', 'Shield', { x: 26, y: -22, width: 122, height: 30 }, nodeStyle.security, { category: 'association', parentId: 'rds' }),
];

const createService = makeServiceFactory(answerNodes);
const createZoneService = makeZoneServiceFactory(zones);

const answerDiagram: DiagramConfig = {
  viewport: { width: 960, height: 650, padding: 48 },
  zones,
  nodes: answerNodes,
  connections: [
    { id: 'admin-to-role', from: 'admin-pc', to: 'admin-role', kind: 'traffic', fromAnchor: 'top', toAnchor: 'left' },
    { id: 'role-to-ssm', from: 'admin-role', to: 'ssm-service', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'ssm-to-endpoint', from: 'ssm-service', to: 'ssm-endpoint', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'endpoint-to-ec2', from: 'ssm-endpoint', to: 'admin-ec2', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'ec2-to-rds', from: 'admin-ec2', to: 'rds', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'ssm-to-logs', from: 'ssm-service', to: 'session-logs', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'sg-admin-to-sg-rds', from: 'sg-admin', to: 'sg-rds', kind: 'association', label: '許可元', fromAnchor: 'right', toAnchor: 'left' },
  ],
};

const challenge: ChallengeConfig = {
  slug: 'internal-admin-app',
  title: '社内管理アプリを設計する',
  description: '外部公開せず、SSM経由でPrivate Subnet内の管理用EC2とRDSへ安全に接続する運用構成を組み立てる',
  headerLabel: 'AWS DESIGN CHALLENGE',
  badge: '設計演習',
  icon: 'Laptop',
  color: 'blue',
  scenario:
    '社内管理者だけがPrivate RDSへ接続できる運用構成を作ります。RDSはPublicにせず、SSHも開けません。管理者はIAMで許可され、SSM Session Managerのポートフォワードを使って、Private Subnet内の管理用EC2経由でRDSへ接続できる完成構成にしてください。',
  requirements: [
    { id: 'private', title: 'PrivateなVPC土台', description: 'VPC、Private Subnet、Private Route Tableを明示し、管理用EC2とRDSは外部公開しない。' },
    { id: 'iam', title: '管理者権限', description: '管理者はIAM Role/権限を通してSSMセッションを開始する。' },
    { id: 'ssm', title: 'SSM接続', description: 'SSM Session ManagerとVPC Endpointを使い、SSHなしで管理用EC2へ到達する。' },
    { id: 'db', title: 'DB接続', description: '管理用EC2からPrivate RDSへ接続する。' },
    { id: 'sg', title: 'Security Group', description: 'RDSは管理用EC2のSecurity Groupからだけ許可する。' },
    { id: 'audit', title: '監査ログ', description: 'SSMセッションのログを残す。' },
  ],
  initialDiagram: {
    viewport: { ...answerDiagram.viewport },
    zones: [],
    nodes: pickNodes(answerNodes, ['admin-pc']),
    connections: [],
  },
  lockedNodeIds: ['admin-pc'],
  services: [
    createZoneService('vpc', '管理用構成を置くネットワーク境界'),
    createZoneService('private-subnet', '管理用EC2とRDSを置くSubnet'),
    createService('admin-role', 'SSM操作を許可するIAM Role'),
    createService('ssm-service', 'ポートフォワードを提供するSSM'),
    createService('ssm-endpoint', 'Private SubnetからSSMへ出るためのEndpoint'),
    createService('admin-ec2', 'SSM Agentが動く管理用EC2'),
    createService('rds', '外部公開しないDB'),
    createService('session-logs', 'セッション監査ログの出力先'),
    createService('private-rt', 'Private SubnetのRoute Table'),
    createService('sg-admin', '管理用EC2に関連付けるSG'),
    createService('sg-rds', 'RDSに関連付けるSG'),
  ],
  awsRules: {
    vpcZoneId: 'vpc',
    publicSubnetZoneIds: [],
    privateSubnetZoneIds: ['private-subnet'],
    routeTables: [
      { routeTableNodeId: 'private-rt', subnetZoneId: 'private-subnet', label: 'Private Route Table' },
    ],
    securityGroups: [
      { securityGroupNodeId: 'sg-admin', attachedToNodeId: 'admin-ec2', label: 'Admin EC2 Security Group' },
      { securityGroupNodeId: 'sg-rds', attachedToNodeId: 'rds', label: 'RDS Security Group', allowedSourceSecurityGroupIds: ['sg-admin'] },
    ],
  },
  checks: [
    { id: 'has-role', type: 'node-exists', nodeId: 'admin-role', label: '管理者Roleがある', failureMessage: 'SSM操作を許可するIAM Roleがありません。' },
    { id: 'has-ssm', type: 'node-exists', nodeId: 'ssm-service', label: 'SSMがある', failureMessage: 'SSM Session Managerがありません。' },
    { id: 'has-endpoint', type: 'node-exists', nodeId: 'ssm-endpoint', label: 'SSM Endpointがある', failureMessage: 'Private SubnetからSSMへ接続するVPC Endpointがありません。' },
    { id: 'has-ec2', type: 'node-exists', nodeId: 'admin-ec2', label: '管理用EC2がある', failureMessage: 'SSM Agentが動く管理用EC2がありません。' },
    { id: 'has-rds', type: 'node-exists', nodeId: 'rds', label: 'Private RDSがある', failureMessage: '接続先となるPrivate RDSがありません。' },
    { id: 'has-logs', type: 'node-exists', nodeId: 'session-logs', label: '監査ログがある', failureMessage: 'SSMセッションログの出力先がありません。' },
    { id: 'ssm-path', type: 'path-exists', path: ['admin-pc', 'admin-role', 'ssm-service', 'ssm-endpoint', 'admin-ec2'], label: 'SSMで管理用EC2へ到達できる', failureMessage: '管理者がIAM許可を通り、SSMとEndpoint経由で管理用EC2へ到達する流れが途切れています。' },
    { id: 'db-path', type: 'path-exists', path: ['admin-pc', 'admin-role', 'ssm-service', 'ssm-endpoint', 'admin-ec2', 'rds'], label: 'Private RDSへ接続できる', failureMessage: 'SSMポートフォワード経由でPrivate RDSへ接続する流れが途切れています。' },
    { id: 'log-path', type: 'connection-exists', from: 'ssm-service', to: 'session-logs', label: 'セッションログを残せる', failureMessage: 'SSM Session Managerから監査ログへ出力する関係がありません。' },
    { id: 'ec2-private', type: 'node-in-zone', nodeId: 'admin-ec2', zoneId: 'private-subnet', label: '管理用EC2はPrivate Subnetにある', failureMessage: '管理用EC2がPrivate Subnetに配置されていません。' },
    { id: 'rds-private', type: 'node-in-zone', nodeId: 'rds', zoneId: 'private-subnet', label: 'RDSはPrivate Subnetにある', failureMessage: 'RDSがPrivate Subnetに配置されていません。' },
    { id: 'rds-only-admin', type: 'incoming-only-from', nodeId: 'rds', allowedSourceIds: ['admin-ec2'], label: 'RDSは管理用EC2からだけ使う', failureMessage: 'RDSへ管理用EC2以外から入る経路があります。' },
  ],
  actions: [
    { id: 'start-session', title: '管理者がSSMセッションを開始する', description: 'IAMで許可された管理者がSSMへ接続する。', checkIds: ['has-role', 'has-ssm', 'has-endpoint', 'has-ec2', 'ssm-path', 'ec2-private'], successMessage: '管理者はSSHを開けずにSSMで管理用EC2へ到達できます。', failureMessage: 'SSMセッション開始の確認に失敗しました。' },
    { id: 'connect-db', title: 'Private RDSへポートフォワードする', description: '管理用EC2経由でPrivate RDSへ接続する。', checkIds: ['has-rds', 'db-path', 'rds-private', 'rds-only-admin'], successMessage: 'RDSをPublicにせず、管理用EC2経由で接続できます。', failureMessage: 'Private RDS接続の確認に失敗しました。' },
    { id: 'audit', title: '管理操作を監査する', description: 'SSMセッションログを保存する。', checkIds: ['has-logs', 'log-path'], successMessage: '管理操作のセッションログを残せます。', failureMessage: '監査ログの確認に失敗しました。' },
  ],
  answerDiagram,
  answerTrace: [
    { id: 'network', title: 'Privateな管理領域を作る', description: 'VPC内にPrivate Subnetを作り、Private Route Tableを関連付け、管理用EC2とRDSを配置します。外部公開するSubnetやSSH入口は置きません。', visibleNodeIds: ['admin-pc', 'private-rt', 'admin-ec2', 'rds', 'sg-admin', 'sg-rds'], visibleConnectionIds: ['sg-admin-to-sg-rds'], activeNodeIds: ['private-rt', 'admin-ec2', 'rds', 'sg-admin', 'sg-rds'], activeConnectionIds: ['sg-admin-to-sg-rds'] },
    { id: 'ssm', title: 'SSMで管理用EC2へ入る', description: '管理者はIAM Roleで許可され、SSM Session ManagerとVPC Endpointを通って管理用EC2へ接続します。', visibleNodeIds: ['admin-pc', 'admin-role', 'ssm-service', 'ssm-endpoint', 'admin-ec2', 'rds', 'sg-admin', 'sg-rds'], visibleConnectionIds: ['admin-to-role', 'role-to-ssm', 'ssm-to-endpoint', 'endpoint-to-ec2', 'sg-admin-to-sg-rds'], activeNodeIds: ['admin-pc', 'admin-role', 'ssm-service', 'ssm-endpoint', 'admin-ec2'], activeConnectionIds: ['admin-to-role', 'role-to-ssm', 'ssm-to-endpoint', 'endpoint-to-ec2'] },
    { id: 'db', title: 'Private RDSへポートフォワードする', description: 'SSMで到達した管理用EC2を経由してPrivate RDSへ接続します。RDS SGは管理用EC2 SGからだけ許可します。', visibleNodeIds: ['admin-pc', 'admin-role', 'ssm-service', 'ssm-endpoint', 'admin-ec2', 'rds', 'sg-admin', 'sg-rds'], visibleConnectionIds: ['admin-to-role', 'role-to-ssm', 'ssm-to-endpoint', 'endpoint-to-ec2', 'ec2-to-rds', 'sg-admin-to-sg-rds'], activeNodeIds: ['admin-ec2', 'rds', 'sg-admin', 'sg-rds'], activeConnectionIds: ['ec2-to-rds', 'sg-admin-to-sg-rds'] },
    { id: 'audit', title: '管理操作を監査する', description: 'SSMセッションログを保存して、誰がいつ接続したかをあとから確認できるようにします。', visibleNodeIds: ['admin-pc', 'admin-role', 'ssm-service', 'ssm-endpoint', 'admin-ec2', 'rds', 'session-logs', 'sg-admin', 'sg-rds'], visibleConnectionIds: ['admin-to-role', 'role-to-ssm', 'ssm-to-endpoint', 'endpoint-to-ec2', 'ec2-to-rds', 'ssm-to-logs', 'sg-admin-to-sg-rds'], activeNodeIds: ['ssm-service', 'session-logs'], activeConnectionIds: ['ssm-to-logs'] },
  ],
};

export default challenge;
