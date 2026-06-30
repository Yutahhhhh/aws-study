import type { TopicConfig } from '../../types/topic';
import { diagramConfig } from './diagram';
import { modes } from './modes';
import { glossary, glossaryCategories } from './glossary';
import { defaultModeThemes } from '../../theme/modeThemes';

const config: TopicConfig = {
  slug: 'security-groups',
  title: 'Security Group 設計',
  description: 'ALB→ECS→RDSのSGチェーンを、通信が「許可される/遮断される」流れで理解する',
  headerLabel: 'AWS SECURITY GROUPS',
  homeBadge: 'インタラクティブ',
  homeIcon: 'Shield',
  homeColor: 'rose',
  diagram: diagramConfig,
  modes,
  defaultModeId: 'allowed',
  glossary,
  glossaryCategories,
  modeThemes: defaultModeThemes,
};

export default config;
