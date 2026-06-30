import type { DiagramConfig, DiagramPosition } from '../../types/diagram';

const zones = [
  {
    id: 'vpc',
    label: 'VPC (10.0.0.0/16)',
    position: { x: 225, y: 30, width: 625, height: 440 },
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
    label: 'Public Subnet (10.0.1.0/24)',
    position: { x: 245, y: 55, width: 395, height: 390 },
    contentPadding: { top: 56, right: 18, bottom: 18, left: 18 },
    style: {
      borderColor: 'border-emerald-600',
      borderStyle: 'border-dashed',
      bgColor: 'bg-emerald-500/[0.03]',
      labelColor: 'text-emerald-400',
    },
  },
  {
    id: 'private-subnet',
    label: 'Private Subnet (10.0.2.0/24)',
    position: { x: 665, y: 55, width: 170, height: 390 },
    contentPadding: { top: 56, right: 18, bottom: 18, left: 18 },
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
  viewport: {
    width: 900,
    height: 520,
    padding: 48,
  },
  zones,
  nodes: [
    {
      id: 'user-pc',
      label: 'ユーザーPC',
      metadata: '198.51.100.50',
      icon: 'Monitor',
      position: { x: 40, y: 210, width: 150, height: 96 },
      glossaryTermId: 'public-private-ip',
      style: {
        bgColor: 'bg-slate-900',
        borderColor: 'border-slate-600',
        textColor: 'text-slate-300',
        accentColor: 'text-slate-500',
      },
    },
    {
      id: 'igw',
      label: 'IGW',
      sublabel: 'ゲートウェイ',
      icon: '/src/assets/aws/Resource-Icons_07312025/Res_Networking-Content-Delivery/Res_Amazon-VPC_Internet-Gateway_48.svg',
      position: placeInZone('public-subnet', { x: 58, y: 122, width: 140, height: 92 }),
      glossaryTermId: 'igw',
      style: {
        bgColor: 'bg-orange-950',
        borderColor: 'border-orange-600',
        textColor: 'text-orange-100',
        accentColor: 'text-orange-500',
      },
    },
    {
      id: 'alb',
      label: 'ALB',
      sublabel: 'パブリック受信窓口',
      metadata: '203.0.113.10',
      icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Elastic-Load-Balancing_48.svg',
      position: placeInZone('public-subnet', { x: 205, y: 36, width: 140, height: 100 }),
      glossaryTermId: 'alb',
      style: {
        bgColor: 'bg-indigo-950',
        borderColor: 'border-indigo-500',
        textColor: 'text-indigo-200',
        accentColor: 'text-indigo-400',
      },
    },
    {
      id: 'nat-gw',
      label: 'NAT-GW',
      sublabel: 'アウトバウンド中継',
      metadata: '203.0.113.99',
      icon: '/src/assets/aws/Resource-Icons_07312025/Res_Networking-Content-Delivery/Res_Amazon-VPC_NAT-Gateway_48.svg',
      position: placeInZone('public-subnet', { x: 205, y: 224, width: 140, height: 100 }),
      glossaryTermId: 'nat-gateway',
      style: {
        bgColor: 'bg-rose-950',
        borderColor: 'border-rose-500',
        textColor: 'text-rose-200',
        accentColor: 'text-rose-500',
      },
    },
    {
      id: 'ecs',
      label: 'ECS (Rails)',
      sublabel: 'アプリ本体',
      metadata: '10.0.2.20',
      icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.svg',
      position: placeInZone('private-subnet', { x: 4, y: 36, width: 126, height: 100 }),
      glossaryTermId: 'ecs',
      style: {
        bgColor: 'bg-emerald-950',
        borderColor: 'border-emerald-500',
        textColor: 'text-emerald-200',
        accentColor: 'text-emerald-500',
      },
    },
    {
      id: 'slack',
      label: 'Slack API',
      metadata: '3.120.0.1',
      icon: 'MessageSquare',
      position: { x: 40, y: 330, width: 150, height: 96 },
      style: {
        bgColor: 'bg-slate-800',
        borderColor: 'border-slate-600',
        textColor: 'text-slate-300',
        accentColor: 'text-slate-500',
      },
    },
  ],
  connections: [
    { id: 'user-to-igw', from: 'user-pc', to: 'igw', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'igw-to-alb', from: 'igw', to: 'alb', fromAnchor: 'top', toAnchor: 'left' },
    { id: 'alb-to-ecs', from: 'alb', to: 'ecs', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'ecs-to-nat', from: 'ecs', to: 'nat-gw', fromAnchor: 'bottom', toAnchor: 'right' },
    { id: 'nat-to-igw', from: 'nat-gw', to: 'igw', fromAnchor: 'left', toAnchor: 'bottom', style: { dashed: true } },
    { id: 'igw-to-slack', from: 'igw', to: 'slack', fromAnchor: 'bottom', toAnchor: 'right' },
  ],
};
