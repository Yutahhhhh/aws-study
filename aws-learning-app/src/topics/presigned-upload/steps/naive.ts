import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'presigned-url',
    title: '大きいファイルはアプリを経由させない',
    description: 'ファイル本体をアプリサーバー経由で運ぶと、帯域・メモリ・タイムアウトのすべてがボトルネックになります。実体はブラウザからS3へ直接送るのが定石です。',
    accentColor: 'text-sky-400',
  },
];

export const naiveSteps: SimulationStep[] = [
  {
    title: '【1】ファイル本体をAPIへPOSTする',
    location: 'ブラウザ → ALB → ECS API',
    diagramState: {
      activeNodeIds: ['browser', 'alb', 'api'],
      activeConnectionIds: ['browser-to-alb', 'alb-to-api'],
      packetAtNodeId: 'api',
      dimmedNodeIds: ['queue', 'worker', 'db'],
    },
    headers: { srcIp: 'ブラウザ', srcPort: 'POST /upload', dstIp: 'ECS API', dstPort: 'multipart/form-data 100MB' },
    labels: { srcIp: '(利用者)', srcPort: '(本体を添付)', dstIp: '(全バイトが通過)', dstPort: '(受信に数十秒)' },
    changes: [],
    desc: `<p>素朴な実装では、100MBの動画がALBとECS APIを<strong>丸ごと通過</strong>します。アップロード中、APIのワーカーは1本占有されっぱなしです。回線の遅い利用者だと数分かかることもあります。</p>`,
    keyPoints,
  },
  {
    title: '【2】受け取ってからS3へ転送 (二重転送)',
    location: 'ECS API → S3',
    diagramState: {
      activeNodeIds: ['api', 's3-upload'],
      activeConnectionIds: ['api-to-s3'],
      packetAtNodeId: 's3-upload',
      dimmedNodeIds: ['queue', 'worker', 'db', 'browser', 'alb'],
    },
    headers: { srcIp: 'ECS API', srcPort: 'PutObject', dstIp: 'S3', dstPort: '同じ100MBを再送' },
    labels: { srcIp: '(メモリ/一時ファイル)', srcPort: '(SDK経由)', dstIp: '(最終的な置き場所)', dstPort: '(転送が2回発生)' },
    changes: ['srcIp', 'dstIp'],
    desc: `<p>APIは受け取ったファイルをメモリや一時ディスクに置いてから、改めてS3へPUTします。<strong>同じ100MBがネットワークを2回流れ</strong>、ECSタスクのメモリとディスクも消費します。同時アップロードが増えるとOOM(メモリ枯渇)の典型原因になります。</p>`,
    keyPoints,
  },
  {
    title: '【3】どこかでタイムアウトが起きる',
    location: 'ALB / ECS API',
    diagramState: {
      activeNodeIds: ['alb', 'api'],
      activeConnectionIds: ['browser-to-alb', 'alb-to-api'],
      packetAtNodeId: 'alb',
      dimmedNodeIds: ['queue', 'worker', 'db', 's3-upload'],
    },
    headers: { srcIp: 'ALB', srcPort: 'idle timeout', dstIp: 'ブラウザ', dstPort: '504 Gateway Timeout' },
    labels: { srcIp: '(既定60秒)', srcPort: '(無通信で切断)', dstIp: '(アップロード失敗)', dstPort: '(低速回線ほど失敗)' },
    changes: ['dstPort'],
    desc: `<p>ALBのidle timeout(既定60秒)、アプリサーバーのリクエストタイムアウト、リバースプロキシのbody size上限…<strong>経路上のどこか1つでも上限に達すると失敗</strong>します。「Wi-Fiだと成功するのにモバイル回線だと失敗する」という報告はこのパターンの典型です。</p>`,
    keyPoints,
  },
  {
    title: '【4】結論: 実体の輸送はS3に任せる',
    location: '設計判断',
    diagramState: {
      activeNodeIds: ['browser', 's3-upload'],
      activeConnectionIds: ['browser-to-s3'],
      packetAtNodeId: 'browser',
      dimmedNodeIds: ['alb', 'api', 'queue', 'worker', 'db'],
    },
    headers: { srcIp: 'ブラウザ', srcPort: 'PUT (直接)', dstIp: 'S3', dstPort: 'Presigned URL' },
    labels: { srcIp: '(実体の輸送)', srcPort: '(アプリ非経由)', dstIp: '(受け口はS3)', dstPort: '(次のモードで詳解)' },
    changes: ['srcPort', 'dstPort'],
    desc: `<p>APIの仕事は「アップロードして良いかの認可」と「どこに置くかの決定」だけにして、<strong>実体の輸送はブラウザ→S3の直接通信</strong>に任せます。これを可能にするのが<span onclick="openGlossary('presigned-url')" class="glossary-link font-bold">Presigned URL</span>です。「Presigned URL方式」モードで正しい流れを見てみましょう。</p>`,
    keyPoints,
  },
];
