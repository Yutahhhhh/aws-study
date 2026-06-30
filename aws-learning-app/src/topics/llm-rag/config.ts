import type { TopicConfig } from '../../types/topic';
import { diagramConfig } from './diagram';
import { modes } from './modes';
import { glossary, glossaryCategories } from './glossary';
import { defaultModeThemes } from '../../theme/modeThemes';

const config: TopicConfig = {
  slug: 'llm-rag',
  title: 'LLM / RAG (Bedrock + OpenSearch)',
  description: '質問→埋め込み→ベクトル検索→根拠付き生成というRAGの流れと、取り込み・Guardrails・トークンコストの勘所を学ぶ',
  headerLabel: 'AWS LLM / RAG',
  homeBadge: 'インタラクティブ',
  homeIcon: 'Brain',
  homeColor: 'amber',
  diagram: diagramConfig,
  modes,
  defaultModeId: 'query',
  glossary,
  glossaryCategories,
  modeThemes: defaultModeThemes,
};

export default config;
