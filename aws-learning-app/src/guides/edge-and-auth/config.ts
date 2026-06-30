import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'edge-and-auth',
  title: '公開エッジと認証',
  description: 'Route 53・CloudFront・OAC・CloudFront Functions・WAF・Cognito。利用者がアプリに届くまでの「入口」を正しく組む',
  headerLabel: 'AWS EDGE & AUTH',
  homeIcon: 'Globe2',
  homeColor: 'blue',
  intro:
    '設計演習では、利用者は必ず<strong>独自ドメイン → CloudFront → (静的ファイル or VPCのALB)</strong>という入口を通ります。この「公開エッジ」をどう組み、どこで認証や保護をかけるのかを、各サービスの役割で整理します。',
  sections: [
    {
      id: 'overview',
      title: '入口の全体像：利用者はどこを通るか',
      icon: 'Globe2',
      blocks: [
        {
          type: 'flow',
          title: '独自ドメインからアプリまでの一本道',
          steps: [
            { label: '利用者', accent: 'slate' },
            { label: 'Route 53', sublabel: '名前解決', accent: 'blue' },
            { label: 'CloudFront', sublabel: '入口/キャッシュ', accent: 'blue' },
            { label: 'S3 / ALB', sublabel: '静的 or 動的', accent: 'emerald' },
          ],
        },
        {
          type: 'paragraph',
          html:
            'ブラウザはまず<strong>Route 53</strong>でドメイン名をCloudFrontのアドレスに解決し、<strong>CloudFront</strong>へ接続します。CloudFrontはリクエストのパスを見て、静的ファイルなら<strong>S3</strong>、APIならVPCの<strong>ALB</strong>へ振り分けます。利用者がVPC内のリソースへ直接触れることはありません。',
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'なぜ入口を1つに集約するのか',
          html: 'TLS終端・キャッシュ・WAF・アクセスログ・独自ドメインを<strong>CloudFrontという1つの面</strong>にまとめられるからです。S3バケットやALBを個別に公開するより、攻撃面も運用点も減ります。',
        },
      ],
    },
    {
      id: 'route53',
      title: 'Route 53（独自ドメインの名前解決）',
      icon: 'Globe2',
      blocks: [
        {
          type: 'paragraph',
          html:
            'Route 53はDNSサービスです。<code>example.com</code> のようなドメインを、CloudFrontディストリビューションへ向けます。このとき使うのが<strong>Aliasレコード</strong>です。',
        },
        {
          type: 'list',
          items: [
            '<strong>Aliasレコード</strong>はAWSリソース(CloudFront/ALB/S3など)を指す専用レコード。通常のCNAMEと違い<strong>ゾーンの頂点(apex、例: <code>example.com</code>)にも設定でき</strong>、追加課金もない',
            'CloudFront用のTLS証明書(ACM)は、CloudFrontがグローバルサービスのため<strong>us-east-1(バージニア北部)</strong>で発行する必要がある',
            'DNSは「どこへ向かわせるか」を決めるだけで、通信の中身は見ない。保護はWAFやSG、認証はCognitoが担う',
          ],
        },
      ],
    },
    {
      id: 'cloudfront',
      title: 'CloudFront（入口・キャッシュ・振り分け）',
      icon: 'Network',
      blocks: [
        {
          type: 'paragraph',
          html:
            'CloudFrontはCDNであり、世界中のエッジロケーションでリクエストを受けます。<strong>キャッシュ</strong>で配信を速くするだけでなく、<strong>1つのドメインの下で複数のオリジンへ振り分ける</strong>入口としても使います。',
        },
        {
          type: 'compare',
          columns: [
            {
              title: 'デフォルトのビヘイビア',
              subtitle: '静的配信',
              accent: 'emerald',
              points: ['<code>/*</code> → S3オリジン', 'HTML/JS/CSS/画像など', 'キャッシュ効果が高い'],
            },
            {
              title: 'パス指定のビヘイビア',
              subtitle: '動的API',
              accent: 'blue',
              points: ['<code>/api/*</code> → ALBオリジン', 'VPCのアプリへ転送', '通常はキャッシュしない'],
            },
          ],
        },
        {
          type: 'paragraph',
          html:
            '<strong>ビヘイビア(Cache Behavior)</strong>はパスパターンごとに「どのオリジンへ送り、どうキャッシュするか」を決める設定です。演習で <code>CloudFront → S3</code> と <code>CloudFront → IGW → ALB</code> の2本に分かれていたのは、このパス振り分けを表しています。',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'APIオリジンはVPCのIGWを通る',
          html: 'CloudFrontからALBへの通信は、利用者と同じく<strong>VPCの外側からInternet Gateway経由でPublic SubnetのALB</strong>へ入ります。ALBのSGでHTTPS(443)だけを許可し、できればCloudFront由来のリクエストだけに絞ります。',
        },
      ],
    },
    {
      id: 'oac',
      title: 'S3 + OAC（バケットを非公開のまま配信）',
      icon: 'ShieldCheck',
      blocks: [
        {
          type: 'paragraph',
          html:
            '静的ファイルはS3に置きますが、<strong>バケットは公開しません</strong>。代わりに<strong>OAC(Origin Access Control)</strong>を使い、「このCloudFrontディストリビューションからのアクセスだけ」をバケットポリシーで許可します。',
        },
        {
          type: 'flow',
          steps: [
            { label: '利用者', accent: 'slate' },
            { label: 'CloudFront', sublabel: 'OACで署名', accent: 'blue' },
            { label: 'S3 (非公開)', sublabel: 'CloudFrontのみ許可', accent: 'emerald' },
          ],
        },
        {
          type: 'list',
          items: [
            'バケットは <code>Block Public Access</code> を有効のままにできる(直接URLでは取得不可)',
            'OACはCloudFrontがオリジンへのリクエストに<strong>SigV4署名</strong>を付ける仕組み。古い<strong>OAI(Origin Access Identity)</strong>の後継で、新規はOACが推奨',
            '演習で「静的ファイルはCloudFront経由でだけ取得する」という条件があったのは、このOACの考え方を表している',
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'バケットを公開しない理由',
          html: 'バケットを公開すると、CloudFrontを迂回して直接アクセスされ、WAF・キャッシュ・アクセス制御を素通りされます。<strong>入口はCloudFrontの1つだけ</strong>に保つのが原則です。',
        },
      ],
    },
    {
      id: 'edge-functions',
      title: 'CloudFront Functions / Lambda@Edge（エッジ処理）',
      icon: 'CornerDownRight',
      blocks: [
        {
          type: 'paragraph',
          html:
            'リクエストやレスポンスを<strong>エッジで軽く加工</strong>したいことがあります。記事サイト演習の「URL正規化(末尾スラッシュや大文字を正規URLへ寄せる)」がその例です。これにはCloudFront FunctionsかLambda@Edgeを使います。',
        },
        {
          type: 'compare',
          columns: [
            {
              title: 'CloudFront Functions',
              subtitle: '超軽量・低レイテンシ',
              accent: 'blue',
              points: [
                'JavaScript。実行はサブミリ秒・超低コスト',
                '<strong>Viewer Request / Response</strong> のみ',
                'URL書き換え・リダイレクト・ヘッダ操作・簡易な認可チェック向き',
                'ネットワークアクセスやリクエストボディは扱えない',
              ],
            },
            {
              title: 'Lambda@Edge',
              subtitle: '高機能',
              accent: 'amber',
              points: [
                'Node.js/Python。数十〜百msオーダー',
                'Viewer/Origin の Request/Response 全4種で動かせる',
                '外部API呼び出しやボディ操作など重い処理が可能',
                'その分コストとレイテンシは大きい',
              ],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'まずはCloudFront Functions',
          html: 'URL正規化やリダイレクト、ヘッダ付与のような<strong>短い処理はCloudFront Functions</strong>で十分です。オリジンへ届く前にレスポンスを返せるため、アプリ(ECS)に無駄なリクエストを通しません。',
        },
      ],
    },
    {
      id: 'waf',
      title: 'WAF（入口での不正リクエスト対策）',
      icon: 'ShieldAlert',
      blocks: [
        {
          type: 'paragraph',
          html:
            'WAF(Web Application Firewall)は<strong>HTTPの中身を見て</strong>悪性リクエストを弾く層です。SQLインジェクション/XSS対策、レート制限、地理制限、不正Botの抑制などを行います。',
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'WAFは入口に「関連付ける」',
          html: 'WAFは独立した通過点ではなく、<strong>CloudFront(またはALB)に関連付けるWeb ACL</strong>です。CloudFrontに付けるとリクエストは<strong>エッジで評価</strong>され、ルールに反するものはアプリに届く前に弾かれます。CloudFront用のWeb ACLは <code>CLOUDFRONT</code> スコープ(us-east-1)で作ります。',
        },
        {
          type: 'paragraph',
          html:
            'SG(L3/L4のポート制御)・WAF(L7の中身検査)・認証認可(誰が何をしてよいか)は<strong>層が違い役割が重なりません</strong>。守備範囲の整理は<span class="font-bold">監視・ログ・アラーム</span>ガイドも参照してください。',
        },
      ],
    },
    {
      id: 'cognito',
      title: 'Cognito（認証とトークン発行）',
      icon: 'LockKeyhole',
      blocks: [
        {
          type: 'paragraph',
          html:
            '会員制SaaSや社内検索アプリでは、「誰がログインしているか」を確かめる<strong>認証</strong>が要ります。これを自前のパスワード管理ではなくマネージドに担うのがCognitoです。',
        },
        {
          type: 'compare',
          columns: [
            {
              title: 'User Pool',
              subtitle: 'ユーザー認証',
              accent: 'emerald',
              points: [
                'ユーザーディレクトリ + サインイン',
                'ログイン成功で<strong>JWT(IDトークン/アクセストークン)</strong>を発行',
                'Hosted UI・MFA・ソーシャルログイン・パスワードポリシー',
              ],
            },
            {
              title: 'Identity Pool',
              subtitle: 'AWS資格情報の発行',
              accent: 'blue',
              points: [
                '認証済みID → 一時的なIAM資格情報へ交換',
                'ブラウザから直接S3等を呼ぶ場合に使う',
                'まずはUser Pool(ログイン)を基準に理解する',
              ],
            },
          ],
        },
        {
          type: 'steps',
          steps: [
            { title: '利用者がCognitoでログイン', html: 'Hosted UIやSDKで認証し、User PoolがJWTを返す。', accent: 'emerald' },
            { title: 'アプリはトークン付きでAPIを呼ぶ', html: 'ブラウザは <code>Authorization</code> ヘッダにトークンを載せてリクエストする。', accent: 'blue' },
            { title: 'トークンを検証して認可', html: 'アプリ(ECS)やALBがJWTの署名・有効期限・スコープを検証し、正当なら処理する。', accent: 'amber' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'ALBでログインを肩代わりする',
          html: 'ALBには <code>authenticate-cognito</code> アクションがあり、<strong>未ログインのリクエストをCognitoへリダイレクトしてログインを強制</strong>できます。アプリ側に認証コードを書かずに入口で守れるため、社内向けアプリで便利です。',
        },
        {
          type: 'callout',
          variant: 'warn',
          title: '認証 ≠ 認可',
          html: '<strong>認証(あなたは誰か)</strong>が通っても、<strong>認可(その操作をしてよいか)</strong>は別です。ロールや所有者チェックはアプリ側のロジックで必ず行います。Cognitoは主に認証を担います。',
        },
      ],
    },
  ],
  checkpoints: [
    'Route 53のAliasレコードがCNAMEと違う点(apexに置ける/AWSリソースを指す)を説明できるか',
    'CloudFrontのビヘイビアで <code>/*</code> をS3、<code>/api/*</code> をALBへ振り分ける意味を説明できるか',
    'S3バケットを公開せずOAC経由でだけ配信する理由を説明できるか',
    'CloudFront Functions と Lambda@Edge の使い分けを説明できるか',
    'WAFをCloudFront/ALBに「関連付ける」とはどういうことか説明できるか',
    'Cognito User Poolが発行するトークンを、誰が・いつ検証するか説明できるか',
  ],
  references: [
    { label: 'Routing traffic to CloudFront (Alias records)', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-to-cloudfront-distribution.html' },
    { label: 'Restricting access to an S3 origin (OAC)', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html' },
    { label: 'CloudFront Functions', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-functions.html' },
    { label: 'Customizing at the edge with Lambda@Edge', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-at-the-edge.html' },
    { label: 'Authenticate users using an Application Load Balancer', url: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-authenticate-users.html' },
    { label: 'Amazon Cognito user pools', url: 'https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html' },
  ],
};

export default config;
