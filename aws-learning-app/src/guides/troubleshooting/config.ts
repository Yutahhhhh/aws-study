import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'troubleshooting',
  title: '障害時の切り分け',
  description: '症状から原因へ、経路を区間に分けてたどる切り分けの地図',
  headerLabel: 'AWS TROUBLESHOOTING',
  homeIcon: 'Stethoscope',
  homeColor: 'blue',
  intro:
    '「APIが500を返す」「画面が出ない」と言われたとき、どこから疑うか。闇雲に全部を見ず、<strong>リクエストの経路を区間に分け、どこまで届いているか</strong>を上流から確認します。',
  sections: [
    {
      id: 'approach',
      title: '基本：上流から区間で切る',
      icon: 'Network',
      blocks: [
        {
          type: 'flow',
          title: '経路を区間A〜Eに分ける',
          steps: [
            { label: '利用者', accent: 'slate' },
            { label: 'CloudFront', sublabel: 'A/B', accent: 'purple' },
            { label: 'ALB', sublabel: 'C', accent: 'amber' },
            { label: 'ECS', sublabel: 'D', accent: 'emerald' },
            { label: 'RDS', sublabel: 'E', accent: 'sky' },
          ],
        },
        {
          type: 'paragraph',
          html:
            'エラーのステータスコードと、どのコンポーネントのログに記録があるかが手がかりです。上流から区間で切ると「問題の範囲」を半分ずつ絞れます。',
        },
      ],
    },
    {
      id: 'symptom-static',
      title: '症状: 画面が表示されない',
      icon: 'TriangleAlert',
      blocks: [
        {
          type: 'steps',
          steps: [
            { title: 'ステータスコードを確認', html: '開発者ツールで 403/404/5xx を見る。', accent: 'blue' },
            { title: '403/404 AccessDenied', html: 'S3のOAC設定 / bucket policy を疑う。CloudFrontからS3を読めていない。', accent: 'rose' },
            { title: '404だがファイルはある(SPA直打ち)', html: 'Custom Error Response で index.html に戻す設定が無い/誤り。', accent: 'amber' },
            { title: '古いファイルが出る', html: 'CloudFrontキャッシュ。invalidation漏れ。', accent: 'purple' },
          ],
        },
      ],
    },
    {
      id: 'symptom-5xx',
      title: '症状: APIが5xxを返す',
      icon: 'Stethoscope',
      blocks: [
        {
          type: 'callout',
          variant: 'danger',
          title: 'まず ELB_5XX か Target_5XX か',
          html: 'この分岐が切り分けの鍵です。',
        },
        {
          type: 'compare',
          columns: [
            {
              title: 'ELB_5XX が増えている',
              accent: 'amber',
              points: ['ALB側/ターゲット不在', '<code>UnHealthyHostCount</code> を確認', 'health check失敗 / 登録なし / Service起動失敗'],
            },
            {
              title: 'Target_5XX が増えている',
              accent: 'rose',
              points: ['アプリ側の問題', 'ECSのCloudWatch Logsでスタックトレースを読む', 'DB接続失敗、未処理例外など'],
            },
          ],
        },
      ],
    },
    {
      id: 'symptom-db',
      title: '症状: アプリからDBに繋がらない',
      icon: 'Database',
      blocks: [
        {
          type: 'compare',
          columns: [
            {
              title: '接続タイムアウト',
              subtitle: 'ネットワーク起因',
              accent: 'amber',
              points: ['RDS SGがECS SGからの5432を許可しているか', '同じVPCでルーティングできるか', '接続先ホスト(エンドポイント)が正しいか'],
            },
            {
              title: '認証エラー',
              subtitle: 'password authentication failed',
              accent: 'rose',
              points: ['Secrets/SSMの値が正しいか', 'Task Definitionの <code>secrets</code> が正しいARNを指すか'],
            },
          ],
        },
      ],
    },
    {
      id: 'symptom-task',
      title: '症状: ECS Taskが起動しない / すぐ停止',
      icon: 'TriangleAlert',
      blocks: [
        {
          type: 'steps',
          steps: [
            { title: '停止理由を確認', html: 'Service events / stopped task の理由を見る。', accent: 'blue' },
            { title: 'CannotPullContainerError', html: 'ECR URI/タグ、execution roleのpull権限、ECR/S3エンドポイント or NATの経路を確認。', accent: 'rose' },
            { title: 'ResourceInitializationError', html: 'secret取得失敗。execution roleの権限 / Secrets・SSMへの経路を確認。', accent: 'amber' },
            { title: '起動直後にexit', html: 'アプリがクラッシュ。CloudWatch Logs確認。環境変数・migration未実行が典型。', accent: 'purple' },
          ],
        },
      ],
    },
    {
      id: 'cheatsheet',
      title: 'つまずきやすい設定ミス早見表',
      icon: 'Layers',
      blocks: [
        {
          type: 'table',
          headers: ['症状', 'よくある原因'],
          rows: [
            ['静的ファイルがAccessDenied', 'OAC/bucket policy不整合'],
            ['SPAのパス直打ちで404', 'Custom Error Response未設定'],
            ['古い画面が出る', 'invalidation漏れ'],
            ['API 503 / 健全Targetなし', 'health check失敗'],
            ['DB接続タイムアウト', 'SG許可漏れ'],
            ['DB認証エラー', 'secrets参照ミス'],
            ['Taskがpullできない', 'ECR権限/経路不足'],
            ['CloudFrontに証明書を割当できない', 'ACMが<code>us-east-1</code>にない'],
          ],
        },
      ],
    },
  ],
  checkpoints: [
    '「APIが500」と言われて、最初に確認するメトリクスを答えられるか',
    'ELB_5XX と Target_5XX で次に見る場所がどう変わるか説明できるか',
    'DB接続失敗を「ネットワーク起因」と「認証起因」にどう切り分けるか説明できるか',
    'ECS Taskがpullできないときの確認項目を挙げられるか',
    '上流から区間で切る切り分けの利点を説明できるか',
  ],
  references: [
    { label: 'Troubleshooting your Application Load Balancers', url: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-troubleshooting.html' },
    { label: 'Amazon ECS stopped task error messages', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/stopped-task-error-codes.html' },
    { label: 'Troubleshooting CloudFront errors', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/http-status-codes.html' },
  ],
};

export default config;
