import type { DiagramConfig } from '../../types/diagram';

const ICON = {
  bedrock: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Artificial-Intelligence/48/Arch_Amazon-Bedrock_48.svg',
  opensearch: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Analytics/48/Arch_Amazon-OpenSearch-Service_48.svg',
  lambda: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Compute/48/Arch_AWS-Lambda_48.svg',
  s3: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Storage/48/Arch_Amazon-Simple-Storage-Service_48.svg',
};

export const diagramConfig: DiagramConfig = {
  viewport: { width: 1040, height: 600, padding: 48 },
  zones: [
    {
      id: 'rag',
      label: 'RAG パイプライン (検索で根拠を与えてから生成)',
      position: { x: 220, y: 60, width: 800, height: 500 },
      contentPadding: { top: 44, right: 18, bottom: 18, left: 18 },
      style: { borderColor: 'border-amber-600', borderStyle: 'border-dashed', bgColor: 'bg-amber-500/[0.03]', labelColor: 'text-amber-400' },
    },
  ],
  nodes: [
    {
      id: 'user',
      label: '利用者',
      sublabel: '質問',
      icon: 'Users',
      position: { x: 36, y: 270, width: 150, height: 96 },
      style: { bgColor: 'bg-slate-800', borderColor: 'border-slate-500', textColor: 'text-slate-200', accentColor: 'text-slate-400' },
    },
    {
      id: 'orchestrator',
      label: 'RAG オーケストレータ',
      sublabel: 'Lambda / ECS',
      metadata: '検索→プロンプト→生成',
      icon: ICON.lambda,
      position: { x: 250, y: 250, width: 220, height: 120 },
      glossaryTermId: 'rag',
      style: { bgColor: 'bg-orange-950', borderColor: 'border-orange-500', textColor: 'text-orange-200', accentColor: 'text-orange-400' },
    },
    {
      id: 'opensearch',
      label: 'OpenSearch (ベクトル)',
      sublabel: 'k-NN 検索',
      metadata: '類似チャンクを返す',
      icon: ICON.opensearch,
      position: { x: 540, y: 110, width: 220, height: 110 },
      glossaryTermId: 'vector-search-knn',
      style: { bgColor: 'bg-sky-950', borderColor: 'border-sky-500', textColor: 'text-sky-200', accentColor: 'text-sky-400' },
    },
    {
      id: 'bedrock',
      label: 'Bedrock',
      sublabel: '埋め込み + 生成LLM',
      metadata: 'マネージドな基盤モデル',
      icon: ICON.bedrock,
      position: { x: 540, y: 380, width: 220, height: 110 },
      glossaryTermId: 'bedrock',
      style: { bgColor: 'bg-fuchsia-950', borderColor: 'border-fuchsia-500', textColor: 'text-fuchsia-200', accentColor: 'text-fuchsia-400' },
    },
    {
      id: 's3',
      label: 'S3 (ナレッジ原文)',
      sublabel: 'ドキュメント',
      icon: ICON.s3,
      position: { x: 830, y: 250, width: 180, height: 110 },
      glossaryTermId: 'embeddings',
      style: { bgColor: 'bg-emerald-950', borderColor: 'border-emerald-500', textColor: 'text-emerald-200', accentColor: 'text-emerald-400' },
    },
  ],
  connections: [
    { id: 'user-to-orch', from: 'user', to: 'orchestrator', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'orch-to-os', from: 'orchestrator', to: 'opensearch', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'orch-to-bedrock', from: 'orchestrator', to: 'bedrock', fromAnchor: 'right', toAnchor: 'left' },
    { id: 'os-to-s3', from: 'opensearch', to: 's3', fromAnchor: 'right', toAnchor: 'left', style: { dashed: true } },
    { id: 's3-to-orch', from: 's3', to: 'orchestrator', fromAnchor: 'bottom', toAnchor: 'bottom', style: { dashed: true } },
  ],
};
