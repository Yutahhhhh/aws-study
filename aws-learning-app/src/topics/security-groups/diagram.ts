import type { DiagramConfig, DiagramPosition } from '../../types/diagram';

const zones = [
  {
    id: 'vpc',
    label: 'VPC (10.2.0.0/16)',
    position: { x: 230, y: 40, width: 640, height: 450 },
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
    position: { x: 250, y: 75, width: 270, height: 390 },
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
    label: 'Private Subnet',
    position: { x: 545, y: 75, width: 300, height: 390 },
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
  viewport: { width: 900, height: 520, padding: 48 },
  zones,
  nodes: [
    {
      id: 'internet',
      label: 'インターネット',
      sublabel: '利用者 / 攻撃者',
      metadata: '不特定多数',
      icon: 'Globe',
      position: { x: 24, y: 200, width: 160, height: 110 },
      style: {
        bgColor: 'bg-slate-900',
        borderColor: 'border-slate-600',
        textColor: 'text-slate-300',
        accentColor: 'text-slate-500',
      },
    },
    {
      id: 'alb',
      label: 'ALB',
      sublabel: 'ALB SG',
      metadata: 'in: 443 from 0.0.0.0/0',
      icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Elastic-Load-Balancing_48.svg',
      position: placeInZone('public-subnet', { x: 30, y: 150, width: 180, height: 120 }),
      glossaryTermId: 'alb-sg',
      style: {
        bgColor: 'bg-indigo-950',
        borderColor: 'border-indigo-500',
        textColor: 'text-indigo-200',
        accentColor: 'text-indigo-400',
      },
    },
    {
      id: 'ecs',
      label: 'ECS Fargate',
      sublabel: 'ECS SG',
      metadata: 'in: 3000 from ALB SG',
      icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.svg',
      position: placeInZone('private-subnet', { x: 30, y: 30, width: 220, height: 110 }),
      glossaryTermId: 'ecs-sg',
      style: {
        bgColor: 'bg-emerald-950',
        borderColor: 'border-emerald-500',
        textColor: 'text-emerald-200',
        accentColor: 'text-emerald-400',
      },
    },
    {
      id: 'rds',
      label: 'RDS PostgreSQL',
      sublabel: 'RDS SG',
      metadata: 'in: 5432 from ECS SG',
      icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Database/48/Arch_Amazon-RDS_48.svg',
      position: placeInZone('private-subnet', { x: 30, y: 190, width: 220, height: 110 }),
      glossaryTermId: 'rds-sg',
      style: {
        bgColor: 'bg-sky-950',
        borderColor: 'border-sky-500',
        textColor: 'text-sky-200',
        accentColor: 'text-sky-400',
      },
    },
  ],
  connections: [
    { id: 'net-to-alb', from: 'internet', to: 'alb', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'alb-to-ecs', from: 'alb', to: 'ecs', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'ecs-to-rds', from: 'ecs', to: 'rds', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'net-to-ecs', from: 'internet', to: 'ecs', fromAnchor: 'top', toAnchor: 'left', style: { dashed: true } },
    { id: 'net-to-rds', from: 'internet', to: 'rds', fromAnchor: 'bottom', toAnchor: 'left', style: { dashed: true } },
  ],
};
