import type { TopicConfig } from '../../types/topic';
import { diagramConfig } from './diagram';
import { modes } from './modes';
import { glossary, glossaryCategories } from './glossary';
import { defaultModeThemes } from '../../theme/modeThemes';

const config: TopicConfig = {
  slug: 'cicd-pipeline',
  title: 'CI/CDデプロイの舞台裏 (GitHub Actions → ECS)',
  description: 'git pushからECSローリングデプロイ完了までの流れと、失敗時に自動ロールバックされる仕組みを追体験する',
  headerLabel: 'AWS CI/CD PIPELINE',
  homeBadge: 'インタラクティブ',
  homeIcon: 'Rocket',
  homeColor: 'blue',
  diagram: diagramConfig,
  inspectorKind: 'call',
  modes,
  defaultModeId: 'deploy',
  glossary,
  glossaryCategories,
  modeThemes: defaultModeThemes,
};

export default config;
