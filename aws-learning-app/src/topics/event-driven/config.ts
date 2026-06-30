import type { TopicConfig } from '../../types/topic';
import { diagramConfig } from './diagram';
import { modes } from './modes';
import { glossary, glossaryCategories } from './glossary';
import { defaultModeThemes } from '../../theme/modeThemes';

const config: TopicConfig = {
  slug: 'event-driven',
  title: 'イベント駆動 (S3 / SQS → Lambda)',
  description: '保存やキュー投入をトリガに処理を非同期化する。リトライ・DLQ・冪等性まで、疎結合な処理の流れを学ぶ',
  headerLabel: 'AWS EVENT-DRIVEN',
  homeBadge: 'インタラクティブ',
  homeIcon: 'Workflow',
  homeColor: 'rose',
  diagram: diagramConfig,
  modes,
  defaultModeId: 's3-event',
  glossary,
  glossaryCategories,
  modeThemes: defaultModeThemes,
};

export default config;
