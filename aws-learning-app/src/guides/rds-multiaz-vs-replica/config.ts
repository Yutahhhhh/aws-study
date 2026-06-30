import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'rds-multiaz-vs-replica',
  title: 'RDS Multi-AZ と Read Replica',
  description: '高可用性(Multi-AZ)と読み取り負荷分散(Read Replica)の違いを、比較で正しく理解する',
  headerLabel: 'AWS RDS',
  homeIcon: 'Database',
  homeColor: 'amber',
  intro:
    '「Multi-AZにすれば読み取りも速くなる」——これは典型的な誤解です。Multi-AZとRead Replicaは<strong>目的が違う別の仕組み</strong>です。この章でその違いをはっきりさせます。',
  sections: [
    {
      id: 'placement',
      title: 'RDSはどこに置き、誰が接続するか',
      icon: 'Database',
      blocks: [
        {
          type: 'flow',
          title: 'DBへ接続するのはECS。利用者は直接触れない',
          steps: [
            { label: '利用者', accent: 'slate' },
            { label: 'CloudFront / ALB', accent: 'amber' },
            { label: 'ECS', accent: 'emerald' },
            { label: 'RDS :5432', accent: 'sky' },
          ],
        },
        {
          type: 'paragraph',
          html:
            'RDSはPrivate Subnetに置き(<code>publicly_accessible = false</code>)、SGで<strong>ECSのSGからの5432番だけ</strong>を許可します。利用者や外部がDBへ直接アクセスする必要がないため、攻撃面を最小化します。',
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'DB subnet group',
          html: 'RDSは DB subnet group で「配置できるSubnet群」を指定します。VPC内に置くには<strong>少なくとも2つの異なるAZのSubnet</strong>が必要です(Multi-AZにしない場合でも要件)。',
        },
      ],
    },
    {
      id: 'multi-az',
      title: 'Multi-AZ（高可用性）',
      icon: 'Network',
      blocks: [
        {
          type: 'flow',
          steps: [
            { label: 'Primary (AZ-a)', sublabel: '読み書き', accent: 'sky' },
            { label: '同期レプリケーション', accent: 'slate' },
            { label: 'Standby (AZ-c)', sublabel: '通常は読めない', accent: 'slate' },
          ],
        },
        {
          type: 'steps',
          steps: [
            { title: 'アプリは単一エンドポイントに接続', html: '普段その向き先はPrimary。', accent: 'sky' },
            { title: 'Primary障害を検知', html: 'RDSがStandbyをPrimaryへ昇格。', accent: 'amber' },
            { title: 'エンドポイントの向き先を切替(failover)', html: '同じエンドポイントを使い続けられる。', accent: 'emerald' },
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'failoverは瞬断ゼロではない',
          html: 'failover中は一時的に接続が切れます。<strong>アプリ側に再接続(リトライ)処理が必要</strong>です。「failoverすればアプリは何もしなくてよい」は誤解です。',
        },
        {
          type: 'callout',
          variant: 'info',
          title: '補足: Multi-AZ DB cluster',
          html: '別形態として「Multi-AZ DB cluster」(1 writer + 2 reader)があり、readerを読み取りに使えます。対応エンジン/バージョンに制約があるため、まずは「Multi-AZ instance = 高可用性、standbyは読めない」を基準に理解してください。',
        },
      ],
    },
    {
      id: 'read-replica',
      title: 'Read Replica（読み取り負荷分散）',
      icon: 'Boxes',
      blocks: [
        {
          type: 'flow',
          steps: [
            { label: 'Primary', sublabel: '読み書き', accent: 'sky' },
            { label: '非同期レプリケーション', accent: 'slate' },
            { label: 'Read Replica', sublabel: '読み取り専用 / 別エンドポイント', accent: 'emerald' },
          ],
        },
        {
          type: 'list',
          items: [
            '別のエンドポイントを持ち、「書き込みはPrimary、重い読み取りはReplica」と振り分ける',
            '<strong>非同期</strong>のためレプリケーション遅延があり得る(最新の書き込みが即反映されないことがある)',
            '主目的は負荷分散で、自動failoverの仕組みとは異なる',
          ],
        },
      ],
    },
    {
      id: 'comparison',
      title: '違いの早見表',
      icon: 'Layers',
      blocks: [
        {
          type: 'table',
          headers: ['観点', 'Multi-AZ (instance)', 'Read Replica'],
          rows: [
            ['主目的', '高可用性・障害時failover', '読み取り負荷分散'],
            ['standby/replicaを読むか', '読まない', '読む'],
            ['エンドポイント', '同じ(failoverで向き先が変わる)', '別エンドポイント'],
            ['レプリケーション', '同期', '非同期(遅延あり)'],
            ['自動failover', 'あり', '(単体では)目的外'],
          ],
        },
        {
          type: 'callout',
          variant: 'danger',
          title: 'よくある誤解',
          html: '「Multi-AZにすれば読み取り性能も自動で上がる」は<strong>誤り</strong>です。standbyは読めません。読み取りを分散したいならRead Replicaです。両方を組み合わせることもできます。',
        },
      ],
    },
    {
      id: 'secrets',
      title: '接続情報（パスワード）の扱い',
      icon: 'KeyRound',
      blocks: [
        {
          type: 'paragraph',
          html:
            '本番では、DBパスワードをTerraformコードやGitに直接書きません。Secrets ManagerやSSM Parameter Storeに置き、ECS Task Definitionの <code>secrets</code> で起動時に注入します。',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'manage_master_user_password',
          html: 'RDSの <code>manage_master_user_password = true</code> を使うと、masterパスワードをSecrets Managerに自動生成・管理させ、tfに平文を残さずに済みます。そのシークレットのARNを <code>secrets</code> から参照すれば、一度も平文を扱いません。',
        },
      ],
    },
  ],
  checkpoints: [
    'RDSをPublic Subnetに置かない理由を説明できるか',
    'DB subnet group が何を指定し、なぜ複数AZが必要か説明できるか',
    'Multi-AZ と Read Replica の違い(目的・読めるか・エンドポイント・遅延)を説明できるか',
    'failover時にアプリ側で必要な対応を説明できるか',
    'DBパスワードをtfに平文で持たない方法を説明できるか',
  ],
  references: [
    { label: 'Multi-AZ DB instance deployments', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html' },
    { label: 'Multi-AZ DB cluster deployments', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZDBClusters.html' },
    { label: 'Working with read replicas', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html' },
    { label: 'Password management with RDS and Secrets Manager', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-secrets-manager.html' },
  ],
};

export default config;
