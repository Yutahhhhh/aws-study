import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'dns-tls-domain',
  title: '独自ドメイン公開と DNS / TLS',
  description: 'Route 53・ACM・CloudFront/ALBで、独自ドメインをHTTPSで公開するまでの実務手順と落とし穴',
  headerLabel: 'AWS DNS & TLS',
  homeIcon: 'Globe2',
  homeColor: 'blue',
  intro:
    'アプリが動いても、<strong>example.com でHTTPSで開ける</strong>ようになるまでが公開作業です。このガイドでは、ドメイン取得からRoute 53のレコード設定、ACM証明書の発行・検証、CloudFront/ALBへの紐づけ、HTTPSリダイレクトまでを、実務の順序で整理します。',
  sections: [
    {
      id: 'big-picture',
      title: '全体像: 名前解決と証明書の2本柱',
      icon: 'Map',
      blocks: [
        {
          type: 'paragraph',
          html: '独自ドメイン公開の作業は「<strong>名前をIP/エンドポイントに解決させる(DNS)</strong>」と「<strong>その名前で暗号化通信できる証明書を用意する(TLS)</strong>」の2本柱です。それぞれ担当サービスが分かれます。',
        },
        {
          type: 'flow',
          title: '公開までの流れ',
          steps: [
            { label: 'ドメイン取得', sublabel: 'Route 53 / 外部レジストラ', accent: 'slate' },
            { label: 'Hosted Zone作成', sublabel: 'Route 53', accent: 'blue' },
            { label: '証明書発行+DNS検証', sublabel: 'ACM', accent: 'emerald' },
            { label: 'CloudFront / ALBに紐づけ', sublabel: '配信側の設定', accent: 'amber' },
            { label: 'ALIASレコード作成', sublabel: '名前→配信先', accent: 'blue' },
            { label: 'HTTPS強制', sublabel: 'リダイレクト設定', accent: 'rose' },
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'ドメインはどこで買ってもよい',
          html: 'ドメインをお名前.com等の外部レジストラで取得しても、<strong>NSレコードをRoute 53のHosted Zoneへ向ければ</strong>DNS管理はRoute 53でできます。逆にRoute 53で取得すればNS設定は自動です。',
        },
      ],
    },
    {
      id: 'route53-records',
      title: 'Route 53: レコードの使い分け',
      icon: 'ListTree',
      blocks: [
        {
          type: 'paragraph',
          html: 'Hosted Zoneは「そのドメインの電話帳」です。実務で触るレコードは多くありません。以下を押さえれば大半のケースに対応できます。',
        },
        {
          type: 'table',
          headers: ['レコード', '用途', 'Webアプリでの典型例'],
          rows: [
            ['<strong>A (ALIAS)</strong>', '名前→AWSリソース', 'example.com → CloudFront / ALB。<strong>AWSではALIASが基本</strong>'],
            ['<strong>CNAME</strong>', '名前→別の名前', 'www.example.com → example.com、SaaSの検証用レコード'],
            ['<strong>TXT</strong>', '所有確認・メール認証', 'ACM/Google検証、SPF、DKIM、DMARC'],
            ['<strong>MX</strong>', 'メール受信先', 'Google Workspace等を使う場合に設定'],
            ['<strong>NS / SOA</strong>', 'ゾーンの委任情報', '自動作成。<strong>基本触らない</strong>'],
          ],
          caption: '実務で使う主なレコード',
        },
        {
          type: 'compare',
          columns: [
            {
              title: 'ALIASレコード (AWS拡張)',
              subtitle: 'AWSリソースへ向けるならこちら',
              accent: 'blue',
              points: [
                'Zone Apex(example.com)に<strong>使える</strong>',
                'CloudFront/ALB/S3など、IPが変動するAWSリソースを名指しできる',
                'クエリ料金が無料',
              ],
            },
            {
              title: 'CNAMEレコード (標準)',
              subtitle: '別名を張る汎用手段',
              accent: 'slate',
              points: [
                'Zone Apexには<strong>使えない</strong>(DNS仕様の制約)',
                'AWS以外のサービスへ向ける時や検証レコードで使う',
                '「wwwをapexへ寄せる」用途でも使う',
              ],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'TTLと切り替え作業',
          html: 'レコードにはTTL(キャッシュ時間)があります。<strong>移行や切り替えの前にはTTLを短く(例: 60秒)しておく</strong>のが定石です。TTL 86400のまま切り替えると、最大1日、旧参照先へアクセスが飛び続けます。',
        },
      ],
    },
    {
      id: 'acm',
      title: 'ACM: 証明書の発行と検証',
      icon: 'BadgeCheck',
      blocks: [
        {
          type: 'paragraph',
          html: 'ACM(AWS Certificate Manager)の証明書は<strong>無料で、自動更新</strong>されます。自前でLet&#39;s Encryptを回すよりも運用が軽く、AWSで配信するなら第一選択です。',
        },
        {
          type: 'steps',
          steps: [
            { title: '証明書をリクエスト', html: 'example.com と *.example.com を1枚に含める(ワイルドカード)のが実務では便利。', accent: 'emerald' },
            { title: 'DNS検証を選ぶ', html: 'ACMが指定するCNAMEレコードをHosted Zoneに作ると検証が通る。Route 53なら<strong>ボタン1つで自動作成</strong>。メール検証は更新も手動になるので避ける。', accent: 'emerald' },
            { title: '検証レコードは消さない', html: 'この CNAME がある限り<strong>自動更新され続ける</strong>。掃除のつもりで消すと、期限切れ事故の原因になる。', accent: 'rose' },
          ],
        },
        {
          type: 'callout',
          variant: 'danger',
          title: 'CloudFront用の証明書は us-east-1 で作る',
          html: 'CloudFrontはグローバルサービスのため、紐づける証明書は<strong>バージニア北部(us-east-1)のACM</strong>で発行する必要があります。ALB用は<strong>ALBと同じリージョン</strong>です。「証明書が選択肢に出てこない」場合、ほぼこのリージョン違いが原因です。',
        },
        {
          type: 'table',
          headers: ['紐づけ先', '証明書のリージョン', '備考'],
          rows: [
            ['CloudFront', '<strong>us-east-1 固定</strong>', 'Alternate Domain Names(CNAMEs)にドメインを書く'],
            ['ALB', 'ALBと同じリージョン', 'HTTPS(443)リスナーに証明書を設定'],
            ['API Gateway', 'カスタムドメインの種類による', 'Edge型はus-east-1、Regional型は同リージョン'],
          ],
        },
      ],
    },
    {
      id: 'https',
      title: 'HTTPS強制とリダイレクト',
      icon: 'Lock',
      blocks: [
        {
          type: 'paragraph',
          html: '証明書を付けただけでは、http:// でもアクセスできてしまいます。<strong>HTTP→HTTPSのリダイレクト</strong>を配信側で設定し、常時HTTPSにします。',
        },
        {
          type: 'compare',
          columns: [
            {
              title: 'CloudFront',
              accent: 'blue',
              points: [
                'Viewer Protocol Policyを<strong>Redirect HTTP to HTTPS</strong>に',
                'Response Headers PolicyでHSTSヘッダーを付与できる',
                'wwwなしへの正規化はCloudFront Functionsで',
              ],
            },
            {
              title: 'ALB',
              accent: 'amber',
              points: [
                'HTTP(80)リスナーに<strong>443へのリダイレクトルール</strong>を設定',
                'HTTPS(443)リスナーで証明書とセキュリティポリシー(TLSバージョン)を指定',
                '古いTLS 1.0/1.1は無効化されたポリシーを選ぶ',
              ],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'HSTS (Strict-Transport-Security)',
          html: '一度HTTPSで訪れたブラウザに「以後この期間はHTTPSのみ使う」と記憶させるヘッダーです。リダイレクト前の初回HTTP通信すら無くせます。<code>max-age=31536000; includeSubDomains</code> が定番ですが、<strong>付けた後にHTTPへ戻すことはできない</strong>ので本番安定後に導入します。',
        },
      ],
    },
    {
      id: 'subdomain-strategy',
      title: 'サブドメイン戦略 (api. と www.)',
      icon: 'Network',
      blocks: [
        {
          type: 'paragraph',
          html: 'フロントとAPIをどう配置するかは、Cookie・CORS・証明書に影響する設計判断です。',
        },
        {
          type: 'compare',
          columns: [
            {
              title: '同一ドメイン + パス分岐',
              subtitle: 'example.com/api/*',
              accent: 'emerald',
              points: [
                'CloudFrontのビヘイビアで /api/* をALBへ転送',
                '<strong>CORS不要・Cookieもそのまま</strong>で認証が簡単',
                'CDNの設定がやや複雑になる',
              ],
            },
            {
              title: 'サブドメイン分離',
              subtitle: 'api.example.com',
              accent: 'blue',
              points: [
                'フロントとAPIを独立に配信・スケールできる',
                '<strong>CORS設定とCookieのDomain属性</strong>の設計が必要',
                'チーム分割や複数クライアント(アプリ等)に向く',
              ],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'wwwあり/なしはどちらかに正規化',
          html: 'www.example.com と example.com の両方を受けつつ、<strong>どちらかへ301リダイレクトで寄せます</strong>。両方をそのまま配信するとSEO上も分析上も分裂します。',
        },
      ],
    },
    {
      id: 'verification',
      title: '公開前の動作確認コマンド',
      icon: 'TerminalSquare',
      blocks: [
        {
          type: 'paragraph',
          html: '「設定したのに開けない」時は、DNS→TLS→HTTPの順に切り分けます。',
        },
        {
          type: 'code',
          code: `# 1. DNSが引けるか (ALIASの解決先を確認)
dig example.com +short

# 2. NSがRoute 53を向いているか (外部レジストラ利用時の定番ミス)
dig example.com NS +short

# 3. 証明書が正しいか (期限・SAN・チェーン)
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null | openssl x509 -noout -dates -subject

# 4. HTTP→HTTPSリダイレクトを確認
curl -I http://example.com

# 5. 末端まで届くか (ヘッダーでキャッシュ状態も見える)
curl -sSI https://example.com | head -20`,
          caption: '切り分けの順序: DNS → TLS → HTTP',
        },
        {
          type: 'list',
          items: [
            '<strong>digが引けない</strong> → Hosted ZoneのNSとレジストラのNS設定を照合する',
            '<strong>証明書エラー</strong> → ドメイン名が証明書のSANに含まれているか、CloudFrontのCNAMEs設定を確認',
            '<strong>403/404</strong> → DNSとTLSは正常。配信側(CloudFrontのビヘイビア、S3のOAC、ALBのルール)を疑う',
            '<strong>反映されない</strong> → TTL内の古いキャッシュ。<code>dig @8.8.8.8</code> や別回線で確認',
          ],
        },
      ],
    },
  ],
  checkpoints: [
    'ALIASレコードとCNAMEレコードの違いと、Zone Apexで使えるのはどちらかを説明できる',
    'ACMのDNS検証の仕組みと、検証用CNAMEを消してはいけない理由を説明できる',
    'CloudFront用の証明書をus-east-1で作る理由を説明できる',
    'ドメインで開けない時に、DNS→TLS→HTTPの順で切り分けるコマンドを挙げられる',
  ],
  references: [
    { label: 'Route 53 開発者ガイド', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html' },
    { label: 'ACM ユーザーガイド (DNS検証)', url: 'https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html' },
    { label: 'CloudFront カスタムドメインの要件', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/CNAMEs.html' },
  ],
};

export default config;
