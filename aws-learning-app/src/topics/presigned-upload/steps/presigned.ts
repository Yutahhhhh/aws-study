import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'presigned-url',
    title: '「権限を持つ人が署名したURL」を渡す',
    description: 'Presigned URLは、APIサーバーのIAM権限で「このキーに、この条件で、この期限まで」PUTできることを署名で保証したURLです。ブラウザ自体はAWS権限を持ちません。',
    accentColor: 'text-sky-400',
  },
  {
    glossaryTermId: 'two-phase-upload',
    title: 'DBは pending → ready の2段階',
    description: 'URL発行時にpendingでレコードを作り、S3イベントを受けたWorkerが検証後にreadyへ更新します。「アップロードしたのに反映されない」を追跡できる状態設計です。',
    accentColor: 'text-purple-400',
  },
];

export const presignedSteps: SimulationStep[] = [
  {
    title: '【1】「アップロードしたい」とAPIへ申請',
    location: 'ブラウザ → ECS API',
    diagramState: {
      activeNodeIds: ['browser', 'alb', 'api'],
      activeConnectionIds: ['browser-to-alb', 'alb-to-api'],
      packetAtNodeId: 'api',
      dimmedNodeIds: ['queue', 'worker'],
    },
    headers: { srcIp: 'ブラウザ', srcPort: 'POST /uploads', dstIp: 'ECS API', dstPort: 'ファイル名/サイズ/型のみ' },
    labels: { srcIp: '(ログイン済み)', srcPort: '(本体は送らない)', dstIp: '(認可チェック)', dstPort: '(数百バイトのJSON)' },
    changes: [],
    desc: `<p>ブラウザはファイルの<strong>メタデータだけ</strong>(ファイル名、サイズ、Content-Type)をAPIへ送ります。APIはログインユーザーの権限、容量制限、拡張子の許可リストなどを<strong>ここで</strong>チェックします。本体はまだ1バイトも動いていません。</p>`,
    keyPoints,
  },
  {
    title: '【2】APIがPresigned URLを発行しDBに仮登録',
    location: 'ECS API → RDS / ブラウザ',
    diagramState: {
      activeNodeIds: ['api', 'db'],
      activeConnectionIds: ['api-to-db'],
      packetAtNodeId: 'db',
      dimmedNodeIds: ['queue', 'worker', 's3-upload'],
    },
    headers: { srcIp: 'ECS API', srcPort: 'SigV4署名', dstIp: 'RDS', dstPort: "INSERT status='pending'" },
    labels: { srcIp: '(IAMロール権限)', srcPort: '(期限15分/型/キー固定)', dstIp: '(ファイル管理テーブル)', dstPort: '(仮登録)' },
    changes: ['srcPort', 'dstIp', 'dstPort'],
    desc: `<p>APIは自分のIAMロール権限で<span onclick="openGlossary('sigv4-signing')" class="glossary-link font-bold">SigV4署名</span>した<span onclick="openGlossary('presigned-url')" class="glossary-link font-bold">Presigned URL</span>を生成します。署名には<strong>バケット/キー/HTTPメソッド/有効期限</strong>が固定で含まれ、他のキーへの書き込みには使えません。同時にDBへ<code>status='pending'</code>でレコードを仮登録し、URLをブラウザへ返します。</p>`,
    keyPoints,
  },
  {
    title: '【3】ブラウザがS3へ直接PUT',
    location: 'ブラウザ → S3',
    diagramState: {
      activeNodeIds: ['browser', 's3-upload'],
      activeConnectionIds: ['browser-to-s3'],
      packetAtNodeId: 's3-upload',
      dimmedNodeIds: ['alb', 'api', 'queue', 'worker', 'db'],
    },
    headers: { srcIp: 'ブラウザ', srcPort: 'PUT 100MB', dstIp: 'S3', dstPort: '署名検証 → 200 OK' },
    labels: { srcIp: '(実体の輸送)', srcPort: '(アプリ非経由)', dstIp: '(CORSで許可済み)', dstPort: '(期限切れ/改ざんは403)' },
    changes: ['srcIp', 'srcPort', 'dstIp'],
    desc: `<p>ブラウザは受け取ったURLへ<strong>S3に直接PUT</strong>します。100MBはアプリサーバーを一切通りません。S3が署名を検証し、期限切れ・URL改ざん・署名と異なるContent-Typeは403で拒否します。ブラウザからの別オリジンPUTなので、バケットに<span onclick="openGlossary('upload-cors')" class="glossary-link font-bold">CORS設定</span>が必要です。巨大ファイルは<span onclick="openGlossary('multipart-upload')" class="glossary-link font-bold">マルチパート</span>で分割・並列・再開可能にします。</p>`,
    keyPoints,
  },
  {
    title: '【4】S3イベントがSQSへ積まれる',
    location: 'S3 → SQS',
    diagramState: {
      activeNodeIds: ['s3-upload', 'queue'],
      activeConnectionIds: ['s3-to-queue'],
      packetAtNodeId: 'queue',
      dimmedNodeIds: ['browser', 'alb', 'api', 'db'],
    },
    headers: { srcIp: 'S3', srcPort: 'ObjectCreated:Put', dstIp: 'SQS', dstPort: 'イベントJSON' },
    labels: { srcIp: '(保存完了が確定)', srcPort: '(イベント通知)', dstIp: '(バッファ)', dstPort: '(バケット名+キー)' },
    changes: ['srcIp', 'srcPort', 'dstIp', 'dstPort'],
    desc: `<p>オブジェクトの保存完了をトリガーに、S3が<span onclick="openGlossary('s3-event-upload')" class="glossary-link font-bold">イベント通知</span>をSQSへ送ります。「アップロード完了をブラウザからの自己申告で受ける」のではなく、<strong>S3自身の事実(保存された)を起点</strong>にするのが信頼性のポイントです。ブラウザが完了直後に離脱しても処理は進みます。</p>`,
    keyPoints,
  },
  {
    title: '【5】Workerが検証してDBをreadyに更新',
    location: 'SQS → Worker → RDS',
    diagramState: {
      activeNodeIds: ['queue', 'worker', 'db'],
      activeConnectionIds: ['queue-to-worker', 'worker-to-db'],
      packetAtNodeId: 'db',
      dimmedNodeIds: ['browser', 'alb', 'api'],
    },
    headers: { srcIp: 'Worker', srcPort: '検証/変換', dstIp: 'RDS', dstPort: "UPDATE status='ready'" },
    labels: { srcIp: '(SQSをポーリング)', srcPort: '(型検査/スキャン/サムネイル)', dstIp: '(pending→ready)', dstPort: '(公開可能に)' },
    changes: ['srcIp', 'srcPort', 'dstPort'],
    desc: `<p>Workerがメッセージを取り出し、<span onclick="openGlossary('upload-validation')" class="glossary-link font-bold">ファイルの検証</span>(マジックバイトでの型検査、サイズ、必要ならウイルススキャン)とサムネイル生成などを行い、DBの状態を<code>ready</code>へ更新します。<strong>「S3にある= 安全なファイル」ではない</strong>ので、検証が済むまでアプリはそのファイルを配信しません。</p>`,
    keyPoints,
  },
  {
    title: '【6】完成: 各コンポーネントが得意な仕事だけをする',
    location: '全体',
    diagramState: {
      activeNodeIds: ['browser', 'api', 's3-upload', 'queue', 'worker', 'db'],
      activeConnectionIds: ['browser-to-alb', 'alb-to-api', 'browser-to-s3', 's3-to-queue', 'queue-to-worker', 'worker-to-db'],
      packetAtNodeId: 'browser',
      dimmedNodeIds: [],
    },
    headers: { srcIp: 'API', srcPort: '認可+署名', dstIp: 'S3/SQS/Worker', dstPort: '輸送+通知+検証' },
    labels: { srcIp: '(軽いJSONのみ)', srcPort: '(数ms)', dstIp: '(重い仕事)', dstPort: '(スケールも独立)' },
    changes: [],
    desc: `<p>APIは認可と署名(軽量)、S3は実体の輸送と保存、SQS+Workerは重い後処理、DBは状態管理。<strong>ファイルサイズや同時アップロード数が増えてもAPIの負荷はほぼ一定</strong>で、Workerだけを独立にスケールできます。画像投稿・CSV取り込み・動画アップロードなど、Webアプリのファイル受け取り全般に使える型です。</p>`,
    keyPoints,
  },
];
