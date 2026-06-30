import type { TopicConfig } from '../../types/topic';
import { diagramConfig } from './diagram';
import { modes } from './modes';
import { glossary, glossaryCategories } from './glossary';
import { defaultModeThemes } from '../../theme/modeThemes';

const config: TopicConfig = {
  slug: 'ecs-scaling',
  title: 'ECS Auto Scaling の動き',
  description: '負荷に応じてECS FargateのTask数が増減する仕組みを、CloudWatch→Auto Scaling→Desired Countの流れで見る',
  headerLabel: 'AWS ECS SCALING',
  homeBadge: 'インタラクティブ',
  homeIcon: 'Gauge',
  homeColor: 'blue',
  diagram: diagramConfig,
  inspectorKind: 'call',
  modes,
  defaultModeId: 'scale-out',
  glossary,
  glossaryCategories,
  modeThemes: defaultModeThemes,
};

export default config;
