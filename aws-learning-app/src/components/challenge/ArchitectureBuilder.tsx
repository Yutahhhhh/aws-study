import { useCallback, useEffect, useState } from 'react';
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
  type OnSelectionChangeParams,
  type XYPosition,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ChevronDown, Info, Trash2 } from 'lucide-react';
import type {
  ConnectionKind,
  DiagramAnchor,
  DiagramConfig,
  DiagramNode as DiagramNodeType,
  DiagramZone as DiagramZoneType,
} from '../../types/diagram';
import { resolveIcon } from '../../utils/iconResolver';
import { DiagramZone } from '../diagram/DiagramZone';
import { AssociationChip } from '../diagram/AssociationChip';
import {
  buildFlowEdge,
  fromZoneFlowId,
  isZoneFlowId,
  nodeFlowExtent,
  orderByParentDepth,
  toZoneFlowId,
  zoneFlowExtent,
  zoneFlowParentId,
} from '../diagram/flowMapping';

type ResultTone = 'idle' | 'success' | 'failure';
export type ZoneRole = 'vpc' | 'subnet';

interface ArchitectureBuilderProps {
  diagram: DiagramConfig;
  lockedNodeIds: string[];
  /** ゾーンの役割（VPC / Subnet）。再ペアレント先の判定に使う。 */
  zoneRoles?: Record<string, ZoneRole>;
  activeNodeIds?: string[];
  activeConnectionIds?: string[];
  resultTone?: ResultTone;
  onChange: (diagram: DiagramConfig) => void;
}

type BuilderNodeData = Record<string, unknown> & {
  node: DiagramNodeType;
  isLocked: boolean;
  isActive: boolean;
  resultTone: ResultTone;
};

type ZoneNodeData = Record<string, unknown> & {
  zone: DiagramZoneType;
};

type BuilderServiceNode = Node<BuilderNodeData, 'service'>;
type BuilderChipNode = Node<BuilderNodeData, 'chip'>;
type BuilderZoneNode = Node<ZoneNodeData, 'zone'>;
type BuilderFlowNode = BuilderServiceNode | BuilderChipNode | BuilderZoneNode;
type BuilderFlowEdge = Edge;

const toHandleId = (anchor: DiagramAnchor | undefined, type: 'source' | 'target') =>
  `${anchor ?? (type === 'source' ? 'right' : 'left')}-${type}`;

const parseAnchor = (handleId: string | null | undefined): DiagramAnchor | undefined => {
  const anchor = handleId?.split('-')[0];
  if (anchor === 'top' || anchor === 'right' || anchor === 'bottom' || anchor === 'left') {
    return anchor;
  }
  return undefined;
};

const toneClasses: Record<ResultTone, string> = {
  idle: 'border-slate-500 shadow-slate-950/20',
  success: 'border-emerald-400 shadow-emerald-500/20',
  failure: 'border-red-400 shadow-red-500/20',
};

const activeTextClasses: Record<ResultTone, string> = {
  idle: 'text-blue-300',
  success: 'text-emerald-200',
  failure: 'text-red-200',
};

const cornerHandles = (
  <>
    <Handle id="top-source" type="source" position={Position.Top} className="builder-source-handle" />
    <Handle id="right-source" type="source" position={Position.Right} className="builder-source-handle" />
    <Handle id="bottom-source" type="source" position={Position.Bottom} className="builder-source-handle" />
    <Handle id="left-source" type="source" position={Position.Left} className="builder-source-handle" />
    <Handle id="top-target" type="target" position={Position.Top} className="builder-target-handle" />
    <Handle id="right-target" type="target" position={Position.Right} className="builder-target-handle" />
    <Handle id="bottom-target" type="target" position={Position.Bottom} className="builder-target-handle" />
    <Handle id="left-target" type="target" position={Position.Left} className="builder-target-handle" />
  </>
);

const BuilderNode = ({ data }: NodeProps<BuilderServiceNode>) => {
  const isGateway = data.node.category === 'gateway';
  const activeClasses = data.isActive
    ? `${toneClasses[data.resultTone]} shadow-lg`
    : data.node.style.borderColor;

  return (
    <div
      className={`
        relative flex h-full w-full flex-col items-center justify-center rounded-lg border-2 p-3
        ${data.node.style.bgColor} ${activeClasses}
        ${isGateway ? 'border-dashed' : ''}
        ${data.isLocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}
        transition-all duration-200 hover:border-slate-200/80
      `}
    >
      {cornerHandles}

      <div className={`mb-1.5 ${data.isActive ? activeTextClasses[data.resultTone] : data.node.style.textColor}`}>
        {resolveIcon(data.node.icon, { size: isGateway ? 22 : 28 })}
      </div>
      <span className={`text-center text-xs font-bold leading-tight ${data.node.style.textColor}`}>
        {data.node.label}
      </span>
      {data.node.sublabel && (
        <span className={`mt-0.5 text-center text-[10px] font-bold ${data.node.style.accentColor}`}>
          {data.node.sublabel}
        </span>
      )}
      {data.node.metadata && (
        <span className="mt-0.5 text-center font-mono text-[9px] text-slate-500">
          {data.node.metadata}
        </span>
      )}
      {data.isLocked && (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-slate-500" aria-hidden="true" />
      )}
    </div>
  );
};

const BuilderChip = ({ data }: NodeProps<BuilderChipNode>) => (
  <div className="relative h-full w-full cursor-grab active:cursor-grabbing">
    {cornerHandles}
    <AssociationChip
      node={data.node}
      isActive={data.isActive}
      activeBorderClass={toneClasses[data.resultTone]}
    />
  </div>
);

const nodeTypes = {
  service: BuilderNode,
  chip: BuilderChip,
  zone: ({ data }: NodeProps<BuilderZoneNode>) => <DiagramZone zone={data.zone} />,
} satisfies NodeTypes;

const toFlowNodes = (
  diagram: DiagramConfig,
  lockedNodeIds: string[],
  activeNodeIds: string[],
  resultTone: ResultTone,
): BuilderFlowNode[] => {
  const zoneNodes: BuilderZoneNode[] = diagram.zones.map((zone) => ({
    id: toZoneFlowId(zone.id),
    type: 'zone',
    position: { x: zone.position.x, y: zone.position.y },
    parentId: zoneFlowParentId(zone),
    extent: zoneFlowExtent(zone),
    data: { zone },
    width: zone.position.width,
    height: zone.position.height,
    draggable: true,
    selectable: true,
    connectable: false,
    deletable: true,
    zIndex: zone.parentZoneId ? 1 : 0,
    ariaLabel: zone.label,
  }));

  const serviceNodes: (BuilderServiceNode | BuilderChipNode)[] = diagram.nodes.map((node) => {
    const isLocked = lockedNodeIds.includes(node.id);
    const isChip = node.category === 'association';
    return {
      id: node.id,
      type: isChip ? 'chip' : 'service',
      position: { x: node.position.x, y: node.position.y },
      parentId: node.parentId,
      extent: nodeFlowExtent(node),
      data: {
        node,
        isLocked,
        isActive: activeNodeIds.includes(node.id),
        resultTone,
      },
      width: node.position.width,
      height: node.position.height,
      draggable: !isLocked,
      selectable: true,
      connectable: true,
      deletable: !isLocked,
      zIndex: isChip ? 30 : 20,
      ariaLabel: node.label,
    } as BuilderServiceNode | BuilderChipNode;
  });

  return orderByParentDepth<BuilderFlowNode>([...zoneNodes, ...serviceNodes]);
};

const toFlowEdges = (
  diagram: DiagramConfig,
  activeConnectionIds: string[],
  resultTone: ResultTone,
): BuilderFlowEdge[] => {
  const activeColor = resultTone === 'failure' ? '#f87171' : resultTone === 'success' ? '#34d399' : '#60a5fa';
  return diagram.connections.map((connection) =>
    buildFlowEdge(connection, {
      isActive: activeConnectionIds.includes(connection.id),
      activeColor,
      idleColor: '#64748b',
      selectable: true,
      deletable: true,
    }),
  );
};

const BuilderInner = ({
  diagram,
  lockedNodeIds,
  zoneRoles = {},
  activeNodeIds = [],
  activeConnectionIds = [],
  resultTone = 'idle',
  onChange,
}: ArchitectureBuilderProps) => {
  const { getIntersectingNodes, getInternalNode, deleteElements } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<BuilderFlowNode>(
    toFlowNodes(diagram, lockedNodeIds, activeNodeIds, resultTone),
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<BuilderFlowEdge>(
    toFlowEdges(diagram, activeConnectionIds, resultTone),
  );
  const [selection, setSelection] = useState<{ nodeIds: string[]; edgeIds: string[] }>({
    nodeIds: [],
    edgeIds: [],
  });

  useEffect(() => {
    setNodes(toFlowNodes(diagram, lockedNodeIds, activeNodeIds, resultTone));
    setEdges(toFlowEdges(diagram, activeConnectionIds, resultTone));
  }, [activeConnectionIds, activeNodeIds, diagram, lockedNodeIds, resultTone, setEdges, setNodes]);

  const zoneRoleOf = useCallback(
    (flowId: string): ZoneRole | undefined => zoneRoles[fromZoneFlowId(flowId)],
    [zoneRoles],
  );

  const absPositionOf = useCallback(
    (flowId: string): XYPosition => {
      const internal = getInternalNode(flowId);
      const abs = internal?.internals.positionAbsolute;
      return abs ? { x: abs.x, y: abs.y } : { x: 0, y: 0 };
    },
    [getInternalNode],
  );

  const relativeTo = useCallback(
    (flowId: string, parentFlowId: string | undefined): XYPosition => {
      const abs = absPositionOf(flowId);
      const parentAbs = parentFlowId ? absPositionOf(parentFlowId) : { x: 0, y: 0 };
      return { x: Math.round(abs.x - parentAbs.x), y: Math.round(abs.y - parentAbs.y) };
    },
    [absPositionOf],
  );

  const handleNodeDrop = useCallback(
    (flowNode: Node) => {
      const node = diagram.nodes.find((item) => item.id === flowNode.id);
      if (!node || lockedNodeIds.includes(node.id)) return;

      const intersections = getIntersectingNodes(flowNode);
      const intersectingZone = (role: ZoneRole) =>
        intersections.find((item) => isZoneFlowId(item.id) && zoneRoleOf(item.id) === role);

      let nextParentId = node.parentId;
      switch (node.category) {
        case 'placement': {
          nextParentId = intersectingZone('subnet')?.id;
          break;
        }
        case 'gateway': {
          nextParentId = intersectingZone('vpc')?.id ?? node.parentId;
          break;
        }
        case 'association': {
          const resource = intersections.find(
            (item) =>
              !isZoneFlowId(item.id) &&
              diagram.nodes.find((n) => n.id === item.id)?.category === 'placement',
          );
          nextParentId = resource ? resource.id : intersectingZone('subnet')?.id ?? node.parentId;
          break;
        }
        default:
          nextParentId = undefined; // external は VPC 外（トップレベル）
      }

      const nextPosition = relativeTo(flowNode.id, nextParentId);

      onChange({
        ...diagram,
        nodes: diagram.nodes.map((item) =>
          item.id === node.id
            ? { ...item, parentId: nextParentId, position: { ...item.position, ...nextPosition } }
            : item,
        ),
      });
    },
    [diagram, getIntersectingNodes, lockedNodeIds, onChange, relativeTo, zoneRoleOf],
  );

  const handleZoneDrop = useCallback(
    (flowNode: Node) => {
      const zoneId = fromZoneFlowId(flowNode.id);
      const zone = diagram.zones.find((item) => item.id === zoneId);
      if (!zone) return;

      let nextParentZoneId = zone.parentZoneId;
      if (zoneRoleOf(flowNode.id) === 'subnet') {
        const vpc = getIntersectingNodes(flowNode).find(
          (item) => isZoneFlowId(item.id) && zoneRoleOf(item.id) === 'vpc',
        );
        nextParentZoneId = vpc ? fromZoneFlowId(vpc.id) : undefined;
      }

      const parentFlowId = nextParentZoneId ? toZoneFlowId(nextParentZoneId) : undefined;
      const nextPosition = relativeTo(flowNode.id, parentFlowId);

      onChange({
        ...diagram,
        zones: diagram.zones.map((item) =>
          item.id === zoneId
            ? { ...item, parentZoneId: nextParentZoneId, position: { ...item.position, ...nextPosition } }
            : item,
        ),
      });
    },
    [diagram, getIntersectingNodes, onChange, relativeTo, zoneRoleOf],
  );

  const connectNodes = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || connection.source === connection.target) return;
      const sourceNode = diagram.nodes.find((node) => node.id === connection.source);
      const targetNode = diagram.nodes.find((node) => node.id === connection.target);
      if (!sourceNode || !targetNode) return;
      if (
        diagram.connections.some(
          (item) => item.from === connection.source && item.to === connection.target,
        )
      ) {
        return;
      }

      const kind: ConnectionKind = sourceNode.category === 'association' ? 'association' : 'traffic';
      const newConnection = {
        id: `${connection.source}-to-${connection.target}-${Date.now()}`,
        from: connection.source,
        to: connection.target,
        kind,
        fromAnchor: parseAnchor(connection.sourceHandle),
        toAnchor: parseAnchor(connection.targetHandle),
      };

      setEdges((currentEdges) =>
        addEdge(
          {
            id: newConnection.id,
            source: newConnection.from,
            target: newConnection.to,
            sourceHandle: toHandleId(newConnection.fromAnchor, 'source'),
            targetHandle: toHandleId(newConnection.toAnchor, 'target'),
          },
          currentEdges,
        ),
      );

      onChange({
        ...diagram,
        connections: [...diagram.connections, newConnection],
      });
    },
    [diagram, onChange, setEdges],
  );

  const deleteNodes = useCallback(
    (deletedNodes: Node[]) => {
      const removedNodeIds = new Set(
        deletedNodes
          .map((node) => node.id)
          .filter((nodeId) => !lockedNodeIds.includes(nodeId) && !isZoneFlowId(nodeId)),
      );
      const removedZoneIds = new Set(
        deletedNodes.filter((node) => isZoneFlowId(node.id)).map((node) => fromZoneFlowId(node.id)),
      );
      if (removedNodeIds.size === 0 && removedZoneIds.size === 0) return;

      // 削除されたノードに関連付いていた子（SG等）も連鎖削除する
      let changed = true;
      while (changed) {
        changed = false;
        for (const node of diagram.nodes) {
          if (removedNodeIds.has(node.id)) continue;
          if (node.parentId && removedNodeIds.has(node.parentId)) {
            removedNodeIds.add(node.id);
            changed = true;
          }
        }
      }

      // 削除された Subnet 等の子は、絶対座標へ変換してトップレベルへ退避する
      const orphanedNodes = diagram.nodes
        .filter(
          (node) =>
            !removedNodeIds.has(node.id) &&
            node.parentId &&
            removedZoneIds.has(fromZoneFlowId(node.parentId)),
        )
        .map((node) => ({ id: node.id, position: absPositionOf(node.id) }));
      const orphanPositionById = new Map(orphanedNodes.map((entry) => [entry.id, entry.position]));

      const orphanedZones = diagram.zones
        .filter((zone) => !removedZoneIds.has(zone.id) && zone.parentZoneId && removedZoneIds.has(zone.parentZoneId))
        .map((zone) => ({ id: zone.id, position: absPositionOf(toZoneFlowId(zone.id)) }));
      const orphanZonePositionById = new Map(orphanedZones.map((entry) => [entry.id, entry.position]));

      onChange({
        ...diagram,
        zones: diagram.zones
          .filter((zone) => !removedZoneIds.has(zone.id))
          .map((zone) =>
            orphanZonePositionById.has(zone.id)
              ? {
                  ...zone,
                  parentZoneId: undefined,
                  position: { ...zone.position, ...orphanZonePositionById.get(zone.id)! },
                }
              : zone,
          ),
        nodes: diagram.nodes
          .filter((node) => !removedNodeIds.has(node.id))
          .map((node) =>
            orphanPositionById.has(node.id)
              ? {
                  ...node,
                  parentId: undefined,
                  position: { ...node.position, ...orphanPositionById.get(node.id)! },
                }
              : node,
          ),
        connections: diagram.connections.filter(
          (connection) => !removedNodeIds.has(connection.from) && !removedNodeIds.has(connection.to),
        ),
      });
    },
    [absPositionOf, diagram, lockedNodeIds, onChange],
  );

  const deleteEdges = useCallback(
    (deletedEdges: Edge[]) => {
      const deletedEdgeIds = deletedEdges.map((edge) => edge.id);
      if (deletedEdgeIds.length === 0) return;

      onChange({
        ...diagram,
        connections: diagram.connections.filter((connection) => !deletedEdgeIds.includes(connection.id)),
      });
    },
    [diagram, onChange],
  );

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: OnSelectionChangeParams) => {
      setSelection({
        nodeIds: selectedNodes.map((node) => node.id).filter((id) => !lockedNodeIds.includes(id)),
        edgeIds: selectedEdges.map((edge) => edge.id),
      });
    },
    [lockedNodeIds],
  );

  const deleteSelected = useCallback(() => {
    if (selection.nodeIds.length === 0 && selection.edgeIds.length === 0) return;
    void deleteElements({
      nodes: selection.nodeIds.map((id) => ({ id })),
      edges: selection.edgeIds.map((id) => ({ id })),
    });
    setSelection({ nodeIds: [], edgeIds: [] });
  }, [deleteElements, selection]);

  const selectedCount = selection.nodeIds.length + selection.edgeIds.length;

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950/70">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.16, minZoom: 0.4, maxZoom: 1.15 }}
        minZoom={0.3}
        maxZoom={1.8}
        nodesDraggable
        nodesConnectable
        edgesReconnectable={false}
        elementsSelectable
        deleteKeyCode={['Backspace', 'Delete']}
        panOnDrag={[1, 2]}
        panOnScroll
        panOnScrollSpeed={0.8}
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        preventScrolling={false}
        zIndexMode="manual"
        proOptions={{ hideAttribution: true }}
        onConnect={connectNodes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={deleteNodes}
        onEdgesDelete={deleteEdges}
        onSelectionChange={handleSelectionChange}
        onNodeDragStop={(_, node) => {
          if (node.type === 'zone') handleZoneDrop(node);
          else handleNodeDrop(node);
        }}
      >
        <Background variant={BackgroundVariant.Lines} color="#1e293b" gap={40} lineWidth={1} />

        {selectedCount > 0 && (
          <Panel position="top-center">
            <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/95 px-2.5 py-1.5 shadow-xl backdrop-blur">
              <span className="text-[11px] font-bold text-slate-300">選択中 {selectedCount}件</span>
              <button
                type="button"
                onClick={deleteSelected}
                className="flex items-center gap-1 rounded-md border border-red-700 bg-red-950 px-2.5 py-1 text-[11px] font-bold text-red-200 transition hover:bg-red-900 active:scale-95"
              >
                <Trash2 size={13} />
                削除
              </button>
            </div>
          </Panel>
        )}

        <BuilderLegend />
        <Controls
          position="bottom-right"
          showInteractive
          fitViewOptions={{ padding: 0.16, minZoom: 0.4, maxZoom: 1.15 }}
        />
      </ReactFlow>
    </div>
  );
};

const legendRows = [
  { mark: '──▶', accent: 'text-blue-300', text: '通信経路（リソース間でつなぐ）' },
  { mark: '┈┈', accent: 'text-rose-300', text: '関連付け / 許可参照（SG間など）' },
  { mark: '····', accent: 'text-orange-300', text: '境界への取り付け（Route Table→IGW）' },
];

const BuilderLegend = () => {
  const [open, setOpen] = useState(false);

  return (
    <Panel position="bottom-left">
      {open ? (
        <div className="relative flex w-64 flex-col gap-1.5 rounded-lg border border-slate-700/70 bg-slate-900/90 p-2.5 pr-7 text-[10px] text-slate-300 shadow-lg backdrop-blur">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-slate-300 transition hover:bg-slate-700"
            aria-label="凡例を閉じる"
            title="凡例を閉じる"
          >
            <ChevronDown size={13} />
          </button>
          {legendRows.map((row) => (
            <div key={row.text} className="flex items-center gap-2">
              <span className={`inline-flex w-9 items-center tracking-tighter ${row.accent}`}>{row.mark}</span>
              <span>{row.text}</span>
            </div>
          ))}
          <div className="mt-0.5 border-t border-slate-700/60 pt-1.5 text-slate-400">
            配置=Subnet枠へドロップ / 関連付け=対象へドロップ / 外部=VPC外に置く
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/90 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 shadow-lg backdrop-blur transition hover:border-slate-500 hover:bg-slate-800"
        >
          <Info size={13} className="text-slate-400" />
          凡例
        </button>
      )}
    </Panel>
  );
};

export const ArchitectureBuilder = (props: ArchitectureBuilderProps) => (
  <ReactFlowProvider>
    <BuilderInner {...props} />
  </ReactFlowProvider>
);
