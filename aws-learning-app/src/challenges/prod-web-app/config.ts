import type { ChallengeConfig, ChallengeService } from '../../types/challenge';
import type {
  DiagramConfig,
  DiagramNode,
  DiagramPosition,
  DiagramZone,
  ResourceCategory,
} from '../../types/diagram';
import { diagramConfig as prodArchitectureDiagram } from '../../topics/prod-architecture/diagram';

const routeTableIcon =
  '/src/assets/aws/Resource-Icons_07312025/Res_Networking-Content-Delivery/Res_Amazon-Route-53_Route-Table_48.svg';
const internetGatewayIcon =
  '/src/assets/aws/Resource-Icons_07312025/Res_Networking-Content-Delivery/Res_Amazon-VPC_Internet-Gateway_48.svg';

const securityGroupStyle: DiagramNode['style'] = {
  bgColor: 'bg-rose-950',
  borderColor: 'border-rose-500',
  textColor: 'text-rose-100',
  accentColor: 'text-rose-300',
};

const routeTableStyle: DiagramNode['style'] = {
  bgColor: 'bg-cyan-950',
  borderColor: 'border-cyan-500',
  textColor: 'text-cyan-100',
  accentColor: 'text-cyan-300',
};

const nodeById = new Map(prodArchitectureDiagram.nodes.map((node) => [node.id, node]));

const getProdNode = (nodeId: string): DiagramNode => {
  const node = nodeById.get(nodeId);
  if (!node) throw new Error(`Unknown answer node: ${nodeId}`);
  return node;
};

interface NodeExtra {
  category: ResourceCategory;
  parentId?: string;
}

/** prod-architecture のノードを複製し、演習用の座標・カテゴリ・親を上書きする */
const placeProdNode = (
  nodeId: string,
  position: DiagramPosition,
  extra: NodeExtra,
): DiagramNode => ({
  ...getProdNode(nodeId),
  position,
  style: { ...getProdNode(nodeId).style },
  ...extra,
});

const makeNode = (
  id: string,
  label: string,
  sublabel: string,
  icon: string,
  position: DiagramPosition,
  style: DiagramNode['style'],
  extra: NodeExtra,
  metadata?: string,
): DiagramNode => ({
  id,
  label,
  sublabel,
  metadata,
  icon,
  position,
  style,
  ...extra,
});

/**
 * 模範解答のレイアウト。
 * 入れ子（VPC ⊃ Subnet ⊃ placement）と関連付け（SG→リソース / RT→Subnet）を
 * parentId で構造的に表現する。子の座標は親に対する相対座標。
 */
const challengeZones: DiagramZone[] = [
  {
    ...prodArchitectureDiagram.zones[0],
    id: 'vpc',
    position: { x: 230, y: 150, width: 720, height: 470 },
    contentPadding: { top: 46, right: 18, bottom: 18, left: 18 },
    style: { ...prodArchitectureDiagram.zones[0].style },
  },
  {
    ...prodArchitectureDiagram.zones[1],
    id: 'public-subnet',
    parentZoneId: 'vpc',
    position: { x: 24, y: 60, width: 320, height: 380 },
    contentPadding: { top: 56, right: 18, bottom: 18, left: 18 },
    style: { ...prodArchitectureDiagram.zones[1].style },
  },
  {
    ...prodArchitectureDiagram.zones[2],
    id: 'private-subnet',
    parentZoneId: 'vpc',
    position: { x: 376, y: 60, width: 320, height: 380 },
    contentPadding: { top: 56, right: 18, bottom: 18, left: 18 },
    style: { ...prodArchitectureDiagram.zones[2].style },
  },
];

const answerNodes: DiagramNode[] = [
  // 外部（VPC外）
  placeProdNode('user-pc', { x: 20, y: 300, width: 150, height: 96 }, { category: 'external' }),
  placeProdNode('cloudfront', { x: 250, y: 10, width: 180, height: 96 }, { category: 'external' }),
  placeProdNode('s3', { x: 450, y: 10, width: 140, height: 96 }, { category: 'external' }),
  placeProdNode('github', { x: 660, y: 10, width: 130, height: 96 }, { category: 'external' }),
  placeProdNode('ecr', { x: 810, y: 10, width: 120, height: 96 }, { category: 'external' }),
  // 境界（VPC上辺にまたがる）
  makeNode(
    'igw',
    'Internet Gateway',
    'VPCの外部接続点',
    internetGatewayIcon,
    { x: 270, y: -32, width: 180, height: 78 },
    {
      bgColor: 'bg-orange-950',
      borderColor: 'border-orange-500',
      textColor: 'text-orange-100',
      accentColor: 'text-orange-300',
    },
    { category: 'gateway', parentId: 'zone-vpc' },
  ),
  // 配置（Subnet内）
  placeProdNode('alb', { x: 70, y: 150, width: 170, height: 92 }, {
    category: 'placement',
    parentId: 'zone-public-subnet',
  }),
  placeProdNode('ecs', { x: 60, y: 120, width: 180, height: 88 }, {
    category: 'placement',
    parentId: 'zone-private-subnet',
  }),
  placeProdNode('rds', { x: 60, y: 250, width: 180, height: 88 }, {
    category: 'placement',
    parentId: 'zone-private-subnet',
  }),
  // 関連付け：Route Table → Subnet
  makeNode(
    'public-rt',
    'Public Route Table',
    '0.0.0.0/0 → IGW',
    routeTableIcon,
    { x: 150, y: 26, width: 152, height: 34 },
    routeTableStyle,
    { category: 'association', parentId: 'zone-public-subnet' },
  ),
  makeNode(
    'private-rt',
    'Private Route Table',
    'local',
    routeTableIcon,
    { x: 150, y: 26, width: 152, height: 34 },
    routeTableStyle,
    { category: 'association', parentId: 'zone-private-subnet' },
  ),
  // 関連付け：Security Group → リソース
  makeNode(
    'sg-alb',
    'SG: ALB',
    'inbound 443',
    'Shield',
    { x: 30, y: -22, width: 112, height: 30 },
    securityGroupStyle,
    { category: 'association', parentId: 'alb' },
  ),
  makeNode(
    'sg-ecs',
    'SG: ECS',
    'from ALB SG',
    'Shield',
    { x: 40, y: -22, width: 112, height: 30 },
    securityGroupStyle,
    { category: 'association', parentId: 'ecs' },
  ),
  makeNode(
    'sg-rds',
    'SG: RDS',
    'from ECS SG',
    'Shield',
    { x: 40, y: -22, width: 112, height: 30 },
    securityGroupStyle,
    { category: 'association', parentId: 'rds' },
  ),
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

/** パレット用 service を模範ノードから生成（parentId は付与しない：配置/関連付け操作で決まる） */
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

const createZoneService = (
  serviceId: string,
  description: string,
  icon: string,
): ChallengeService => {
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
  viewport: {
    width: 1000,
    height: 700,
    padding: 48,
  },
  zones: challengeZones,
  nodes: answerNodes,
  connections: [
    // 通信フロー（実線＋矢印）
    { id: 'user-to-cf', from: 'user-pc', to: 'cloudfront', kind: 'traffic', fromAnchor: 'top', toAnchor: 'left' },
    { id: 'cf-to-s3', from: 'cloudfront', to: 's3', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'cf-to-igw', from: 'cloudfront', to: 'igw', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'igw-to-alb', from: 'igw', to: 'alb', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'alb-to-ecs', from: 'alb', to: 'ecs', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'ecs-to-rds', from: 'ecs', to: 'rds', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'github-to-ecr', from: 'github', to: 'ecr', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'ecr-to-ecs', from: 'ecr', to: 'ecs', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'right' },
    // 境界への取り付け（破線）：Public Route Table が IGW へ経路を向ける
    { id: 'igw-to-public-rt', from: 'igw', to: 'public-rt', kind: 'attachment', label: 'route', fromAnchor: 'right', toAnchor: 'top' },
    // 許可参照（点線・矢印なし）：Security Group 間の許可元
    { id: 'sg-alb-to-sg-ecs', from: 'sg-alb', to: 'sg-ecs', kind: 'association', label: '許可元', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'sg-ecs-to-sg-rds', from: 'sg-ecs', to: 'sg-rds', kind: 'association', label: '許可元', fromAnchor: 'bottom', toAnchor: 'top' },
  ],
};

const initialNodeIds = ['user-pc'];

const challenge: ChallengeConfig = {
  slug: 'prod-web-app',
  title: '本番Webアプリ構成を設計する',
  description: '静的配信、API、DB、デプロイ経路を含む本番向けWebアプリ構成を要件から組み立てる',
  headerLabel: 'AWS DESIGN CHALLENGE',
  badge: '設計演習',
  icon: 'PenTool',
  color: 'blue',
  scenario:
    '小規模なSaaSを本番公開します。フロントエンドは静的ファイル、バックエンドはコンテナAPI、DBはPostgreSQLです。VPC、Subnet、Route Table、Security Groupを明示し、外部公開する入口を絞りながらデプロイも成立する構成を作ってください。リソースは「配置する／境界に取り付ける／関連付ける／外部サービスとして使う」を意識して組み立てます。',
  requirements: [
    {
      id: 'network-foundation',
      title: 'AWSネットワークの土台',
      description: 'VPCを作り、Public/Private SubnetをVPC内に入れ子で配置。Route TableはSubnetに、Security Groupはリソースに関連付ける。',
    },
    {
      id: 'static-site',
      title: '静的サイト配信',
      description: '利用者は独自ドメインのHTTPSアクセスでフロントエンドを取得できる。',
    },
    {
      id: 'api-routing',
      title: 'API通信',
      description: '/api/* のリクエストはCloudFrontからVPCの境界（IGW）を通り、Public SubnetのALB経由でPrivate SubnetのAPIまで届く。',
    },
    {
      id: 'private-app',
      title: 'アプリケーション保護',
      description: 'APIアプリケーションはPrivate Subnetに配置し、ALBのSecurity Groupからだけ受ける。',
    },
    {
      id: 'private-db',
      title: 'DB保護',
      description: 'PostgreSQLはPrivate Subnetに配置し、ECSのSecurity Groupからだけ使える。',
    },
    {
      id: 'deployment',
      title: 'デプロイ経路',
      description: 'CI/CDからコンテナイメージを登録し、実行基盤がそのイメージを使える。',
    },
  ],
  initialDiagram: {
    viewport: { ...answerDiagram.viewport },
    zones: [],
    nodes: pickAnswerNodes(initialNodeIds),
    connections: [],
  },
  lockedNodeIds: initialNodeIds,
  services: [
    createZoneService('vpc', 'AWS内のネットワーク境界', 'Network'),
    createZoneService('public-subnet', '外部公開入口を置くSubnet（VPCに入れ子）', 'Network'),
    createZoneService('private-subnet', 'アプリとDBを守るSubnet（VPCに入れ子）', 'Network'),
    createService('alb', 'VPC内アプリへ渡す公開入口', 'placement'),
    createService('ecs', 'コンテナAPIを実行する基盤', 'placement'),
    createService('rds', 'PostgreSQLの永続データストア', 'placement'),
    createService('igw', 'VPCをインターネットへ接続する境界', 'gateway'),
    createService('public-rt', 'Public Subnetに関連付ける経路（→IGW）', 'association'),
    createService('private-rt', 'Private Subnetに関連付ける内部経路', 'association'),
    createService('sg-alb', 'ALBに関連付ける通信許可', 'association'),
    createService('sg-ecs', 'ECSに関連付ける通信許可', 'association'),
    createService('sg-rds', 'RDSに関連付ける通信許可', 'association'),
    createService('cloudfront', '静的配信とAPI振り分けの入口', 'external'),
    createService('s3', 'フロントエンドの静的ファイル配置先', 'external'),
    createService('github', 'CI/CDからAWSへデプロイする実行元', 'external'),
    createService('ecr', 'コンテナイメージの保管先', 'external'),
  ],
  awsRules: {
    vpcZoneId: 'vpc',
    publicSubnetZoneIds: ['public-subnet'],
    privateSubnetZoneIds: ['private-subnet'],
    internetGatewayNodeId: 'igw',
    routeTables: [
      {
        routeTableNodeId: 'public-rt',
        subnetZoneId: 'public-subnet',
        label: 'Public Route Table',
        requiresInternetGatewayConnection: { internetGatewayNodeId: 'igw' },
      },
      {
        routeTableNodeId: 'private-rt',
        subnetZoneId: 'private-subnet',
        label: 'Private Route Table',
      },
    ],
    securityGroups: [
      {
        securityGroupNodeId: 'sg-alb',
        attachedToNodeId: 'alb',
        label: 'ALB Security Group',
      },
      {
        securityGroupNodeId: 'sg-ecs',
        attachedToNodeId: 'ecs',
        label: 'ECS Security Group',
        allowedSourceSecurityGroupIds: ['sg-alb'],
      },
      {
        securityGroupNodeId: 'sg-rds',
        attachedToNodeId: 'rds',
        label: 'RDS Security Group',
        allowedSourceSecurityGroupIds: ['sg-ecs'],
      },
    ],
  },
  checks: [
    {
      id: 'has-cloudfront',
      type: 'node-exists',
      nodeId: 'cloudfront',
      label: '公開入口がある',
      failureMessage:
        '利用者のHTTPSアクセスを最初に受けるグローバルな入口がないため、静的配信とAPI振り分けの起点が成立していません。',
    },
    {
      id: 'has-s3',
      type: 'node-exists',
      nodeId: 's3',
      label: '静的ファイル配置先がある',
      failureMessage:
        'フロントエンドの静的ファイルを保持する場所がないため、画面表示に必要なファイルを返せません。',
    },
    {
      id: 'has-alb',
      type: 'node-exists',
      nodeId: 'alb',
      label: 'APIの受信口がある',
      failureMessage:
        'VPC内のアプリケーションへHTTPリクエストを渡す受信口がないため、API通信が内部へ進めません。',
    },
    {
      id: 'has-ecs',
      type: 'node-exists',
      nodeId: 'ecs',
      label: 'API実行基盤がある',
      failureMessage:
        'APIを実行するコンテナ基盤がないため、バックエンド処理を受ける場所がありません。',
    },
    {
      id: 'has-rds',
      type: 'node-exists',
      nodeId: 'rds',
      label: 'DBがある',
      failureMessage:
        '永続データを保存するPostgreSQLがないため、APIがデータを読み書きできません。',
    },
    {
      id: 'has-github',
      type: 'node-exists',
      nodeId: 'github',
      label: 'CI/CD実行元がある',
      failureMessage:
        'デプロイを開始する実行元がないため、コンテナイメージの登録フローを表現できていません。',
    },
    {
      id: 'has-ecr',
      type: 'node-exists',
      nodeId: 'ecr',
      label: 'イメージ保管先がある',
      failureMessage:
        'コンテナイメージを保存するレジストリがないため、実行基盤がデプロイ対象を取得できません。',
    },
    {
      id: 'static-path',
      type: 'path-exists',
      path: ['user-pc', 'cloudfront', 's3'],
      label: '静的配信経路が成立する',
      failureMessage:
        '静的ファイル取得の経路が途中で途切れています。利用者のアクセスを入口で受け、静的ファイルの保管先へ渡せる流れが必要です。',
    },
    {
      id: 'api-path',
      type: 'path-exists',
      path: ['user-pc', 'cloudfront', 'igw', 'alb', 'ecs'],
      label: 'API経路が成立する',
      failureMessage:
        'APIリクエストの経路が途中で途切れています。CloudFrontからVPC境界のIGWを通り、Public SubnetのALBを経由してPrivate Subnetのアプリへ渡す流れが必要です。',
    },
    {
      id: 'db-path',
      type: 'path-exists',
      path: ['ecs', 'rds'],
      label: 'アプリからDBへ到達できる',
      failureMessage:
        'アプリケーションからDBへ到達できません。永続データは外部ではなく、アプリケーション層から利用される必要があります。',
    },
    {
      id: 'deploy-path',
      type: 'path-exists',
      path: ['github', 'ecr', 'ecs'],
      label: 'デプロイ経路が成立する',
      failureMessage:
        'コンテナイメージの登録から実行基盤での利用までの流れが途切れています。CI/CD、レジストリ、実行基盤の関係が必要です。',
    },
    {
      id: 'alb-public',
      type: 'node-in-zone',
      nodeId: 'alb',
      zoneId: 'public-subnet',
      label: 'API受信口はPublic Subnetに配置されている',
      failureMessage:
        'ALBがPublic Subnetに配置されていません。ALBはSubnet内に「配置する」リソースです。Public Subnetの枠内へドロップして所属させてください。',
    },
    {
      id: 'ecs-private',
      type: 'node-in-zone',
      nodeId: 'ecs',
      zoneId: 'private-subnet',
      label: 'API実行基盤はPrivate Subnetに配置されている',
      failureMessage:
        'ECSがPrivate Subnetに配置されていません。Private Subnetの枠内へドロップして、公開入口と処理層を分離してください。',
    },
    {
      id: 'rds-private',
      type: 'node-in-zone',
      nodeId: 'rds',
      zoneId: 'private-subnet',
      label: 'DBはPrivate Subnetに配置されている',
      failureMessage:
        'RDSがPrivate Subnetに配置されていません。Private Subnetの枠内へドロップして、永続データを外部から切り離してください。',
    },
    {
      id: 's3-only-cloudfront',
      type: 'incoming-only-from',
      nodeId: 's3',
      allowedSourceIds: ['cloudfront'],
      label: '静的ファイルは入口経由で取得する',
      failureMessage:
        '静的ファイルの保管先へ入口を通らない経路が入っています。公開面を入口に集約する意図が崩れています。',
    },
    {
      id: 'rds-only-ecs',
      type: 'incoming-only-from',
      nodeId: 'rds',
      allowedSourceIds: ['ecs'],
      label: 'DBはアプリケーション層からだけ使う',
      failureMessage:
        'DBへアプリケーション層以外から入る経路があります。DBは利用者や公開入口から直接触らせない構成にします。',
    },
  ],
  actions: [
    {
      id: 'open-web',
      title: '利用者がWeb画面を開く',
      description: 'ブラウザからHTTPSでアクセスし、フロントエンドの静的ファイルを取得する。',
      checkIds: ['has-cloudfront', 'has-s3', 'static-path', 's3-only-cloudfront'],
      successMessage:
        'ブラウザからのリクエストは入口を経由して静的ファイルへ到達できます。公開面を入口に集約した配信が成立しています。',
      failureMessage: 'Web画面の表示に失敗しました。',
    },
    {
      id: 'call-api',
      title: '利用者が /api/products を呼び出す',
      description: 'フロントエンドからAPIへアクセスし、コンテナで動くアプリケーションまで到達する。',
      checkIds: ['has-cloudfront', 'has-alb', 'has-ecs', 'api-path', 'alb-public', 'ecs-private'],
      successMessage:
        'APIリクエストは公開入口からVPC境界を通り、Private Subnetのアプリケーションまで到達できます。',
      failureMessage: 'APIリクエストの処理に失敗しました。',
    },
    {
      id: 'query-db',
      title: 'APIが商品データをDBから読む',
      description: 'アプリケーションがPostgreSQLへ接続し、永続データを取得する。',
      checkIds: ['has-ecs', 'has-rds', 'db-path', 'ecs-private', 'rds-private', 'rds-only-ecs'],
      successMessage:
        'アプリケーションからDBへ到達でき、DBはPrivate Subnetで外部公開されない状態になっています。',
      failureMessage: 'DB参照に失敗しました。',
    },
    {
      id: 'deploy-container',
      title: 'CI/CDが新しいAPIをデプロイする',
      description: 'CI/CDがイメージを登録し、実行基盤がそのイメージを使う。',
      checkIds: ['has-github', 'has-ecr', 'has-ecs', 'deploy-path'],
      successMessage:
        'CI/CDからコンテナイメージを登録し、実行基盤がそれを使うデプロイ経路が成立しています。',
      failureMessage: 'デプロイ経路の確認に失敗しました。',
    },
  ],
  answerDiagram,
  answerTrace: [
    {
      id: 'foundation',
      title: 'VPCの土台と境界・経路を用意する',
      description:
        'VPC内にPublic/Private Subnetを入れ子で作り、VPC境界にInternet Gatewayを取り付けます。Public Route TableはPublic Subnetに関連付け、0.0.0.0/0をIGWへ向けます（点線＝経路の関連付け）。',
      visibleNodeIds: ['user-pc', 'igw', 'public-rt', 'private-rt'],
      visibleConnectionIds: ['igw-to-public-rt'],
      activeNodeIds: ['igw', 'public-rt', 'private-rt'],
      activeConnectionIds: ['igw-to-public-rt'],
    },
    {
      id: 'static',
      title: '静的ファイル配信をつなぐ',
      description:
        '利用者のHTTPSアクセスをCloudFrontで受け、フロントエンドの静的ファイルはS3から取得します。どちらもVPC外のマネージドサービスです。',
      visibleNodeIds: ['user-pc', 'cloudfront', 's3', 'igw', 'public-rt', 'private-rt'],
      visibleConnectionIds: ['user-to-cf', 'cf-to-s3', 'igw-to-public-rt'],
      activeNodeIds: ['user-pc', 'cloudfront', 's3'],
      activeConnectionIds: ['user-to-cf', 'cf-to-s3'],
    },
    {
      id: 'api-entry',
      title: 'APIの公開入口を配置する',
      description:
        'APIリクエストはCloudFrontからIGW（VPC境界）を通り、Public Subnetに配置したALBへ届きます。ALBにはSecurity Groupを関連付けます（リソースに貼り付くバッジ）。',
      visibleNodeIds: ['user-pc', 'cloudfront', 's3', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb'],
      visibleConnectionIds: ['user-to-cf', 'cf-to-s3', 'cf-to-igw', 'igw-to-public-rt', 'igw-to-alb'],
      activeNodeIds: ['cloudfront', 'igw', 'alb', 'sg-alb'],
      activeConnectionIds: ['cf-to-igw', 'igw-to-alb'],
    },
    {
      id: 'app',
      title: 'アプリケーションをPrivate Subnetに配置する',
      description:
        'APIの実体はPrivate Subnetに配置したECSで動かし、ECSのSecurity GroupはALBのSecurity Groupからの通信だけを許可します（点線＝許可参照）。',
      visibleNodeIds: ['user-pc', 'cloudfront', 's3', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs', 'sg-ecs'],
      visibleConnectionIds: ['user-to-cf', 'cf-to-s3', 'cf-to-igw', 'igw-to-public-rt', 'igw-to-alb', 'alb-to-ecs', 'sg-alb-to-sg-ecs'],
      activeNodeIds: ['alb', 'ecs', 'sg-alb', 'sg-ecs'],
      activeConnectionIds: ['alb-to-ecs', 'sg-alb-to-sg-ecs'],
    },
    {
      id: 'database',
      title: 'DBをさらに内側に配置する',
      description:
        'RDSもPrivate Subnetに配置し、RDSのSecurity GroupはECSのSecurity Groupからだけ接続を許可します。',
      visibleNodeIds: ['user-pc', 'cloudfront', 's3', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs', 'sg-ecs', 'rds', 'sg-rds'],
      visibleConnectionIds: ['user-to-cf', 'cf-to-s3', 'cf-to-igw', 'igw-to-public-rt', 'igw-to-alb', 'alb-to-ecs', 'sg-alb-to-sg-ecs', 'ecs-to-rds', 'sg-ecs-to-sg-rds'],
      activeNodeIds: ['ecs', 'rds', 'sg-ecs', 'sg-rds'],
      activeConnectionIds: ['ecs-to-rds', 'sg-ecs-to-sg-rds'],
    },
    {
      id: 'deploy',
      title: 'デプロイ経路を加える',
      description:
        'CI/CDからECRへコンテナイメージを登録し、ECSがそのイメージを使うデプロイの経路を加えます。GitHub・ECRはVPC外のサービスです。',
      visibleNodeIds: ['user-pc', 'cloudfront', 's3', 'igw', 'public-rt', 'private-rt', 'alb', 'sg-alb', 'ecs', 'sg-ecs', 'rds', 'sg-rds', 'github', 'ecr'],
      visibleConnectionIds: ['user-to-cf', 'cf-to-s3', 'cf-to-igw', 'igw-to-public-rt', 'igw-to-alb', 'alb-to-ecs', 'sg-alb-to-sg-ecs', 'ecs-to-rds', 'sg-ecs-to-sg-rds', 'github-to-ecr', 'ecr-to-ecs'],
      activeNodeIds: ['github', 'ecr', 'ecs'],
      activeConnectionIds: ['github-to-ecr', 'ecr-to-ecs'],
    },
  ],
};

export default challenge;
