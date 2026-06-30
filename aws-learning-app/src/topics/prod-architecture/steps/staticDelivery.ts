import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'cloudfront',
    title: 'CloudFrontのパス振り分け',
    description: 'CloudFrontはリクエストパスに一致するCache Behaviorを探し、Originを選びます。/api/* 以外はDefault BehaviorでS3へ向かいます。',
    accentColor: 'text-purple-400',
  },
  {
    glossaryTermId: 's3-oac',
    title: 'OAC (Origin Access Control)',
    description: 'S3をpublicにせず、CloudFrontからの署名付きリクエストだけ読めるようにする仕組み。利用者がS3へ直接アクセスしても拒否されます。',
    accentColor: 'text-green-400',
  },
];

export const staticDeliverySteps: SimulationStep[] = [
  {
    title: '【送信】利用者が画面(HTML)を要求',
    location: 'インターネット世界 (送信中)',
    diagramState: {
      activeNodeIds: ['user-pc', 'cloudfront'],
      activeConnectionIds: ['user-to-cf'],
      packetAtNodeId: 'user-pc',
      dimmedNodeIds: ['github', 'ecr', 'alb', 'ecs', 'rds'],
    },
    headers: {
      srcIp: '198.51.100.50',
      srcPort: '52345',
      dstIp: '(CloudFront edge)',
      dstPort: '443',
    },
    labels: {
      srcIp: '(利用者PCのIP)',
      srcPort: '(ブラウザが割り当てたランダムポート)',
      dstIp: '(DNSで解決されたCloudFrontのエッジ)',
      dstPort: '(HTTPS規格ポート)',
    },
    changes: [],
    desc: `<p>利用者がブラウザで <code>https://example.com/</code> を開いた直後です。</p>
           <p class='mt-2'>DNS(Route 53など)でドメインが<strong>CloudFrontのエッジ</strong>に解決され、最寄りのエッジロケーションへHTTPSリクエストが向かいます。</p>`,
    keyPoints,
  },
  {
    title: '【振り分け】CloudFrontがDefault BehaviorでS3を選ぶ',
    location: 'CloudFront (エッジ)',
    diagramState: {
      activeNodeIds: ['cloudfront', 's3'],
      activeConnectionIds: ['cf-to-s3'],
      packetAtNodeId: 'cloudfront',
      dimmedNodeIds: ['github', 'ecr', 'alb', 'ecs', 'rds'],
    },
    headers: {
      srcIp: '(CloudFront)',
      srcPort: '-',
      dstIp: '(S3 origin)',
      dstPort: '443',
    },
    labels: {
      srcIp: '(CloudFrontがOriginへ取りに行く)',
      srcPort: '-',
      dstIp: '(S3バケットのOrigin)',
      dstPort: '(HTTPS)',
    },
    changes: ['srcIp', 'dstIp'],
    desc: `<p>リクエストパス <code>/</code> は <code>/api/*</code> に一致しないため、<strong><span onclick="openGlossary('cloudfront')" class="glossary-link font-bold">Default Behavior</span></strong>が選ばれ、Originは<strong>S3</strong>になります。</p>
           <p class='mt-2'>キャッシュにあればそのまま返し、なければS3 Originへ取りに行きます。静的ファイルは積極的にキャッシュします。</p>`,
    keyPoints,
  },
  {
    title: '【取得】S3がOAC経由でHTMLを返す',
    location: 'S3 (Origin)',
    diagramState: {
      activeNodeIds: ['s3', 'cloudfront'],
      activeConnectionIds: ['cf-to-s3'],
      packetAtNodeId: 's3',
      dimmedNodeIds: ['github', 'ecr', 'alb', 'ecs', 'rds'],
    },
    headers: {
      srcIp: '(S3 origin)',
      srcPort: '443',
      dstIp: '(CloudFront)',
      dstPort: '-',
    },
    labels: {
      srcIp: '(S3が応答)',
      srcPort: '(HTTPS)',
      dstIp: '(CloudFrontへ返す → 利用者へ配信)',
      dstPort: '-',
    },
    changes: ['srcIp', 'srcPort', 'dstIp'],
    desc: `<p>S3バケットは<strong><span onclick="openGlossary('s3-oac')" class="glossary-link font-bold">OAC</span></strong>で「このCloudFrontからの署名付きリクエストだけ許可」に設定されています。</p>
           <p class='mt-2 text-green-400 font-bold'>利用者がS3のURLへ直接アクセスしても拒否されます。配信経路はCloudFrontに一本化されます。</p>
           <p class='mt-1 text-slate-400'>取得したHTML/CSS/JSはCloudFrontを通って利用者のブラウザへ返ります。</p>`,
    keyPoints,
  },
];
