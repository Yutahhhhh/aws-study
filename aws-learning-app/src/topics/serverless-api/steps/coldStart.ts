import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'lambda-cold-start',
    title: 'コールドスタート',
    description: '実行環境が無いとき、コードDL→ランタイム起動→初期化が走り、初回だけ数百ms〜遅くなります。2回目以降は同じ環境を再利用(ウォーム)して速いです。',
    accentColor: 'text-orange-400',
  },
  {
    glossaryTermId: 'lambda-in-vpc',
    title: 'VPC内Lambdaとコネクション',
    description: 'RDS等へVPC内で繋ぐLambdaはENIを使います。多数同時実行でRDSの接続数が枯渇しやすく、RDS Proxyでプールするのが定石です。',
    accentColor: 'text-sky-400',
  },
];

export const coldStartSteps: SimulationStep[] = [
  {
    title: '【コールド】実行環境が無く、初期化から始まる',
    location: 'Lambda (cold start)',
    diagramState: {
      activeNodeIds: ['apigw', 'lambda'],
      activeConnectionIds: ['apigw-to-lambda'],
      packetAtNodeId: 'lambda',
      dimmedNodeIds: ['dynamodb', 'logs', 'client'],
    },
    headers: { srcIp: 'API Gateway', srcPort: '-', dstIp: 'Lambda', dstPort: 'init' },
    labels: { srcIp: '(初回)', srcPort: '-', dstIp: '(コードDL→ランタイム→handler初期化)', dstPort: '(+数百ms)' },
    changes: ['dstPort'],
    desc: `<p>その関数の実行環境が無いと、AWSは環境を作ります: コード取得→ランタイム起動→<strong>ハンドラ外の初期化</strong>(DBクライアント生成等)。これが<span onclick="openGlossary('lambda-cold-start')" class="glossary-link font-bold">コールドスタート</span>の遅延です。</p>`,
    keyPoints,
  },
  {
    title: '【ウォーム】同じ環境を再利用して高速',
    location: 'Lambda (warm reuse)',
    diagramState: {
      activeNodeIds: ['apigw', 'lambda', 'dynamodb'],
      activeConnectionIds: ['apigw-to-lambda', 'lambda-to-ddb'],
      packetAtNodeId: 'dynamodb',
      dimmedNodeIds: ['logs', 'client'],
    },
    headers: { srcIp: 'API Gateway', srcPort: '-', dstIp: 'Lambda', dstPort: 'reuse' },
    labels: { srcIp: '(2回目以降)', srcPort: '-', dstIp: '(初期化をスキップ)', dstPort: '(数ms)' },
    changes: ['dstPort'],
    desc: `<p>直後のリクエストは同じ温まった環境が処理します。初期化は再実行されないので高速です。<strong>ハンドラ外でクライアントを生成</strong>し再利用するのが定石です。</p>`,
    keyPoints,
  },
  {
    title: '【対策】同時実行とコールド緩和の手段',
    location: 'Provisioned Concurrency / SnapStart',
    diagramState: {
      activeNodeIds: ['lambda', 'logs'],
      activeConnectionIds: ['lambda-to-logs'],
      packetAtNodeId: 'lambda',
      dimmedNodeIds: ['client', 'apigw', 'dynamodb'],
    },
    headers: { srcIp: 'Lambda', srcPort: '-', dstIp: '同時実行', dstPort: 'concurrency' },
    labels: { srcIp: '(リクエスト並列数)', srcPort: '-', dstIp: '(環境はリクエストごとに1つ)', dstPort: '(上限/予約)' },
    changes: [],
    desc: `<p>Lambdaは1環境=1リクエスト。並列数だけ環境が増えます(<span onclick="openGlossary('lambda-concurrency')" class="glossary-link font-bold">同時実行数</span>)。コールドを抑えるには Provisioned Concurrency / SnapStart、依存を軽くする等。</p>
           <p class='mt-2 text-slate-400'>VPC内でRDSに繋ぐなら<span onclick="openGlossary('lambda-in-vpc')" class="glossary-link font-bold">接続数枯渇</span>に注意(RDS Proxy)。</p>`,
    keyPoints,
  },
];
