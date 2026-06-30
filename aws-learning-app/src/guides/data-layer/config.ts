import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'data-layer',
  title: 'データ層の選び方',
  description: 'RDS / Aurora / RDS Proxy / DynamoDB / ElastiCache。アクセスパターンから正しいデータストアを選ぶ',
  headerLabel: 'AWS DATA LAYER',
  homeIcon: 'Database',
  homeColor: 'amber',
  intro:
    '「とりあえずRDS」で進めると、接続数の枯渇やスケール限界に後でぶつかります。データ層は<strong>アクセスパターン(読み書きの形・量・整合性要件)から逆算</strong>して選びます。ここでは代表的な選択肢の役割を整理します。',
  sections: [
    {
      id: 'rds-aurora',
      title: 'RDS と Aurora（リレーショナル）',
      icon: 'Database',
      blocks: [
        {
          type: 'compare',
          columns: [
            {
              title: 'RDS (標準エンジン)',
              subtitle: 'PostgreSQL/MySQL等',
              accent: 'sky',
              points: ['素直なマネージドDB', 'Multi-AZで高可用、Read Replicaで読み分散', '小〜中規模に十分'],
            },
            {
              title: 'Aurora',
              subtitle: 'AWS製互換エンジン',
              accent: 'amber',
              points: [
                'ストレージが3AZ×2=6多重で自動拡張',
                '最大15のリーダー、高速なfailover',
                'Serverless v2で自動キャパシティ／Global Databaseで跨リージョン',
              ],
            },
          ],
        },
        {
          type: 'paragraph',
          html:
            '可用性・読み取りスケール・運用の手間で優位なのがAurora。コストや要件が軽ければ標準RDSで十分です。Multi-AZとRead Replicaの違いは<span class="font-bold">RDS Multi-AZ と Read Replica</span>ガイドで詳説しています。',
        },
      ],
    },
    {
      id: 'rds-proxy',
      title: 'RDS Proxy（コネクションプール）',
      icon: 'Cable',
      blocks: [
        {
          type: 'callout',
          variant: 'warn',
          title: 'なぜ要るのか：接続数の枯渇',
          html: 'FargateのTaskやLambdaが<strong>急増すると、それぞれがDBへ接続を張り</strong>、RDSの<code>max_connections</code>を食い潰します。スケールアウトしたのにDBが受けられず落ちる、という典型的な事故です。',
        },
        {
          type: 'flow',
          steps: [
            { label: '多数のTask/Lambda', accent: 'emerald' },
            { label: 'RDS Proxy', sublabel: '接続をプール/再利用', accent: 'blue' },
            { label: 'RDS/Aurora', sublabel: '少数の物理接続', accent: 'sky' },
          ],
        },
        {
          type: 'list',
          items: [
            'アプリ側の大量の接続を<strong>少数の実接続に集約</strong>して再利用する',
            'failover時の<strong>接続の張り替えを肩代わり</strong>し、切断を緩和',
            '認証はSecrets Manager連携にでき、IAM認証も使える',
          ],
        },
      ],
    },
    {
      id: 'dynamodb',
      title: 'DynamoDB（サーバーレスNoSQL）',
      icon: 'Boxes',
      blocks: [
        {
          type: 'paragraph',
          html:
            'キーで引く・超高スループット・運用レス・水平スケールが要るならDynamoDB。ただし<strong>設計思想がRDBと逆</strong>です。「正規化してJOIN」ではなく、<strong>アクセスパターンを先に決め、それに合うキー設計</strong>をします。',
        },
        {
          type: 'list',
          items: [
            '<strong>パーティションキー(PK)</strong>でデータを分散。<strong>ソートキー(SK)</strong>で範囲・並び替え',
            '別の引き方が要るなら<strong>GSI(グローバルセカンダリインデックス)</strong>を足す',
            '<strong>シングルテーブル設計</strong>：複数エンティティを1テーブルに同居させ、1リクエストで関連データを取る',
            'キャパシティは<strong>オンデマンド</strong>(変動に強い)か<strong>プロビジョンド</strong>(予測可能で安い)を選ぶ',
          ],
        },
        {
          type: 'callout',
          variant: 'danger',
          title: 'ホットパーティションに注意',
          html: 'PKが偏ると特定パーティションへ集中し(<strong>ホットパーティション</strong>)スロットリングします。キーは<strong>カーディナリティが高く分散する</strong>ように設計します。「あとからキー設計を直す」のは非常に高コストです。',
        },
      ],
    },
    {
      id: 'elasticache',
      title: 'ElastiCache（キャッシュ）',
      icon: 'Zap',
      blocks: [
        {
          type: 'paragraph',
          html:
            '同じ読み取りが繰り返されるなら、DBの手前に<strong>Redis/Memcached(ElastiCache)</strong>を置いて応答を高速化し、DB負荷を下げます。最も一般的なのは<strong>キャッシュアサイド(lazy loading)</strong>です。',
        },
        {
          type: 'steps',
          steps: [
            { title: 'まずキャッシュを見る', html: 'ヒットすればそれを返す（DBに行かない）。', accent: 'emerald' },
            { title: 'ミスならDBから取得', html: '取得結果を<strong>TTL付き</strong>でキャッシュに入れる。', accent: 'amber' },
            { title: '更新時はキャッシュを無効化', html: '古い値を返さないよう削除/更新する。', accent: 'rose' },
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'キャッシュ特有の罠',
          html: 'TTL一斉切れで負荷が殺到する<strong>thundering herd</strong>、更新漏れによる<strong>stale data</strong>、存在しないキーを叩き続ける<strong>cache penetration</strong>。TTLのばらつき・無効化戦略・ネガティブキャッシュで対処します。',
        },
      ],
    },
    {
      id: 'cheatsheet',
      title: '選択早見表',
      icon: 'Layers',
      blocks: [
        {
          type: 'table',
          headers: ['要件', '第一候補'],
          rows: [
            ['トランザクション・JOIN・既存SQL資産', 'RDS / Aurora'],
            ['Fargate/Lambdaが急増し接続が枯渇', 'RDS Proxy を前段に'],
            ['キー引き中心・超高スループット・運用レス', 'DynamoDB'],
            ['読み取りが重い・同じ結果の繰り返し', 'ElastiCache を手前に'],
            ['読み取り負荷分散(SQLのまま)', 'Read Replica / Aurora リーダー'],
            ['跨リージョンの低遅延読み取り', 'Aurora Global / DynamoDB Global Tables'],
          ],
        },
      ],
    },
  ],
  checkpoints: [
    'RDS と Aurora の差(ストレージ/可用性/スケール)を説明できるか',
    'RDS Proxyが解決する「接続枯渇」がなぜ起きるか説明できるか',
    'DynamoDBで「アクセスパターン先行」設計をする理由を説明できるか',
    'ホットパーティションを避けるキー設計の考え方を説明できるか',
    'キャッシュアサイドの流れと代表的な罠を説明できるか',
  ],
  references: [
    { label: 'Amazon Aurora', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_AuroraOverview.html' },
    { label: 'Amazon RDS Proxy', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.html' },
    { label: 'DynamoDB best practices (key design)', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html' },
    { label: 'Caching strategies (ElastiCache)', url: 'https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Strategies.html' },
  ],
};

export default config;
