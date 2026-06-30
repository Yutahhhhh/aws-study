import type { TopicConfig } from '../../types/topic';
import { diagramConfig } from './diagram';
import { modes } from './modes';
import { glossary, glossaryCategories } from './glossary';
import { defaultModeThemes } from '../../theme/modeThemes';

const config: TopicConfig = {
  slug: 'network-simulation',
  title: 'IP変換(NAT)とルーティング',
  description: 'AWS VPCにおけるパケットの流れと、NAT・ルーティングの仕組みを視覚的に学習',
  headerLabel: 'AWS NETWORKING',
  homeBadge: 'インタラクティブ',
  homeIcon: 'Network',
  homeColor: 'blue',
  diagram: diagramConfig,
  modes,
  defaultModeId: 'inbound',
  glossary,
  glossaryCategories,
  modeThemes: defaultModeThemes,
};

export default config;
