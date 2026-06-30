import type { ChallengeConfig, ChallengeManifest } from '../types/challenge';

const challengeLoaders: Record<string, () => Promise<{ default: ChallengeConfig }>> = {
  'prod-web-app': () => import('./prod-web-app/config'),
  'scalable-web-app': () => import('./scalable-web-app/config'),
  'image-upload-app': () => import('./image-upload-app/config'),
  'media-site': () => import('./media-site/config'),
  'member-saas-app': () => import('./member-saas-app/config'),
  'operated-web-app': () => import('./operated-web-app/config'),
  'ecommerce-app': () => import('./ecommerce-app/config'),
  'document-search-app': () => import('./document-search-app/config'),
  'internal-admin-app': () => import('./internal-admin-app/config'),
  'data-layer-app': () => import('./data-layer-app/config'),
  'advanced-network-app': () => import('./advanced-network-app/config'),
  'multi-region-dr-app': () => import('./multi-region-dr-app/config'),
};

export const challengeManifest: ChallengeManifest[] = [
  {
    slug: 'prod-web-app',
    title: '本番Webアプリ構成を設計する',
    description: '要件を読み、静的配信・API・DB・デプロイが成立するAWS構成を作る',
    icon: 'PenTool',
    color: 'blue',
    badge: '設計演習',
    path: '/challenges/prod-web-app',
  },
  {
    slug: 'scalable-web-app',
    title: 'スケーラブルWebアプリを設計する',
    description: 'Multi-AZで冗長化し、Auto Scalingで負荷追従する構成を要件から作る',
    icon: 'Gauge',
    color: 'blue',
    badge: '設計演習',
    path: '/challenges/scalable-web-app',
  },
  {
    slug: 'image-upload-app',
    title: '画像投稿アプリを設計する',
    description: '画像保存、非同期サムネイル生成、失敗退避、処理ログまで含む投稿アプリを作る',
    icon: 'Images',
    color: 'rose',
    badge: '設計演習',
    path: '/challenges/image-upload-app',
  },
  {
    slug: 'media-site',
    title: '記事メディアサイトを設計する',
    description: '検索クローラーと読者に公開できる記事配信、SEOファイル、OGP生成を含む構成を作る',
    icon: 'Newspaper',
    color: 'amber',
    badge: '設計演習',
    path: '/challenges/media-site',
  },
  {
    slug: 'member-saas-app',
    title: '会員制SaaSアプリを設計する',
    description: 'ログイン、入口保護、Private API/DB、秘密情報、監査ログを含むSaaS構成を作る',
    icon: 'LockKeyhole',
    color: 'rose',
    badge: '設計演習',
    path: '/challenges/member-saas-app',
  },
  {
    slug: 'operated-web-app',
    title: '本番運用するWebアプリを設計する',
    description: '稼働中のWebアプリにログ、メトリクス、アラーム、通知、ダッシュボードを組み込む',
    icon: 'Activity',
    color: 'rose',
    badge: '設計演習',
    path: '/challenges/operated-web-app',
  },
  {
    slug: 'ecommerce-app',
    title: 'ECサイトを設計する',
    description: '商品閲覧、購入API、決済、注文イベント、在庫更新、通知まで含むECサイトを作る',
    icon: 'ShoppingCart',
    color: 'amber',
    badge: '設計演習',
    path: '/challenges/ecommerce-app',
  },
  {
    slug: 'document-search-app',
    title: 'ドキュメント検索アプリを設計する',
    description: '社内文書の取り込み、ベクトル検索、根拠付き回答、ログまで含む検索アプリを作る',
    icon: 'Search',
    color: 'amber',
    badge: '設計演習',
    path: '/challenges/document-search-app',
  },
  {
    slug: 'internal-admin-app',
    title: '社内管理アプリを設計する',
    description: 'SSM経由でPrivate Subnet内の管理用EC2とRDSへ安全に接続する運用構成を作る',
    icon: 'Laptop',
    color: 'blue',
    badge: '設計演習',
    path: '/challenges/internal-admin-app',
  },
  {
    slug: 'data-layer-app',
    title: 'データ層を設計する',
    description: '接続枯渇を防ぐRDS Proxyと、読み取りを受けるElastiCacheで、スケールに強いデータ層を作る',
    icon: 'Database',
    color: 'amber',
    badge: '設計演習',
    path: '/challenges/data-layer-app',
  },
  {
    slug: 'advanced-network-app',
    title: 'NATを使わずVPC Endpointで閉じる',
    description: 'Private SubnetのegressをInterface/Gateway Endpointだけで成立させ、NATを排した閉域構成を作る',
    icon: 'Cable',
    color: 'blue',
    badge: '設計演習',
    path: '/challenges/advanced-network-app',
  },
  {
    slug: 'multi-region-dr-app',
    title: 'マルチリージョンDRを設計する',
    description: 'データ複製・Warm Standby・Route 53フェイルオーバーでリージョン障害に備える構成を作る',
    icon: 'Globe',
    color: 'amber',
    badge: '設計演習',
    path: '/challenges/multi-region-dr-app',
  },
];

export async function loadChallengeConfig(slug: string): Promise<ChallengeConfig> {
  const loader = challengeLoaders[slug];
  if (!loader) throw new Error(`Unknown challenge: ${slug}`);
  const module = await loader();
  return module.default;
}
