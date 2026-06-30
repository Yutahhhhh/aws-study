import type { DiagramConfig, DiagramPosition } from '../../types/diagram';

const zones = [
  {
    id: 'vpc',
    label: 'VPC (10.2.0.0/16)',
    position: { x: 40, y: 40, width: 880, height: 500 },
    contentPadding: { top: 46, right: 18, bottom: 18, left: 18 },
    style: {
      borderColor: 'border-slate-600',
      borderStyle: 'border-dashed',
      bgColor: 'bg-transparent',
      labelColor: 'text-slate-500',
    },
  },
  {
    id: 'az-a',
    label: 'AZ ap-northeast-1a',
    position: { x: 60, y: 150, width: 410, height: 370 },
    contentPadding: { top: 50, right: 18, bottom: 18, left: 18 },
    style: {
      borderColor: 'border-emerald-600',
      borderStyle: 'border-dashed',
      bgColor: 'bg-emerald-500/[0.03]',
      labelColor: 'text-emerald-400',
    },
  },
  {
    id: 'az-c',
    label: 'AZ ap-northeast-1c',
    position: { x: 490, y: 150, width: 410, height: 370 },
    contentPadding: { top: 50, right: 18, bottom: 18, left: 18 },
    style: {
      borderColor: 'border-blue-500',
      borderStyle: 'border-dashed',
      bgColor: 'bg-blue-500/[0.03]',
      labelColor: 'text-blue-400',
    },
  },
] satisfies DiagramConfig['zones'];

const placeInZone = (
  zoneId: (typeof zones)[number]['id'],
  position: DiagramPosition,
): DiagramPosition => {
  const zone = zones.find((item) => item.id === zoneId);
  if (!zone) return position;
  const padding = zone.contentPadding ?? { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    ...position,
    x: zone.position.x + padding.left + position.x,
    y: zone.position.y + padding.top + position.y,
  };
};

export const diagramConfig: DiagramConfig = {
  viewport: { width: 960, height: 560, padding: 48 },
  zones,
  nodes: [
    {
      id: 'alb',
      label: 'ALB',
      sublabel: '2つのAZにまたがる',
      metadata: '健全なTaskへ振り分け',
      icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Elastic-Load-Balancing_48.svg',
      position: { x: 300, y: 55, width: 360, height: 70 },
      glossaryTermId: 'alb-multi-az',
      style: {
        bgColor: 'bg-indigo-950',
        borderColor: 'border-indigo-500',
        textColor: 'text-indigo-200',
        accentColor: 'text-indigo-400',
      },
    },
    {
      id: 'ecs-a',
      label: 'ECS Task (AZ-a)',
      sublabel: 'Private Subnet A',
      icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.svg',
      position: placeInZone('az-a', { x: 40, y: 30, width: 320, height: 100 }),
      glossaryTermId: 'subnet-per-az',
      style: {
        bgColor: 'bg-emerald-950',
        borderColor: 'border-emerald-500',
        textColor: 'text-emerald-200',
        accentColor: 'text-emerald-400',
      },
    },
    {
      id: 'ecs-c',
      label: 'ECS Task (AZ-c)',
      sublabel: 'Private Subnet C',
      icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.svg',
      position: placeInZone('az-c', { x: 40, y: 30, width: 320, height: 100 }),
      glossaryTermId: 'subnet-per-az',
      style: {
        bgColor: 'bg-emerald-950',
        borderColor: 'border-emerald-500',
        textColor: 'text-emerald-200',
        accentColor: 'text-emerald-400',
      },
    },
    {
      id: 'rds-primary',
      label: 'RDS Primary',
      sublabel: 'AZ-a',
      metadata: '読み書き',
      icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Database/48/Arch_Amazon-RDS_48.svg',
      position: placeInZone('az-a', { x: 40, y: 180, width: 320, height: 110 }),
      glossaryTermId: 'multi-az-rds',
      style: {
        bgColor: 'bg-sky-950',
        borderColor: 'border-sky-500',
        textColor: 'text-sky-200',
        accentColor: 'text-sky-400',
      },
    },
    {
      id: 'rds-standby',
      label: 'RDS Standby',
      sublabel: 'AZ-c',
      metadata: '同期 / 通常は読めない',
      icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Database/48/Arch_Amazon-RDS_48.svg',
      position: placeInZone('az-c', { x: 40, y: 180, width: 320, height: 110 }),
      glossaryTermId: 'failover',
      style: {
        bgColor: 'bg-slate-800',
        borderColor: 'border-slate-500',
        textColor: 'text-slate-300',
        accentColor: 'text-slate-400',
      },
    },
  ],
  connections: [
    { id: 'alb-to-ecs-a', from: 'alb', to: 'ecs-a', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'alb-to-ecs-c', from: 'alb', to: 'ecs-c', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'ecs-a-to-rds', from: 'ecs-a', to: 'rds-primary', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'ecs-c-to-rds', from: 'ecs-c', to: 'rds-primary', fromAnchor: 'bottom', toAnchor: 'right' },
    { id: 'rds-sync', from: 'rds-primary', to: 'rds-standby', fromAnchor: 'right', toAnchor: 'left', style: { dashed: true } },
  ],
};
