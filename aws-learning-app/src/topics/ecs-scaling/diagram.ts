import type { DiagramConfig, DiagramPosition } from '../../types/diagram';

const ICON = {
  alb: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Elastic-Load-Balancing_48.svg',
  ecs: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.svg',
  cw: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Management-Governance/48/Arch_Amazon-CloudWatch_48.svg',
  asg: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Compute/48/Arch_Amazon-EC2-Auto-Scaling_48.svg',
};

const zones = [
  {
    id: 'vpc',
    label: 'VPC (10.3.0.0/16)',
    position: { x: 250, y: 150, width: 700, height: 440 },
    contentPadding: { top: 46, right: 18, bottom: 18, left: 18 },
    style: {
      borderColor: 'border-slate-600',
      borderStyle: 'border-dashed',
      bgColor: 'bg-transparent',
      labelColor: 'text-slate-500',
    },
  },
  {
    id: 'public-subnet',
    label: 'Public Subnet',
    position: { x: 270, y: 320, width: 280, height: 250 },
    contentPadding: { top: 50, right: 18, bottom: 18, left: 18 },
    style: {
      borderColor: 'border-emerald-600',
      borderStyle: 'border-dashed',
      bgColor: 'bg-emerald-500/[0.03]',
      labelColor: 'text-emerald-400',
    },
  },
  {
    id: 'private-subnet',
    label: 'Private Subnet (ECS Service)',
    position: { x: 580, y: 320, width: 350, height: 250 },
    contentPadding: { top: 50, right: 18, bottom: 18, left: 18 },
    style: {
      borderColor: 'border-blue-500',
      borderStyle: 'border-dashed',
      bgColor: 'bg-blue-500/[0.03]',
      labelColor: 'text-blue-400',
    },
  },
] satisfies DiagramConfig['zones'];

const placeInZone = (zoneId: (typeof zones)[number]['id'], position: DiagramPosition): DiagramPosition => {
  const zone = zones.find((item) => item.id === zoneId);
  if (!zone) return position;
  const padding = zone.contentPadding ?? { top: 0, right: 0, bottom: 0, left: 0 };
  return { ...position, x: zone.position.x + padding.left + position.x, y: zone.position.y + padding.top + position.y };
};

const taskStyle = {
  bgColor: 'bg-emerald-950',
  borderColor: 'border-emerald-500',
  textColor: 'text-emerald-200',
  accentColor: 'text-emerald-400',
};

export const diagramConfig: DiagramConfig = {
  viewport: { width: 980, height: 620, padding: 48 },
  zones,
  nodes: [
    {
      id: 'user',
      label: 'クライアント',
      sublabel: '負荷(リクエスト)',
      icon: 'Users',
      position: { x: 40, y: 360, width: 150, height: 90 },
      style: { bgColor: 'bg-slate-800', borderColor: 'border-slate-500', textColor: 'text-slate-200', accentColor: 'text-slate-400' },
    },
    {
      id: 'cloudwatch',
      label: 'CloudWatch',
      sublabel: 'CPU/メモリ/リクエスト数',
      metadata: 'Metrics & Alarm',
      icon: ICON.cw,
      position: { x: 300, y: 175, width: 250, height: 92 },
      glossaryTermId: 'cloudwatch-alarm',
      style: { bgColor: 'bg-rose-950', borderColor: 'border-rose-500', textColor: 'text-rose-200', accentColor: 'text-rose-400' },
    },
    {
      id: 'autoscaling',
      label: 'Application Auto Scaling',
      sublabel: 'Target Tracking',
      metadata: 'Desired Count を増減',
      icon: ICON.asg,
      position: { x: 600, y: 175, width: 290, height: 92 },
      glossaryTermId: 'target-tracking',
      style: { bgColor: 'bg-amber-950', borderColor: 'border-amber-500', textColor: 'text-amber-200', accentColor: 'text-amber-400' },
    },
    {
      id: 'alb',
      label: 'ALB',
      sublabel: '健全なTaskへ分散',
      icon: ICON.alb,
      position: placeInZone('public-subnet', { x: 20, y: 30, width: 230, height: 150 }),
      glossaryTermId: 'ecs-service',
      style: { bgColor: 'bg-indigo-950', borderColor: 'border-indigo-500', textColor: 'text-indigo-200', accentColor: 'text-indigo-400' },
    },
    {
      id: 'task-1',
      label: 'Task 1',
      sublabel: 'Fargate',
      icon: ICON.ecs,
      position: placeInZone('private-subnet', { x: 20, y: 20, width: 140, height: 78 }),
      glossaryTermId: 'desired-count',
      style: taskStyle,
    },
    {
      id: 'task-2',
      label: 'Task 2',
      sublabel: 'Fargate',
      icon: ICON.ecs,
      position: placeInZone('private-subnet', { x: 175, y: 20, width: 140, height: 78 }),
      glossaryTermId: 'desired-count',
      style: taskStyle,
    },
    {
      id: 'task-3',
      label: 'Task 3',
      sublabel: 'scale-outで起動',
      icon: ICON.ecs,
      position: placeInZone('private-subnet', { x: 20, y: 110, width: 140, height: 78 }),
      glossaryTermId: 'desired-count',
      style: taskStyle,
    },
    {
      id: 'task-4',
      label: 'Task 4',
      sublabel: 'scale-outで起動',
      icon: ICON.ecs,
      position: placeInZone('private-subnet', { x: 175, y: 110, width: 140, height: 78 }),
      glossaryTermId: 'desired-count',
      style: taskStyle,
    },
  ],
  connections: [
    { id: 'user-to-alb', from: 'user', to: 'alb', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'alb-to-task-1', from: 'alb', to: 'task-1', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'alb-to-task-2', from: 'alb', to: 'task-2', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'alb-to-task-3', from: 'alb', to: 'task-3', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'alb-to-task-4', from: 'alb', to: 'task-4', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'cw-to-as', from: 'cloudwatch', to: 'autoscaling', fromAnchor: 'right', toAnchor: 'left', style: { dashed: true } },
    { id: 'as-to-task-3', from: 'autoscaling', to: 'task-3', fromAnchor: 'bottom', toAnchor: 'top', style: { dashed: true } },
    { id: 'as-to-task-4', from: 'autoscaling', to: 'task-4', fromAnchor: 'bottom', toAnchor: 'top', style: { dashed: true } },
  ],
};
