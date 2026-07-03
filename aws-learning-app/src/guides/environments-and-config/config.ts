import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'environments-and-config',
  title: '環境分離 (dev/stg/prod) と設定管理',
  description: 'dev/stg/prodの分け方、アカウント分離、Parameter Store/Secrets Managerによる設定・秘密情報の管理を整理する',
  headerLabel: 'AWS ENVIRONMENTS',
  homeIcon: 'Layers',
  homeColor: 'rose',
  intro:
    '「stgでは動いたのに本番で落ちた」「検証のつもりで本番のDBを消した」——環境まわりの事故は、技術力ではなく<strong>環境の分け方と設定の置き場所</strong>で決まります。このガイドでは、dev/stg/prodをどう分離し、環境ごとの設定と秘密情報をどこに置くかを整理します。',
  sections: [
    {
      id: 'why-separate',
      title: 'なぜ環境を分けるのか',
      icon: 'Layers',
      blocks: [
        {
          type: 'paragraph',
          html: '環境分離の目的は「<strong>本番を壊さずに変更を試す場所</strong>を作ること」と「<strong>本番データ・本番権限に触れる人と経路を絞ること</strong>」の2つです。',
        },
        {
          type: 'table',
          headers: ['環境', '目的', 'データ', '典型的な構成差'],
          rows: [
            ['<strong>dev</strong>', '開発中の動作確認。壊れてよい', 'ダミーデータ', 'シングルAZ、小さいインスタンス、夜間停止'],
            ['<strong>stg</strong>', 'リリース前の最終確認。本番の相似形', '本番相当(マスキング済み)', '<strong>本番と同じ構成</strong>を縮小したもの'],
            ['<strong>prod</strong>', '実ユーザーへの提供', '実データ', 'Multi-AZ、Auto Scaling、アラーム完備'],
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'stgは「本番と同じ作り方」であることに価値がある',
          html: 'stgの目的はリリース前検証なので、<strong>構成が本番と違ったら検証になりません</strong>。同じTerraform/IaCから変数だけ変えて作るのが原則です。「stgだけ手作業で作った」環境は、検証をすり抜ける差分の温床になります。',
        },
      ],
    },
    {
      id: 'account-strategy',
      title: 'アカウント分離戦略',
      icon: 'Building2',
      blocks: [
        {
          type: 'paragraph',
          html: '環境を分ける単位は大きく「同一アカウント内で分ける」「環境ごとにAWSアカウントを分ける」の2択です。現在のAWSのベストプラクティスは<strong>アカウント分離</strong>です。',
        },
        {
          type: 'compare',
          columns: [
            {
              title: '環境ごとにアカウント分離',
              subtitle: '推奨 (AWS Organizations)',
              accent: 'emerald',
              points: [
                'IAMの境界=アカウント境界なので<strong>誤操作が構造的に本番へ届かない</strong>',
                'コストが環境ごとに自動で分かれる',
                'Service Quotas(上限)も環境ごとに独立',
                'アカウント作成・SSO・ガードレールはOrganizations + IAM Identity Centerで管理',
              ],
            },
            {
              title: '同一アカウントでタグ/命名分離',
              subtitle: '小規模の初期はあり得る',
              accent: 'amber',
              points: [
                '構築は簡単。IAMポリシーの条件で権限を絞る運用',
                '<strong>「dev作業のつもりでprodを操作」が起き得る</strong>',
                'リソース名の衝突、上限の食い合いが発生する',
                '成長したら分離への移行コストが重くなる',
              ],
            },
          ],
        },
        {
          type: 'flow',
          title: 'Organizationsの典型構成',
          steps: [
            { label: 'Management', sublabel: '請求とOrganizations管理のみ', accent: 'slate' },
            { label: 'dev account', sublabel: '開発者に広めの権限', accent: 'blue' },
            { label: 'stg account', sublabel: '本番相当の絞った権限', accent: 'amber' },
            { label: 'prod account', sublabel: '人の書き込みは原則禁止', accent: 'rose' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: '本番は「人が触らない」を目指す',
          html: 'prodへの変更はCI/CD(IaC)経由のみとし、人間のIAMは読み取り+緊急用のbreak-glassロールに絞るのが理想形です。「本番で手作業した変更」はIaCとの乖離(ドリフト)になり、次のデプロイで消えて事故になります。',
        },
      ],
    },
    {
      id: 'config-management',
      title: '設定はどこに置くか (Parameter Store / Secrets Manager)',
      icon: 'KeyRound',
      blocks: [
        {
          type: 'paragraph',
          html: '環境ごとに変わる値をコードに埋め込むと、環境追加のたびにビルドが変わり、秘密情報のコミット事故も起きます。<strong>「設定は環境側に置き、アプリは同じイメージのまま」</strong>が原則です(Twelve-Factor App)。',
        },
        {
          type: 'table',
          headers: ['置き場所', '向いているもの', '特徴'],
          rows: [
            ['<strong>SSM Parameter Store</strong>', '機能フラグ、URL、チューニング値', '無料枠が広い。階層パス(/myapp/prod/...)で整理。SecureStringで暗号化も可'],
            ['<strong>Secrets Manager</strong>', 'DBパスワード、APIキー', '<strong>自動ローテーション</strong>対応。RDSと統合。有料(シークレットごと)'],
            ['タスク定義の環境変数', '秘密でない固定値', 'ビルド不要で変えられるが、変更=新リビジョンのデプロイ'],
            ['コード内定数', '環境で変わらない値のみ', '環境差分を持ち込まない'],
          ],
        },
        {
          type: 'code',
          code: `# Parameter Storeの階層設計の例
/myapp/dev/database/host
/myapp/dev/features/new-checkout   # 機能フラグ
/myapp/stg/database/host
/myapp/prod/database/host

# ECSタスク定義では secrets として注入する(平文で env に書かない)
"secrets": [
  { "name": "DB_PASSWORD",
    "valueFrom": "arn:aws:secretsmanager:...:secret:myapp/prod/db" }
]`,
          caption: '環境をパスで分ける。アプリは自分の環境のパスだけ読む権限を持つ',
        },
        {
          type: 'callout',
          variant: 'danger',
          title: 'やってはいけない置き場所',
          html: '<strong>gitリポジトリ(.envのコミット)、Dockerイメージ内、CIのログに出る場所</strong>。一度コミットした秘密は履歴に残るため、漏れたらローテーション(値の変更)が必須です。ローテーションできるように、秘密は最初からSecrets Manager等の1箇所に集めておきます。',
        },
      ],
    },
    {
      id: 'iac-environments',
      title: 'IaC (Terraform) での環境の表現',
      icon: 'Boxes',
      blocks: [
        {
          type: 'paragraph',
          html: '「同じコードから変数だけ変えて各環境を作る」をTerraformでどう表現するか。主流は<strong>環境ごとのディレクトリ分割</strong>です。',
        },
        {
          type: 'code',
          code: `environments/
  dev/
    main.tf        # module "app" { source = "../../modules/app", instance_size = "small", az_count = 1 }
    backend.tf     # stateはdev用のS3キー
  stg/
    main.tf        # az_count = 2, 本番と同じ形
  prod/
    main.tf        # az_count = 2, deletion_protection = true
modules/
  app/             # 共通の構成定義(全環境がこれを使う)`,
          caption: 'モジュールを共有し、環境ディレクトリは「変数の束」だけを持つ',
        },
        {
          type: 'list',
          items: [
            '<strong>stateは環境ごとに分離</strong>する(devのplan/applyがprodのstateに触れない)',
            'prodにだけ <code>deletion_protection</code> や <code>prevent_destroy</code> を入れる',
            '環境差分は変数で表現し、<strong>ifで環境名を分岐させる書き方を増やしすぎない</strong>(差分が追えなくなる)',
            'applyの権限も環境ごとのIAMロールで分ける(CIのOIDCロールをアカウント別に用意)',
          ],
        },
      ],
    },
    {
      id: 'cost-and-parity',
      title: '環境差分の落とし穴とコスト',
      icon: 'Wallet',
      blocks: [
        {
          type: 'paragraph',
          html: '「本番と同じ」を全環境でやるとコストが跳ねます。<strong>何を本番と揃え、何を削るか</strong>を意図的に決めるのがこのテーマの実務です。',
        },
        {
          type: 'compare',
          columns: [
            {
              title: '揃えるべきもの',
              subtitle: '違うと検証にならない',
              accent: 'rose',
              points: [
                'アーキテクチャの形(CloudFront経由か、SGの構成、IAMの形)',
                'ミドルウェアの<strong>バージョン</strong>(RDSエンジン、ランタイム)',
                'デプロイ方法(stgも本番と同じパイプラインで)',
                '暗号化やネットワーク境界などのセキュリティ構造',
              ],
            },
            {
              title: '削ってよいもの',
              subtitle: 'コストに効く',
              accent: 'emerald',
              points: [
                'インスタンスサイズ・台数(t系/小サイズ/min=1)',
                'Multi-AZ(devはシングルAZで十分)',
                'NAT Gateway(devは1つに集約 or VPC Endpoint)',
                '<strong>夜間・週末の自動停止</strong>(dev/stgのRDS・ECS)',
              ],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: '「stgでは動いた」の典型原因',
          html: 'データ量の差(本番だけ遅いクエリ)、環境変数・パラメータの設定漏れ、IAM権限の差、外部サービスの本番キー切り替え漏れ。<strong>リリース前チェックリストに「prodのパラメータ一式がstgと同じ構造で存在するか」の照合を入れる</strong>と、このクラスの事故は大きく減ります。',
        },
      ],
    },
  ],
  checkpoints: [
    'dev/stg/prodそれぞれの目的と、stgが「本番の相似形」であるべき理由を説明できる',
    'アカウント分離が同一アカウント内分離より安全とされる理由をIAMの観点で説明できる',
    'Parameter StoreとSecrets Managerの使い分けを説明できる',
    '秘密情報をgit/イメージ/CIログに置いてはいけない理由と、漏れた時の対応(ローテーション)を説明できる',
  ],
  references: [
    { label: 'Organizing Your AWS Environment Using Multiple Accounts', url: 'https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/organizing-your-aws-environment.html' },
    { label: 'AWS Systems Manager Parameter Store', url: 'https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html' },
    { label: 'The Twelve-Factor App: Config', url: 'https://12factor.net/config' },
  ],
};

export default config;
