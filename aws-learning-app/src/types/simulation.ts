import type { DiagramStepState } from './diagram';

export interface PacketHeaders {
  srcIp: string;
  srcPort: string;
  dstIp: string;
  dstPort: string;
}

export interface PacketLabels {
  srcIp: string;
  srcPort: string;
  dstIp: string;
  dstPort: string;
}

/** ステップ解説の「ここが理解のポイント」1件分 */
export interface KeyPoint {
  glossaryTermId: string;
  title: string;
  description: string;
  accentColor: string;
}

/** シミュレーションの1ステップ */
export interface SimulationStep {
  title: string;
  location: string;
  /** CSS図の表示状態 */
  diagramState: DiagramStepState;
  headers: PacketHeaders;
  labels: PacketLabels;
  changes: string[];
  desc: string;
  keyPoints?: KeyPoint[];
  /** @deprecated SVG用。移行完了後に削除 */
  path?: string;
  /** @deprecated SVG用。移行完了後に削除 */
  packetPos?: { cx: number; cy: number };
}

/** トピック内の1モード（例: inbound, outbound-nat） */
export interface SimulationMode {
  id: string;
  label: string;
  themeId: string;
  icon: string;
  steps: SimulationStep[];
}

/** @deprecated 旧型。TopicConfig.modes に置き換え */
export type LegacySimulationMode = 'inbound' | 'outbound-nat' | 'outbound-public-ecs';

/** @deprecated 旧型。TopicConfig に置き換え */
export type SimulationData = Record<LegacySimulationMode, SimulationStep[]>;
