import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'rag',
    title: 'まず探してから答える',
    description: 'RAGは、質問に関係する社内ドキュメントを検索し、その本文を根拠としてLLMに渡してから生成させます。モデルの記憶に頼らず、最新・固有の知識で答えられます。',
    accentColor: 'text-orange-400',
  },
  {
    glossaryTermId: 'vector-search-knn',
    title: '意味で探す(ベクトル検索)',
    description: '質問とドキュメントを埋め込み(ベクトル)に変換し、近いものを探します。キーワード一致でなく“意味が近い”チャンクを取り出せます。',
    accentColor: 'text-sky-400',
  },
];

export const querySteps: SimulationStep[] = [
  {
    title: '【1】質問をオーケストレータが受ける',
    location: 'User → Orchestrator',
    diagramState: {
      activeNodeIds: ['user', 'orchestrator'],
      activeConnectionIds: ['user-to-orch'],
      packetAtNodeId: 'orchestrator',
      dimmedNodeIds: ['s3'],
    },
    headers: { srcIp: 'User', srcPort: '-', dstIp: 'Orchestrator', dstPort: 'question' },
    labels: { srcIp: '(利用者)', srcPort: '-', dstIp: '(Lambda/ECS)', dstPort: '(自然文の質問)' },
    changes: [],
    desc: `<p>「先月の経費規程の上限は?」のような質問が来ます。<span onclick="openGlossary('rag')" class="glossary-link font-bold">RAG</span>はこれをそのままLLMに投げず、まず根拠を探しに行きます。</p>`,
    keyPoints,
  },
  {
    title: '【2】質問を埋め込みに変換 (Bedrock)',
    location: 'Orchestrator → Bedrock (embeddings)',
    diagramState: {
      activeNodeIds: ['orchestrator', 'bedrock'],
      activeConnectionIds: ['orch-to-bedrock'],
      packetAtNodeId: 'bedrock',
      dimmedNodeIds: ['s3', 'user'],
    },
    headers: { srcIp: 'Orchestrator', srcPort: '-', dstIp: 'Bedrock', dstPort: 'embed' },
    labels: { srcIp: '(質問テキスト)', srcPort: '-', dstIp: '(Titan Embeddings等)', dstPort: '(ベクトル化)' },
    changes: ['dstPort'],
    desc: `<p>質問を<span onclick="openGlossary('embeddings')" class="glossary-link font-bold">埋め込み</span>(数値ベクトル)に変換します。これで「意味の近さ」を計算できるようになります。</p>`,
    keyPoints,
  },
  {
    title: '【3】OpenSearchで類似チャンクを検索',
    location: 'Orchestrator → OpenSearch (k-NN)',
    diagramState: {
      activeNodeIds: ['orchestrator', 'opensearch', 's3'],
      activeConnectionIds: ['orch-to-os', 'os-to-s3'],
      packetAtNodeId: 'opensearch',
      dimmedNodeIds: ['user'],
    },
    headers: { srcIp: 'Orchestrator', srcPort: '-', dstIp: 'OpenSearch', dstPort: 'k-NN' },
    labels: { srcIp: '(質問ベクトル)', srcPort: '-', dstIp: '(近いチャンクを上位k件)', dstPort: '(類似度)' },
    changes: ['dstIp'],
    desc: `<p><span onclick="openGlossary('vector-search-knn')" class="glossary-link font-bold">ベクトル検索</span>で、質問に意味が近い文書チャンクを上位k件取り出します。原文はS3、ベクトルと本文断片はOpenSearchにあります。</p>`,
    keyPoints,
  },
  {
    title: '【4】根拠を添えてLLMが生成 (Bedrock)',
    location: 'Orchestrator → Bedrock (generate)',
    diagramState: {
      activeNodeIds: ['orchestrator', 'bedrock', 'user'],
      activeConnectionIds: ['orch-to-bedrock', 'user-to-orch'],
      packetAtNodeId: 'user',
      dimmedNodeIds: ['s3'],
    },
    headers: { srcIp: 'Orchestrator', srcPort: '-', dstIp: 'Bedrock', dstPort: 'generate' },
    labels: { srcIp: '(質問 + 取得チャンク)', srcPort: '-', dstIp: '(プロンプトに根拠を同梱)', dstPort: '(回答生成)' },
    changes: ['dstPort'],
    desc: `<p>取得したチャンクを<span onclick="openGlossary('prompt-context-window')" class="glossary-link font-bold">プロンプト</span>に詰め、「この根拠だけで答えて」と指示してBedrockに生成させます。出典付きで答えられ、<span onclick="openGlossary('hallucination')" class="glossary-link font-bold">ハルシネーション</span>を抑えられます。</p>`,
    keyPoints,
  },
];
