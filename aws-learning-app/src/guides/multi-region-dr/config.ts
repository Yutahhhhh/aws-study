import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'multi-region-dr',
  title: 'マルチリージョンと DR',
  description: 'RTO/RPO から考える4つのDR戦略と、データ複製・Route 53フェイルオーバーの組み立て',
  headerLabel: 'AWS MULTI-REGION / DR',
  homeIcon: 'Globe',
  homeColor: 'amber',
  intro:
    'Multi-AZはAZ障害に強いですが、<strong>リージョン全体の障害や広域災害</strong>には別の備えが要ります。DR(災害復旧)は「いくらかけて、どれだけ早く・どれだけ失わずに復旧したいか」という<strong>RTO/RPOからの逆算</strong>で設計します。',
  sections: [
    {
      id: 'rto-rpo',
      title: 'まず RTO と RPO を決める',
      icon: 'Timer',
      blocks: [
        {
          type: 'compare',
          columns: [
            {
              title: 'RTO',
              subtitle: '復旧までの時間',
              accent: 'blue',
              points: ['Recovery Time Objective', '「何分/何時間で復旧するか」', 'ダウンタイムの許容量'],
            },
            {
              title: 'RPO',
              subtitle: '失ってよいデータ量',
              accent: 'rose',
              points: ['Recovery Point Objective', '「何分前までのデータを守るか」', 'データ損失の許容量'],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          html: 'RTO/RPOを<strong>ゼロに近づけるほどコストは跳ね上がります</strong>。全システム一律ではなく、業務の重要度ごとに目標を分けるのが現実的です。',
        },
      ],
    },
    {
      id: 'four-strategies',
      title: '4つのDR戦略（コストと速さのトレードオフ）',
      icon: 'Layers',
      blocks: [
        {
          type: 'steps',
          steps: [
            { title: 'Backup & Restore', html: '別リージョンにバックアップだけ。障害時に構築・復元。<strong>最安・最遅</strong>(RTO時間〜)。', accent: 'slate' },
            { title: 'Pilot Light', html: 'DBだけ複製し最小構成を待機。障害時にアプリ層を起動・拡大。', accent: 'blue' },
            { title: 'Warm Standby', html: '縮小版を常時稼働。障害時にスケールアップして引き受ける。', accent: 'amber' },
            { title: 'Active-Active (Multi-site)', html: '両リージョンで常時稼働し負荷分散。<strong>最速・最高コスト</strong>(RTO≒0)。', accent: 'emerald' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          html: '下に行くほど待機リソースが増え、RTO/RPOは短くなります。「重要システムはWarm Standby、それ以外はBackup&Restore」のように<strong>段階を使い分け</strong>ます。',
        },
      ],
    },
    {
      id: 'data-replication',
      title: 'データをどう複製するか',
      icon: 'Database',
      blocks: [
        {
          type: 'table',
          headers: ['データ', '複製手段', '備考'],
          rows: [
            ['Aurora', 'Aurora Global Database', '跨リージョンの低遅延レプリカ・高速昇格'],
            ['RDS', 'クロスリージョンRead Replica / スナップショットコピー', 'リードレプリカを昇格'],
            ['DynamoDB', 'Global Tables', 'マルチリージョン書き込み(最終的整合)'],
            ['S3', 'クロスリージョンレプリケーション(CRR)', 'オブジェクトを別リージョンへ複製'],
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: '非同期複製にはRPOが伴う',
          html: '跨リージョン複製の多くは<strong>非同期</strong>です。複製が追いつく前に元リージョンが落ちると、その差分は失われます。これが<strong>RPO</strong>の正体です。整合性要件が厳しいデータほど慎重に。',
        },
      ],
    },
    {
      id: 'routing',
      title: 'Route 53 で向き先を切り替える',
      icon: 'Globe',
      blocks: [
        {
          type: 'flow',
          steps: [
            { label: '利用者', accent: 'slate' },
            { label: 'Route 53', sublabel: 'ヘルスチェック+failover', accent: 'amber' },
            { label: 'Primaryリージョン', sublabel: '正常時', accent: 'emerald' },
            { label: 'Secondaryリージョン', sublabel: '障害時に昇格', accent: 'blue' },
          ],
        },
        {
          type: 'list',
          items: [
            '<strong>フェイルオーバールーティング</strong>：ヘルスチェックでPrimary不調を検知し、Secondaryへ向ける',
            '<strong>レイテンシ/位置情報ルーティング</strong>：Active-Activeで最寄りリージョンへ振り分ける',
            'DNSの<strong>TTL</strong>分は切替が反映されない点に注意(クライアントキャッシュ)',
          ],
        },
        {
          type: 'callout',
          variant: 'danger',
          title: '「作ったが切り替わらない」を防ぐ',
          html: 'DRは<strong>定期的に切替訓練(ゲームデー)</strong>をしないと、いざという時に動きません。手順・権限・データ昇格・DNS切替を実際に回して確かめます。構成があることと復旧できることは別です。',
        },
      ],
    },
  ],
  checkpoints: [
    'RTO と RPO の違いを説明できるか',
    '4つのDR戦略をコスト/復旧速度の順で説明できるか',
    'Aurora Global / DynamoDB Global Tables / S3 CRR の役割を説明できるか',
    '非同期複製がRPOを生む理由を説明できるか',
    'Route 53 フェイルオーバーとDNS TTLの注意点を説明できるか',
    'DR訓練(ゲームデー)が必要な理由を説明できるか',
  ],
  references: [
    { label: 'Disaster recovery options in the cloud', url: 'https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html' },
    { label: 'Amazon Aurora Global Database', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html' },
    { label: 'DynamoDB global tables', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html' },
    { label: 'Route 53 failover routing', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html' },
  ],
};

export default config;
