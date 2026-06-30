import type { DiagramConfig } from '../../types/diagram';

const ICON = {
  s3: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Storage/48/Arch_Amazon-Simple-Storage-Service_48.svg',
  sqs: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_App-Integration/48/Arch_Amazon-Simple-Queue-Service_48.svg',
  lambda: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Compute/48/Arch_AWS-Lambda_48.svg',
  ddb: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Database/48/Arch_Amazon-DynamoDB_48.svg',
};

export const diagramConfig: DiagramConfig = {
  viewport: { width: 1020, height: 600, padding: 48 },
  zones: [
    {
      id: 'async',
      label: '非同期 / 疎結合 (生産側と消費側を切り離す)',
      position: { x: 210, y: 60, width: 800, height: 500 },
      contentPadding: { top: 44, right: 18, bottom: 18, left: 18 },
      style: { borderColor: 'border-rose-600', borderStyle: 'border-dashed', bgColor: 'bg-rose-500/[0.03]', labelColor: 'text-rose-400' },
    },
  ],
  nodes: [
    {
      id: 'producer',
      label: '生産側',
      sublabel: 'アップロード / 投入',
      icon: 'Users',
      position: { x: 30, y: 260, width: 150, height: 96 },
      style: { bgColor: 'bg-slate-800', borderColor: 'border-slate-500', textColor: 'text-slate-200', accentColor: 'text-slate-400' },
    },
    {
      id: 's3',
      label: 'S3 (入力バケット)',
      sublabel: 'オブジェクト保存',
      metadata: 'PutObject',
      icon: ICON.s3,
      position: { x: 250, y: 110, width: 200, height: 100 },
      glossaryTermId: 's3-event-notification',
      style: { bgColor: 'bg-emerald-950', borderColor: 'border-emerald-500', textColor: 'text-emerald-200', accentColor: 'text-emerald-400' },
    },
    {
      id: 'sqs',
      label: 'SQS (ジョブキュー)',
      sublabel: 'バッファ / 順序',
      metadata: 'at-least-once',
      icon: ICON.sqs,
      position: { x: 250, y: 330, width: 200, height: 100 },
      glossaryTermId: 'sqs-decoupling',
      style: { bgColor: 'bg-fuchsia-950', borderColor: 'border-fuchsia-500', textColor: 'text-fuchsia-200', accentColor: 'text-fuchsia-400' },
    },
    {
      id: 'lambda',
      label: 'Lambda (ワーカー)',
      sublabel: 'イベントで起動',
      metadata: '並列処理',
      icon: ICON.lambda,
      position: { x: 540, y: 220, width: 200, height: 110 },
      glossaryTermId: 'event-source-mapping',
      style: { bgColor: 'bg-orange-950', borderColor: 'border-orange-500', textColor: 'text-orange-200', accentColor: 'text-orange-400' },
    },
    {
      id: 'ddb',
      label: 'DynamoDB (結果)',
      sublabel: '処理結果/状態',
      icon: ICON.ddb,
      position: { x: 800, y: 130, width: 190, height: 100 },
      glossaryTermId: 'idempotency',
      style: { bgColor: 'bg-sky-950', borderColor: 'border-sky-500', textColor: 'text-sky-200', accentColor: 'text-sky-400' },
    },
    {
      id: 'dlq',
      label: 'DLQ (失敗退避)',
      sublabel: 'Dead Letter Queue',
      icon: ICON.sqs,
      position: { x: 540, y: 420, width: 200, height: 96 },
      glossaryTermId: 'dlq',
      style: { bgColor: 'bg-red-950', borderColor: 'border-red-500', textColor: 'text-red-200', accentColor: 'text-red-400' },
    },
  ],
  connections: [
    { id: 'prod-to-s3', from: 'producer', to: 's3', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'prod-to-sqs', from: 'producer', to: 'sqs', fromAnchor: 'right', toAnchor: 'left' },
    { id: 's3-to-lambda', from: 's3', to: 'lambda', fromAnchor: 'right', toAnchor: 'left', style: { dashed: true } },
    { id: 'sqs-to-lambda', from: 'sqs', to: 'lambda', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'lambda-to-ddb', from: 'lambda', to: 'ddb', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'lambda-to-dlq', from: 'lambda', to: 'dlq', fromAnchor: 'bottom', toAnchor: 'top', style: { dashed: true } },
    { id: 'sqs-to-dlq', from: 'sqs', to: 'dlq', fromAnchor: 'bottom', toAnchor: 'left', style: { dashed: true } },
  ],
};
