import type { DiagramConfig, DiagramPosition } from '../../types/diagram';

const zones = [
  {
    id: 'vpc',
    label: 'VPC (10.2.0.0/16)',
    position: { x: 220, y: 30, width: 460, height: 500 },
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
    position: { x: 240, y: 65, width: 190, height: 190 },
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
    position: { x: 240, y: 280, width: 420, height: 230 },
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
      id: 'ecs',
      label: 'ECS Task',
      sublabel: 'Private Subnet',
      metadata: '外へ出たい',
      icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.svg',
      position: placeInZone('private-subnet', { x: 24, y: 40, width: 190, height: 120 }),
      style: {
        bgColor: 'bg-emerald-950',
        borderColor: 'border-emerald-500',
        textColor: 'text-emerald-200',
        accentColor: 'text-emerald-400',
      },
    },
    {
      id: 'vpce',
      label: 'VPC Endpoint',
      sublabel: 'Interface / Gateway',
      metadata: 'AWSサービス向け',
      icon: 'Plug',
      position: placeInZone('private-subnet', { x: 220, y: 40, width: 170, height: 120 }),
      glossaryTermId: 'vpce-interface',
      style: {
        bgColor: 'bg-orange-950',
        borderColor: 'border-orange-500',
        textColor: 'text-orange-200',
        accentColor: 'text-orange-400',
      },
    },
    {
      id: 'nat',
      label: 'NAT Gateway',
      sublabel: 'Public Subnet',
      metadata: 'インターネット向け',
      icon: '/src/assets/aws/Resource-Icons_07312025/Res_Networking-Content-Delivery/Res_Amazon-VPC_NAT-Gateway_48.svg',
      position: placeInZone('public-subnet', { x: 16, y: 30, width: 150, height: 100 }),
      glossaryTermId: 'nat-gateway',
      style: {
        bgColor: 'bg-rose-950',
        borderColor: 'border-rose-500',
        textColor: 'text-rose-200',
        accentColor: 'text-rose-400',
      },
    },
    {
      id: 'igw',
      label: 'IGW',
      sublabel: 'Internet Gateway',
      icon: '/src/assets/aws/Resource-Icons_07312025/Res_Networking-Content-Delivery/Res_Amazon-VPC_Internet-Gateway_48.svg',
      position: { x: 480, y: 110, width: 160, height: 90 },
      style: {
        bgColor: 'bg-slate-800',
        borderColor: 'border-slate-500',
        textColor: 'text-slate-200',
        accentColor: 'text-slate-400',
      },
    },
    {
      id: 'external',
      label: '外部API',
      sublabel: 'Slack / Stripe など',
      metadata: 'インターネット上',
      icon: 'Globe',
      position: { x: 720, y: 90, width: 180, height: 120 },
      glossaryTermId: 'egress',
      style: {
        bgColor: 'bg-slate-900',
        borderColor: 'border-slate-600',
        textColor: 'text-slate-300',
        accentColor: 'text-slate-500',
      },
    },
    {
      id: 'aws-svc',
      label: 'AWSサービス',
      sublabel: 'S3 / ECR / Secrets',
      metadata: 'PrivateLink / Gateway',
      icon: 'Boxes',
      position: { x: 720, y: 360, width: 180, height: 130 },
      glossaryTermId: 'vpce-gateway',
      style: {
        bgColor: 'bg-purple-950',
        borderColor: 'border-purple-500',
        textColor: 'text-purple-200',
        accentColor: 'text-purple-400',
      },
    },
  ],
  connections: [
    { id: 'ecs-to-nat', from: 'ecs', to: 'nat', fromAnchor: 'top', toAnchor: 'bottom' },
    { id: 'nat-to-igw', from: 'nat', to: 'igw', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'igw-to-external', from: 'igw', to: 'external', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'ecs-to-vpce', from: 'ecs', to: 'vpce', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'vpce-to-aws', from: 'vpce', to: 'aws-svc', fromAnchor: 'bottom', toAnchor: 'left' },
  ],
};
