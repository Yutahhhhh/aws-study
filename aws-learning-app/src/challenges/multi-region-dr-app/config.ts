import type { ChallengeConfig } from '../../types/challenge';
import type { DiagramConfig, DiagramNode, DiagramZone } from '../../types/diagram';
import { ICON, makeNode, makeServiceFactory, makeZone, nodeStyle, pickNodes } from '../shared';

const zones: DiagramZone[] = [
  makeZone('region-primary', 'Region: Tokyo (Primary)', { x: 220, y: 150, width: 440, height: 540 }, 'public'),
  makeZone('region-standby', 'Region: Osaka (Warm Standby)', { x: 720, y: 150, width: 440, height: 540 }, 'ops'),
];

const answerNodes: DiagramNode[] = [
  makeNode('users', '利用者', 'ブラウザ', 'Users', { x: 40, y: 60, width: 150, height: 82 }, nodeStyle.external, { category: 'external' }),
  makeNode('route53', 'Route 53', 'failover routing', 'Globe2', { x: 470, y: 30, width: 190, height: 82 }, nodeStyle.edge, { category: 'external' }),
  makeNode('healthcheck', 'Route 53 Health Check', 'Primary監視', 'HeartPulse', { x: 470, y: 150, width: 190, height: 74 }, nodeStyle.observability, { category: 'external' }),
  // Primary region (locked, 稼働中)
  makeNode('app-primary', 'App (Primary)', 'ALB + ECS', ICON.ecs, { x: 290, y: 250, width: 210, height: 90 }, nodeStyle.app, { category: 'external' }),
  makeNode('db-primary', 'Aurora (Primary)', '読み書き', ICON.rds, { x: 290, y: 400, width: 210, height: 90 }, nodeStyle.data, { category: 'external' }),
  makeNode('s3-primary', 'S3 (Primary)', '静的/オブジェクト', ICON.s3, { x: 290, y: 540, width: 210, height: 82 }, nodeStyle.data, { category: 'external' }),
  // Standby region (ユーザーが追加)
  makeNode('app-standby', 'App (Standby)', '縮小構成で待機', ICON.ecs, { x: 800, y: 250, width: 210, height: 90 }, nodeStyle.worker, { category: 'external' }),
  makeNode('db-standby', 'Aurora (Secondary)', 'Global DB複製先', ICON.rds, { x: 800, y: 400, width: 210, height: 90 }, nodeStyle.data, { category: 'external' }),
  makeNode('s3-standby', 'S3 (Replica)', 'CRR複製先', ICON.s3, { x: 800, y: 540, width: 210, height: 82 }, nodeStyle.data, { category: 'external' }),
];

const createService = makeServiceFactory(answerNodes);

const lockedNodeIds = ['users', 'route53', 'app-primary', 'db-primary', 's3-primary'];

const baseConnections = [
  { id: 'users-to-r53', from: 'users', to: 'route53', kind: 'traffic' as const, fromAnchor: 'right' as const, toAnchor: 'left' as const },
  { id: 'r53-to-primary', from: 'route53', to: 'app-primary', kind: 'traffic' as const, label: 'primary', fromAnchor: 'bottom' as const, toAnchor: 'top' as const },
  { id: 'primary-app-to-db', from: 'app-primary', to: 'db-primary', kind: 'traffic' as const, fromAnchor: 'bottom' as const, toAnchor: 'top' as const },
];

const answerDiagram: DiagramConfig = {
  viewport: { width: 1200, height: 730, padding: 48 },
  zones,
  nodes: answerNodes,
  connections: [
    ...baseConnections,
    { id: 'r53-to-hc', from: 'route53', to: 'healthcheck', kind: 'association', label: '監視', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'hc-to-primary', from: 'healthcheck', to: 'app-primary', kind: 'association', label: 'health', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'r53-to-standby', from: 'route53', to: 'app-standby', kind: 'traffic', label: 'failover (secondary)', fromAnchor: 'right', toAnchor: 'top' },
    { id: 'standby-app-to-db', from: 'app-standby', to: 'db-standby', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'db-replicate', from: 'db-primary', to: 'db-standby', kind: 'association', label: 'Aurora Global 複製', fromAnchor: 'right', toAnchor: 'left' },
    { id: 's3-replicate', from: 's3-primary', to: 's3-standby', kind: 'association', label: 'S3 CRR', fromAnchor: 'right', toAnchor: 'left' },
  ],
};

const challenge: ChallengeConfig = {
  slug: 'multi-region-dr-app',
  title: 'マルチリージョンDRを設計する（Warm Standby）',
  description: 'Primaryリージョンの稼働構成に、別リージョンの待機系・データ複製・Route 53フェイルオーバーを足してDRを成立させる',
  headerLabel: 'AWS MULTI-REGION DR',
  badge: '設計演習',
  icon: 'Globe',
  color: 'amber',
  scenario:
    'Tokyoリージョンで稼働中のWebアプリを、リージョン障害でも復旧できるようにします。Osakaリージョンに縮小構成(Warm Standby)を用意し、Aurora Global DatabaseとS3 CRRでデータを複製、Route 53のヘルスチェックとフェイルオーバーで、Primary障害時に待機系へ向き先を切り替える構成を完成させてください。',
  requirements: [
    { id: 'replicate', title: 'データ複製', description: 'Aurora Global DatabaseでDBを、S3 Cross-Region ReplicationでオブジェクトをStandbyリージョンへ複製する。' },
    { id: 'warm-standby', title: '待機系', description: 'Standbyリージョンに縮小構成のアプリを置き、複製先のDBへ接続できるようにする。' },
    { id: 'healthcheck', title: 'ヘルスチェック', description: 'Route 53のヘルスチェックでPrimaryの健全性を監視する。' },
    { id: 'failover', title: 'フェイルオーバー', description: 'Route 53にStandbyへのフェイルオーバー経路(secondary)を設定する。' },
  ],
  initialDiagram: {
    viewport: { ...answerDiagram.viewport },
    zones,
    nodes: pickNodes(answerNodes, lockedNodeIds),
    connections: baseConnections,
  },
  lockedNodeIds,
  services: [
    createService('app-standby', 'Standbyリージョンの縮小アプリ'),
    createService('db-standby', 'Aurora Global の複製先DB'),
    createService('s3-standby', 'S3 CRR の複製先バケット'),
    createService('healthcheck', 'Primaryを監視するRoute 53ヘルスチェック'),
  ],
  checks: [
    { id: 'has-app-standby', type: 'node-exists', nodeId: 'app-standby', label: '待機系アプリがある', failureMessage: 'Standbyリージョンの待機アプリがありません。' },
    { id: 'has-db-standby', type: 'node-exists', nodeId: 'db-standby', label: '複製先DBがある', failureMessage: 'Aurora Globalの複製先DBがありません。' },
    { id: 'has-s3-standby', type: 'node-exists', nodeId: 's3-standby', label: '複製先バケットがある', failureMessage: 'S3 CRRの複製先バケットがありません。' },
    { id: 'has-healthcheck', type: 'node-exists', nodeId: 'healthcheck', label: 'ヘルスチェックがある', failureMessage: 'Route 53のヘルスチェックがありません。' },
    { id: 'db-replication', type: 'connection-exists', from: 'db-primary', to: 'db-standby', label: 'DBを別リージョンへ複製する', failureMessage: 'Aurora PrimaryからSecondaryへの複製がありません。' },
    { id: 's3-replication', type: 'connection-exists', from: 's3-primary', to: 's3-standby', label: 'オブジェクトを別リージョンへ複製する', failureMessage: 'S3 Primaryから複製先バケットへのCRRがありません。' },
    { id: 'standby-db-link', type: 'connection-exists', from: 'app-standby', to: 'db-standby', label: '待機系が複製DBへ接続する', failureMessage: '待機系アプリから複製先DBへの接続がありません。' },
    { id: 'hc-monitors', type: 'connection-exists', from: 'healthcheck', to: 'app-primary', label: 'ヘルスチェックがPrimaryを監視する', failureMessage: 'ヘルスチェックがPrimaryアプリを監視していません。' },
    { id: 'r53-uses-hc', type: 'connection-exists', from: 'route53', to: 'healthcheck', label: 'Route 53がヘルスチェックを使う', failureMessage: 'Route 53がヘルスチェックを参照していません。' },
    { id: 'failover-path', type: 'path-exists', path: ['users', 'route53', 'app-standby'], label: '障害時にStandbyへ切り替わる', failureMessage: 'Primary障害時に利用者をRoute 53経由でStandbyアプリへ向ける経路がありません。' },
    { id: 'normal-path', type: 'path-exists', path: ['users', 'route53', 'app-primary'], label: '平常時はPrimaryへ向く', failureMessage: '平常時に利用者をPrimaryへ向ける経路がありません。' },
  ],
  actions: [
    { id: 'replicate-data', title: 'データを別リージョンへ複製する', description: 'Aurora GlobalとS3 CRRでStandbyリージョンへ複製する。', checkIds: ['has-db-standby', 'has-s3-standby', 'db-replication', 's3-replication'], successMessage: 'DBとオブジェクトをStandbyリージョンへ継続複製できます（RPOを小さく保てます）。', failureMessage: 'データ複製の確認に失敗しました。' },
    { id: 'prepare-standby', title: '待機系を用意する', description: 'Standbyリージョンの縮小アプリを複製DBへ接続する。', checkIds: ['has-app-standby', 'standby-db-link'], successMessage: 'Warm Standbyの待機系が複製DBへ接続済みで、昇格に備えられます。', failureMessage: '待機系の確認に失敗しました。' },
    { id: 'detect', title: 'Primaryの健全性を監視する', description: 'Route 53ヘルスチェックでPrimaryを監視する。', checkIds: ['has-healthcheck', 'r53-uses-hc', 'hc-monitors', 'normal-path'], successMessage: '平常時はPrimaryへ向け、ヘルスチェックで障害を検知できます。', failureMessage: '監視構成の確認に失敗しました。' },
    { id: 'failover', title: 'リージョン障害でStandbyへ切り替える', description: 'フェイルオーバーで利用者をStandbyへ向ける。', checkIds: ['failover-path'], successMessage: 'Primary障害時、Route 53のフェイルオーバーで利用者をStandbyリージョンへ切り替えられます。', failureMessage: 'フェイルオーバー経路の確認に失敗しました。' },
  ],
  answerDiagram,
  answerTrace: [
    { id: 'base', title: 'Primaryリージョンが稼働中', description: 'Tokyoで利用者→Route 53→アプリ→Auroraが動いています。ここにDRを足します。', visibleNodeIds: ['users', 'route53', 'app-primary', 'db-primary', 's3-primary'], visibleConnectionIds: ['users-to-r53', 'r53-to-primary', 'primary-app-to-db'], activeNodeIds: ['app-primary', 'db-primary'], activeConnectionIds: ['r53-to-primary', 'primary-app-to-db'] },
    { id: 'replicate', title: 'データを別リージョンへ複製する', description: 'Aurora Global DatabaseでDBを、S3 CRRでオブジェクトをOsakaへ継続複製します。複製は非同期のため、その遅延分がRPOになります。', visibleNodeIds: ['users', 'route53', 'app-primary', 'db-primary', 's3-primary', 'db-standby', 's3-standby'], visibleConnectionIds: ['users-to-r53', 'r53-to-primary', 'primary-app-to-db', 'db-replicate', 's3-replicate'], activeNodeIds: ['db-primary', 'db-standby', 's3-primary', 's3-standby'], activeConnectionIds: ['db-replicate', 's3-replicate'] },
    { id: 'standby', title: '待機系とヘルスチェックを用意する', description: 'Osakaに縮小構成のアプリを置いて複製DBへ繋ぎ、Route 53ヘルスチェックでPrimaryを監視します。', visibleNodeIds: ['users', 'route53', 'healthcheck', 'app-primary', 'db-primary', 's3-primary', 'app-standby', 'db-standby', 's3-standby'], visibleConnectionIds: ['users-to-r53', 'r53-to-primary', 'primary-app-to-db', 'db-replicate', 's3-replicate', 'standby-app-to-db', 'r53-to-hc', 'hc-to-primary'], activeNodeIds: ['app-standby', 'db-standby', 'healthcheck'], activeConnectionIds: ['standby-app-to-db', 'r53-to-hc', 'hc-to-primary'] },
    { id: 'failover', title: 'フェイルオーバーで切り替える', description: 'Primaryが不健全になると、Route 53はsecondaryレコードへ切り替え、利用者をOsakaのStandbyへ向けます。Warm Standbyをスケールアップして受けます。', visibleNodeIds: ['users', 'route53', 'healthcheck', 'app-primary', 'db-primary', 's3-primary', 'app-standby', 'db-standby', 's3-standby'], visibleConnectionIds: ['users-to-r53', 'r53-to-primary', 'primary-app-to-db', 'db-replicate', 's3-replicate', 'standby-app-to-db', 'r53-to-hc', 'hc-to-primary', 'r53-to-standby'], activeNodeIds: ['users', 'route53', 'app-standby', 'db-standby'], activeConnectionIds: ['r53-to-standby', 'standby-app-to-db'] },
  ],
};

export default challenge;
