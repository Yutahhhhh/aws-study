import type { GlossaryDatabase } from '../../types/glossary';
import type { GlossaryCategory } from '../../types/topic';

export const glossary: GlossaryDatabase = {
  rag: {
    icon: 'BookText',
    title: 'RAG (検索拡張生成)',
    eng: 'RETRIEVAL-AUGMENTED GENERATION',
    oneLiner: '関連文書を検索して根拠として渡し、それを元にLLMが答える',
    detail: `RAGは、質問に関連する社内/最新のドキュメントを検索し、その本文をプロンプトに添えてLLMに生成させる方式です。モデルの学習済み知識だけに頼らないため、固有・最新の情報に答えられ、出典も示せます。
            <br><br>「検索(Retrieval)」と「生成(Generation)」の二段構えが要点です。`,
    focus: `ファインチューニングより手軽に「自社の知識」で答えさせられます。回答品質は検索の良し悪し(チャンク設計・埋め込み・k件数)でほぼ決まります。まず検索を疑うのが鉄則。`,
  },
  embeddings: {
    icon: 'Binary',
    title: '埋め込み (Embeddings)',
    eng: 'EMBEDDINGS',
    oneLiner: 'テキストを「意味」を表す数値ベクトルに変換したもの',
    detail: `埋め込みは、文章を高次元の数値ベクトルに変換したものです。意味が近い文章はベクトルも近くなります。Bedrockの埋め込みモデル(Titan等)で生成します。
            <br><br>ドキュメントも質問も同じ方式で埋め込み、近さで検索します。`,
    focus: `ドキュメント側は事前に埋め込んでインデックス化(ingest)し、質問側はリアルタイムに埋め込みます。両者で同じモデルを使うのが前提。モデルを変えたら作り直し。`,
  },
  'vector-search-knn': {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Analytics/48/Arch_Amazon-OpenSearch-Service_48.svg',
    title: 'ベクトル検索 (k-NN)',
    eng: 'VECTOR / k-NN SEARCH',
    oneLiner: '質問ベクトルに近いチャンクを上位k件取り出す検索',
    detail: `OpenSearchのk-NN(近傍探索)で、質問ベクトルに近いドキュメントチャンクを上位k件取り出します。キーワード一致でなく意味の近さで探せるのが特徴です。
            <br><br>キーワード検索と組み合わせるハイブリッド検索で精度を上げることも多いです。`,
    focus: `k(取得件数)とチャンクサイズの調整が肝。少なすぎると根拠不足、多すぎるとノイズ&トークン増。メタデータでフィルタ(部署/期間)すると精度が上がります。`,
  },
  bedrock: {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Artificial-Intelligence/48/Arch_Amazon-Bedrock_48.svg',
    title: 'Amazon Bedrock',
    eng: 'AMAZON BEDROCK',
    oneLiner: '基盤モデル(LLM/埋め込み)をAPIで使えるマネージドサービス',
    detail: `Bedrockは複数ベンダーの基盤モデルを統一APIで使えるマネージドサービスです。埋め込み生成も文章生成も行え、サーバー管理は不要。IAMで認可し、VPCエンドポイント経由でプライベートに呼べます。
            <br><br>Guardrailsやモデル評価、Knowledge Bases等の周辺機能もあります。`,
    focus: `自前でGPUを持たずにLLMを組み込めます。データはモデル学習に使われない設計。コスト・レイテンシ・品質でモデルを選び、機能ごとに小型/大型を使い分けます。`,
  },
  'prompt-context-window': {
    icon: 'SquareStack',
    title: 'プロンプトとコンテキストウィンドウ',
    eng: 'PROMPT & CONTEXT WINDOW',
    oneLiner: 'モデルに一度に渡せるトークンには上限がある。詰めすぎは逆効果',
    detail: `LLMが一度に扱えるトークン量(コンテキストウィンドウ)には上限があります。RAGでは「指示+取得チャンク+質問」をこの枠に収めます。
            <br><br>関係ないチャンクを詰めると、精度低下とコスト増を招きます。`,
    focus: `「全部入れれば賢くなる」は誤り。必要十分な根拠だけを、出典付き・構造化して渡すのがコツ。長文要約や再ランキングで枠を有効に使います。`,
  },
  guardrails: {
    icon: 'ShieldCheck',
    title: 'Guardrails / 安全対策',
    eng: 'GUARDRAILS',
    oneLiner: 'PII・有害出力・プロンプト注入を抑える入出力の制御',
    detail: `Bedrock Guardrails等で、禁止トピック・PII・有害表現をフィルタできます。ユーザー入力が指示を上書きする「プロンプトインジェクション」にも備えます。
            <br><br>取得した社内文書に機密が含まれる場合、誰に何を返してよいかの認可も必要です。`,
    focus: `RAGは「社内データをLLMに渡す」ため、認可(誰がそのチャンクを見てよいか)とログが重要。入力検証・出力フィルタ・監査をAPI同様に設計します。`,
  },
  'llm-cost-token': {
    icon: 'Coins',
    title: 'トークン課金とコスト',
    eng: 'TOKEN-BASED COST',
    oneLiner: '課金は主に入力+出力トークン量。文脈の詰めすぎは高コスト',
    detail: `多くのLLMは入力トークンと出力トークンで課金されます。RAGで大量のチャンクを詰めると入力トークンが膨らみ、コストとレイテンシが増えます。
            <br><br>モデルのサイズでも単価が変わります。`,
    focus: `コスト最適化: 取得件数を絞る、要約/再ランキング、キャッシュ、簡単な質問は小型モデルへルーティング。品質・速度・コストの三角形で設計します。`,
  },
  hallucination: {
    icon: 'Ghost',
    title: 'ハルシネーション',
    eng: 'HALLUCINATION',
    oneLiner: 'もっともらしいが誤った内容を生成すること',
    detail: `LLMは根拠が無くても自信ありげに誤情報を作ることがあります。RAGで根拠を与え「この根拠だけで答え、無ければ分からないと言う」と指示することで大きく減らせます。
            <br><br>出典を併記させると検証しやすくなります。`,
    focus: `RAGは万能ではありません。検索が外せば誤答します。出典提示・「分からない」を許す指示・人間レビュー(重要用途)を組み合わせます。`,
  },
};

export const glossaryCategories: GlossaryCategory[] = [
  {
    label: 'RAGの仕組み',
    termIds: ['rag', 'embeddings', 'vector-search-knn', 'bedrock'],
  },
  {
    label: '品質・安全・コスト',
    termIds: ['prompt-context-window', 'guardrails', 'llm-cost-token', 'hallucination'],
  },
];
