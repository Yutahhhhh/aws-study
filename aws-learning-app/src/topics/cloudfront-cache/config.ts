import type { TopicConfig } from '../../types/topic';
import { diagramConfig } from './diagram';
import { modes } from './modes';
import { glossary, glossaryCategories } from './glossary';
import { defaultModeThemes } from '../../theme/modeThemes';

const config: TopicConfig = {
  slug: 'cloudfront-cache',
  title: 'CDNキャッシュの動きとリリース反映',
  description: 'CloudFrontのHIT/MISSの仕組みと、「リリースしたのに画面が変わらない」問題の原因と定石(ハッシュ付きアセット+短TTLのHTML)を学ぶ',
  headerLabel: 'AWS CDN CACHING',
  homeBadge: 'インタラクティブ',
  homeIcon: 'Gauge',
  homeColor: 'amber',
  diagram: diagramConfig,
  inspectorKind: 'call',
  modes,
  defaultModeId: 'cache-flow',
  glossary,
  glossaryCategories,
  modeThemes: defaultModeThemes,
};

export default config;
