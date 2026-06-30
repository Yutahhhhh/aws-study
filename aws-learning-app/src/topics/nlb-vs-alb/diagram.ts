import type { DiagramConfig, DiagramPosition } from '../../types/diagram';

const ICON = {
  alb: '/src/assets/aws/Resource-Icons_07312025/Res_Networking-Content-Delivery/Res_Elastic-Load-Balancing_Application-Load-Balancer_48.svg',
  nlb: '/src/assets/aws/Resource-Icons_07312025/Res_Networking-Content-Delivery/Res_Elastic-Load-Balancing_Network-Load-Balancer_48.svg',
  ecs: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.svg',
};

const zones = [
  {
    id: 'vpc',
    label: 'VPC',
    position: { x: 250, y: 60, width: 720, height: 520 },
    contentPadding: { top: 44, right: 18, bottom: 18, left: 18 },
    style: { borderColor: 'border-slate-600', borderStyle: 'border-dashed', bgColor: 'bg-transparent', labelColor: 'text-slate-500' },
  },
  {
    id: 'public-subnet',
    label: 'Public Subnet',
    position: { x: 270, y: 110, width: 300, height: 450 },
    contentPadding: { top: 50, right: 18, bottom: 18, left: 18 },
    style: { borderColor: 'border-emerald-600', borderStyle: 'border-dashed', bgColor: 'bg-emerald-500/[0.03]', labelColor: 'text-emerald-400' },
  },
  {
    id: 'private-subnet',
    label: 'Private Subnet (targets)',
    position: { x: 600, y: 110, width: 350, height: 450 },
    contentPadding: { top: 50, right: 18, bottom: 18, left: 18 },
    style: { borderColor: 'border-blue-500', borderStyle: 'border-dashed', bgColor: 'bg-blue-500/[0.03]', labelColor: 'text-blue-400' },
  },
] satisfies DiagramConfig['zones'];

const placeInZone = (zoneId: (typeof zones)[number]['id'], position: DiagramPosition): DiagramPosition => {
  const zone = zones.find((item) => item.id === zoneId);
  if (!zone) return position;
  const padding = zone.contentPadding ?? { top: 0, right: 0, bottom: 0, left: 0 };
  return { ...position, x: zone.position.x + padding.left + position.x, y: zone.position.y + padding.top + position.y };
};

const ecsStyle = { bgColor: 'bg-emerald-950', borderColor: 'border-emerald-500', textColor: 'text-emerald-200', accentColor: 'text-emerald-400' };

export const diagramConfig: DiagramConfig = {
  viewport: { width: 1000, height: 620, padding: 48 },
  zones,
  nodes: [
    {
      id: 'client',
      label: 'クライアント',
      sublabel: 'src 203.0.113.10',
      icon: 'Users',
      position: { x: 40, y: 280, width: 160, height: 96 },
      style: { bgColor: 'bg-slate-800', borderColor: 'border-slate-500', textColor: 'text-slate-200', accentColor: 'text-slate-400' },
    },
    {
      id: 'alb',
      label: 'ALB (L7)',
      sublabel: 'HTTP/HTTPS を理解',
      metadata: 'パス/ホストで振り分け',
      icon: ICON.alb,
      position: placeInZone('public-subnet', { x: 20, y: 20, width: 250, height: 120 }),
      glossaryTermId: 'l4-vs-l7',
      style: { bgColor: 'bg-indigo-950', borderColor: 'border-indigo-500', textColor: 'text-indigo-200', accentColor: 'text-indigo-400' },
    },
    {
      id: 'nlb',
      label: 'NLB (L4)',
      sublabel: 'TCP/UDP をそのまま',
      metadata: '固定IP・超低遅延',
      icon: ICON.nlb,
      position: placeInZone('public-subnet', { x: 20, y: 230, width: 250, height: 120 }),
      glossaryTermId: 'nlb-source-ip',
      style: { bgColor: 'bg-amber-950', borderColor: 'border-amber-500', textColor: 'text-amber-200', accentColor: 'text-amber-400' },
    },
    {
      id: 'ecs-web',
      label: 'ECS: web ( / )',
      sublabel: '静的/画面',
      icon: ICON.ecs,
      position: placeInZone('private-subnet', { x: 20, y: 20, width: 300, height: 80 }),
      glossaryTermId: 'alb-path-routing',
      style: ecsStyle,
    },
    {
      id: 'ecs-api',
      label: 'ECS: api ( /api )',
      sublabel: 'REST API',
      icon: ICON.ecs,
      position: placeInZone('private-subnet', { x: 20, y: 115, width: 300, height: 80 }),
      glossaryTermId: 'alb-path-routing',
      style: ecsStyle,
    },
    {
      id: 'ecs-tcp',
      label: 'ECS: gRPC (TCP 50051)',
      sublabel: '非HTTP / 双方向',
      icon: ICON.ecs,
      position: placeInZone('private-subnet', { x: 20, y: 230, width: 300, height: 80 }),
      glossaryTermId: 'nlb-static-ip',
      style: ecsStyle,
    },
  ],
  connections: [
    { id: 'client-to-alb', from: 'client', to: 'alb', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'client-to-nlb', from: 'client', to: 'nlb', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'alb-to-web', from: 'alb', to: 'ecs-web', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'alb-to-api', from: 'alb', to: 'ecs-api', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'nlb-to-tcp', from: 'nlb', to: 'ecs-tcp', fromAnchor: 'right', toAnchor: 'left' },
  ],
};
