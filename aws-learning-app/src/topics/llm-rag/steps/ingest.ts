import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'embeddings',
    title: '取り込みは事前にやる',
    description: '検索を速く正確にするため、ドキュメントは事前にチャンク分割→埋め込み→インデックス化しておきます。質問時は探すだけにします。',
    accentColor: 'text-emerald-400',
  },
  {
    glossaryTermId: 'guardrails',
    title: '安全とコストを設計に入れる',
    description: 'PII除去・出力フィルタ(Guardrails)、トークン課金、プロンプトインジェクション対策は後付けでなく最初から。RAGでも入力検証は必須です。',
    accentColor: 'text-rose-400',
  },
];

export const ingestSteps: SimulationStep[] = [
  {
    title: '【取り込み1】原文をチャンクに分割',
    location: 'S3 → Orchestrator (chunk)',
    diagramState: {
      activeNodeIds: ['s3', 'orchestrator'],
      activeConnectionIds: ['s3-to-orch'],
      packetAtNodeId: 'orchestrator',
      dimmedNodeIds: ['user'],
    },
    headers: { srcIp: 'S3', srcPort: '-', dstIp: 'Orchestrator', dstPort: 'chunk' },
    labels: { srcIp: '(PDF/Markdown等)', srcPort: '-', dstIp: '(数百〜千トークン単位)', dstPort: '(重なり付き分割)' },
    changes: [],
    desc: `<p>長い文書はそのままでは検索精度が落ちます。意味の区切りで<strong>チャンク</strong>に分割し、前後を少し重ねます。チャンク設計が回答品質を大きく左右します。</p>`,
    keyPoints,
  },
  {
    title: '【取り込み2】埋め込み→OpenSearchへインデックス',
    location: 'Orchestrator → Bedrock → OpenSearch',
    diagramState: {
      activeNodeIds: ['orchestrator', 'bedrock', 'opensearch'],
      activeConnectionIds: ['orch-to-bedrock', 'orch-to-os'],
      packetAtNodeId: 'opensearch',
      dimmedNodeIds: ['user'],
    },
    headers: { srcIp: 'Orchestrator', srcPort: '-', dstIp: 'OpenSearch', dstPort: 'index' },
    labels: { srcIp: '(チャンク→ベクトル)', srcPort: '-', dstIp: '(ベクトル+本文+メタ)', dstPort: '(k-NNインデックス)' },
    changes: ['dstPort'],
    desc: `<p>各チャンクをBedrockで<span onclick="openGlossary('embeddings')" class="glossary-link font-bold">埋め込み</span>、ベクトルと本文・出典メタをOpenSearchに格納します。質問時はここを検索するだけになります。</p>
           <p class='mt-2 text-slate-400'>更新は差分インデックスで。古い版の削除も忘れずに。</p>`,
    keyPoints,
  },
  {
    title: '【運用】Guardrails・トークンコスト・注入対策',
    location: 'Bedrock Guardrails / Cost',
    diagramState: {
      activeNodeIds: ['orchestrator', 'bedrock'],
      activeConnectionIds: ['orch-to-bedrock'],
      packetAtNodeId: 'bedrock',
      dimmedNodeIds: ['user', 's3', 'opensearch'],
    },
    headers: { srcIp: 'Orchestrator', srcPort: '-', dstIp: 'Bedrock', dstPort: 'tokens' },
    labels: { srcIp: '(入力+出力トークン)', srcPort: '-', dstIp: '(モデル別の従量課金)', dstPort: '(Guardrails)' },
    changes: ['dstPort'],
    desc: `<p>課金は主に<span onclick="openGlossary('llm-cost-token')" class="glossary-link font-bold">トークン量</span>。詰めすぎたコンテキストは高コスト&精度低下になります。<span onclick="openGlossary('guardrails')" class="glossary-link font-bold">Guardrails</span>でPII/有害出力を抑え、ユーザー入力由来のプロンプト注入にも備えます。</p>
           <p class='mt-2 text-slate-400'>キャッシュやモデル選択(小型/大型)でコストと品質を調整します。</p>`,
    keyPoints,
  },
];
