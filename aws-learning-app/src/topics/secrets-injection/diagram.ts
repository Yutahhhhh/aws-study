import type { DiagramConfig, DiagramPosition } from '../../types/diagram';

const zones = [
  {
    id: 'vpc',
    label: 'VPC (10.2.0.0/16)',
    position: { x: 40, y: 40, width: 560, height: 440 },
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
    position: { x: 60, y: 75, width: 520, height: 390 },
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
      id: 'ecs',
      label: 'ECS Task',
      sublabel: 'execution role',
      metadata: '起動時に secrets 取得',
      icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.svg',
      position: placeInZone('private-subnet', { x: 24, y: 110, width: 210, height: 130 }),
      glossaryTermId: 'execution-role',
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
      sublabel: 'Interface (PrivateLink)',
      metadata: 'secretsmanager / ssm',
      icon: 'Plug',
      position: placeInZone('private-subnet', { x: 270, y: 110, width: 200, height: 130 }),
      glossaryTermId: 'secrets-route',
      style: {
        bgColor: 'bg-orange-950',
        borderColor: 'border-orange-500',
        textColor: 'text-orange-200',
        accentColor: 'text-orange-400',
      },
    },
    {
      id: 'secrets',
      label: 'Secrets Manager',
      sublabel: 'DBパスワード等',
      metadata: '自動ローテーション可',
      icon: 'KeyRound',
      position: { x: 650, y: 90, width: 210, height: 130 },
      glossaryTermId: 'secrets-manager',
      style: {
        bgColor: 'bg-rose-950',
        borderColor: 'border-rose-500',
        textColor: 'text-rose-200',
        accentColor: 'text-rose-400',
      },
    },
    {
      id: 'ssm-param',
      label: 'SSM Parameter Store',
      sublabel: 'SecureString',
      metadata: '設定値・軽い秘密',
      icon: 'SlidersHorizontal',
      position: { x: 650, y: 290, width: 210, height: 130 },
      glossaryTermId: 'ssm-parameter',
      style: {
        bgColor: 'bg-purple-950',
        borderColor: 'border-purple-500',
        textColor: 'text-purple-200',
        accentColor: 'text-purple-400',
      },
    },
  ],
  connections: [
    { id: 'ecs-to-vpce', from: 'ecs', to: 'vpce', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'vpce-to-secrets', from: 'vpce', to: 'secrets', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'vpce-to-ssm', from: 'vpce', to: 'ssm-param', fromAnchor: 'bottom', toAnchor: 'left' },
  ],
};
