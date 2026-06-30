import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'l4-vs-l7',
    title: 'L7は「中身」を読める',
    description: 'ALBはHTTPを解釈するため、URLパス・ホスト名・ヘッダーを見て振り分けられます。代わりに一度TCPを終端し、自分が新しい接続をターゲットへ張り直します。',
    accentColor: 'text-indigo-400',
  },
  {
    glossaryTermId: 'x-forwarded-for',
    title: '送信元IPはヘッダーで渡る',
    description: 'ALBが接続を張り直すため、ターゲットから見た送信元はALBのIPになります。本当のクライアントIPは X-Forwarded-For ヘッダーで渡されます。',
    accentColor: 'text-rose-400',
  },
];

export const albL7Steps: SimulationStep[] = [
  {
    title: '【ALB】TLSを終端しHTTPとして受ける',
    location: 'Client → ALB (443)',
    diagramState: {
      activeNodeIds: ['client', 'alb'],
      activeConnectionIds: ['client-to-alb'],
      packetAtNodeId: 'alb',
      dimmedNodeIds: ['nlb', 'ecs-tcp'],
    },
    headers: { srcIp: '203.0.113.10', srcPort: '54321', dstIp: 'ALB', dstPort: '443' },
    labels: { srcIp: '(クライアント)', srcPort: '(任意)', dstIp: '(Application LB)', dstPort: '(HTTPS)' },
    changes: [],
    desc: `<p>ALBは<span onclick="openGlossary('tls-termination')" class="glossary-link font-bold">TLSを終端</span>し、中身をHTTPとして解釈します。ここで初めて「どのパスへのリクエストか」が分かります。</p>`,
    keyPoints,
  },
  {
    title: '【ALB】パスで振り分け (/api → api, / → web)',
    location: 'ALB → ECS (path routing)',
    diagramState: {
      activeNodeIds: ['alb', 'ecs-web', 'ecs-api'],
      activeConnectionIds: ['alb-to-web', 'alb-to-api'],
      packetAtNodeId: 'ecs-api',
      dimmedNodeIds: ['nlb', 'ecs-tcp'],
    },
    headers: { srcIp: 'ALB', srcPort: '*', dstIp: 'ECS api / web', dstPort: '3000' },
    labels: { srcIp: '(ALBが接続を張り直す)', srcPort: '(任意)', dstIp: '(/api と / を出し分け)', dstPort: '(コンテナポート)' },
    changes: ['srcIp', 'dstIp'],
    desc: `<p><span onclick="openGlossary('alb-path-routing')" class="glossary-link font-bold">リスナールール</span>でパスを見て、<code>/api</code>はapiコンテナ、<code>/</code>はwebコンテナへ振り分けます。1つのALBで複数サービスを束ねられます。</p>
           <p class='mt-2 text-slate-400'>ターゲットから見た送信元は<span onclick="openGlossary('x-forwarded-for')" class="glossary-link font-bold">ALBのIP</span>になります。</p>`,
    keyPoints,
  },
  {
    title: '【ALB】L7だからできること: WAF・Cookie固定・認証',
    location: 'ALB (L7 features)',
    diagramState: {
      activeNodeIds: ['alb', 'ecs-web', 'ecs-api'],
      activeConnectionIds: ['alb-to-web', 'alb-to-api'],
      packetAtNodeId: 'alb',
      dimmedNodeIds: ['nlb', 'ecs-tcp', 'client'],
    },
    headers: { srcIp: 'ALB', srcPort: '*', dstIp: 'ECS', dstPort: '3000' },
    labels: { srcIp: '(WAF/認証を前段で)', srcPort: '-', dstIp: '(ホスト/パス/ヘッダー条件)', dstPort: '-' },
    changes: [],
    desc: `<p>HTTPを理解できるので、WAFの連携、Cookieによるスティッキー、OIDC/Cognito認証、ホストヘッダー(マルチテナント)などが使えます。</p>
           <p class='mt-2 text-slate-400'>「Webアプリの入口」は基本ALBが第一候補です。</p>`,
    keyPoints,
  },
];
