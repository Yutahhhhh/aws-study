import { MarkerType, type Edge } from '@xyflow/react';
import type {
  ConnectionKind,
  DiagramConnection,
  DiagramNode,
  DiagramZone,
} from '../../types/diagram';

/**
 * ArchitectureDiagram（閲覧）と ArchitectureBuilder（編集）で共有する
 * React Flow へのマッピングロジック。
 * 入れ子（parentId/extent）・相対座標・エッジ種別（kind）の描画規則を一元化する。
 */

export const ZONE_PREFIX = 'zone-';

/** ゾーンID → React Flow ノードID（`zone-` プレフィックス付き） */
export const toZoneFlowId = (zoneId: string) => `${ZONE_PREFIX}${zoneId}`;

/** React Flow ノードID → ゾーンID（プレフィックスを除去） */
export const fromZoneFlowId = (flowId: string) => flowId.replace(/^zone-/, '');

export const isZoneFlowId = (flowId: string) => flowId.startsWith(ZONE_PREFIX);

/** Subnet→VPC の入れ子の親（React Flow ノードID） */
export const zoneFlowParentId = (zone: DiagramZone): string | undefined =>
  zone.parentZoneId ? toZoneFlowId(zone.parentZoneId) : undefined;

/**
 * extent:'parent' を付けるか。
 * placement は Subnet 枠内に拘束する。gateway は境界をまたぐため拘束しない。
 */
export const nodeFlowExtent = (node: DiagramNode): 'parent' | undefined =>
  node.parentId && node.category === 'placement' ? 'parent' : undefined;

export const zoneFlowExtent = (zone: DiagramZone): 'parent' | undefined =>
  zone.parentZoneId ? 'parent' : undefined;

/**
 * 入れ子の深さ順（親→子）に安定ソートする。
 * React Flow は親ノードが配列内で子より前にある必要がある。
 * flow ノードの `id` / `parentId` 名前空間で評価する（ゾーンは `zone-x`）。
 */
export const orderByParentDepth = <T extends { id: string; parentId?: string }>(
  items: T[],
): T[] => {
  const byId = new Map(items.map((item) => [item.id, item]));
  const depthCache = new Map<string, number>();

  const depthOf = (id: string, seen: Set<string> = new Set()): number => {
    const cached = depthCache.get(id);
    if (cached !== undefined) return cached;

    const item = byId.get(id);
    if (!item || !item.parentId || seen.has(id)) return 0;

    seen.add(id);
    const depth = 1 + depthOf(item.parentId, seen);
    depthCache.set(id, depth);
    return depth;
  };

  return items
    .map((item, index) => ({ item, index, depth: depthOf(item.id) }))
    .sort((a, b) => a.depth - b.depth || a.index - b.index)
    .map((entry) => entry.item);
};

/** kind ごとの基本色（idle 時）。ノードのアクセント色と揃える。 */
const KIND_IDLE_COLOR: Record<ConnectionKind, string | undefined> = {
  traffic: undefined, // 呼び出し側の idleColor を使う
  association: '#fb7185', // rose-400（Security Group / 関連付け）
  attachment: '#fb923c', // orange-400（IGW / 取り付け）
};

export interface EdgeRenderOptions {
  isActive: boolean;
  /** アクティブ時の線色 */
  activeColor: string;
  /** traffic で色指定が無いときの既定色 */
  idleColor: string;
  selectable: boolean;
  deletable?: boolean;
  zIndex?: number;
}

/**
 * DiagramConnection を kind に応じたスタイルの React Flow Edge へ変換する。
 * - traffic    : 実線＋矢印（アクティブ時アニメーション）
 * - association: 点線・矢印なし（関連付け／許可参照）
 * - attachment : 破線・矢印なし（境界への取り付け）
 */
export const buildFlowEdge = (
  connection: DiagramConnection,
  options: EdgeRenderOptions,
): Edge => {
  const kind: ConnectionKind = connection.kind ?? 'traffic';
  const showArrow = kind === 'traffic';
  const { isActive } = options;

  const color = isActive
    ? options.activeColor
    : connection.style?.color ?? KIND_IDLE_COLOR[kind] ?? options.idleColor;

  const dashArray =
    kind === 'association'
      ? '7 5'
      : kind === 'attachment'
        ? '2 5'
        : connection.style?.dashed && !isActive
          ? '6 6'
          : undefined;

  const strokeWidth = isActive ? 3 : connection.style?.thickness ?? (kind === 'traffic' ? 2 : 1.75);

  return {
    id: connection.id,
    source: connection.from,
    target: connection.to,
    sourceHandle: toHandleId(connection.fromAnchor, 'source'),
    targetHandle: toHandleId(connection.toAnchor, 'target'),
    type: 'smoothstep',
    animated: isActive && kind === 'traffic',
    selectable: options.selectable,
    deletable: options.deletable ?? false,
    zIndex: options.zIndex ?? 10,
    label: connection.label,
    markerEnd: showArrow
      ? { type: MarkerType.ArrowClosed, color, width: 18, height: 18 }
      : undefined,
    style: {
      stroke: color,
      strokeWidth,
      strokeOpacity: isActive ? 0.95 : kind === 'traffic' ? 0.55 : 0.7,
      strokeDasharray: dashArray,
    },
    // pathOptions は smoothstep 専用オプション（Edge 共用型には無いためキャストで付与）
    pathOptions: {
      borderRadius: 12,
      offset: 20,
    },
  } as Edge;
};

export const toHandleId = (anchor: string | undefined, type: 'source' | 'target') =>
  `${anchor ?? (type === 'source' ? 'right' : 'left')}-${type}`;
