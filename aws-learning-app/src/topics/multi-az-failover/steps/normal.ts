import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'subnet-per-az',
    title: '1 Subnet = 1 AZ',
    description: 'Subnetは1つのAZにしか属せません。Multi-AZにするにはAZの数だけSubnetを作り、ECSやRDSを分散配置します。',
    accentColor: 'text-emerald-400',
  },
  {
    glossaryTermId: 'alb-multi-az',
    title: 'ALBは複数AZにまたがる',
    description: 'ALBは指定した各AZのPublic Subnetにノードを持ち、健全なTaskへ振り分けます。片方のAZが落ちても入口を維持できます。',
    accentColor: 'text-indigo-400',
  },
];

export const normalSteps: SimulationStep[] = [
  {
    title: '【平常時】ALBが2つのAZのTaskへ振り分け',
    location: 'ALB → ECS (AZ-a / AZ-c)',
    diagramState: {
      activeNodeIds: ['alb', 'ecs-a', 'ecs-c'],
      activeConnectionIds: ['alb-to-ecs-a', 'alb-to-ecs-c'],
      packetAtNodeId: 'alb',
      dimmedNodeIds: [],
    },
    headers: { srcIp: 'ALB', srcPort: '*', dstIp: 'ECS (両AZ)', dstPort: '3000' },
    labels: {
      srcIp: '(ALBノード)',
      srcPort: '(任意)',
      dstIp: '(AZ-a と AZ-c のTask)',
      dstPort: '(コンテナポート)',
    },
    changes: [],
    desc: `<p>ECS Serviceに2つのAZのPrivate Subnetを指定しているため、Taskは<strong>AZ-aとAZ-cの両方</strong>に配置されます。</p>
           <p class='mt-2'>ALBは両AZの健全なTaskへリクエストを振り分けます。負荷も可用性も2AZに分散します。</p>`,
    keyPoints,
  },
  {
    title: '【平常時】読み書きはRDS Primary(AZ-a)へ',
    location: 'ECS → RDS Primary',
    diagramState: {
      activeNodeIds: ['ecs-a', 'ecs-c', 'rds-primary'],
      activeConnectionIds: ['ecs-a-to-rds', 'ecs-c-to-rds'],
      packetAtNodeId: 'rds-primary',
      dimmedNodeIds: ['rds-standby'],
    },
    headers: { srcIp: 'ECS', srcPort: '*', dstIp: 'RDS Primary', dstPort: '5432' },
    labels: {
      srcIp: '(両AZのTask)',
      srcPort: '(任意)',
      dstIp: '(単一エンドポイント→Primary)',
      dstPort: '(PostgreSQL)',
    },
    changes: [],
    desc: `<p>どちらのAZのTaskも、RDSの<strong>単一エンドポイント</strong>に接続します。普段その向き先はAZ-aのPrimaryです。</p>
           <p class='mt-2 text-slate-400'>アプリは「Primaryはどっち?」を意識しません。エンドポイントに繋ぐだけです。</p>`,
    keyPoints,
  },
  {
    title: '【平常時】PrimaryからStandbyへ同期レプリケーション',
    location: 'RDS Primary → Standby',
    diagramState: {
      activeNodeIds: ['rds-primary', 'rds-standby'],
      activeConnectionIds: ['rds-sync'],
      packetAtNodeId: 'rds-primary',
      dimmedNodeIds: ['alb'],
    },
    headers: { srcIp: 'RDS Primary', srcPort: '*', dstIp: 'RDS Standby', dstPort: '5432' },
    labels: {
      srcIp: '(AZ-a Primary)',
      srcPort: '-',
      dstIp: '(AZ-c Standby / 同期)',
      dstPort: '(レプリケーション)',
    },
    changes: [],
    desc: `<p><strong><span onclick="openGlossary('multi-az-rds')" class="glossary-link font-bold">Multi-AZ</span></strong>では、PrimaryからStandbyへ同期レプリケーションが行われます。</p>
           <p class='mt-2 text-slate-400'>Standbyは通常、読み取りには使えません(failover用)。読み取りを分散したい場合はRead Replicaを別に使います。</p>`,
    keyPoints,
  },
];
