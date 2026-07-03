import type { DiagramConfig } from '../../types/diagram';

const ICON = {
  cloudfront: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Amazon-CloudFront_48.svg',
  s3: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Storage/48/Arch_Amazon-Simple-Storage-Service_48.svg',
  alb: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Elastic-Load-Balancing_48.svg',
};

export const diagramConfig: DiagramConfig = {
  viewport: { width: 1000, height: 560, padding: 48 },
  zones: [
    {
      id: 'edge',
      label: 'エッジロケーション (利用者の近く)',
      position: { x: 250, y: 110, width: 265, height: 400 },
      contentPadding: { top: 44, right: 16, bottom: 16, left: 16 },
      style: { borderColor: 'border-indigo-600', borderStyle: 'border-dashed', bgColor: 'bg-indigo-500/[0.03]', labelColor: 'text-indigo-400' },
    },
    {
      id: 'origin',
      label: 'オリジン (ap-northeast-1)',
      position: { x: 570, y: 20, width: 400, height: 510 },
      contentPadding: { top: 44, right: 16, bottom: 16, left: 16 },
      style: { borderColor: 'border-slate-600', borderStyle: 'border-dashed', bgColor: 'bg-transparent', labelColor: 'text-slate-500' },
    },
  ],
  nodes: [
    {
      id: 'user',
      label: '利用者',
      sublabel: 'ブラウザ',
      icon: 'Users',
      position: { x: 40, y: 220, width: 150, height: 96 },
      style: { bgColor: 'bg-slate-800', borderColor: 'border-slate-500', textColor: 'text-slate-200', accentColor: 'text-slate-400' },
    },
    {
      id: 'edge-server',
      label: 'CloudFront',
      sublabel: 'エッジサーバー',
      metadata: 'キャッシュキーで判定',
      icon: ICON.cloudfront,
      position: { x: 290, y: 170, width: 185, height: 104 },
      glossaryTermId: 'cache-key',
      style: { bgColor: 'bg-indigo-950', borderColor: 'border-indigo-500', textColor: 'text-indigo-200', accentColor: 'text-indigo-400' },
    },
    {
      id: 'edge-cache',
      label: 'エッジキャッシュ',
      sublabel: 'TTL付きの保存領域',
      icon: 'DatabaseZap',
      position: { x: 290, y: 360, width: 185, height: 96 },
      glossaryTermId: 'cache-control-ttl',
      style: { bgColor: 'bg-amber-950', borderColor: 'border-amber-500', textColor: 'text-amber-200', accentColor: 'text-amber-400' },
    },
    {
      id: 's3-assets',
      label: 'S3 (静的アセット)',
      sublabel: 'HTML / JS / CSS / 画像',
      icon: ICON.s3,
      position: { x: 620, y: 80, width: 185, height: 96 },
      glossaryTermId: 'versioned-assets',
      style: { bgColor: 'bg-sky-950', borderColor: 'border-sky-500', textColor: 'text-sky-200', accentColor: 'text-sky-400' },
    },
    {
      id: 'alb-api',
      label: 'ALB (API)',
      sublabel: '動的レスポンス',
      metadata: 'キャッシュ無効',
      icon: ICON.alb,
      position: { x: 620, y: 250, width: 185, height: 96 },
      glossaryTermId: 'cache-behavior',
      style: { bgColor: 'bg-emerald-950', borderColor: 'border-emerald-500', textColor: 'text-emerald-200', accentColor: 'text-emerald-400' },
    },
    {
      id: 'ci',
      label: 'CI/CD',
      sublabel: '新バージョンを配置',
      icon: 'Rocket',
      position: { x: 620, y: 420, width: 185, height: 88 },
      glossaryTermId: 'invalidation',
      style: { bgColor: 'bg-rose-950', borderColor: 'border-rose-500', textColor: 'text-rose-200', accentColor: 'text-rose-400' },
    },
  ],
  connections: [
    { id: 'user-to-edge', from: 'user', to: 'edge-server', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'edge-to-cache', from: 'edge-server', to: 'edge-cache', fromAnchor: 'bottom', toAnchor: 'top', style: { dashed: true } },
    { id: 'edge-to-s3', from: 'edge-server', to: 's3-assets', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'edge-to-alb', from: 'edge-server', to: 'alb-api', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'ci-to-s3', from: 'ci', to: 's3-assets', fromAnchor: 'top', toAnchor: 'bottom' },
  ],
};
