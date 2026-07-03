import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'webapp-launch-checklist',
  title: 'Webアプリ本番リリース前チェックリスト',
  description: 'セキュリティ・可用性・監視・バックアップ・コスト・当日の手順まで、リリース前に確認する項目を領域別に整理する',
  headerLabel: 'AWS LAUNCH CHECKLIST',
  homeIcon: 'ClipboardCheck',
  homeColor: 'amber',
  intro:
    'リリース直後に起きる事故の多くは、技術的に難しい問題ではなく「<strong>確認すれば気づけた設定漏れ</strong>」です。このガイドは、本番公開の前日までに一巡すべき確認項目を領域別のチェックリストとして整理したものです。自分のプロジェクトに合わせて取捨選択してください。',
  sections: [
    {
      id: 'security',
      title: 'セキュリティ: 公開範囲と権限',
      icon: 'ShieldCheck',
      blocks: [
        {
          type: 'list',
          items: [
            '<strong>Security Groupに0.0.0.0/0で開いているポートはALB/NLBの80/443だけか</strong>(SSH/DBポートの全開放が残っていないか)',
            'RDS/ElastiCacheはPrivate Subnetにあり、Publicly Accessibleがオフか',
            'S3バケットのBlock Public Accessが有効か(公開配信はCloudFront+OAC経由になっているか)',
            'IAMユーザーの長期アクセスキーが残っていないか(CIはOIDC、人はSSOに寄せる)',
            '秘密情報(DBパスワード、APIキー)がコード・イメージ・タスク定義の平文envに無いか',
            'WAFを入口(CloudFront/ALB)に適用したか(最低限マネージドルール)',
            '管理画面や内部APIに認証が掛かっているか(「URLを知らなければ大丈夫」は事故のもと)',
          ],
        },
        {
          type: 'callout',
          variant: 'danger',
          title: '公開初日から攻撃は来る',
          html: '公開したドメインには<strong>数時間以内</strong>に脆弱性スキャンのボットが来ます。/wp-admin、/.env、/.git へのアクセスがログに並ぶのは正常な世界です。慌てないためにも、上記の「開いている場所の棚卸し」を先に済ませます。',
        },
      ],
    },
    {
      id: 'availability',
      title: '可用性: 落ちない・落ちても戻る',
      icon: 'Network',
      blocks: [
        {
          type: 'list',
          items: [
            'ECS/ALBは<strong>2AZ以上</strong>に分散しているか。RDSはMulti-AZか(少なくとも判断した記録があるか)',
            'ヘルスチェックは「DBに接続できる」など実質的な内容を返しているか',
            'ECS ServiceのDesired Countは2以上か(1だとデプロイ・障害のたびに断が出る)',
            'Auto Scalingのポリシーと上限を設定したか(上限なしはコスト事故、下限1は可用性事故)',
            'ECSのDeployment Circuit Breaker+ロールバックが有効か',
            'RDS・ECSの<strong>削除保護</strong>を有効にしたか',
            'Service Quotas(ENI数、vCPU上限など)がスケール想定に足りるか',
          ],
        },
        {
          type: 'flow',
          title: '「戻れる」ことの確認',
          steps: [
            { label: '直前バージョンのイメージ', sublabel: 'ECRに残っている', accent: 'blue' },
            { label: 'ロールバック手順', sublabel: '文書化+一度試した', accent: 'amber' },
            { label: 'DBマイグレーション', sublabel: '後方互換 or 戻し方がある', accent: 'rose' },
          ],
        },
      ],
    },
    {
      id: 'observability',
      title: '監視: 気づける状態を作る',
      icon: 'Activity',
      blocks: [
        {
          type: 'list',
          items: [
            'ALBの<strong>5xx率</strong>・ターゲット応答時間、ECSのCPU/メモリ、RDSのCPU/接続数/ストレージにアラームがあるか',
            'アラームの通知先(SNS→Slack/メール/オンコール)は<strong>実際に届くことを試したか</strong>',
            'アプリログがCloudWatch Logsに出ており、ERRORで検索できるか(構造化ログが理想)',
            'ログの保持期間を設定したか(無期限は課金が積み上がる)',
            '外形監視(合成監視)があるか: 「ユーザーとして開けるか」を外から定期確認する',
            'リリース直後に見るダッシュボード(5xx・レイテンシ・タスク数・DB接続数)を1枚に用意したか',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'アラームは「対応する人と行動」までがセット',
          html: '「CPU 80%でアラーム」を作っても、<strong>誰が何をするのか</strong>が決まっていなければノイズです。アラームごとに「受け取る人」「見るダッシュボード」「最初の一手」をメモした一覧(Runbookの種)を作っておくと、リリース後の夜間対応が別物になります。',
        },
      ],
    },
    {
      id: 'backup',
      title: 'バックアップ: 消えても戻せる',
      icon: 'DatabaseBackup',
      blocks: [
        {
          type: 'list',
          items: [
            'RDSの自動バックアップが有効で、保持期間(例: 7〜35日)を設定したか',
            'リリース直前に<strong>手動スナップショット</strong>を取る手順が当日のフローに入っているか',
            'S3のバージョニングを重要バケットで有効にしたか',
            '<strong>リストア手順を一度実際に試したか</strong>(バックアップの存在とリストアできることは別問題)',
            'RTO/RPO(どれだけ止まってよいか・どこまでデータを失ってよいか)を言語化したか',
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'バックアップの99%はリストアで失敗する',
          html: '「スナップショットはあるが、復元したらパラメータグループとSGが付いておらず繋がらない」「復元に3時間かかると初めて知った」——リストア訓練をしていないバックアップは、障害当日に必ず何かが起きます。<strong>stgで一度、スナップショットからの復元→アプリ接続まで通してください</strong>。',
        },
      ],
    },
    {
      id: 'performance-cost',
      title: '性能とコスト',
      icon: 'Gauge',
      blocks: [
        {
          type: 'list',
          items: [
            '想定ピークの負荷試験をstgで行ったか(同時接続数、RPSの根拠を持つ)',
            'DBに<strong>本番相当のデータ量</strong>を入れてスロークエリを確認したか(1万行と1000万行では別世界)',
            'CloudFrontのキャッシュヒット率を確認したか(静的アセットがMISSし続けていないか)',
            'AWS Budgetsで予算アラート(予想額の120%など)を設定したか',
            'コスト配分タグ(環境・サービス別)を付けたか',
            'NAT Gateway・ログ・データ転送など「気づきにくい従量課金」の見積もりをしたか',
          ],
        },
      ],
    },
    {
      id: 'launch-day',
      title: 'リリース当日の進め方',
      icon: 'Rocket',
      blocks: [
        {
          type: 'steps',
          steps: [
            { title: '静かな時間帯を選ぶ', html: 'トラフィックが少なく、<strong>問題が起きても対応できる人が揃っている</strong>時間帯(週末や深夜のワンオペは避ける)。', accent: 'blue' },
            { title: '直前スナップショットを取る', html: 'DBの手動スナップショット+現行イメージのタグを記録。「戻る先」を確定させる。', accent: 'blue' },
            { title: '段階的に公開する', html: '可能なら社内→限定ユーザー→全体の順。DNSのTTLは事前に短くしておく。', accent: 'amber' },
            { title: 'ダッシュボードを見ながら待つ', html: '5xx率・レイテンシ・DB接続数を30分〜1時間観察。<strong>「何もなければ何もしない」</strong>。', accent: 'amber' },
            { title: 'ロールバック判断基準を先に決める', html: '「5xxが5%を超えて10分続いたら戻す」のように、<strong>判断基準を事前に文章化</strong>。当日の議論は判断を遅らせる。', accent: 'rose' },
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'チェックリストは育てるもの',
          html: 'このリストは出発点です。リリース後に起きたヒヤリハットを<strong>自分たちのチェックリストに追記していく</strong>ことで、チーム固有の事故パターンを塞ぐ資産になります。',
        },
      ],
    },
  ],
  checkpoints: [
    'リリース前にSecurity Group・S3公開設定・IAMキーの何を確認すべきか挙げられる',
    '「バックアップがある」と「リストアできる」の違いを説明できる',
    'リリース当日に見るべきメトリクスと、ロールバック判断基準を事前に決める理由を説明できる',
    'Desired Count=1やアラーム未設定など、初回リリースにありがちな穴を指摘できる',
  ],
  references: [
    { label: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { label: 'Operational Readiness Reviews (ORR)', url: 'https://docs.aws.amazon.com/wellarchitected/latest/operational-readiness-reviews/wa-operational-readiness-reviews.html' },
  ],
};

export default config;
