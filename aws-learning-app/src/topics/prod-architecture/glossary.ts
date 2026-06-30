import type { GlossaryDatabase } from '../../types/glossary';
import type { GlossaryCategory } from '../../types/topic';

export const glossary: GlossaryDatabase = {
  cloudfront: {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Amazon-CloudFront_48.svg',
    title: 'CloudFront (CDN / パス振り分け)',
    eng: 'AMAZON CLOUDFRONT',
    oneLiner: '1つのドメインの入口として、パスごとにS3とALBへリクエストを振り分けるCDN',
    detail: `世界中のエッジロケーションからコンテンツを配信するCDNです。
            <br><br>この構成ではCloudFrontが唯一の入口になり、<strong>Cache Behavior</strong>でリクエストパスを見てOriginを選びます。<code>/api/*</code> はALBへ、それ以外はDefault BehaviorでS3へ向かいます。静的ファイルはキャッシュし、APIはキャッシュしない(または極小TTL)のが基本です。`,
    focus: `フロントエンドとAPIを同一ドメインに統一できるため、CORSや別ドメインCookieの問題を避けやすくなります。注意点として、SPAの404対策(存在しないパスをindex.htmlに戻す)は画面パスだけに適用し、<code>/api/*</code>へ適用してはいけません。APIレスポンスがHTMLに化けてしまいます。`,
  },
  's3-oac': {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Storage/48/Arch_Amazon-Simple-Storage-Service_48.svg',
    title: 'S3 + OAC (フロントエンド配信)',
    eng: 'AMAZON S3 + ORIGIN ACCESS CONTROL',
    oneLiner: 'ビルド済みフロントエンドの置き場。OACでCloudFront経由のみ読めるようにする',
    detail: `S3はHTML/CSS/JS/画像などの静的ファイルを置くストレージです。
            <br><br><strong>OAC(Origin Access Control)</strong>を使うと、CloudFrontがS3へリクエストする際に署名を付け、S3のbucket policyで「このCloudFront distributionからの署名付きリクエストだけ許可」にできます。バケットをpublicにする必要がありません。`,
    focus: `バケットをpublicにすると、CloudFrontを通さず直接URLで読めてしまい、アクセス制御やキャッシュ・ログの一元管理が崩れます。OACで配信経路をCloudFrontに一本化するのが本番の基本です。OACは旧来のOAIの後継で、新規構築ではOACを使います。`,
  },
  alb: {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Elastic-Load-Balancing_48.svg',
    title: 'ALB (Application Load Balancer)',
    eng: 'APPLICATION LOAD BALANCER',
    oneLiner: 'CloudFrontから来た /api/* を受け、Target Groupに登録されたECS Taskへ転送する公開窓口',
    detail: `Public Subnetに配置するHTTP/HTTPSロードバランサーです。
            <br><br>443番のlistenerで受け、<strong>listener rule</strong>でパス(例: <code>/api/*</code>, <code>/health</code>)を見て<strong>Target Group</strong>へ転送します。Target Groupには、health checkに通ったターゲットだけが残ります。`,
    focus: `この構成のTarget Groupは<code>target_type = "ip"</code>で、ECS TaskのPrivate IP:3000が登録されます。Fargateの<code>awsvpc</code>モードでTaskごとにIPが割り当てられるためです。ALBを表に立てることで、ECS本体をPrivate Subnetに隠したままサービス提供できます。`,
  },
  ecs: {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.svg',
    title: 'ECS Fargate (APIアプリ実行環境)',
    eng: 'ELASTIC CONTAINER SERVICE (FARGATE)',
    oneLiner: 'APIアプリをコンテナとして動かすマネージドな実行基盤。増減する単位はTask',
    detail: `Dockerコンテナを実行するマネージドサービスで、Fargateを使うとEC2インスタンスを自分で管理せずに済みます。
            <br><br><strong>Task Definition</strong>(設計図) から <strong>Task</strong>(実体) が起動し、<strong>Service</strong>が指定数(desired_count)を維持します。Auto Scalingが増減させるのはEC2ではなく<strong>Task数</strong>です。`,
    focus: `Service Auto ScalingはCPU/メモリ/リクエスト数などの指標でTask数を増減します。デプロイはローリング方式で、新Taskがhealth checkに通ってから旧Taskを止めます。health checkに通らないとデプロイが進まないのが安全弁です。`,
  },
  rds: {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Database/48/Arch_Amazon-RDS_48.svg',
    title: 'RDS PostgreSQL',
    eng: 'AMAZON RDS (POSTGRESQL)',
    oneLiner: 'アプリの永続データを持つDB。Private Subnetに置き、ECSからのみ接続を許可する',
    detail: `マネージドなリレーショナルDBサービスです。
            <br><br>本番ではPrivate Subnetに置き(<code>publicly_accessible = false</code>)、SGでECSのSGからの5432番だけを許可します。<strong>DB subnet group</strong>に複数AZのPrivate Subnetを入れ、<strong>Multi-AZ</strong>で高可用性を確保します。`,
    focus: `Multi-AZ(高可用性・failover用、standbyは通常読めない)とRead Replica(読み取り負荷分散・別エンドポイント)は別物です。「Multi-AZにすれば読み取りも速くなる」は誤解です。パスワードはコードに書かず、Secrets Manager等で管理し、ECS Task Definitionの<code>secrets</code>で注入します。`,
  },
  ecr: {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Registry_48.svg',
    title: 'ECR (コンテナ画像レジストリ)',
    eng: 'ELASTIC CONTAINER REGISTRY',
    oneLiner: 'ビルドしたコンテナ画像を保管する場所。ECS TaskはここからImageをpullする',
    detail: `Dockerコンテナ画像を保管するマネージドなレジストリです。
            <br><br>GitHub Actionsがビルドした画像をpushし、ECS Serviceの更新時にTaskがここからpullして起動します。タグ(コミットSHAなど)で画像のバージョンを管理します。`,
    focus: `Private SubnetのTaskがECRからpullするには、NAT Gateway、または <code>ecr.api</code> と <code>ecr.dkr</code> のInterface Endpoint + S3 Gateway Endpoint が必要です。画像レイヤの実体はS3にあるため、S3への経路が欠けるとpullに失敗します。`,
  },
  'github-oidc': {
    icon: 'GitBranch',
    title: 'GitHub Actions OIDC',
    eng: 'GITHUB ACTIONS OIDC',
    oneLiner: '長期キーを保存せず、実行ごとに一時クレデンシャルでAWSへデプロイする仕組み',
    detail: `OIDC(OpenID Connect)を使うと、ワークフロー実行ごとにGitHubが発行する署名付きIDトークンでAWSロールをassumeし、短命の一時クレデンシャルを得られます。
            <br><br>AWS側には「GitHubのOIDCプロバイダ」を1つ登録し、ロールの<strong>trust policy</strong>で「どのリポジトリ/ブランチからのassumeを許すか」を条件にします。`,
    focus: `IAMユーザーの長期アクセスキーをGitHub Secretsに置く方式は、漏洩時の被害が大きく管理も面倒です。OIDCならキーを保存せず、数時間で失効します。trust policyの<code>sub</code>条件を緩めると他リポジトリからassumeされ得るため、リポジトリ/ブランチ単位で必ず絞ります。`,
  },
};

export const glossaryCategories: GlossaryCategory[] = [
  {
    label: '入口・配信',
    termIds: ['cloudfront', 's3-oac', 'alb'],
  },
  {
    label: 'アプリ・データ',
    termIds: ['ecs', 'rds'],
  },
  {
    label: 'デプロイ',
    termIds: ['ecr', 'github-oidc'],
  },
];
