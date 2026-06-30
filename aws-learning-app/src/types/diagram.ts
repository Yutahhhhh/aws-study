/** キャンバス上の配置 */
export interface DiagramPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** ゾーン内でリソースを置いてよい安全領域 */
export interface DiagramInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** 接続線をノードのどの辺につなぐか */
export type DiagramAnchor = 'top' | 'right' | 'bottom' | 'left';

/** ノードの見た目スタイル */
export interface DiagramNodeStyle {
  bgColor: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
  width?: string;
  height?: string;
}

/** 1つのAWSリソース or 外部エンティティ */
export interface DiagramNode {
  id: string;
  label: string;
  sublabel?: string;
  metadata?: string;
  icon: string;
  position: DiagramPosition;
  glossaryTermId?: string;
  style: DiagramNodeStyle;
}

/** VPC/サブネットなどの境界ゾーン */
export interface DiagramZone {
  id: string;
  label: string;
  position: DiagramPosition;
  contentPadding?: DiagramInsets;
  style: {
    borderColor: string;
    borderStyle: string;
    bgColor: string;
    labelColor: string;
  };
}

/** ノード間の接続線 */
export interface DiagramConnection {
  id: string;
  from: string;
  to: string;
  fromAnchor?: DiagramAnchor;
  toAnchor?: DiagramAnchor;
  label?: string;
  style?: {
    color?: string;
    dashed?: boolean;
    thickness?: number;
  };
}

/** ステップごとの図の表示状態 */
export interface DiagramStepState {
  activeNodeIds: string[];
  activeConnectionIds: string[];
  packetAtNodeId: string;
  dimmedNodeIds?: string[];
}

/** トピックの図全体の設定 */
export interface DiagramConfig {
  viewport: {
    width: number;
    height: number;
    padding: number;
  };
  zones: DiagramZone[];
  nodes: DiagramNode[];
  connections: DiagramConnection[];
}
