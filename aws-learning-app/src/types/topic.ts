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
  /**
   * 右上パネルの表示形式。
   * - packet(既定): IPパケットの通信（送信元/宛先IP・Port）として表示
   * - call: API呼び出し/イベントの流れ（呼び出し元/先・操作）として表示。
   *   IPアドレスやポート番号を持たないAPI/イベント駆動のトピックに使う
   */
  inspectorKind?: 'packet' | 'call';
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
