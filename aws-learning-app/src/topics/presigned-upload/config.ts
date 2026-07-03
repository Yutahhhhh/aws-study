import type { TopicConfig } from '../../types/topic';
import { diagramConfig } from './diagram';
import { modes } from './modes';
import { glossary, glossaryCategories } from './glossary';
import { defaultModeThemes } from '../../theme/modeThemes';

const config: TopicConfig = {
  slug: 'presigned-upload',
  title: 'ファイルアップロード設計 (Presigned URL)',
  description: 'サーバー経由アップロードの問題点と、Presigned URLでブラウザからS3へ直接アップロードする流れ・検証・状態管理を学ぶ',
  headerLabel: 'AWS FILE UPLOAD',
  homeBadge: 'インタラクティブ',
  homeIcon: 'FileUp',
  homeColor: 'rose',
  diagram: diagramConfig,
  inspectorKind: 'call',
  modes,
  defaultModeId: 'naive',
  glossary,
  glossaryCategories,
  modeThemes: defaultModeThemes,
};

export default config;
