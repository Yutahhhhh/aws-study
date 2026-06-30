import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'cooldown',
    title: 'すぐには減らさない',
    description: 'scale-inは慎重です。低負荷がクールダウン期間続いて初めてTaskを減らします。増減を繰り返す“バタつき(フラッピング)”を避けるためです。',
    accentColor: 'text-amber-400',
  },
  {
    glossaryTermId: 'connection-draining',
    title: '処理中のリクエストを守る',
    description: 'Taskを止める前にALBが新規振り分けを止め、処理中のリクエストが終わるのを待ちます(deregistration delay / draining)。',
    accentColor: 'text-indigo-400',
  },
];

export const scaleInSteps: SimulationStep[] = [
  {
    title: '【負荷低下】CPUが目標を下回る',
    location: 'Task → CloudWatch (メトリクス)',
    diagramState: {
      activeNodeIds: ['task-1', 'task-2', 'task-3', 'task-4', 'cloudwatch'],
      activeConnectionIds: [],
      packetAtNodeId: 'cloudwatch',
      dimmedNodeIds: ['user'],
    },
    headers: { srcIp: 'ECS Task ×4', srcPort: '-', dstIp: 'CloudWatch', dstPort: 'Metric' },
    labels: { srcIp: '(CPU使用率)', srcPort: '-', dstIp: '(平均 20% < 目標50%)', dstPort: '(低負荷)' },
    changes: ['dstIp'],
    desc: `<p>アクセスが落ち着き、CPU使用率が目標(50%)を大きく下回ります。CloudWatchはこれを継続的に観測します。</p>`,
    keyPoints,
  },
  {
    title: '【クールダウン】すぐには減らさず様子を見る',
    location: 'Auto Scaling (cooldown)',
    diagramState: {
      activeNodeIds: ['cloudwatch', 'autoscaling'],
      activeConnectionIds: ['cw-to-as'],
      packetAtNodeId: 'autoscaling',
      dimmedNodeIds: ['user'],
    },
    headers: { srcIp: 'Auto Scaling', srcPort: '-', dstIp: '(待機)', dstPort: 'cooldown' },
    labels: { srcIp: '(Target Tracking)', srcPort: '-', dstIp: '(低負荷が継続するか確認)', dstPort: '(数分)' },
    changes: ['dstPort'],
    desc: `<p>低負荷が一時的でないかを<span onclick="openGlossary('cooldown')" class="glossary-link font-bold">クールダウン</span>期間で見極めます。すぐ減らすと、再び増える時にコールドスタート的な遅延が出るためです。</p>`,
    keyPoints,
  },
  {
    title: '【scale-in】drainしてからTaskを停止 (4→2)',
    location: 'ALB drain → Task 停止',
    diagramState: {
      activeNodeIds: ['alb', 'autoscaling', 'task-1', 'task-2'],
      activeConnectionIds: ['as-to-task-3', 'as-to-task-4'],
      packetAtNodeId: 'autoscaling',
      dimmedNodeIds: ['task-3', 'task-4', 'user'],
    },
    headers: { srcIp: 'Auto Scaling', srcPort: '-', dstIp: 'ECS Service', dstPort: 'Desired=2' },
    labels: { srcIp: '(Target Tracking)', srcPort: '-', dstIp: '(Task 3/4 を停止)', dstPort: '(drain後)' },
    changes: ['dstIp', 'dstPort'],
    desc: `<p>Desired Countを<strong>4→2</strong>に戻します。停止対象のTaskはALBから外され、<span onclick="openGlossary('connection-draining')" class="glossary-link font-bold">処理中のリクエストが終わるのを待って</span>から停止します。</p>
           <p class='mt-2 text-slate-400'>これで使っていないTaskの課金を止められます。</p>`,
    keyPoints,
  },
];
