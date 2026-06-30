import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'target-tracking',
    title: 'Target Tracking が基本',
    description: '「CPU平均を50%に保つ」のように目標値を決めると、Application Auto Scalingが必要なTask数を自動計算してDesired Countを増減します。',
    accentColor: 'text-amber-400',
  },
  {
    glossaryTermId: 'desired-count',
    title: 'スケールの単位はTask数',
    description: 'ECS(Fargate)のスケールは「Taskを何個動かすか(Desired Count)」です。1つのTaskを大きくするのではなく、同じTaskを横に増やします。',
    accentColor: 'text-emerald-400',
  },
];

export const scaleOutSteps: SimulationStep[] = [
  {
    title: '【平常時】Desired Count = 2 でリクエストを捌く',
    location: 'ALB → Task 1 / Task 2',
    diagramState: {
      activeNodeIds: ['user', 'alb', 'task-1', 'task-2'],
      activeConnectionIds: ['user-to-alb', 'alb-to-task-1', 'alb-to-task-2'],
      packetAtNodeId: 'alb',
      dimmedNodeIds: ['task-3', 'task-4', 'autoscaling'],
    },
    headers: { srcIp: 'Client', srcPort: '*', dstIp: 'ECS Task ×2', dstPort: '3000' },
    labels: { srcIp: '(利用者)', srcPort: '(任意)', dstIp: '(Desired Count = 2)', dstPort: '(コンテナポート)' },
    changes: [],
    desc: `<p>平常時はECS Serviceが<strong>2つのTask</strong>を維持し、ALBが両方へ振り分けます。</p>
           <p class='mt-2 text-slate-400'>この「維持したいTask数」が<span onclick="openGlossary('desired-count')" class="glossary-link font-bold">Desired Count</span>です。</p>`,
    keyPoints,
  },
  {
    title: '【負荷上昇】CloudWatchがCPU高騰を検知しアラーム',
    location: 'Task → CloudWatch (メトリクス)',
    diagramState: {
      activeNodeIds: ['user', 'task-1', 'task-2', 'cloudwatch'],
      activeConnectionIds: ['user-to-alb'],
      packetAtNodeId: 'cloudwatch',
      dimmedNodeIds: ['task-3', 'task-4'],
    },
    headers: { srcIp: 'ECS Task', srcPort: '-', dstIp: 'CloudWatch', dstPort: 'Metric' },
    labels: { srcIp: '(CPU使用率)', srcPort: '-', dstIp: '(平均 85% > 目標50%)', dstPort: '(ALARM)' },
    changes: ['dstIp'],
    desc: `<p>アクセスが急増し、各TaskのCPU使用率が上がります。<span onclick="openGlossary('cloudwatch-alarm')" class="glossary-link font-bold">CloudWatch</span>がメトリクスを集計し、目標(50%)を超えたためアラーム状態になります。</p>`,
    keyPoints,
  },
  {
    title: '【scale-out】Desired Countを増やし、新Taskを起動',
    location: 'Auto Scaling → ECS (Desired Count 2→4)',
    diagramState: {
      activeNodeIds: ['cloudwatch', 'autoscaling', 'task-3', 'task-4'],
      activeConnectionIds: ['cw-to-as', 'as-to-task-3', 'as-to-task-4'],
      packetAtNodeId: 'autoscaling',
      dimmedNodeIds: [],
    },
    headers: { srcIp: 'Auto Scaling', srcPort: '-', dstIp: 'ECS Service', dstPort: 'UpdateService' },
    labels: { srcIp: '(Target Tracking)', srcPort: '-', dstIp: '(Desired Count = 4)', dstPort: '(Task起動)' },
    changes: ['dstPort'],
    desc: `<p><span onclick="openGlossary('target-tracking')" class="glossary-link font-bold">Application Auto Scaling</span>がDesired Countを<strong>2→4</strong>に引き上げ、ECSが新しいTaskを2つ起動します。</p>
           <p class='mt-2 text-slate-400'>新Taskは<span onclick="openGlossary('ecs-service')" class="glossary-link font-bold">ALBのhealth check</span>に通って初めてトラフィックを受けます。</p>`,
    keyPoints,
  },
  {
    title: '【分散】ALBが4つのTaskへ均等に振り分け',
    location: 'ALB → Task 1〜4',
    diagramState: {
      activeNodeIds: ['user', 'alb', 'task-1', 'task-2', 'task-3', 'task-4'],
      activeConnectionIds: ['user-to-alb', 'alb-to-task-1', 'alb-to-task-2', 'alb-to-task-3', 'alb-to-task-4'],
      packetAtNodeId: 'alb',
      dimmedNodeIds: [],
    },
    headers: { srcIp: 'Client', srcPort: '*', dstIp: 'ECS Task ×4', dstPort: '3000' },
    labels: { srcIp: '(利用者)', srcPort: '(任意)', dstIp: '(Desired Count = 4)', dstPort: '(コンテナポート)' },
    changes: ['dstIp'],
    desc: `<p>Taskが4つになり、ALBが全Taskへ分散します。1Taskあたりの負荷が下がり、CPUは目標値へ戻ります。</p>`,
    keyPoints,
  },
];
