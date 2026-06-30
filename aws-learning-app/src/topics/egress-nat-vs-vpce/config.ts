import type { TopicConfig } from '../../types/topic';
import { diagramConfig } from './diagram';
import { modes } from './modes';
import { glossary, glossaryCategories } from './glossary';
import { defaultModeThemes } from '../../theme/modeThemes';

const config: TopicConfig = {
  slug: 'egress-nat-vs-vpce',
  title: 'NAT vs VPCエンドポイント',
  description: 'Private Subnetからの外向き通信を、外部API向けのNAT経路とAWSサービス向けのVPC Endpoint経路で比較する',
  headerLabel: 'AWS EGRESS ROUTING',
  homeBadge: 'インタラクティブ',
  homeIcon: 'Plug',
  homeColor: 'amber',
  diagram: diagramConfig,
  modes,
  defaultModeId: 'via-nat',
  glossary,
  glossaryCategories,
  modeThemes: defaultModeThemes,
};

export default config;
