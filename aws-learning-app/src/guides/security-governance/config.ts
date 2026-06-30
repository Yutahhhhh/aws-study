import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'security-governance',
  title: 'セキュリティ統制と監査',
  description: 'CloudTrail・KMS/暗号化・GuardDuty・Config・Security Hub。「守る・気づく・証明する」ための土台',
  headerLabel: 'AWS SECURITY GOVERNANCE',
  homeIcon: 'ShieldCheck',
  homeColor: 'rose',
  intro:
    'アプリ監視(observability)が「サービスが健全か」を見るのに対し、セキュリティ統制は「<strong>誰が何をしたか(監査)・データが守られているか(暗号化)・不正の兆候はないか(検知)</strong>」を担います。本番・監査対応・インシデント対応で必ず要る土台です。',
  sections: [
    {
      id: 'cloudtrail',
      title: 'CloudTrail（誰が何をしたかの監査ログ）',
      icon: 'ScrollText',
      blocks: [
        {
          type: 'compare',
          columns: [
            {
              title: 'CloudTrail',
              subtitle: '統制・監査',
              accent: 'rose',
              points: ['<strong>AWS APIの呼び出し履歴</strong>', '「誰が・いつ・どのAPIを・どこから」', '不正調査・コンプライアンスの根拠'],
            },
            {
              title: 'CloudWatch Logs',
              subtitle: 'アプリ運用',
              accent: 'blue',
              points: ['アプリやサービスが出す<strong>ログ</strong>', '「処理がどう動いたか」', '障害調査・デバッグ'],
            },
          ],
        },
        {
          type: 'paragraph',
          html:
            '両者は別物です。「IAMロールが削除された」「SGが0.0.0.0/0に開かれた」のような<strong>変更の証跡</strong>はCloudTrailにしか残りません。管理イベントは既定で記録されますが、長期保管・全リージョン集約には<strong>証跡(trail)をS3へ出力</strong>し、改ざん防止(ログファイル検証/Object Lock)を併用します。',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: '最小権限の絞り込みにも使う',
          html: 'CloudTrailで「実際に呼ばれたAction」を分析すれば、過剰なIAM権限を実績ベースで削れます（IAM Access Analyzerのポリシー生成）。',
        },
      ],
    },
    {
      id: 'kms',
      title: 'KMS と暗号化（保存時・転送時）',
      icon: 'KeyRound',
      blocks: [
        {
          type: 'list',
          items: [
            '<strong>転送時(in transit)</strong>：TLS。CloudFront/ALBで終端し、できれば内部区間もTLS。<strong>ACM</strong>で証明書を発行・自動更新',
            '<strong>保存時(at rest)</strong>：S3/EBS/RDS/Secrets等を<strong>KMSキー</strong>で暗号化。多くは既定で有効化できる',
            '<strong>キーポリシー</strong>がKMSの認可の中心。「誰がこのキーで暗号化/復号してよいか」を定義（IAMと両方で許可が要る）',
            'エンベロープ暗号化：データはデータキーで暗号化し、そのデータキーをKMSキーで暗号化する2段構え',
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'AWS管理キー vs カスタマー管理キー(CMK)',
          html: '手軽さならAWS管理キー。<strong>キーポリシーの細かい制御・ローテーション周期・キー単位の無効化・監査</strong>が要るならカスタマー管理キー(CMK)を使います。クロスアカウント共有もCMKが前提です。',
        },
      ],
    },
    {
      id: 'detection',
      title: '検知と構成監視（GuardDuty / Config / Security Hub）',
      icon: 'Radar',
      blocks: [
        {
          type: 'table',
          headers: ['サービス', '役割', '例'],
          rows: [
            ['GuardDuty', '脅威検知(振る舞い)', '不審なAPIコール、既知の悪性IPとの通信、クレデンシャル流出の兆候'],
            ['Config', '構成のスナップショット/準拠チェック', '「S3が公開されていないか」「暗号化が有効か」をルールで継続評価'],
            ['Security Hub', '横断ダッシュボード', 'GuardDuty/Config等の検出を集約し、ベンチマーク(CIS等)でスコア化'],
            ['IAM Access Analyzer', '外部公開・過剰権限の発見', '外部アカウントからアクセス可能なリソースを洗い出す'],
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: '検知は通知に繋ぐ',
          html: 'GuardDutyやConfigの検出はEventBridge経由でSNS/チャットへ流し、<strong>気づける状態</strong>にして初めて意味があります（<span class="font-bold">監視・ログ・アラーム</span>ガイドの通知設計と同じ）。',
        },
      ],
    },
    {
      id: 'secrets',
      title: '秘密情報のローテーション',
      icon: 'RefreshCw',
      blocks: [
        {
          type: 'paragraph',
          html:
            'DBパスワードやAPIキーは<strong>Secrets Manager</strong>に置き、ECSタスク定義の<code>secrets</code>で起動時に注入します（コード/Gitに平文を残さない）。Secrets Managerは<strong>定期ローテーション</strong>を自動化でき、RDSのmasterパスワードは<code>manage_master_user_password</code>でAWSに生成・管理させられます。',
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'Parameter Store と使い分け',
          html: '単なる設定値はSSM Parameter Store(安価)、<strong>自動ローテーションや厳密なアクセス監査が要る秘密</strong>はSecrets Manager。詳細は<span class="font-bold">Secrets注入とECS起動</span>シミュレーションを参照。',
        },
      ],
    },
    {
      id: 'defense-in-depth',
      title: '多層防御として並べる',
      icon: 'Layers',
      blocks: [
        {
          type: 'flow',
          title: '層が違えば役割は重ならない',
          steps: [
            { label: 'WAF', sublabel: 'L7の悪性リクエスト', accent: 'rose' },
            { label: 'SG', sublabel: 'L3/L4の到達制御', accent: 'blue' },
            { label: 'IAM', sublabel: 'APIの認可', accent: 'emerald' },
            { label: 'KMS', sublabel: 'データの暗号化', accent: 'amber' },
            { label: 'CloudTrail', sublabel: '事後の証跡', accent: 'slate' },
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          html: '1つの層が破られても次の層で止める／少なくとも<strong>後から追える</strong>ようにする。これが多層防御です。どれか1つで万全になるサービスはありません。',
        },
      ],
    },
  ],
  checkpoints: [
    'CloudTrail と CloudWatch Logs の違いと使い分けを説明できるか',
    '転送時暗号化と保存時暗号化のそれぞれの実現手段を挙げられるか',
    'KMSのキーポリシーがIAMと別に必要な理由を説明できるか',
    'GuardDuty / Config / Security Hub の役割の違いを説明できるか',
    'Secrets Manager と Parameter Store の使い分けを説明できるか',
    '多層防御で各層(WAF/SG/IAM/KMS/CloudTrail)が担う範囲を説明できるか',
  ],
  references: [
    { label: 'AWS CloudTrail concepts', url: 'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-concepts.html' },
    { label: 'AWS KMS concepts', url: 'https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html' },
    { label: 'Amazon GuardDuty', url: 'https://docs.aws.amazon.com/guardduty/latest/ug/what-is-guardduty.html' },
    { label: 'AWS Config', url: 'https://docs.aws.amazon.com/config/latest/developerguide/WhatIsConfig.html' },
    { label: 'Rotate Secrets Manager secrets', url: 'https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html' },
  ],
};

export default config;
