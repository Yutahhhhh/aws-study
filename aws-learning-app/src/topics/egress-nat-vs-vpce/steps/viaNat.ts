import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'nat-gateway',
    title: 'NAT Gatewayは内→外の出口',
    description: 'Private Subnetのリソースがインターネットへ出るための出口。外から始まる通信は通しません(戻りだけ通す)。',
    accentColor: 'text-rose-400',
  },
  {
    glossaryTermId: 'egress',
    title: '外部API宛てはNATが必要',
    description: 'SaaSや決済APIなど「インターネット上の宛先」へはVPC Endpointでは到達できません。NAT Gatewayを使います。',
    accentColor: 'text-slate-300',
  },
];

export const viaNatSteps: SimulationStep[] = [
  {
    title: '【外向き】ECSが外部APIを呼びたい',
    location: 'Private Subnet (ECS)',
    diagramState: {
      activeNodeIds: ['ecs', 'nat'],
      activeConnectionIds: ['ecs-to-nat'],
      packetAtNodeId: 'ecs',
      dimmedNodeIds: ['vpce', 'aws-svc'],
    },
    headers: { srcIp: '10.2.11.20', srcPort: '*', dstIp: '外部API', dstPort: '443' },
    labels: {
      srcIp: '(ECSのPrivate IP)',
      srcPort: '(任意)',
      dstIp: '(Slack/StripeなどのグローバルIP)',
      dstPort: '(HTTPS)',
    },
    changes: [],
    desc: `<p>ECSが外部のSaaS API(例: Slack通知、決済)を呼びます。宛先は<strong>インターネット上</strong>です。</p>
           <p class='mt-2'>Private Subnetのルートは <code>0.0.0.0/0 → NAT Gateway</code>。まずNAT Gatewayへ向かいます。</p>`,
    keyPoints,
  },
  {
    title: '【NAT変換】NAT GatewayがグローバルIPへ',
    location: 'Public Subnet (NAT Gateway)',
    diagramState: {
      activeNodeIds: ['nat', 'igw'],
      activeConnectionIds: ['nat-to-igw'],
      packetAtNodeId: 'nat',
      dimmedNodeIds: ['vpce', 'aws-svc'],
    },
    headers: { srcIp: 'NATのグローバルIP', srcPort: '*', dstIp: '外部API', dstPort: '443' },
    labels: {
      srcIp: '→ 送信元がNATのIPに変換',
      srcPort: '(変換)',
      dstIp: '(外部API)',
      dstPort: '(HTTPS)',
    },
    changes: ['srcIp', 'srcPort'],
    desc: `<p><strong><span onclick="openGlossary('nat-gateway')" class="glossary-link font-bold">NAT Gateway</span></strong>が送信元をNATのグローバルIPへ変換し、IGW経由でインターネットへ送り出します。</p>
           <p class='mt-2 text-slate-400'>戻りはNATが対応付けを覚えていてECSへ返します。外から新規に入ることはできません。</p>`,
    keyPoints,
  },
  {
    title: '【到達】外部APIへ',
    location: 'インターネット',
    diagramState: {
      activeNodeIds: ['igw', 'external'],
      activeConnectionIds: ['igw-to-external'],
      packetAtNodeId: 'external',
      dimmedNodeIds: ['vpce', 'aws-svc'],
    },
    headers: { srcIp: 'NATのグローバルIP', srcPort: '*', dstIp: '外部API', dstPort: '443' },
    labels: {
      srcIp: '(NAT経由)',
      srcPort: '(任意)',
      dstIp: '(到達)',
      dstPort: '(HTTPS)',
    },
    changes: [],
    desc: `<p>外部APIへ到達しました。<strong><span onclick="openGlossary('egress')" class="glossary-link font-bold">インターネット上の宛先</span></strong>へはこのNAT経路が必要です。</p>
           <p class='mt-2 text-slate-400'>NAT Gatewayは時間課金＋処理データ量課金。通すデータが多いほどコストが効きます。AZごとに置くと可用性は上がりますが台数分の固定費がかかります。</p>`,
    keyPoints,
  },
];
