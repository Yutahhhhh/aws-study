import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 's3-event-notification',
    title: '保存が“イベント”になる',
    description: 'S3にオブジェクトが作られると、S3 Event NotificationがLambda/SQS/SNSを起動できます。アップロードと処理を直接つながず、保存をトリガにします。',
    accentColor: 'text-emerald-400',
  },
  {
    glossaryTermId: 'async-invoke-retry',
    title: '非同期はAWSがリトライ',
    description: 'S3→Lambdaは非同期invoke。失敗するとAWSが自動で数回リトライし、それでもダメならDLQ(またはOn-failure送信先)へ退避します。',
    accentColor: 'text-orange-400',
  },
];

export const s3EventSteps: SimulationStep[] = [
  {
    title: '【1】生産側がS3へアップロード',
    location: 'Producer → S3 (PutObject)',
    diagramState: {
      activeNodeIds: ['producer', 's3'],
      activeConnectionIds: ['prod-to-s3'],
      packetAtNodeId: 's3',
      dimmedNodeIds: ['sqs', 'dlq'],
    },
    headers: { srcIp: 'Producer', srcPort: '-', dstIp: 'S3 Bucket', dstPort: 'PutObject' },
    labels: { srcIp: '(アプリ/利用者)', srcPort: '-', dstIp: '(入力バケット)', dstPort: '(オブジェクト作成)' },
    changes: [],
    desc: `<p>画像やファイルがS3に保存されます。ここで処理側を呼ぶコードは<strong>書きません</strong>。保存そのものを次のトリガにします。</p>`,
    keyPoints,
  },
  {
    title: '【2】S3 Event NotificationがLambdaを非同期起動',
    location: 'S3 → Lambda (async)',
    diagramState: {
      activeNodeIds: ['s3', 'lambda'],
      activeConnectionIds: ['s3-to-lambda'],
      packetAtNodeId: 'lambda',
      dimmedNodeIds: ['sqs', 'dlq', 'producer'],
    },
    headers: { srcIp: 'S3 Event', srcPort: '-', dstIp: 'Lambda', dstPort: 'async invoke' },
    labels: { srcIp: '(ObjectCreated)', srcPort: '-', dstIp: '(event = bucket/key)', dstPort: '(非同期)' },
    changes: ['dstPort'],
    desc: `<p><span onclick="openGlossary('s3-event-notification')" class="glossary-link font-bold">S3イベント通知</span>がLambdaを<span onclick="openGlossary('async-invoke-retry')" class="glossary-link font-bold">非同期</span>で起動します。eventにはバケット名とキーが入り、関数が本体を取得して処理します。</p>`,
    keyPoints,
  },
  {
    title: '【3】処理結果を保存。失敗はリトライ→DLQ',
    location: 'Lambda → DynamoDB / DLQ',
    diagramState: {
      activeNodeIds: ['lambda', 'ddb', 'dlq'],
      activeConnectionIds: ['lambda-to-ddb', 'lambda-to-dlq'],
      packetAtNodeId: 'ddb',
      dimmedNodeIds: ['producer', 'sqs'],
    },
    headers: { srcIp: 'Lambda', srcPort: '-', dstIp: 'DynamoDB', dstPort: 'PutItem' },
    labels: { srcIp: '(ワーカー)', srcPort: '-', dstIp: '(結果/メタデータ)', dstPort: '(失敗時はDLQへ)' },
    changes: ['dstIp'],
    desc: `<p>サムネイル生成やメタ抽出の結果を保存します。例外時はAWSが自動リトライし、最終的に失敗したイベントは<span onclick="openGlossary('dlq')" class="glossary-link font-bold">DLQ</span>へ退避され、消えません。</p>
           <p class='mt-2 text-slate-400'>同じイベントが2回来ても壊れないよう<span onclick="openGlossary('idempotency')" class="glossary-link font-bold">冪等</span>に作ります。</p>`,
    keyPoints,
  },
];
