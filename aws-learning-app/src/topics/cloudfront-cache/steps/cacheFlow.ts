import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'cache-key',
    title: '「同じリクエスト」の定義がキャッシュキー',
    description: 'URLパス+含めると決めたヘッダー/クエリ/Cookieの組がキャッシュキーです。キーに含めるものが多いほどキャッシュは分裂し、ヒット率が下がります。',
    accentColor: 'text-indigo-400',
  },
  {
    glossaryTermId: 'cache-behavior',
    title: 'パスごとにキャッシュ方針を変える',
    description: '/assets/*は長期キャッシュ、/api/*はキャッシュ無効、のようにビヘイビアでパスパターンごとにポリシーとオリジンを切り替えるのが基本形です。',
    accentColor: 'text-emerald-400',
  },
];

export const cacheFlowSteps: SimulationStep[] = [
  {
    title: '【1】初回リクエストがエッジに届く',
    location: '利用者 → エッジサーバー',
    diagramState: {
      activeNodeIds: ['user', 'edge-server'],
      activeConnectionIds: ['user-to-edge'],
      packetAtNodeId: 'edge-server',
      dimmedNodeIds: ['ci', 'alb-api'],
    },
    headers: { srcIp: '利用者', srcPort: 'GET', dstIp: 'CloudFront', dstPort: '/assets/app.js' },
    labels: { srcIp: '(ブラウザ)', srcPort: '(HTTPS)', dstIp: '(最寄りのエッジ)', dstPort: '(キャッシュキーを計算)' },
    changes: [],
    desc: `<p>DNSにより利用者は<strong>物理的に最寄りのエッジロケーション</strong>へ接続します。エッジサーバーはリクエストから<span onclick="openGlossary('cache-key')" class="glossary-link font-bold">キャッシュキー</span>(URL+設定したヘッダー等)を計算し、手元のキャッシュを探しに行きます。</p>`,
    keyPoints,
  },
  {
    title: '【2】キャッシュに無い → MISS',
    location: 'エッジサーバー → エッジキャッシュ',
    diagramState: {
      activeNodeIds: ['edge-server', 'edge-cache'],
      activeConnectionIds: ['edge-to-cache'],
      packetAtNodeId: 'edge-cache',
      dimmedNodeIds: ['ci', 'alb-api', 'user', 's3-assets'],
    },
    headers: { srcIp: 'エッジサーバー', srcPort: 'lookup', dstIp: 'エッジキャッシュ', dstPort: 'MISS' },
    labels: { srcIp: '(キャッシュキー)', srcPort: '(検索)', dstIp: '(該当なし)', dstPort: '(オリジンへ取りに行く)' },
    changes: ['dstPort'],
    desc: `<p>初回なのでキャッシュには何もありません。<span onclick="openGlossary('cache-hit-miss')" class="glossary-link font-bold">MISS</span>です。この場合エッジは<strong>オリジン(S3やALB)までリクエストを転送</strong>します。つまり初回アクセスの速度はオリジン次第です。</p>`,
    keyPoints,
  },
  {
    title: '【3】オリジンから取得し、Cache-Controlを受け取る',
    location: 'エッジサーバー → S3',
    diagramState: {
      activeNodeIds: ['edge-server', 's3-assets'],
      activeConnectionIds: ['edge-to-s3'],
      packetAtNodeId: 's3-assets',
      dimmedNodeIds: ['ci', 'alb-api', 'user'],
    },
    headers: { srcIp: 'エッジサーバー', srcPort: 'GET (forward)', dstIp: 'S3', dstPort: '200 + Cache-Control' },
    labels: { srcIp: '(オリジンへ)', srcPort: '(オリジンリクエスト)', dstIp: '(app.jsの実体)', dstPort: '(max-age=31536000)' },
    changes: ['dstIp', 'dstPort'],
    desc: `<p>S3がファイル本体と<span onclick="openGlossary('cache-control-ttl')" class="glossary-link font-bold">Cache-Controlヘッダー</span>を返します。「このファイルをどれだけキャッシュしてよいか(TTL)」は、<strong>オリジンが返すヘッダーとCloudFrontのキャッシュポリシーの組み合わせ</strong>で決まります。</p>`,
    keyPoints,
  },
  {
    title: '【4】エッジに保存して応答',
    location: 'エッジキャッシュ / 利用者',
    diagramState: {
      activeNodeIds: ['edge-server', 'edge-cache', 'user'],
      activeConnectionIds: ['edge-to-cache', 'user-to-edge'],
      packetAtNodeId: 'user',
      dimmedNodeIds: ['ci', 'alb-api'],
    },
    headers: { srcIp: 'CloudFront', srcPort: 'store', dstIp: '利用者', dstPort: 'X-Cache: Miss from cloudfront' },
    labels: { srcIp: '(TTL付きで保存)', srcPort: '(次回に備える)', dstIp: '(初回はやや遅い)', dstPort: '(レスポンスヘッダーで確認可)' },
    changes: ['srcPort', 'dstIp', 'dstPort'],
    desc: `<p>エッジはレスポンスをTTL付きでキャッシュに保存しつつ、利用者へ返します。レスポンスの<strong>X-Cacheヘッダー</strong>を見ると、そのレスポンスがMissだったのかHitだったのかを確認できます。動作検証やヒット率調査の第一歩です。</p>`,
    keyPoints,
  },
  {
    title: '【5】2回目以降はHIT。オリジンに行かない',
    location: '利用者 → エッジ (完結)',
    diagramState: {
      activeNodeIds: ['user', 'edge-server', 'edge-cache'],
      activeConnectionIds: ['user-to-edge', 'edge-to-cache'],
      packetAtNodeId: 'user',
      dimmedNodeIds: ['ci', 's3-assets', 'alb-api'],
    },
    headers: { srcIp: 'CloudFront', srcPort: 'HIT', dstIp: '利用者', dstPort: 'X-Cache: Hit from cloudfront' },
    labels: { srcIp: '(キャッシュから即返却)', srcPort: '(オリジン負荷ゼロ)', dstIp: '(高速)', dstPort: '(TTLが切れるまで続く)' },
    changes: ['srcPort', 'dstPort'],
    desc: `<p>同じキャッシュキーのリクエストはエッジだけで完結し、<strong>高速・オリジン負荷ゼロ・転送コスト減</strong>の三拍子が揃います。これがCDNの価値です。一方で<span onclick="openGlossary('cache-behavior')" class="glossary-link font-bold">/api/*のような動的なパス</span>はキャッシュ無効(CachingDisabled)にして毎回オリジンへ転送します。「何をキャッシュし、何をしないか」の設計がCDN導入の本体です。</p>`,
    keyPoints,
  },
];
