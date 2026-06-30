import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'failover',
    title: 'failoverは自動だが瞬断あり',
    description: 'Primary障害時、RDSがStandbyへ自動でfailoverします。エンドポイントの向き先が切り替わりますが、その間は一時的に接続が切れます。',
    accentColor: 'text-rose-400',
  },
  {
    glossaryTermId: 'multi-az-limits',
    title: 'Multi-AZで守れないもの',
    description: 'AZ障害には強くなりますが、アプリのバグ、誤ったmigration、SG設定ミス、リージョン全体障害は守れません。',
    accentColor: 'text-amber-400',
  },
];

export const failoverSteps: SimulationStep[] = [
  {
    title: '【障害発生】AZ-a が停止',
    location: 'AZ ap-northeast-1a',
    diagramState: {
      activeNodeIds: ['ecs-c', 'rds-standby'],
      activeConnectionIds: [],
      packetAtNodeId: 'ecs-c',
      dimmedNodeIds: ['ecs-a', 'rds-primary'],
    },
    headers: { srcIp: '-', srcPort: '-', dstIp: '-', dstPort: '-' },
    labels: {
      srcIp: '(AZ-a のリソースが利用不可)',
      srcPort: '-',
      dstIp: '-',
      dstPort: '-',
    },
    changes: [],
    desc: `<p>AZ-a全体が障害になりました。AZ-aのECS TaskもRDS Primaryも利用できません(図で暗くなっています)。</p>
           <p class='mt-2'>ここからMulti-AZ構成がどう耐えるかを見ます。</p>`,
    keyPoints,
  },
  {
    title: '【入口は維持】ALBがAZ-cのTaskへ振り分け',
    location: 'ALB → ECS (AZ-c)',
    diagramState: {
      activeNodeIds: ['alb', 'ecs-c'],
      activeConnectionIds: ['alb-to-ecs-c'],
      packetAtNodeId: 'alb',
      dimmedNodeIds: ['ecs-a', 'rds-primary'],
    },
    headers: { srcIp: 'ALB', srcPort: '*', dstIp: 'ECS (AZ-c)', dstPort: '3000' },
    labels: {
      srcIp: '(ALBノード)',
      srcPort: '(任意)',
      dstIp: '(健全なAZ-cのTaskのみ)',
      dstPort: '(コンテナポート)',
    },
    changes: [],
    desc: `<p>ALBはhealth checkでAZ-aのTaskを「不健全」と判断し、振り分けから外します。<strong><span onclick="openGlossary('alb-multi-az')" class="glossary-link font-bold">健全なAZ-cのTask</span></strong>だけにリクエストが流れます。</p>
           <p class='mt-2 text-emerald-400 font-bold'>→ 入口は止まりません。ECSのAuto Scalingが不足分を補おうとします。</p>`,
    keyPoints,
  },
  {
    title: '【DB切替】RDSがStandbyへfailover',
    location: 'RDS failover',
    diagramState: {
      activeNodeIds: ['rds-standby'],
      activeConnectionIds: [],
      packetAtNodeId: 'rds-standby',
      dimmedNodeIds: ['ecs-a', 'rds-primary'],
    },
    headers: { srcIp: 'RDS endpoint', srcPort: '*', dstIp: 'Standby→新Primary', dstPort: '5432' },
    labels: {
      srcIp: '(同じエンドポイント)',
      srcPort: '(任意)',
      dstIp: '(向き先がAZ-cへ切替)',
      dstPort: '(PostgreSQL)',
    },
    changes: ['dstIp'],
    desc: `<p>RDSはAZ-cのStandbyへ<strong><span onclick="openGlossary('failover')" class="glossary-link font-bold">failover</span></strong>します。アプリは同じエンドポイントに繋ぎ続けますが、向き先がAZ-cの新Primaryに切り替わります。</p>
           <p class='mt-2 text-rose-400 font-bold'>→ failover中は一時的に接続断。アプリ側の再接続(リトライ)処理が必要です。</p>`,
    keyPoints,
  },
  {
    title: '【まとめ】守れるもの・守れないもの',
    location: 'Multi-AZ の効果と限界',
    diagramState: {
      activeNodeIds: ['alb', 'ecs-c', 'rds-standby'],
      activeConnectionIds: ['alb-to-ecs-c'],
      packetAtNodeId: 'ecs-c',
      dimmedNodeIds: ['ecs-a', 'rds-primary'],
    },
    headers: { srcIp: '-', srcPort: '-', dstIp: '-', dstPort: '-' },
    labels: { srcIp: '-', srcPort: '-', dstIp: '-', dstPort: '-' },
    changes: [],
    desc: `<p>AZ-aが丸ごと落ちても、AZ-cでサービスを継続できました。これがMulti-AZの効果です。</p>
           <p class='mt-2'>ただし<strong><span onclick="openGlossary('multi-az-limits')" class="glossary-link font-bold">守れないもの</span></strong>もあります。アプリのバグ、誤ったmigration、SG/ルートの設定ミス、リージョン全体障害には効きません。</p>
           <p class='mt-1 text-slate-400'>Multi-AZは「落ちない魔法」ではなく「1つのAZに依存しない設計」です。</p>`,
    keyPoints,
  },
];
