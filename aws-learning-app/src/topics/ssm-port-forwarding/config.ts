import type { TopicConfig } from '../../types/topic';
import { diagramConfig } from './diagram';
import { modes } from './modes';
import { glossary, glossaryCategories } from './glossary';
import { defaultModeThemes } from '../../theme/modeThemes';

const config: TopicConfig = {
  slug: 'ssm-port-forwarding',
  title: 'SSMでPrivate RDSへ接続',
  description: 'RDSをpublicにせず、SSHも開けずに、SSM Session Managerのポートフォワーディングで安全にDB接続する流れ',
  headerLabel: 'AWS SSM SESSION MANAGER',
  homeBadge: 'インタラクティブ',
  homeIcon: 'PlugZap',
  homeColor: 'amber',
  diagram: diagramConfig,
  modes,
  defaultModeId: 'connect',
  glossary,
  glossaryCategories,
  modeThemes: defaultModeThemes,
};

export default config;
