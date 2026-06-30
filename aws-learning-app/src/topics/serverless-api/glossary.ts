import type { GlossaryDatabase } from '../../types/glossary';
import type { GlossaryCategory } from '../../types/topic';

export const glossary: GlossaryDatabase = {
  'api-gateway': {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Amazon-API-Gateway_48.svg',
    title: 'API Gateway',
    eng: 'AMAZON API GATEWAY',
    oneLiner: 'HTTPの入口。認証・スロットリング・検証をしてLambda等へ繋ぐ',
    detail: `API GatewayはサーバーレスAPIの入口です。認証(IAM/Cognito/Lambda Authorizer)、レート制限、リクエスト/レスポンス変換、ステージ管理を担います。
            <br><br>安価でシンプルなHTTP APIと、機能が豊富なREST APIがあります。`,
    focus: `「ALB+ECS」の代わりに「API Gateway+Lambda」を選ぶ判断軸は、トラフィックの山谷が大きい/常駐不要/運用を減らしたい、など。常時高負荷ならECSの方が安いことも。`,
  },
  'lambda-invoke': {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Compute/48/Arch_AWS-Lambda_48.svg',
    title: 'Lambda と invoke',
    eng: 'AWS LAMBDA',
    oneLiner: 'コードだけを置き、イベントが来た時だけ実行される関数',
    detail: `Lambdaはサーバーを管理せず関数コードだけを置きます。API Gateway/S3/SQS/EventBridgeなどのイベントでinvokeされ、実行時間とメモリで課金されます。
            <br><br>同期(APIなど)と非同期(S3イベントなど)の呼び出しがあります。`,
    focus: `常駐しないので「アイドル時0円」。一方で1回の最大15分・サイズ制限・状態を持てない等の制約があります。状態はDynamoDB/S3など外部へ。`,
  },
  'lambda-execution-role': {
    icon: 'KeyRound',
    title: 'Execution Role (実行ロール)',
    eng: 'LAMBDA EXECUTION ROLE',
    oneLiner: 'Lambdaが他のAWSサービスへアクセスする権限。鍵を持ち歩かない',
    detail: `LambdaはExecution Role(IAMロール)を引き受けて動きます。DynamoDBやS3へのアクセスはこのロールのポリシーで許可します。一時認証情報が自動で供給され、SigV4で署名されます。
            <br><br>DB接続文字列やアクセスキーをコードに書く必要がありません。`,
    focus: `最小権限が鉄則。「dynamodb:*」ではなく必要なテーブル・アクションだけ許可します。漏洩リスクのある長期キーを避けられるのがロールの最大の利点。`,
  },
  'dynamodb-serverless': {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Database/48/Arch_Amazon-DynamoDB_48.svg',
    title: 'DynamoDB (サーバーレスKVS)',
    eng: 'AMAZON DYNAMODB',
    oneLiner: 'HTTP APIで叩くKey-Value/ドキュメントDB。接続プール不要',
    detail: `DynamoDBはマネージドのKVSで、HTTPS APIでアクセスします。コネクションプールの概念が無く、Lambdaの大量同時実行と相性が良いです。On-Demandなら容量管理も不要。
            <br><br>RDB的なJOINや柔軟なクエリは苦手で、アクセスパターン先行で設計します。`,
    focus: `「Lambda+RDS」は接続数枯渇が起きがち。サーバーレスではDynamoDBが第一候補。ただし検索要件が複雑ならRDS(+RDS Proxy)やAuroraを選びます。`,
  },
  'lambda-cold-start': {
    icon: 'Snowflake',
    title: 'コールドスタート',
    eng: 'COLD START',
    oneLiner: '実行環境が無いとき、初期化が走って初回だけ遅くなる',
    detail: `対象の関数の暖かい環境が無いと、AWSはコード取得→ランタイム起動→ハンドラ外の初期化を行います。これが初回のレイテンシです。2回目以降は環境を再利用して高速。
            <br><br>VPC接続やパッケージが大きいほど影響が出ます。`,
    focus: `緩和策: 依存を減らす、ハンドラ外で重い初期化を一度だけ、Provisioned Concurrency、SnapStart(対応ランタイム)。「常に遅い」わけではなく初回中心、という性質を理解する。`,
  },
  'lambda-concurrency': {
    icon: 'Layers3',
    title: '同時実行数とログ',
    eng: 'LAMBDA CONCURRENCY',
    oneLiner: '1環境=1リクエスト。並列数だけ環境が増え、上限/予約で制御',
    detail: `Lambdaは1つの実行環境で同時に1リクエストだけ処理します。並列リクエスト数=必要な環境数です。アカウント/関数で同時実行の上限や予約を設定できます。
            <br><br>ログ・メトリクスはCloudWatchに出ます。`,
    focus: `下流(RDSや外部API)が同時実行に耐えられるかが盲点。Lambdaは一気にスケールするので、DBの接続数や外部APIのレート制限を超えがち。Reserved Concurrencyで絞る判断も。`,
  },
  'lambda-in-vpc': {
    icon: 'Network',
    title: 'VPC内Lambda と RDS Proxy',
    eng: 'LAMBDA IN VPC',
    oneLiner: 'RDS等へVPC内接続するLambdaはENI経由。接続枯渇はProxyで吸収',
    detail: `RDSなどVPC内リソースへ繋ぐLambdaは、Subnet内にENIを作って通信します。外部APIへ出るならNATやVPC Endpointが要ります。
            <br><br>大量同時実行でRDSの接続数が枯渇しやすく、RDS Proxyで接続をプールするのが定石です。`,
    focus: `「Lambda+RDS」を選ぶなら接続管理が論点。RDS Proxy、最小接続、idleタイムアウト設計が要る。DynamoDBで済むならVPCに入れない方がシンプル&速い。`,
  },
};

export const glossaryCategories: GlossaryCategory[] = [
  {
    label: 'サーバーレスAPIの構成',
    termIds: ['api-gateway', 'lambda-invoke', 'lambda-execution-role', 'dynamodb-serverless'],
  },
  {
    label: '性能と運用の勘所',
    termIds: ['lambda-cold-start', 'lambda-concurrency', 'lambda-in-vpc'],
  },
];
