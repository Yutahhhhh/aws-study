import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'sqs-decoupling',
    title: 'キューで山を平す',
    description: 'SQSは生産側と消費側を切り離す緩衝材です。急なスパイクをキューに溜め、ワーカーは自分のペースで処理。生産側は応答を待たずに済みます。',
    accentColor: 'text-fuchsia-400',
  },
  {
    glossaryTermId: 'event-source-mapping',
    title: 'Lambdaがキューをポーリング',
    description: 'Event Source MappingがSQSをポーリングし、メッセージをバッチでLambdaへ渡します。同時実行はキューの溜まり具合に応じて自動で増えます。',
    accentColor: 'text-orange-400',
  },
];

export const sqsQueueSteps: SimulationStep[] = [
  {
    title: '【1】生産側はキューに入れて即終了',
    location: 'Producer → SQS (SendMessage)',
    diagramState: {
      activeNodeIds: ['producer', 'sqs'],
      activeConnectionIds: ['prod-to-sqs'],
      packetAtNodeId: 'sqs',
      dimmedNodeIds: ['s3', 'dlq'],
    },
    headers: { srcIp: 'Producer', srcPort: '-', dstIp: 'SQS', dstPort: 'SendMessage' },
    labels: { srcIp: '(API/アプリ)', srcPort: '-', dstIp: '(ジョブキュー)', dstPort: '(投入して即応答)' },
    changes: [],
    desc: `<p>重い処理を同期で待たず、ジョブを<span onclick="openGlossary('sqs-decoupling')" class="glossary-link font-bold">SQS</span>へ投入してすぐ応答を返します。スパイクはキューが吸収します。</p>`,
    keyPoints,
  },
  {
    title: '【2】Lambdaがバッチで取り出して処理',
    location: 'SQS → Lambda (poll / batch)',
    diagramState: {
      activeNodeIds: ['sqs', 'lambda', 'ddb'],
      activeConnectionIds: ['sqs-to-lambda', 'lambda-to-ddb'],
      packetAtNodeId: 'lambda',
      dimmedNodeIds: ['producer', 's3', 'dlq'],
    },
    headers: { srcIp: 'SQS', srcPort: '-', dstIp: 'Lambda', dstPort: 'batch' },
    labels: { srcIp: '(可視性タイムアウト)', srcPort: '-', dstIp: '(最大10件/バッチ)', dstPort: '(at-least-once)' },
    changes: ['dstPort'],
    desc: `<p><span onclick="openGlossary('event-source-mapping')" class="glossary-link font-bold">Event Source Mapping</span>がキューをポーリングし、まとめてLambdaへ渡します。処理中は他のワーカーに見えない(可視性タイムアウト)。成功したメッセージは削除されます。</p>`,
    keyPoints,
  },
  {
    title: '【3】失敗は再試行、超過でDLQへ',
    location: 'SQS → DLQ (maxReceiveCount)',
    diagramState: {
      activeNodeIds: ['sqs', 'dlq'],
      activeConnectionIds: ['sqs-to-dlq'],
      packetAtNodeId: 'dlq',
      dimmedNodeIds: ['producer', 's3', 'lambda', 'ddb'],
    },
    headers: { srcIp: 'SQS', srcPort: '-', dstIp: 'DLQ', dstPort: 'redrive' },
    labels: { srcIp: '(処理失敗で再表示)', srcPort: '-', dstIp: '(maxReceiveCount超過)', dstPort: '(退避)' },
    changes: ['dstIp'],
    desc: `<p>削除されなかったメッセージは再びキューに現れ、再試行されます。規定回数を超えると<span onclick="openGlossary('dlq')" class="glossary-link font-bold">DLQ</span>へ移動。ここを監視して“毒メッセージ”を調べます。</p>
           <p class='mt-2 text-slate-400'>at-least-once配信なので重複前提。<span onclick="openGlossary('idempotency')" class="glossary-link font-bold">冪等</span>設計が必須です。順序厳守ならFIFOキュー。</p>`,
    keyPoints,
  },
];
