import type { TopicConfig } from '../../types/topic';
import { diagramConfig } from './diagram';
import { modes } from './modes';
import { glossary, glossaryCategories } from './glossary';
import { defaultModeThemes } from '../../theme/modeThemes';

const config: TopicConfig = {
  slug: 'secrets-injection',
  title: 'Secrets注入とECS起動',
  description: 'DBパスワードなどの秘密を、コードに書かずにSecrets Manager/SSMからECS Taskへ注入する流れと失敗パターン',
  headerLabel: 'AWS SECRETS / PARAMETER STORE',
  homeBadge: 'インタラクティブ',
  homeIcon: 'KeyRound',
  homeColor: 'rose',
  diagram: diagramConfig,
  modes,
  defaultModeId: 'inject',
  glossary,
  glossaryCategories,
  modeThemes: defaultModeThemes,
};

export default config;
