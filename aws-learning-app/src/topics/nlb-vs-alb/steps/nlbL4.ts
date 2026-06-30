import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'nlb-source-ip',
    title: '送信元IPがそのまま届く',
    description: 'NLBはL4でほぼ素通しのため、ターゲットには本当のクライアントIPが届きます(instance/IPターゲットの場合)。IP制限や監査が素直にできます。',
    accentColor: 'text-amber-400',
  },
  {
    glossaryTermId: 'nlb-static-ip',
    title: '固定IP・超低遅延・非HTTP',
    description: 'NLBはAZごとに固定IP(Elastic IP可)を持ち、HTTP以外(gRPC生TCP/UDP/MQTT等)も扱え、レイテンシが極小です。',
    accentColor: 'text-amber-400',
  },
];

export const nlbL4Steps: SimulationStep[] = [
  {
    title: '【NLB】TCPをそのまま受ける(終端しない)',
    location: 'Client → NLB (TCP)',
    diagramState: {
      activeNodeIds: ['client', 'nlb'],
      activeConnectionIds: ['client-to-nlb'],
      packetAtNodeId: 'nlb',
      dimmedNodeIds: ['alb', 'ecs-web', 'ecs-api'],
    },
    headers: { srcIp: '203.0.113.10', srcPort: '54321', dstIp: 'NLB (固定IP)', dstPort: '50051' },
    labels: { srcIp: '(クライアント)', srcPort: '(任意)', dstIp: '(Network LB)', dstPort: '(任意のTCP/UDP)' },
    changes: [],
    desc: `<p>NLBはL4のロードバランサで、中身(HTTP)を解釈せずTCP/UDPをほぼそのまま流します。<span onclick="openGlossary('nlb-static-ip')" class="glossary-link font-bold">AZごとに固定IP</span>を持てるのも特徴です。</p>`,
    keyPoints,
  },
  {
    title: '【NLB】送信元IPを保ったままターゲットへ',
    location: 'NLB → ECS (TCP passthrough)',
    diagramState: {
      activeNodeIds: ['nlb', 'ecs-tcp'],
      activeConnectionIds: ['nlb-to-tcp'],
      packetAtNodeId: 'ecs-tcp',
      dimmedNodeIds: ['alb', 'ecs-web', 'ecs-api'],
    },
    headers: { srcIp: '203.0.113.10', srcPort: '54321', dstIp: 'ECS (gRPC)', dstPort: '50051' },
    labels: { srcIp: '(クライアントIPが保持)', srcPort: '(保持)', dstIp: '(ターゲットへ素通し)', dstPort: '(TCP)' },
    changes: ['dstIp'],
    desc: `<p>ALBと違い接続を張り直さないため、<span onclick="openGlossary('nlb-source-ip')" class="glossary-link font-bold">送信元IPが保持</span>されたままターゲットに届きます。IPベースのアクセス制御や監査が素直にできます。</p>
           <p class='mt-2 text-slate-400'>※SGはターゲット側で評価。NLB自体は基本SGを持ちません(近年は付与も可)。</p>`,
    keyPoints,
  },
  {
    title: '【使い分け】HTTPならALB、それ以外/低遅延/固定IPならNLB',
    location: 'ALB vs NLB',
    diagramState: {
      activeNodeIds: ['alb', 'nlb'],
      activeConnectionIds: [],
      packetAtNodeId: 'nlb',
      dimmedNodeIds: ['client', 'ecs-web', 'ecs-api', 'ecs-tcp'],
    },
    headers: { srcIp: '-', srcPort: '-', dstIp: '-', dstPort: '-' },
    labels: { srcIp: '(L7: パス/ホスト/WAF)', srcPort: '-', dstIp: '(L4: 固定IP/低遅延/非HTTP)', dstPort: '-' },
    changes: [],
    desc: `<p><strong>Webアプリの入口はALB</strong>(パスルーティング・WAF・認証)。<strong>gRPC生TCP・固定IPが必要・極小レイテンシ・PrivateLink公開</strong>などはNLB。</p>
           <p class='mt-2 text-slate-400'>両方を組み合わせ「NLB → ALB」や「NLB → PrivateLink」も実務ではよくあります。</p>`,
    keyPoints,
  },
];
