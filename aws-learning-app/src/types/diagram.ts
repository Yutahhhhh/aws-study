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

/**
 * リソースの「AWS上の性質」を表す分類。
 * 配置・境界・関連付け・外部 で操作と表現を切り替える。
 * - placement   : Subnet内に存在する実体（ALB/ECS/RDS/NAT GW）
 * - gateway     : VPC境界にアタッチするもの（IGW）
 * - association : 対象に関連付けるもの（Route Table / Security Group）
 * - external    : VPC外のマネージドサービス（CloudFront/S3/ECR/GitHub）
 * - network     : 境界ゾーン自体（VPC/Subnet）
 */
export type ResourceCategory =
  | 'network'
  | 'placement'
  | 'gateway'
  | 'association'
  | 'external';

/**
 * ノード間の関係の種類。
 * - traffic     : 通信フロー（実線＋矢印）
 * - association : 関連付け・許可参照（点線・矢印なし）
 * - attachment  : 境界への取り付け（破線）
 */
export type ConnectionKind = 'traffic' | 'association' | 'attachment';

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
  /** AWS上の性質（未指定なら従来どおりのフラットなノードとして扱う） */
  category?: ResourceCategory;
  /**
   * 構造的な所属先。
   * - placement のとき: 属する Subnet ゾーン（`zone-<zoneId>`）
   * - association のとき: 関連付け対象のノードID（SG→リソース）または Subnet ゾーン（RT→`zone-<zoneId>`）
   * 指定時、座標は親に対する相対座標になる（React Flow の parentId と一致）。
   */
  parentId?: string;
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
  /** 入れ子の親ゾーン（Subnet→VPC）。指定時、座標は親ゾーンに対する相対座標になる。 */
  parentZoneId?: string;
}

/** ノード間の接続線 */
export interface DiagramConnection {
  id: string;
  from: string;
  to: string;
  fromAnchor?: DiagramAnchor;
  toAnchor?: DiagramAnchor;
  label?: string;
  /** 関係の種類（未指定なら traffic 相当として描画） */
  kind?: ConnectionKind;
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
