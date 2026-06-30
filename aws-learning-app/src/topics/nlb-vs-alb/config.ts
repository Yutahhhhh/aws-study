import type { TopicConfig } from '../../types/topic';
import { diagramConfig } from './diagram';
import { modes } from './modes';
import { glossary, glossaryCategories } from './glossary';
import { defaultModeThemes } from '../../theme/modeThemes';

const config: TopicConfig = {
  slug: 'nlb-vs-alb',
  title: 'NLB と ALB（L4 と L7）',
  description: '同じリクエストがALB(L7)とNLB(L4)でどう扱われるかを比較し、パスルーティング・送信元IP・固定IPの違いを理解する',
  headerLabel: 'AWS ELB L4/L7',
  homeBadge: 'インタラクティブ',
  homeIcon: 'Network',
  homeColor: 'blue',
  diagram: diagramConfig,
  modes,
  defaultModeId: 'alb-l7',
  glossary,
  glossaryCategories,
  modeThemes: defaultModeThemes,
};

export default config;
