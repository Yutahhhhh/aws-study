import type { TopicConfig } from '../../types/topic';
import { diagramConfig } from './diagram';
import { modes } from './modes';
import { glossary, glossaryCategories } from './glossary';
import { defaultModeThemes } from '../../theme/modeThemes';

const config: TopicConfig = {
  slug: 'serverless-api',
  title: 'サーバーレスAPI (API Gateway + Lambda)',
  description: 'API Gateway→Lambda→DynamoDBのリクエストの流れと、コールドスタート・同時実行・VPC接続の勘所を学ぶ',
  headerLabel: 'AWS SERVERLESS API',
  homeBadge: 'インタラクティブ',
  homeIcon: 'Zap',
  homeColor: 'amber',
  diagram: diagramConfig,
  modes,
  defaultModeId: 'request',
  glossary,
  glossaryCategories,
  modeThemes: defaultModeThemes,
};

export default config;
