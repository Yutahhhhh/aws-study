import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'sg-default-deny',
    title: '許可がなければ拒否',
    description: 'SGのinboundは「明示的に許可したものだけ」通します。ルールに無い通信は黙って破棄されます(デフォルト拒否)。',
    accentColor: 'text-rose-400',
  },
  {
    glossaryTermId: 'sg-vs-subnet',
    title: 'Private Subnet + SG の二重防御',
    description: 'そもそもPrivate Subnetは外から直接ルーティングできません。さらにSGでも絞ることで、経路と許可の両面で守ります。',
    accentColor: 'text-blue-400',
  },
];

export const blockedSteps: SimulationStep[] = [
  {
    title: '【遮断】インターネット → ECS:3000 を直接',
    location: 'ECS Security Group',
    diagramState: {
      activeNodeIds: ['internet', 'ecs'],
      activeConnectionIds: ['net-to-ecs'],
      packetAtNodeId: 'internet',
      dimmedNodeIds: ['alb', 'rds'],
    },
    headers: { srcIp: '0.0.0.0/0', srcPort: '*', dstIp: 'ECS', dstPort: '3000' },
    labels: {
      srcIp: '(攻撃者など外部)',
      srcPort: '(任意)',
      dstIp: '(ECS Taskを直接狙う)',
      dstPort: '(コンテナポート)',
    },
    changes: [],
    desc: `<p>攻撃者がALBを飛ばしてECSの3000番を直接狙ったとします。ECSのSGは <code>3000 from ALB SG</code> しか許可していません。</p>
           <p class='mt-2 text-rose-400 font-bold'>→ 遮断。送信元がALB SGでないため、<span onclick="openGlossary('sg-default-deny')" class="glossary-link font-bold">許可ルールに一致せず破棄</span >されます。</p>
           <p class='mt-1 text-slate-400'>そもそもECSはPrivate Subnetにいるため、外から直接ルーティングもできません。</p>`,
    keyPoints,
  },
  {
    title: '【遮断】インターネット → RDS:5432 を直接',
    location: 'RDS Security Group',
    diagramState: {
      activeNodeIds: ['internet', 'rds'],
      activeConnectionIds: ['net-to-rds'],
      packetAtNodeId: 'internet',
      dimmedNodeIds: ['alb', 'ecs'],
    },
    headers: { srcIp: '0.0.0.0/0', srcPort: '*', dstIp: 'RDS', dstPort: '5432' },
    labels: {
      srcIp: '(外部からの直接接続試行)',
      srcPort: '(任意)',
      dstIp: '(RDSを直接狙う)',
      dstPort: '(PostgreSQL)',
    },
    changes: [],
    desc: `<p>DBを直接狙う通信です。RDSのSGは <code>5432 from ECS SG</code> しか許可していません。加えてRDSは <code>publicly_accessible = false</code> です。</p>
           <p class='mt-2 text-rose-400 font-bold'>→ 遮断。<span onclick="openGlossary('sg-vs-subnet')" class="glossary-link font-bold">Private Subnetの経路 と SGの許可</span >の二重で守られています。</p>`,
    keyPoints,
  },
  {
    title: '【設定ミス例】RDS SGがIP許可だと壊れる',
    location: 'よくある失敗',
    diagramState: {
      activeNodeIds: ['ecs', 'rds'],
      activeConnectionIds: ['ecs-to-rds'],
      packetAtNodeId: 'ecs',
      dimmedNodeIds: ['internet', 'alb'],
    },
    headers: { srcIp: '10.2.11.20', srcPort: '*', dstIp: 'RDS', dstPort: '5432' },
    labels: {
      srcIp: '(今日のECS TaskのIP)',
      srcPort: '(任意)',
      dstIp: '(RDS)',
      dstPort: '(PostgreSQL)',
    },
    changes: [],
    desc: `<p>もしRDS SGを「特定IP <code>10.2.11.20</code> から許可」とIPで書いてしまうと、Fargateの再デプロイでTaskのIPが変わった瞬間に接続できなくなります。</p>
           <p class='mt-2 text-rose-400 font-bold'>→ ある日突然DB接続エラー。原因はSGのIP直書きです。</p>
           <p class='mt-1 text-emerald-400'>だからVPC内では <span onclick="openGlossary('sg-reference')" class="glossary-link font-bold">SG参照</span >で許可するのが基本です。</p>`,
    keyPoints,
  },
];
