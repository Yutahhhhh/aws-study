/**
 * トピック設定の型定義
 * 各学習テーマを定義するための構造
 */

import type { DiagramConfig } from './diagram';
import type { GlossaryDatabase } from './glossary';
import type { ModeTheme } from '../theme/modeThemes';
import type { SimulationMode } from './simulation';

/** 1つの学習テーマに必要な全設定 */
export interface TopicConfig {
  slug: string;
  title: string;
  description: string;
  headerLabel: string;
  homeBadge: string;
  homeIcon: string;
  homeColor: string;
  diagram: DiagramConfig;
  modes: SimulationMode[];
  defaultModeId: string;
  glossary: GlossaryDatabase;
  glossaryCategories?: GlossaryCategory[];
  modeThemes?: Record<string, ModeTheme>;
}

/** 用語集のカテゴリグループ */
export interface GlossaryCategory {
  label: string;
  termIds: string[];
}

/** Homeページ用の軽量なトピック一覧エントリ */
export interface TopicManifest {
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  badge: string;
  path: string;
  /** simulation = インタラクティブな通信フロー / guide = 図解の解説記事 */
  kind?: 'simulation' | 'guide';
}
