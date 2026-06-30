import type { DiagramConfig, DiagramPosition } from '../../types/diagram';

const zones = [
  {
    id: 'vpc',
    label: 'VPC (10.2.0.0/16)',
    position: { x: 410, y: 40, width: 460, height: 440 },
    contentPadding: { top: 46, right: 18, bottom: 18, left: 18 },
    style: {
      borderColor: 'border-slate-600',
      borderStyle: 'border-dashed',
      bgColor: 'bg-transparent',
      labelColor: 'text-slate-500',
    },
  },
  {
    id: 'private-subnet',
    label: 'Private Subnet (10.2.11.0/24)',
    position: { x: 430, y: 75, width: 420, height: 390 },
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
      id: 'admin-pc',
      label: '管理者PC',
      sublabel: 'localhost:15432',
      metadata: 'AWS CLI + SSM plugin',
      icon: 'Laptop',
      position: { x: 24, y: 200, width: 175, height: 120 },
      glossaryTermId: 'port-forwarding',
      style: {
        bgColor: 'bg-slate-900',
        borderColor: 'border-slate-600',
        textColor: 'text-slate-300',
        accentColor: 'text-slate-500',
      },
    },
    {
      id: 'ssm',
      label: 'SSM Session Manager',
      sublabel: 'Systems Manager',
      metadata: 'IAMで認可',
      icon: 'Network',
      position: { x: 235, y: 40, width: 160, height: 120 },
      glossaryTermId: 'ssm-session-manager',
      style: {
        bgColor: 'bg-orange-950',
        borderColor: 'border-orange-500',
        textColor: 'text-orange-200',
        accentColor: 'text-orange-400',
      },
    },
    {
      id: 'bastion',
      label: '管理用EC2',
      sublabel: 'Managed Node',
      metadata: 'inbound 22 なし',
      icon: 'Server',
      position: placeInZone('private-subnet', { x: 30, y: 30, width: 200, height: 120 }),
      glossaryTermId: 'managed-node',
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
      sublabel: 'Private / 非公開',
      metadata: ':5432',
      icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Database/48/Arch_Amazon-RDS_48.svg',
      position: placeInZone('private-subnet', { x: 30, y: 200, width: 200, height: 120 }),
      glossaryTermId: 'rds-private',
      style: {
        bgColor: 'bg-sky-950',
        borderColor: 'border-sky-500',
        textColor: 'text-sky-200',
        accentColor: 'text-sky-400',
      },
    },
  ],
  connections: [
    { id: 'admin-to-ssm', from: 'admin-pc', to: 'ssm', fromAnchor: 'top', toAnchor: 'left' },
    { id: 'ssm-to-bastion', from: 'ssm', to: 'bastion', fromAnchor: 'right', toAnchor: 'top' },
    { id: 'bastion-to-rds', from: 'bastion', to: 'rds', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'admin-to-rds', from: 'admin-pc', to: 'rds', fromAnchor: 'bottom', toAnchor: 'left', style: { dashed: true } },
  ],
};
