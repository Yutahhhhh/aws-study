import type { TopicConfig } from '../../types/topic';
import { diagramConfig } from './diagram';
import { modes } from './modes';
import { glossary, glossaryCategories } from './glossary';
import { defaultModeThemes } from '../../theme/modeThemes';

const config: TopicConfig = {
  slug: 'prod-architecture',
  title: '本番Webアプリ構成の通信フロー',
  description: 'CloudFront・S3・ALB・ECS Fargate・RDSによる本番構成で、画面表示・API通信・デプロイの通信がどう流れるかを視覚的に学習',
  headerLabel: 'AWS PROD ARCHITECTURE',
  homeBadge: 'インタラクティブ',
  homeIcon: 'Server',
  homeColor: 'blue',
  diagram: diagramConfig,
  modes,
  defaultModeId: 'static-delivery',
  glossary,
  glossaryCategories,
  modeThemes: defaultModeThemes,
};

export default config;
