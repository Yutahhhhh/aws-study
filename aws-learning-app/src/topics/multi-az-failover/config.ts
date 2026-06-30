import type { TopicConfig } from '../../types/topic';
import { diagramConfig } from './diagram';
import { modes } from './modes';
import { glossary, glossaryCategories } from './glossary';
import { defaultModeThemes } from '../../theme/modeThemes';

const config: TopicConfig = {
  slug: 'multi-az-failover',
  title: 'Multi-AZ とフェイルオーバー',
  description: '2つのAZにALB・ECS・RDSを分散する構成で、平常時の流れとAZ障害時のfailoverを見る',
  headerLabel: 'AWS MULTI-AZ',
  homeBadge: 'インタラクティブ',
  homeIcon: 'Network',
  homeColor: 'blue',
  diagram: diagramConfig,
  modes,
  defaultModeId: 'normal',
  glossary,
  glossaryCategories,
  modeThemes: defaultModeThemes,
};

export default config;
