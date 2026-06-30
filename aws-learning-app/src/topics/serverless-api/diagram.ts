import type { DiagramConfig } from '../../types/diagram';

const ICON = {
  apigw: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Amazon-API-Gateway_48.svg',
  lambda: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Compute/48/Arch_AWS-Lambda_48.svg',
  dynamodb: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Database/48/Arch_Amazon-DynamoDB_48.svg',
  cw: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Management-Governance/48/Arch_Amazon-CloudWatch_48.svg',
};

export const diagramConfig: DiagramConfig = {
  viewport: { width: 1000, height: 540, padding: 48 },
  zones: [
    {
      id: 'managed',
      label: 'AWSマネージド (サーバー管理不要 / 従量課金)',
      position: { x: 230, y: 60, width: 740, height: 430 },
      contentPadding: { top: 44, right: 18, bottom: 18, left: 18 },
      style: { borderColor: 'border-amber-600', borderStyle: 'border-dashed', bgColor: 'bg-amber-500/[0.03]', labelColor: 'text-amber-400' },
    },
  ],
  nodes: [
    {
      id: 'client',
      label: 'クライアント',
      sublabel: 'HTTPS',
      icon: 'Users',
      position: { x: 40, y: 210, width: 150, height: 96 },
      style: { bgColor: 'bg-slate-800', borderColor: 'border-slate-500', textColor: 'text-slate-200', accentColor: 'text-slate-400' },
    },
    {
      id: 'apigw',
      label: 'API Gateway',
      sublabel: '認証 / スロットリング',
      metadata: 'REST/HTTP API',
      icon: ICON.apigw,
      position: { x: 260, y: 200, width: 180, height: 110 },
      glossaryTermId: 'api-gateway',
      style: { bgColor: 'bg-indigo-950', borderColor: 'border-indigo-500', textColor: 'text-indigo-200', accentColor: 'text-indigo-400' },
    },
    {
      id: 'lambda',
      label: 'Lambda',
      sublabel: '関数(コードだけ)',
      metadata: 'イベント駆動で起動',
      icon: ICON.lambda,
      position: { x: 500, y: 200, width: 180, height: 110 },
      glossaryTermId: 'lambda-invoke',
      style: { bgColor: 'bg-orange-950', borderColor: 'border-orange-500', textColor: 'text-orange-200', accentColor: 'text-orange-400' },
    },
    {
      id: 'dynamodb',
      label: 'DynamoDB',
      sublabel: 'サーバーレスKVS',
      metadata: 'IAMロールで接続',
      icon: ICON.dynamodb,
      position: { x: 740, y: 200, width: 180, height: 110 },
      glossaryTermId: 'dynamodb-serverless',
      style: { bgColor: 'bg-sky-950', borderColor: 'border-sky-500', textColor: 'text-sky-200', accentColor: 'text-sky-400' },
    },
    {
      id: 'logs',
      label: 'CloudWatch Logs',
      sublabel: 'ログ/メトリクス',
      icon: ICON.cw,
      position: { x: 500, y: 370, width: 180, height: 90 },
      glossaryTermId: 'lambda-concurrency',
      style: { bgColor: 'bg-rose-950', borderColor: 'border-rose-500', textColor: 'text-rose-200', accentColor: 'text-rose-400' },
    },
  ],
  connections: [
    { id: 'client-to-apigw', from: 'client', to: 'apigw', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'apigw-to-lambda', from: 'apigw', to: 'lambda', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'lambda-to-ddb', from: 'lambda', to: 'dynamodb', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'lambda-to-logs', from: 'lambda', to: 'logs', fromAnchor: 'bottom', toAnchor: 'top', style: { dashed: true } },
  ],
};
