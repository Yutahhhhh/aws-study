import type { GlossaryDatabase } from '../../types/glossary';
import type { GlossaryCategory } from '../../types/topic';

export const glossary: GlossaryDatabase = {
  'github-oidc': {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Security-Identity-Compliance/48/Arch_AWS-Identity-and-Access-Management_48.svg',
    title: 'GitHub OIDC連携',
    eng: 'OIDC FEDERATION',
    oneLiner: 'アクセスキーを配らず、ワークフローがIAMロールを一時的に引き受ける',
    detail: `GitHub ActionsはOIDCトークンで「どのリポジトリ・どのブランチのワークフローか」を証明し、IAMのAssumeRoleWithWebIdentityで一時認証情報を得ます。
            <br><br>IAM側の信頼ポリシーで「このリポジトリのmainブランチだけ許可」のように絞れます。`,
    focus: `長期アクセスキーをGitHub Secretsに置く方式は、漏洩したら無期限に悪用されます。OIDCなら盗まれても数十分で失効する一時認証情報のみ。新規構築では必ずOIDCを選びます。`,
  },
  'ecr-registry': {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Registry_48.svg',
    title: 'ECR (コンテナレジストリ)',
    eng: 'ELASTIC CONTAINER REGISTRY',
    oneLiner: 'buildしたDockerイメージの保管庫。ECSはここからpullして起動する',
    detail: `ECRはプライベートなDockerレジストリです。CIがpushし、ECSのTask起動時にpullされます。イメージスキャン(脆弱性検査)やライフサイクルポリシー(古いイメージの自動削除)も持ちます。
            <br><br>認証はIAMで行い、docker loginのトークンは一時発行です。`,
    focus: `ライフサイクルポリシーを設定しないとイメージが溜まり続けて課金が増えます。ただし「直近N世代は残す」にしておくこと。ロールバック先のイメージまで消すと戻れなくなります。`,
  },
  'task-definition': {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.svg',
    title: 'Task Definition (リビジョン)',
    eng: 'TASK DEFINITION',
    oneLiner: '「どのイメージをどんな設定で動かすか」の宣言。版(リビジョン)が積み重なる',
    detail: `Task Definitionはイメージ、CPU/メモリ、環境変数、Secrets、ログ設定などをまとめた起動仕様です。変更のたびに新しいリビジョンとして登録され、過去の版も残ります。
            <br><br>デプロイとは「Serviceが参照するリビジョンを差し替えること」です。`,
    focus: `ロールバック=「前のリビジョンを指し直す」だけ。この仕組みを理解すると、デプロイが怖くなくなります。環境変数の変更もコード変更と同じく「新リビジョンのデプロイ」として扱われる点に注意。`,
  },
  'rolling-update': {
    icon: 'RefreshCw',
    title: 'ローリング更新',
    eng: 'ROLLING UPDATE',
    oneLiner: '新Taskを起動→健康確認→旧Taskを停止、を少しずつ進める入れ替え方式',
    detail: `ECSの標準デプロイ方式です。minimumHealthyPercent(下限)とmaximumPercent(上限)で、入れ替え中に何個のTaskを並行稼働させるかを制御します。
            <br><br>例: desired=4, min=100%, max=200%なら「4台を維持したまま新4台を追加起動→古い4台を停止」。`,
    focus: `一時的に新旧バージョンが同時にリクエストを受けます。DBスキーマ変更やAPI変更は「新旧どちらのコードでも動く」中間状態を挟む(後方互換を保つ)のが実務の鉄則です。`,
  },
  'deploy-health-check': {
    icon: 'HeartPulse',
    title: 'ヘルスチェックとデプロイ',
    eng: 'HEALTH CHECK',
    oneLiner: '「健康と確認できたTaskだけ」が本番トラフィックを受ける仕組み',
    detail: `ALBのTarget Groupは登録されたTaskへ定期的にヘルスチェック(例: GET /health)を送り、連続成功でhealthy、連続失敗でunhealthyと判定します。
            <br><br>ECSはunhealthyなTaskを落として起動し直します。デプロイ時は「新Taskがhealthyになってから」旧Taskの停止が始まります。`,
    focus: `/healthが「200を返すだけ」だと、DB接続が死んでいてもhealthyになってしまいます。逆に外部API疎通まで見ると外部障害で全Taskがunhealthy化する諸刃の剣。「自プロセスが仕事できる最小条件」を返すのが目安です。`,
  },
  'circuit-breaker': {
    icon: 'ShieldAlert',
    title: 'Deployment Circuit Breaker',
    eng: 'DEPLOYMENT CIRCUIT BREAKER',
    oneLiner: '安定しないデプロイを自動で失敗判定し、前の版に巻き戻す',
    detail: `新Taskの起動失敗やヘルスチェック失敗が続くと、ECSがそのデプロイをFAILEDにします。ロールバックオプションを有効にしておくと、直前の正常なリビジョンで自動的に再デプロイされます。
            <br><br>これが無いと、失敗デプロイは「新Taskの起動と失敗を無限に繰り返す」状態で滞留します。`,
    focus: `本番のECS Serviceでは基本的に有効化+ロールバックONにしておくべき設定です。加えてCloudWatchアラームと連動するロールバック(CodeDeployや--enable-execute-command系の運用)を組むと「起動はするが遅い/エラー率が高い」ケースにも対応できます。`,
  },
  'image-tag-strategy': {
    icon: 'Tag',
    title: 'イメージタグ戦略',
    eng: 'IMAGE TAGGING',
    oneLiner: 'タグはコミットSHA。「latest」だけの運用はロールバック不能を招く',
    detail: `イメージタグをコミットSHA(例: app:abc1234)にすると、「動いているイメージ=どのコードか」が一意に特定でき、任意の過去バージョンへ戻せます。
            <br><br>「latest」タグは同じ名前で中身が変わるため、再現性がなくデバッグもロールバックも困難になります。`,
    focus: `Task Definitionに書くイメージURIは必ず一意なタグ(またはダイジェスト)にします。ECRのタグ変更不可設定(immutable tags)を有効にすると、同じタグへの上書きpushをレジストリ側で防げます。`,
  },
};

export const glossaryCategories: GlossaryCategory[] = [
  {
    label: 'パイプラインの構成要素',
    termIds: ['github-oidc', 'ecr-registry', 'task-definition', 'image-tag-strategy'],
  },
  {
    label: '安全なリリースの仕組み',
    termIds: ['rolling-update', 'deploy-health-check', 'circuit-breaker'],
  },
];
