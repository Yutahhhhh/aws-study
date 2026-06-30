import type { DiagramConfig, DiagramPosition } from '../../types/diagram';

const zones = [
  {
    id: 'vpc',
    label: 'VPC (10.2.0.0/16)',
    position: { x: 250, y: 150, width: 660, height: 420 },
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
    label: 'Public Subnet (10.2.1.0/24)',
    position: { x: 270, y: 185, width: 300, height: 360 },
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
    label: 'Private Subnet (10.2.11.0/24)',
    position: { x: 590, y: 185, width: 300, height: 360 },
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
    width: 960,
    height: 600,
    padding: 48,
  },
  zones,
  nodes: [
    {
      id: 'user-pc',
      label: '利用者',
      sublabel: 'ブラウザ',
      metadata: 'https://example.com',
      icon: 'Monitor',
      position: { x: 24, y: 250, width: 150, height: 96 },
      glossaryTermId: 'cloudfront',
      style: {
        bgColor: 'bg-slate-900',
        borderColor: 'border-slate-600',
        textColor: 'text-slate-300',
        accentColor: 'text-slate-500',
      },
    },
    {
      id: 'cloudfront',
      label: 'CloudFront',
      sublabel: 'CDN / パス振り分け',
      metadata: '通常→S3 / /api/*→ALB',
      icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Amazon-CloudFront_48.svg',
      position: { x: 250, y: 24, width: 190, height: 100 },
      glossaryTermId: 'cloudfront',
      style: {
        bgColor: 'bg-purple-950',
        borderColor: 'border-purple-500',
        textColor: 'text-purple-200',
        accentColor: 'text-purple-400',
      },
    },
    {
      id: 's3',
      label: 'S3',
      sublabel: 'フロントエンド配置',
      metadata: 'OAC経由のみ読取',
      icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Storage/48/Arch_Amazon-Simple-Storage-Service_48.svg',
      position: { x: 470, y: 24, width: 150, height: 100 },
      glossaryTermId: 's3-oac',
      style: {
        bgColor: 'bg-green-950',
        borderColor: 'border-green-500',
        textColor: 'text-green-200',
        accentColor: 'text-green-400',
      },
    },
    {
      id: 'github',
      label: 'GitHub Actions',
      sublabel: 'OIDCでAWS操作',
      icon: 'GitBranch',
      position: { x: 660, y: 24, width: 130, height: 100 },
      glossaryTermId: 'github-oidc',
      style: {
        bgColor: 'bg-slate-800',
        borderColor: 'border-slate-500',
        textColor: 'text-slate-200',
        accentColor: 'text-slate-400',
      },
    },
    {
      id: 'ecr',
      label: 'ECR',
      sublabel: 'コンテナ画像',
      icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Registry_48.svg',
      position: { x: 810, y: 24, width: 120, height: 100 },
      glossaryTermId: 'ecr',
      style: {
        bgColor: 'bg-fuchsia-950',
        borderColor: 'border-fuchsia-500',
        textColor: 'text-fuchsia-200',
        accentColor: 'text-fuchsia-400',
      },
    },
    {
      id: 'alb',
      label: 'ALB',
      sublabel: '公開受信窓口',
      metadata: '443 → Target Group',
      icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Elastic-Load-Balancing_48.svg',
      position: placeInZone('public-subnet', { x: 60, y: 70, width: 170, height: 110 }),
      glossaryTermId: 'alb',
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
      sublabel: 'APIアプリ :3000',
      metadata: '10.2.11.x / awsvpc',
      icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.svg',
      position: placeInZone('private-subnet', { x: 40, y: 36, width: 210, height: 104 }),
      glossaryTermId: 'ecs',
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
      sublabel: '永続データ :5432',
      metadata: 'Private / Multi-AZ',
      icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Database/48/Arch_Amazon-RDS_48.svg',
      position: placeInZone('private-subnet', { x: 40, y: 192, width: 210, height: 104 }),
      glossaryTermId: 'rds',
      style: {
        bgColor: 'bg-sky-950',
        borderColor: 'border-sky-500',
        textColor: 'text-sky-200',
        accentColor: 'text-sky-400',
      },
    },
  ],
  connections: [
    { id: 'user-to-cf', from: 'user-pc', to: 'cloudfront', fromAnchor: 'top', toAnchor: 'left' },
    { id: 'cf-to-s3', from: 'cloudfront', to: 's3', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'cf-to-alb', from: 'cloudfront', to: 'alb', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'alb-to-ecs', from: 'alb', to: 'ecs', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'ecs-to-rds', from: 'ecs', to: 'rds', fromAnchor: 'bottom', toAnchor: 'top' },
    { id: 'github-to-ecr', from: 'github', to: 'ecr', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'ecr-to-ecs', from: 'ecr', to: 'ecs', fromAnchor: 'bottom', toAnchor: 'top', style: { dashed: true } },
  ],
};
