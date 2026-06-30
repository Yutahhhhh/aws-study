import type { GlossaryDatabase } from '../../types/glossary';
import type { GlossaryCategory } from '../../types/topic';

export const glossary: GlossaryDatabase = {
  'ip-header': {
    icon: 'Mail',
    title: 'IPヘッダー',
    eng: 'IP HEADER',
    oneLiner: 'パケットの先頭に付く、送信元IPや宛先IPなどを記録した制御情報',
    detail: `ネットワーク上を往復するすべてのデータ(パケット)の先頭には「IPヘッダー」と呼ばれるデータが数バイト分くっついています。
            <br><br>ここには主に、<strong>「送信元のIPアドレス」</strong>と<strong>「宛先(目的地)のIPアドレス」</strong>、その他に通信の寿命(TTL)などが記録されています。ルーターなどの機器は、このIPヘッダーの情報を読み込んで次の目的地へパケットを転送します。`,
    focus: `通信エラーの調査では、IPヘッダーの『送信元』や『宛先』が想定どおりかを見ることが重要です。Wiresharkなどでパケットキャプチャを行い、NATやロードバランサーを通過した後のIPを確認できると、原因を切り分けやすくなります。`,
  },
  nat: {
    icon: 'RefreshCw',
    title: 'NAT (ネットワーク・アドレス変換)',
    eng: 'NETWORK ADDRESS TRANSLATION',
    oneLiner: 'プライベートIPとパブリックIPの境界で、通信が成立するようにIPアドレスを変換する仕組み',
    detail: `インターネット上のルールとして、「10.0.x.x」などのプライベートIPはインターネットを移動できません。
            <br><br>そのため、VPC内のプライベートIPを持つリソースがインターネットと通信するには、境界でアドレス変換が必要になります。AWSでは、Public SubnetのリソースがパブリックIPv4を持つ場合はIGWが1対1 NATを担い、Private Subnetから外へ出る場合はNAT Gatewayを使うのが一般的です。`,
    focus: `NATがあるおかげで、Private Subnet内のECSからSlackや決済APIなどの外部サービスを呼び出せます。設計時は「そのリソースは外から入られる必要があるのか」「外へ出るだけでよいのか」を分けて考えると、IGW・ALB・NAT Gatewayの役割が整理しやすくなります。`,
  },
  routing: {
    icon: 'Map',
    title: 'ルーティング (道案内)',
    eng: 'ROUTING',
    oneLiner: 'パケットの宛先IPを見て、次にどの経路へ転送するかを決める仕組み',
    detail: `ネットワーク上のパケットに対し、次に向かうべき適切な方向を指し示すプロセスです。
            <br><br>AWS上では<strong>「ルートテーブル」</strong>という仮想の地図がこの役割を担っています。例えば、『もし宛先IPが 0.0.0.0/0(インターネットのすべての場所)だったら、インターネットゲートウェイ(IGW)の門に運びなさい』といったルール(道しるべ)を定義し、パケットを目的地まで正しく誘導します。`,
    focus: `「コンテナからSlackへの通信がタイムアウトする」などのエラーでは、ルートテーブルに正しい経路があるかをまず確認します。そのうえで、経路はあるがSGで止まっているのか、そもそもNAT GatewayやIGWへの道がないのかを分けて考えるのが大切です。`,
  },
  'public-private-ip': {
    icon: 'Key',
    title: 'パブリックIPとプライベートIP',
    eng: 'PUBLIC IP vs PRIVATE IP',
    oneLiner: 'インターネットから到達可能な住所(パブリック)と、VPC内部で使う住所(プライベート)',
    detail: `・<strong>パブリック(グローバル)IP:</strong> インターネット上でルーティング可能な住所。ALBなどインターネットに公開する機器に割り当てます。
            <br>・<strong>プライベートIP:</strong> VPC内(10.0.0.0/16など)で使う住所。外のインターネットから、この住所へ直接ルーティングすることはできません。ECSやRDSなどの内部リソースに割り当てます。`,
    focus: `DBやECSをPrivate Subnetに置く設計は、リソースへインターネットから直接到達させないための基本です。一方、ユーザーからアクセスを受けるALBは、インターネット向けロードバランサーとして公開エンドポイントを持たせます。`,
  },
  'port-number': {
    icon: 'Door',
    title: 'ポート番号とポートフォワーディング',
    eng: 'PORT NUMBER & PORT FORWARDING',
    oneLiner: '同じIPアドレス上のアプリケーションを識別する番号と、別ポートの宛先へ中継する考え方',
    detail: `ひとつのサーバー(IPアドレス)の中では複数のプログラム(RailsやDBなど)が動きます。これらを識別するための部屋番号が<strong>ポート番号</strong>です。
            <br><br>・HTTPS接続 ➔ <code>443</code>
            <br>・Railsの開発・内部待ち受け例 ➔ <code>3000</code>
            <br>・PostgreSQL ➔ <code>5432</code>
            <br><br>ALBでは、ユーザーからは443番で受け、ターゲットグループ側ではECSの3000番へ転送する、といった構成を取れます。厳密には単純なIPパケットのポート書き換えではなく、ALBがリクエストを受けてターゲットへ新しい接続として転送します。`,
    focus: `一般ユーザーにRailsの3000番を直接公開する必要はありません。ALBが443番の公開窓口になり、裏側のECSへ3000番で転送することで、アプリ本体をPrivate SubnetやSGで守ったままサービス提供できます。`,
  },
  vpc: {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Amazon-Virtual-Private-Cloud_48.svg',
    title: 'VPC (Virtual Private Cloud)',
    eng: 'VIRTUAL PRIVATE CLOUD',
    oneLiner: 'AWS上に作る、論理的に隔離された自分専用の仮想ネットワーク',
    detail: `AWS上に構築する隔離されたネットワーク空間です。
            <br><br>ここで独自にIPアドレス帯(例: <code>10.0.0.0/16</code>)を設定し、その中にパブリックサブネットやプライベートサブネットという細かい敷地区分を切り出し、ALB、ECS、RDSなどのインスタンスを配置していきます。他の誰のネットワークとも干渉しない、独立した独自の空間です。`,
    focus: `ECS、ALB、RDSなどVPC内に置くサービスを使う場合、まずVPCとサブネットの設計が土台になります。どのリソースを公開側に置き、どれを非公開側に置くかが、セキュリティと通信経路の大枠を決めます。`,
  },
  igw: {
    icon: '/src/assets/aws/Resource-Icons_07312025/Res_Networking-Content-Delivery/Res_Amazon-VPC_Internet-Gateway_48.svg',
    title: 'IGW (インターネットゲートウェイ)',
    eng: 'INTERNET GATEWAY',
    oneLiner: 'VPCとインターネットの間で通信するために使う、VPCにアタッチするゲートウェイ',
    detail: `VPCにアタッチして使用するAWS提供のネットワークコンポーネントです。
            <br><br>Public Subnetのルートテーブルで <code>0.0.0.0/0</code> の宛先をIGWへ向けることで、インターネットとの通信経路ができます。また、Public IPv4を持つリソースでは、IGWがプライベートIPとパブリックIPの1対1 NATを論理的に担います。`,
    focus: `インターネット向けALBや、パブリックIPを持つECSタスクを使う場合は、VPCにIGWをアタッチし、対象サブネットのルートをIGWへ向ける必要があります。IGWがないと、公開向けのリソースを置いてもインターネットから到達できません。`,
  },
  alb: {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Elastic-Load-Balancing_48.svg',
    title: 'ALB (Application Load Balancer)',
    eng: 'APPLICATION LOAD BALANCER',
    oneLiner: 'HTTP/HTTPSリクエストを受け、背後のECSなどのターゲットへ振り分ける公開窓口',
    detail: `パブリックサブネットに配置する高機能ロードバランサーです。
            <br><br>世界中から届く <code>example.com</code> 宛てのHTTP/HTTPS通信を受け取り、ターゲットグループに登録されたECSタスクなどへ転送します。ターゲットのヘルスチェックを行い、正常なターゲットへだけリクエストを流す役割も持ちます。`,
    focus: `ALBを表に立てることで、一般ユーザーからECSタスクへ直接アクセスさせずに済みます。ECS本体はPrivate Subnetに置き、SGでALBからの通信だけを許可する構成がよく使われます。`,
  },
  ecs: {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.svg',
    title: 'ECS Fargate (コンテナ実行環境)',
    eng: 'ELASTIC CONTAINER SERVICE (FARGATE)',
    oneLiner: 'Railsなどのアプリケーションコンテナを起動・運用するためのマネージドな実行基盤',
    detail: `Dockerコンテナを使ってアプリケーションを実行するAWSのマネージドサービスです。
            <br><br>サーバー自体の管理を不要にする「Fargate」を使うと、EC2インスタンスを直接管理せずにコンテナを実行できます。アプリケーション側は、コンテナイメージ、CPU/メモリ、環境変数、ネットワーク設定などを定義して運用します。`,
    focus: `安全設計の基本形は、ECSをPrivate Subnetに配置し、外部からの入口はALBに集約することです。ただし、コンテナがECRからイメージを取得したり、外部APIへ接続したりするには、NAT GatewayまたはVPCエンドポイントなど、外部・AWSサービスへ到達する経路が必要になります。`,
  },
  'nat-gateway': {
    icon: '/src/assets/aws/Resource-Icons_07312025/Res_Networking-Content-Delivery/Res_Amazon-VPC_NAT-Gateway_48.svg',
    title: 'NAT Gateway',
    eng: 'NAT GATEWAY',
    oneLiner: 'Private Subnetのリソースが、外部APIやインターネットへ出ていくためのアウトバウンド用NAT',
    detail: `プライベートサブネット内のECSなどは直接インターネットに繋がっていません。
            <br><br>そこで、これらプライベートリソースからの「Slack、Stripe、外部APIへ通信したい」というアウトバウンド通信を、Public Subnet上のNAT Gatewayが代理でインターネットへ送り出します。インターネット側からPrivate Subnet内のリソースへ新規接続を開始する用途には使いません。`,
    focus: `NAT Gatewayには時間課金とデータ処理料金が発生します。そのため小規模な検証では、ECSをPublic Subnetに置いてパブリックIPを付与し、SGで入口を絞る構成が選ばれることもあります。ただし、本番ではセキュリティ要件、運用、料金を見て慎重に判断します。`,
  },
  'security-group': {
    icon: 'Shield',
    title: 'セキュリティグループ (SG)',
    eng: 'SECURITY GROUP',
    oneLiner: 'ALB、ECS、RDSなどに紐づけて、許可した通信だけを通す仮想ファイアウォール',
    detail: `ネットワークの各コンポーネントに割り当てる仮想ファイアウォールです。
            <br><br>セキュリティグループでは、<strong>送信元、送信先、プロトコル、ポート</strong>を指定して許可ルールを作ります。新しく作成したSGはインバウンドが許可なし、アウトバウンドは全許可が初期状態です。必要に応じてアウトバウンドも絞り込みます。`,
    focus: `実務トラブルでは、SGの許可漏れで通信が止まっているケースがよくあります。ECSへALBから通信させる場合は、ECSのSGで「ALBのSGから3000番を許可」のように、IPアドレスではなくSG参照で許可すると管理しやすく安全です。`,
  },
};

export const glossaryCategories: GlossaryCategory[] = [
  {
    label: '基本ネットワーク用語',
    termIds: ['ip-header', 'nat', 'routing', 'public-private-ip', 'port-number'],
  },
  {
    label: 'AWS インフラ製品',
    termIds: ['vpc', 'igw', 'alb', 'ecs', 'nat-gateway', 'security-group'],
  },
];
