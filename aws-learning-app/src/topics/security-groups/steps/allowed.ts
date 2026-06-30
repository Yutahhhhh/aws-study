import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'sg-reference',
    title: 'SG参照で許可する',
    description: '許可元をIPではなく「別のSGのID」で指定します。ECS TaskのIPが入れ替わっても、同じSGを持つ限り許可され続けます。',
    accentColor: 'text-emerald-400',
  },
  {
    glossaryTermId: 'sg-stateful',
    title: 'SGはステートフル',
    description: '許可した通信の戻りは自動的に通ります。戻り(レスポンス)用のルールを別途書く必要はありません。',
    accentColor: 'text-blue-400',
  },
];

export const allowedSteps: SimulationStep[] = [
  {
    title: '【許可】インターネット → ALB:443',
    location: 'ALB Security Group',
    diagramState: {
      activeNodeIds: ['internet', 'alb'],
      activeConnectionIds: ['net-to-alb'],
      packetAtNodeId: 'internet',
      dimmedNodeIds: [],
    },
    headers: { srcIp: '0.0.0.0/0', srcPort: '*', dstIp: 'ALB', dstPort: '443' },
    labels: {
      srcIp: '(不特定多数の利用者)',
      srcPort: '(任意)',
      dstIp: '(ALBの公開エンドポイント)',
      dstPort: '(HTTPS)',
    },
    changes: [],
    desc: `<p>ALBのSGは <code>inbound 443 from 0.0.0.0/0</code> を許可しています。Webサービスとして公開するため、ここだけはインターネット全体に開きます。</p>
           <p class='mt-2 text-emerald-400 font-bold'>→ 許可。チェーンの最初の関門を通過します。</p>`,
    keyPoints,
  },
  {
    title: '【許可】ALB → ECS:3000（ALB SGから）',
    location: 'ECS Security Group',
    diagramState: {
      activeNodeIds: ['alb', 'ecs'],
      activeConnectionIds: ['alb-to-ecs'],
      packetAtNodeId: 'alb',
      dimmedNodeIds: [],
    },
    headers: { srcIp: 'ALB SG', srcPort: '*', dstIp: 'ECS', dstPort: '3000' },
    labels: {
      srcIp: '(送信元= ALBのSG)',
      srcPort: '(任意)',
      dstIp: '(ECS TaskのPrivate IP)',
      dstPort: '(コンテナの待ち受け)',
    },
    changes: ['srcIp', 'dstIp', 'dstPort'],
    desc: `<p>ECSのSGは <code>inbound 3000 from <span onclick="openGlossary('sg-reference')" class="glossary-link font-bold">ALB SG</span></code> だけを許可しています。送信元をIPではなく<strong>ALBのSG</strong>で指定している点がポイントです。</p>
           <p class='mt-2 text-emerald-400 font-bold'>→ 許可。ALB由来の通信なので通ります。</p>`,
    keyPoints,
  },
  {
    title: '【許可】ECS → RDS:5432（ECS SGから）',
    location: 'RDS Security Group',
    diagramState: {
      activeNodeIds: ['ecs', 'rds'],
      activeConnectionIds: ['ecs-to-rds'],
      packetAtNodeId: 'ecs',
      dimmedNodeIds: [],
    },
    headers: { srcIp: 'ECS SG', srcPort: '*', dstIp: 'RDS', dstPort: '5432' },
    labels: {
      srcIp: '(送信元= ECSのSG)',
      srcPort: '(任意)',
      dstIp: '(RDSエンドポイント)',
      dstPort: '(PostgreSQL)',
    },
    changes: ['srcIp', 'dstIp', 'dstPort'],
    desc: `<p>RDSのSGは <code>inbound 5432 from <span onclick="openGlossary('rds-sg')" class="glossary-link font-bold">ECS SG</span></code> だけを許可しています。</p>
           <p class='mt-2 text-emerald-400 font-bold'>→ 許可。これでインターネット → ALB → ECS → RDS のチェーンが全て通りました。</p>
           <p class='mt-1 text-slate-400'>各段で「1つ手前のSGからだけ」許可するのが、最小権限なSGチェーンです。</p>`,
    keyPoints,
  },
];
