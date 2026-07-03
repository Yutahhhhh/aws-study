import type { ChallengeConfig } from '../../types/challenge';
import type { DiagramConfig, DiagramNode } from '../../types/diagram';
import { ICON, makeNode, makeServiceFactory, nodeStyle, pickNodes } from '../shared';

const ICON_EXTRA = {
  apigw: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Amazon-API-Gateway_48.svg',
  lambda: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Compute/48/Arch_AWS-Lambda_48.svg',
  dynamodb: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Database/48/Arch_Amazon-DynamoDB_48.svg',
  cloudwatch: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Management-Governance/48/Arch_Amazon-CloudWatch_48.svg',
};

const answerNodes: DiagramNode[] = [
  makeNode('user-a', '利用者A', 'メッセージ送信側', 'Users', { x: 20, y: 140, width: 145, height: 86 }, nodeStyle.external, { category: 'external' }),
  makeNode('user-b', '利用者B', 'リアルタイム受信側', 'Users', { x: 20, y: 430, width: 145, height: 86 }, nodeStyle.external, { category: 'external' }),
  makeNode('cloudfront', 'CloudFront', 'チャット画面配信', ICON.cloudfront, { x: 240, y: 20, width: 170, height: 84 }, nodeStyle.edge, { category: 'external' }),
  makeNode('frontend-bucket', 'S3 Frontend Bucket', '静的フロント', ICON.s3, { x: 470, y: 20, width: 180, height: 82 }, nodeStyle.data, { category: 'external' }),
  makeNode('apigw-ws', 'API Gateway', 'WebSocket API', ICON_EXTRA.apigw, { x: 250, y: 270, width: 180, height: 96 }, nodeStyle.edge, { category: 'external' }),
  makeNode('lambda-connect', 'Lambda: $connect', '接続/切断の管理', ICON_EXTRA.lambda, { x: 520, y: 160, width: 190, height: 88 }, nodeStyle.app, { category: 'external' }),
  makeNode('lambda-message', 'Lambda: sendMessage', 'メッセージ処理', ICON_EXTRA.lambda, { x: 520, y: 370, width: 190, height: 88 }, nodeStyle.worker, { category: 'external' }),
  makeNode('ddb-connections', 'DynamoDB', 'connectionsテーブル', ICON_EXTRA.dynamodb, { x: 790, y: 160, width: 190, height: 88 }, nodeStyle.data, { category: 'external' }),
  makeNode('ddb-messages', 'DynamoDB', 'messagesテーブル', ICON_EXTRA.dynamodb, { x: 790, y: 370, width: 190, height: 88 }, nodeStyle.data, { category: 'external' }),
  makeNode('cloudwatch', 'CloudWatch Logs', 'Lambdaログ', ICON_EXTRA.cloudwatch, { x: 790, y: 530, width: 190, height: 78 }, nodeStyle.observability, { category: 'external' }),
];

const createService = makeServiceFactory(answerNodes);

const answerDiagram: DiagramConfig = {
  viewport: { width: 1060, height: 660, padding: 48 },
  zones: [],
  nodes: answerNodes,
  connections: [
    { id: 'usera-to-cf', from: 'user-a', to: 'cloudfront', kind: 'traffic', fromAnchor: 'top', toAnchor: 'left' },
    { id: 'cf-to-frontend', from: 'cloudfront', to: 'frontend-bucket', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'usera-to-apigw', from: 'user-a', to: 'apigw-ws', kind: 'traffic', label: 'wss://', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'apigw-to-connect', from: 'apigw-ws', to: 'lambda-connect', kind: 'traffic', fromAnchor: 'top', toAnchor: 'left' },
    { id: 'connect-to-ddbconn', from: 'lambda-connect', to: 'ddb-connections', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'apigw-to-message', from: 'apigw-ws', to: 'lambda-message', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'message-to-ddbmsg', from: 'lambda-message', to: 'ddb-messages', kind: 'traffic', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'message-to-ddbconn', from: 'lambda-message', to: 'ddb-connections', kind: 'traffic', label: '宛先取得', fromAnchor: 'top', toAnchor: 'bottom' },
    { id: 'message-to-apigw', from: 'lambda-message', to: 'apigw-ws', kind: 'traffic', label: 'Management API', fromAnchor: 'bottom', toAnchor: 'bottom' },
    { id: 'apigw-to-userb', from: 'apigw-ws', to: 'user-b', kind: 'traffic', label: 'push', fromAnchor: 'left', toAnchor: 'right' },
    { id: 'message-to-logs', from: 'lambda-message', to: 'cloudwatch', kind: 'traffic', fromAnchor: 'bottom', toAnchor: 'left' },
  ],
};

const challenge: ChallengeConfig = {
  slug: 'realtime-chat-app',
  title: 'リアルタイムチャットを設計する',
  description: 'WebSocket API・Lambda・DynamoDBで、接続管理からメッセージ保存、相手へのリアルタイムpush配信までを組み立てる',
  headerLabel: 'AWS DESIGN CHALLENGE',
  badge: '設計演習',
  icon: 'MessagesSquare',
  color: 'amber',
  scenario:
    'サポートチャット機能を追加します。ポーリングではなくWebSocketでのリアルタイム配信が要件です。API GatewayのWebSocket APIを入口に、$connect/$disconnectで接続IDをDynamoDBに管理し、sendMessageでメッセージを保存して、宛先の接続へManagement API経由でpush配信するサーバーレス構成を設計してください。チャット画面自体はCloudFront+S3で配信します。',
  requirements: [
    { id: 'frontend', title: 'チャット画面の配信', description: '利用者AがCloudFront経由でS3の静的フロントエンドを取得できる。' },
    { id: 'connect', title: 'WebSocket接続の管理', description: '利用者AがAPI GatewayへWebSocket接続し、$connect LambdaがconnectionIdをDynamoDB connectionsテーブルへ保存する。' },
    { id: 'send', title: 'メッセージの受付と保存', description: 'sendMessageルートのLambdaがメッセージをDynamoDB messagesテーブルへ保存する。' },
    { id: 'push', title: 'リアルタイムpush配信', description: 'sendMessage Lambdaがconnectionsテーブルから宛先を引き、API GatewayのManagement API経由で利用者Bへpushする。' },
    { id: 'logs', title: '運用ログ', description: 'メッセージ処理LambdaのログをCloudWatch Logsへ出す。' },
  ],
  initialDiagram: {
    viewport: { ...answerDiagram.viewport },
    zones: [],
    nodes: pickNodes(answerNodes, ['user-a', 'user-b']),
    connections: [],
  },
  lockedNodeIds: ['user-a', 'user-b'],
  services: [
    createService('cloudfront', 'チャット画面の公開入口'),
    createService('frontend-bucket', '静的フロントエンドの配置先'),
    createService('apigw-ws', 'WebSocketを終端するAPI Gateway'),
    createService('lambda-connect', '$connect/$disconnectを処理するLambda'),
    createService('lambda-message', 'sendMessageを処理するLambda'),
    createService('ddb-connections', '接続ID(connectionId)を管理するテーブル'),
    createService('ddb-messages', 'メッセージ履歴を保存するテーブル'),
    createService('cloudwatch', 'Lambdaログの出力先'),
  ],
  checks: [
    { id: 'static-path', type: 'path-exists', path: ['user-a', 'cloudfront', 'frontend-bucket'], label: 'チャット画面を配信できる', failureMessage: '利用者AがCloudFront経由でS3のフロントエンドを取得する経路がありません。' },
    { id: 'ws-connect-path', type: 'path-exists', path: ['user-a', 'apigw-ws', 'lambda-connect', 'ddb-connections'], label: '接続を記録できる', failureMessage: 'WebSocket接続時にconnectionIdをDynamoDBへ保存する流れ(利用者A→API GW→$connect Lambda→connections)が途切れています。' },
    { id: 'send-path', type: 'path-exists', path: ['user-a', 'apigw-ws', 'lambda-message', 'ddb-messages'], label: 'メッセージを保存できる', failureMessage: 'sendMessageの流れ(利用者A→API GW→sendMessage Lambda→messages)が途切れています。' },
    { id: 'lookup-conn', type: 'connection-exists', from: 'lambda-message', to: 'ddb-connections', label: '宛先の接続を引ける', failureMessage: 'sendMessage Lambdaがconnectionsテーブルから宛先connectionIdを取得する経路がありません。' },
    { id: 'mgmt-api', type: 'connection-exists', from: 'lambda-message', to: 'apigw-ws', label: 'Management APIでpushできる', failureMessage: 'sendMessage LambdaからAPI GatewayのManagement APIを呼ぶ経路がありません(WebSocketのpushはAPI Gateway経由で行います)。' },
    { id: 'push-path', type: 'connection-exists', from: 'apigw-ws', to: 'user-b', label: '利用者Bへ届けられる', failureMessage: 'API Gatewayから利用者Bの既存WebSocket接続へpushする経路がありません。' },
    { id: 'message-logs', type: 'connection-exists', from: 'lambda-message', to: 'cloudwatch', label: '処理ログを出せる', failureMessage: 'sendMessage LambdaからCloudWatch Logsへのログ出力経路がありません。' },
  ],
  actions: [
    { id: 'open-chat', title: 'チャット画面を開く', description: 'CloudFrontから静的フロントエンドを取得する。', checkIds: ['static-path'], successMessage: 'チャット画面をCloudFront経由で配信できます。', failureMessage: 'チャット画面の表示に失敗しました。' },
    { id: 'establish-ws', title: 'WebSocket接続を確立する', description: '$connectでconnectionIdをDynamoDBへ保存する。', checkIds: ['ws-connect-path'], successMessage: '接続がconnectionsテーブルで管理されます。', failureMessage: 'WebSocket接続の管理経路が成立していません。' },
    { id: 'send-message', title: 'メッセージを送信する', description: 'sendMessage Lambdaが履歴をmessagesテーブルへ保存する。', checkIds: ['send-path', 'message-logs'], successMessage: 'メッセージの受付・保存・ログ出力ができています。', failureMessage: 'メッセージの保存経路が成立していません。' },
    { id: 'deliver-realtime', title: '相手へリアルタイム配信する', description: '宛先接続を引き、Management API経由で利用者Bへpushする。', checkIds: ['lookup-conn', 'mgmt-api', 'push-path'], successMessage: '利用者Bへのリアルタイムpush配信ができています。', failureMessage: 'push配信の経路が不足しています。' },
  ],
  answerDiagram,
  answerTrace: [
    { id: 'frontend', title: 'チャット画面を配信する', description: '画面自体はただの静的SPAなので、CloudFront+S3の定番構成で配信します。', visibleNodeIds: ['user-a', 'user-b', 'cloudfront', 'frontend-bucket'], visibleConnectionIds: ['usera-to-cf', 'cf-to-frontend'], activeNodeIds: ['user-a', 'cloudfront', 'frontend-bucket'], activeConnectionIds: ['usera-to-cf', 'cf-to-frontend'] },
    { id: 'connect', title: '接続をDynamoDBで管理する', description: 'WebSocketはHTTPと違い「つなぎっぱなし」です。API Gatewayが接続を終端し、$connectで発行されるconnectionIdをconnectionsテーブルへ保存します($disconnectで削除)。Lambdaは接続を保持しません。', visibleNodeIds: ['user-a', 'user-b', 'cloudfront', 'frontend-bucket', 'apigw-ws', 'lambda-connect', 'ddb-connections'], visibleConnectionIds: ['usera-to-cf', 'cf-to-frontend', 'usera-to-apigw', 'apigw-to-connect', 'connect-to-ddbconn'], activeNodeIds: ['user-a', 'apigw-ws', 'lambda-connect', 'ddb-connections'], activeConnectionIds: ['usera-to-apigw', 'apigw-to-connect', 'connect-to-ddbconn'] },
    { id: 'send', title: 'メッセージを受け付けて保存する', description: 'sendMessageルートに紐づくLambdaが、本文をmessagesテーブルへ保存します。履歴表示や未読管理はこのテーブルが担います。', visibleNodeIds: ['user-a', 'user-b', 'cloudfront', 'frontend-bucket', 'apigw-ws', 'lambda-connect', 'ddb-connections', 'lambda-message', 'ddb-messages', 'cloudwatch'], visibleConnectionIds: ['usera-to-cf', 'cf-to-frontend', 'usera-to-apigw', 'apigw-to-connect', 'connect-to-ddbconn', 'apigw-to-message', 'message-to-ddbmsg', 'message-to-logs'], activeNodeIds: ['apigw-ws', 'lambda-message', 'ddb-messages'], activeConnectionIds: ['apigw-to-message', 'message-to-ddbmsg'] },
    { id: 'push', title: '宛先へpush配信する', description: 'LambdaはBに直接送れません。connectionsテーブルで宛先のconnectionIdを引き、API GatewayのManagement API(PostToConnection)を呼ぶと、API Gatewayが保持しているBとのWebSocket接続へpushされます。', visibleNodeIds: ['user-a', 'user-b', 'cloudfront', 'frontend-bucket', 'apigw-ws', 'lambda-connect', 'ddb-connections', 'lambda-message', 'ddb-messages', 'cloudwatch'], visibleConnectionIds: ['usera-to-cf', 'cf-to-frontend', 'usera-to-apigw', 'apigw-to-connect', 'connect-to-ddbconn', 'apigw-to-message', 'message-to-ddbmsg', 'message-to-ddbconn', 'message-to-apigw', 'apigw-to-userb', 'message-to-logs'], activeNodeIds: ['lambda-message', 'ddb-connections', 'apigw-ws', 'user-b'], activeConnectionIds: ['message-to-ddbconn', 'message-to-apigw', 'apigw-to-userb'] },
  ],
};

export default challenge;
