import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'iam-foundations',
  title: 'IAM と権限設計',
  description: 'ポリシー・ロール・AssumeRole/STS・権限境界・最小権限。AWSで「誰が何をしてよいか」を決める土台',
  headerLabel: 'AWS IAM',
  homeIcon: 'BadgeCheck',
  homeColor: 'blue',
  intro:
    'IAMはAWSの<strong>すべてのAPI呼び出しの入口</strong>にいる認可エンジンです。SGやWAFが「通信」を制御するのに対し、IAMは「このリクエストはこのアクションをこのリソースに対して実行してよいか」を判定します。ここを曖昧にすると、過剰権限が事故と侵害の温床になります。',
  sections: [
    {
      id: 'model',
      title: '誰が(Principal)・何を(Action)・どれに(Resource)',
      icon: 'BadgeCheck',
      blocks: [
        {
          type: 'flow',
          title: 'IAMが毎回判定していること',
          steps: [
            { label: 'Principal', sublabel: '誰が', accent: 'blue' },
            { label: 'Action', sublabel: '何を', accent: 'amber' },
            { label: 'Resource', sublabel: 'どれに', accent: 'emerald' },
            { label: 'Condition', sublabel: 'どんな条件で', accent: 'slate' },
          ],
        },
        {
          type: 'paragraph',
          html:
            'リクエストは<strong>暗黙的に拒否(default deny)</strong>が初期状態です。いずれかのポリシーに<code>Allow</code>があり、かつ<code>Deny</code>が1つも無いときだけ許可されます。<strong>明示的なDenyは常に勝ちます</strong>。',
        },
        {
          type: 'code',
          caption: 'IAMポリシー(JSON)の最小例：特定バケットの読み取りだけ',
          code: `{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject"],
    "Resource": "arn:aws:s3:::my-app-assets/*",
    "Condition": { "StringEquals": { "aws:SecureTransport": "true" } }
  }]
}`,
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'アイデンティティベース vs リソースベース',
          html: 'ポリシーは2種類。<strong>アイデンティティベース</strong>(ユーザ/ロールに付ける)と、<strong>リソースベース</strong>(S3バケットポリシー、SQSポリシー、KMSキーポリシー等、リソース側に付ける)。クロスアカウント許可はリソースベースが要になります。',
        },
      ],
    },
    {
      id: 'roles',
      title: 'ロールとAssumeRole / STS（一時資格情報）',
      icon: 'KeyRound',
      blocks: [
        {
          type: 'paragraph',
          html:
            '本番では<strong>長期のアクセスキーを配らない</strong>のが鉄則です。代わりに<strong>IAMロール</strong>を「一時的に引き受ける(AssumeRole)」ことで、STSが短命の資格情報(数十分〜数時間)を発行します。漏れても寿命が短く、ローテーションも自動です。',
        },
        {
          type: 'steps',
          steps: [
            { title: '信頼ポリシー(trust policy)で「誰が引き受けてよいか」を定義', html: 'ロール側に「このサービス/アカウント/IdPはAssumeRoleしてよい」を書く。', accent: 'blue' },
            { title: 'STS:AssumeRole で一時資格情報を取得', html: 'アクセスキー・シークレット・<strong>セッショントークン</strong>の3点セットが返る。', accent: 'amber' },
            { title: 'その資格情報でAPIを呼ぶ', html: '権限はロールの権限ポリシーの範囲。期限が切れたら再取得。', accent: 'emerald' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'マシンには「ロール」を渡す',
          html: 'EC2は<strong>インスタンスプロファイル</strong>、ECSは<strong>タスクロール</strong>(<code>taskRoleArn</code>)、Lambdaは<strong>実行ロール</strong>でロールを受け取ります。アプリのコードにキーを書く必要は一切ありません。<span class="font-bold">Secrets注入とECS起動</span>や<span class="font-bold">SSMでPrivate RDSへ接続</span>で出てきたのもこの仕組みです。',
        },
      ],
    },
    {
      id: 'least-privilege',
      title: '最小権限と権限境界',
      icon: 'ShieldCheck',
      blocks: [
        {
          type: 'list',
          items: [
            '<strong>最小権限(least privilege)</strong>：必要なActionとResourceだけを許可。<code>"Action": "*"</code> や <code>"Resource": "*"</code> は原則避ける',
            '<strong>権限境界(permissions boundary)</strong>：そのロール/ユーザが「最大でも持てる権限の上限」を別ポリシーで設定。委譲時に「これ以上は絶対与えられない」枠を作れる',
            '<strong>SCP(Service Control Policy)</strong>：Organizations全体に効くガードレール。アカウントを跨いで「リージョン制限」「特定サービス禁止」などを強制',
            '<strong>条件(Condition)</strong>：送信元IP、MFA有無、タグ、時間帯などで絞る(<code>aws:MultiFactorAuthPresent</code> 等)',
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: '権限の重なりは「積集合」で考える',
          html: '実効権限 = アイデンティティポリシー ∩ 権限境界 ∩ SCP ∩ (リソースポリシー) から、明示Denyを除いたもの。どれか1つでも許可していなければ通りません。',
        },
      ],
    },
    {
      id: 'federation',
      title: '人と外部システムの認証連携（フェデレーション）',
      icon: 'Cable',
      blocks: [
        {
          type: 'compare',
          columns: [
            {
              title: '人間のアクセス',
              subtitle: 'IAM Identity Center',
              accent: 'emerald',
              points: ['SSOで一時資格情報を配布', 'IAMユーザを各人に作らない', 'グループ×権限セットで管理'],
            },
            {
              title: 'CI/CDのアクセス',
              subtitle: 'OIDCフェデレーション',
              accent: 'blue',
              points: [
                'GitHub Actions等が<strong>キーなし</strong>でAssumeRole',
                'OIDCトークンを信頼ポリシーで検証',
                '<code>sub</code>でリポジトリ/ブランチを限定',
              ],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'デプロイ用に長期キーを置かない',
          html: 'CI/CDからAWSへデプロイする際、アクセスキーをSecretsに貯めるより<strong>OIDCで都度AssumeRole</strong>する方が安全です。鍵の漏洩・棚卸し問題が消えます。<span class="font-bold">デプロイ戦略とCI/CD</span>ガイドと合わせて設計します。',
        },
      ],
    },
    {
      id: 'pitfalls',
      title: 'よくある事故',
      icon: 'ShieldAlert',
      blocks: [
        {
          type: 'list',
          items: [
            '<code>AdministratorAccess</code> をアプリのタスクロールに付けてしまう（侵害時に全権を奪われる）',
            '長期アクセスキーをコード/環境変数/Gitに直書きし、ローテーションされない',
            '<code>iam:PassRole</code> を広く許可し、権限昇格(より強いロールを別サービスに渡す)を許す',
            'ルートユーザを日常利用する（MFA必須・封印が原則）',
            '「とりあえず動かす」ための <code>*</code> 権限が本番にそのまま残る',
          ],
        },
        {
          type: 'callout',
          variant: 'danger',
          title: '権限は「足す」より「絞る」が難しい',
          html: '最初に広く与えると、後から削るのは壊れるのが怖くて進みません。<strong>最初は拒否寄りで始め、足りなければ足す</strong>。CloudTrailで実際に使われたActionを見て絞り込むのが定石です（<span class="font-bold">セキュリティ統制と監査</span>ガイド参照）。',
        },
      ],
    },
  ],
  checkpoints: [
    'default deny と 明示Deny優先 のルールを説明できるか',
    'アイデンティティベースとリソースベースのポリシーの使い分けを説明できるか',
    'AssumeRole/STSで長期キーを避ける利点を説明できるか',
    'ECSタスクロール・インスタンスプロファイルが何を解決するか説明できるか',
    '権限境界とSCPの役割の違いを説明できるか',
    'CI/CDでOIDCフェデレーションを使う理由を説明できるか',
  ],
  references: [
    { label: 'IAM policies and permissions', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html' },
    { label: 'IAM roles', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html' },
    { label: 'Permissions boundaries', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html' },
    { label: 'Service control policies (SCPs)', url: 'https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html' },
    { label: 'Configure OpenID Connect in AWS (GitHub Actions)', url: 'https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services' },
  ],
};

export default config;
