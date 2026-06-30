import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'lambda-invoke',
    title: 'リクエストごとに関数が呼ばれる',
    description: 'API GatewayはHTTPリクエストをイベントに変換してLambdaをinvokeします。サーバーを常駐させず、来た分だけ実行・課金されます。',
    accentColor: 'text-orange-400',
  },
  {
    glossaryTermId: 'lambda-execution-role',
    title: 'DBは“パスワード”でなくIAMロール',
    description: 'LambdaはExecution Role(IAM)の権限でDynamoDBへアクセスします。接続文字列やパスワードを持ち歩かず、最小権限を付与します。',
    accentColor: 'text-sky-400',
  },
];

export const requestSteps: SimulationStep[] = [
  {
    title: '【1】API GatewayがHTTPSを受ける',
    location: 'Client → API Gateway',
    diagramState: {
      activeNodeIds: ['client', 'apigw'],
      activeConnectionIds: ['client-to-apigw'],
      packetAtNodeId: 'apigw',
      dimmedNodeIds: ['logs'],
    },
    headers: { srcIp: 'Client', srcPort: '443', dstIp: 'API Gateway', dstPort: '443' },
    labels: { srcIp: '(利用者)', srcPort: '(HTTPS)', dstIp: '(REST/HTTP API)', dstPort: '(認証/throttle)' },
    changes: [],
    desc: `<p><span onclick="openGlossary('api-gateway')" class="glossary-link font-bold">API Gateway</span>が入口です。認証(JWT/IAM/Lambda Authorizer)、スロットリング、リクエスト検証をここで行います。</p>`,
    keyPoints,
  },
  {
    title: '【2】GatewayがLambdaをinvoke(イベント化)',
    location: 'API Gateway → Lambda',
    diagramState: {
      activeNodeIds: ['apigw', 'lambda'],
      activeConnectionIds: ['apigw-to-lambda'],
      packetAtNodeId: 'lambda',
      dimmedNodeIds: ['logs'],
    },
    headers: { srcIp: 'API Gateway', srcPort: '-', dstIp: 'Lambda', dstPort: 'Invoke' },
    labels: { srcIp: '(統合)', srcPort: '-', dstIp: '(event = HTTPリクエスト)', dstPort: '(同期呼び出し)' },
    changes: ['dstPort'],
    desc: `<p>GatewayはHTTPリクエストを<strong>JSONイベント</strong>に変換してLambdaを同期<span onclick="openGlossary('lambda-invoke')" class="glossary-link font-bold">invoke</span>します。関数は必要な時だけ起動します。</p>`,
    keyPoints,
  },
  {
    title: '【3】LambdaがIAMロールでDynamoDBへ',
    location: 'Lambda → DynamoDB',
    diagramState: {
      activeNodeIds: ['lambda', 'dynamodb'],
      activeConnectionIds: ['lambda-to-ddb'],
      packetAtNodeId: 'dynamodb',
      dimmedNodeIds: ['logs'],
    },
    headers: { srcIp: 'Lambda', srcPort: '-', dstIp: 'DynamoDB', dstPort: 'API (HTTPS)' },
    labels: { srcIp: '(Execution Role)', srcPort: '-', dstIp: '(GetItem/PutItem)', dstPort: '(SigV4署名)' },
    changes: ['dstIp'],
    desc: `<p>Lambdaは<span onclick="openGlossary('lambda-execution-role')" class="glossary-link font-bold">Execution Role</span>の権限でDynamoDBのAPIを叩きます。<span onclick="openGlossary('dynamodb-serverless')" class="glossary-link font-bold">DynamoDB</span>もサーバーレスで、コネクションプール不要のHTTP APIです。</p>`,
    keyPoints,
  },
  {
    title: '【4】結果を返し、ログはCloudWatchへ',
    location: 'Lambda → Client / Logs',
    diagramState: {
      activeNodeIds: ['client', 'apigw', 'lambda', 'logs'],
      activeConnectionIds: ['client-to-apigw', 'apigw-to-lambda', 'lambda-to-logs'],
      packetAtNodeId: 'client',
      dimmedNodeIds: [],
    },
    headers: { srcIp: 'Lambda', srcPort: '-', dstIp: 'Client', dstPort: '200 OK' },
    labels: { srcIp: '(レスポンス)', srcPort: '-', dstIp: '(API Gateway経由)', dstPort: '(JSON)' },
    changes: ['dstPort'],
    desc: `<p>結果がGateway経由でクライアントへ返ります。標準出力やメトリクスは<span onclick="openGlossary('lambda-concurrency')" class="glossary-link font-bold">CloudWatch</span>に出ます。サーバーの面倒を見ずにAPIが動きました。</p>`,
    keyPoints,
  },
];
