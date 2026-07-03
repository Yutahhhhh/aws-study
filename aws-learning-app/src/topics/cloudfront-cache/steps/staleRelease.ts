import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'versioned-assets',
    title: 'ファイル名を変えればキャッシュは無関係',
    description: 'app.a1b2c3.jsのようにビルドごとにハッシュ付きファイル名にすると、新バージョンは「別URL=別キャッシュキー」になり、古いキャッシュと衝突しません。',
    accentColor: 'text-sky-400',
  },
  {
    glossaryTermId: 'invalidation',
    title: 'Invalidationは非常手段',
    description: 'キャッシュの強制削除は反映まで時間がかかり、月1,000パス超は有料です。毎リリースの前提にせず、設計(ハッシュ名+短TTLのHTML)で不要にするのが定石です。',
    accentColor: 'text-rose-400',
  },
];

export const staleReleaseSteps: SimulationStep[] = [
  {
    title: '【1】新バージョンをリリースする',
    location: 'CI/CD → S3',
    diagramState: {
      activeNodeIds: ['ci', 's3-assets'],
      activeConnectionIds: ['ci-to-s3'],
      packetAtNodeId: 's3-assets',
      dimmedNodeIds: ['user', 'edge-server', 'edge-cache', 'alb-api'],
    },
    headers: { srcIp: 'CI/CD', srcPort: 'aws s3 sync', dstIp: 'S3', dstPort: '新しいHTML/JS/CSS' },
    labels: { srcIp: '(デプロイジョブ)', srcPort: '(ビルド成果物)', dstIp: '(オリジンは最新化)', dstPort: '(エッジはまだ古いまま)' },
    changes: [],
    desc: `<p>CIがビルド成果物をS3へアップロードしました。<strong>オリジンは最新</strong>です。しかし世界中のエッジキャッシュには、TTLが残った古いファイルがまだ保存されています。ここからが本番リリースあるあるの始まりです。</p>`,
    keyPoints,
  },
  {
    title: '【2】「リリースしたのに画面が変わらない」',
    location: '利用者 → エッジ (古いHIT)',
    diagramState: {
      activeNodeIds: ['user', 'edge-server', 'edge-cache'],
      activeConnectionIds: ['user-to-edge', 'edge-to-cache'],
      packetAtNodeId: 'user',
      dimmedNodeIds: ['ci', 's3-assets', 'alb-api'],
    },
    headers: { srcIp: 'CloudFront', srcPort: 'HIT (古い)', dstIp: '利用者', dstPort: '旧index.html' },
    labels: { srcIp: '(TTL内なのでHIT)', srcPort: '(オリジンを見に行かない)', dstIp: '(古い画面が表示)', dstPort: '(新機能が出ない/JSエラー)' },
    changes: ['srcPort', 'dstPort'],
    desc: `<p>エッジはTTLが切れるまでオリジンに問い合わせないため、<strong>古いindex.htmlがHITし続けます</strong>。さらに危険なのが「HTMLは新しいがJSは古い」のような<strong>新旧混在</strong>で、画面が真っ白になるJSエラーの典型原因です。リリース直後の「一部のユーザーだけおかしい」はほぼこれを疑います。</p>`,
    keyPoints,
  },
  {
    title: '【3】対処その1: Invalidation (強制削除)',
    location: 'CI/CD → CloudFront',
    diagramState: {
      activeNodeIds: ['ci', 'edge-server', 'edge-cache'],
      activeConnectionIds: ['edge-to-cache'],
      packetAtNodeId: 'edge-cache',
      dimmedNodeIds: ['user', 's3-assets', 'alb-api'],
    },
    headers: { srcIp: 'CI/CD', srcPort: 'CreateInvalidation', dstIp: '全エッジ', dstPort: '/* を削除' },
    labels: { srcIp: '(緊急対応)', srcPort: '(API呼び出し)', dstIp: '(世界中に伝播)', dstPort: '(完了まで数十秒〜数分)' },
    changes: ['srcPort', 'dstIp', 'dstPort'],
    desc: `<p><span onclick="openGlossary('invalidation')" class="glossary-link font-bold">Invalidation</span>を発行すると、指定パスのキャッシュが全エッジから削除され、次のリクエストはオリジンへ取りに行きます。確実ですが<strong>即時ではなく、パス数課金もある</strong>ため、「間違ったものを配ってしまった時の消しゴム」と位置づけるのが健全です。</p>`,
    keyPoints,
  },
  {
    title: '【4】対処その2 (定石): ハッシュ付きファイル名',
    location: 'ビルド設計',
    diagramState: {
      activeNodeIds: ['s3-assets', 'ci'],
      activeConnectionIds: ['ci-to-s3'],
      packetAtNodeId: 's3-assets',
      dimmedNodeIds: ['user', 'alb-api', 'edge-server', 'edge-cache'],
    },
    headers: { srcIp: 'ビルド', srcPort: 'app.js', dstIp: '成果物', dstPort: 'app.a1b2c3.js' },
    labels: { srcIp: '(Vite/webpack)', srcPort: '(旧: 同名で上書き)', dstIp: '(新: 内容ハッシュ付き)', dstPort: '(URL自体が変わる)' },
    changes: ['dstPort'],
    desc: `<p>Vite等のビルドツールはJS/CSSを<span onclick="openGlossary('versioned-assets')" class="glossary-link font-bold">内容ハッシュ付きファイル名</span>で出力します。新バージョンは<strong>別URL=別キャッシュキー</strong>なので、古いキャッシュと絶対に衝突しません。アセットはCache-Control: max-age=31536000, immutableで1年キャッシュしても安全です。</p>`,
    keyPoints,
  },
  {
    title: '【5】index.htmlだけは常に確認させる',
    location: 'エッジ → S3 (再検証)',
    diagramState: {
      activeNodeIds: ['user', 'edge-server', 's3-assets'],
      activeConnectionIds: ['user-to-edge', 'edge-to-s3'],
      packetAtNodeId: 's3-assets',
      dimmedNodeIds: ['ci', 'alb-api'],
    },
    headers: { srcIp: 'エッジ', srcPort: 'GET /index.html', dstIp: 'S3', dstPort: 'no-cache → 常に最新' },
    labels: { srcIp: '(TTL 0/短TTL)', srcPort: '(毎回オリジン確認)', dstIp: '(小さいファイル)', dstPort: '(新ハッシュのJSを参照)' },
    changes: ['srcPort', 'dstPort'],
    desc: `<p>入口となるindex.htmlは<strong>Cache-Control: no-cache(または短TTL)</strong>にして、常にオリジンへ確認させます。HTMLは数KBなのでオリジン負荷は問題になりません。最新のHTMLが新ハッシュのJS/CSSを参照するので、<strong>リリース=index.htmlの差し替えだけで瞬時に反映</strong>されます。</p>`,
    keyPoints,
  },
  {
    title: '【6】まとめ: HTMLは短命、アセットは長命',
    location: '全体',
    diagramState: {
      activeNodeIds: ['user', 'edge-server', 'edge-cache', 's3-assets'],
      activeConnectionIds: ['user-to-edge', 'edge-to-cache', 'edge-to-s3'],
      packetAtNodeId: 'user',
      dimmedNodeIds: ['alb-api'],
    },
    headers: { srcIp: 'HTML', srcPort: 'no-cache', dstIp: 'JS/CSS/画像', dstPort: 'max-age=1年 + ハッシュ名' },
    labels: { srcIp: '(常に最新)', srcPort: '(入口だけ確認)', dstIp: '(ほぼ100% HIT)', dstPort: '(immutable)' },
    changes: [],
    desc: `<p>SPA配信の完成形は「<strong>index.htmlは短命、ハッシュ付きアセットは長命</strong>」の組み合わせです。ヒット率とリリース即時性を両立でき、Invalidationは緊急時だけになります。この考え方はAPIレスポンスのキャッシュ(Cache-Control設計)にもそのまま応用できます。</p>`,
    keyPoints,
  },
];
