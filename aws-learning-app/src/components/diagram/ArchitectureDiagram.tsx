import { useMemo } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type {
  DiagramConfig,
  DiagramNode as DiagramNodeType,
  DiagramStepState,
  DiagramZone as DiagramZoneType,
} from '../../types/diagram';
import type { ModeTheme } from '../../theme/modeThemes';
import { DiagramNode } from './DiagramNode';
import { DiagramZone } from './DiagramZone';

interface ArchitectureDiagramProps {
  config: DiagramConfig;
  stepState: DiagramStepState;
  onNodeClick?: (glossaryTermId: string) => void;
  activeTheme: ModeTheme;
}

type ServiceNodeData = Record<string, unknown> & {
  node: DiagramNodeType;
  isActive: boolean;
  isDimmed: boolean;
  hasPacket: boolean;
  activeTheme: ModeTheme;
};

type ZoneNodeData = Record<string, unknown> & {
  zone: DiagramZoneType;
};

type ServiceFlowNode = Node<ServiceNodeData, 'service'>;
type ZoneFlowNode = Node<ZoneNodeData, 'zone'>;
type DiagramFlowNode = ServiceFlowNode | ZoneFlowNode;
type DiagramFlowEdge = Edge;

const nodeTypes = {
  service: ({ data }: NodeProps<ServiceFlowNode>) => (
    <DiagramNode
      node={data.node}
      isActive={data.isActive}
      isDimmed={data.isDimmed}
      hasPacket={data.hasPacket}
      activeTheme={data.activeTheme}
    />
  ),
  zone: ({ data }: NodeProps<ZoneFlowNode>) => <DiagramZone zone={data.zone} />,
} satisfies NodeTypes;

const toHandleId = (anchor: string | undefined, type: 'source' | 'target') =>
  `${anchor ?? (type === 'source' ? 'right' : 'left')}-${type}`;

export const ArchitectureDiagram = ({
  config,
  stepState,
  onNodeClick,
  activeTheme,
}: ArchitectureDiagramProps) => {
  const flowNodes = useMemo<DiagramFlowNode[]>(() => {
    const zoneNodes: ZoneFlowNode[] = config.zones.map((zone) => ({
      id: `zone-${zone.id}`,
      type: 'zone',
      position: { x: zone.position.x, y: zone.position.y },
      data: { zone },
      width: zone.position.width,
      height: zone.position.height,
      draggable: false,
      selectable: false,
      connectable: false,
      zIndex: 0,
      ariaLabel: zone.label,
    }));

    const serviceNodes: ServiceFlowNode[] = config.nodes.map((node) => ({
      id: node.id,
      type: 'service',
      position: { x: node.position.x, y: node.position.y },
      data: {
        node,
        isActive: stepState.activeNodeIds.includes(node.id),
        isDimmed: stepState.dimmedNodeIds?.includes(node.id) ?? false,
        hasPacket: stepState.packetAtNodeId === node.id,
        activeTheme,
      },
      width: node.position.width,
      height: node.position.height,
      draggable: false,
      selectable: false,
      connectable: false,
      zIndex: 20,
      ariaLabel: node.label,
    }));

    return [...zoneNodes, ...serviceNodes];
  }, [activeTheme, config.nodes, config.zones, stepState]);

  const flowEdges = useMemo<DiagramFlowEdge[]>(
    () =>
      config.connections.map((connection) => {
        const isActive = stepState.activeConnectionIds.includes(connection.id);
        const color = isActive ? activeTheme.pathHex : connection.style?.color ?? '#475569';

        return {
          id: connection.id,
          source: connection.from,
          target: connection.to,
          sourceHandle: toHandleId(connection.fromAnchor, 'source'),
          targetHandle: toHandleId(connection.toAnchor, 'target'),
          type: 'smoothstep',
          animated: isActive,
          selectable: false,
          zIndex: 10,
          label: connection.label,
          style: {
            stroke: color,
            strokeWidth: isActive ? 3 : connection.style?.thickness ?? 2,
            strokeOpacity: isActive ? 0.95 : 0.4,
            strokeDasharray: connection.style?.dashed && !isActive ? '6 6' : undefined,
          },
          pathOptions: {
            borderRadius: 12,
            offset: 20,
          },
        };
      }),
    [activeTheme.pathHex, config.connections, stepState.activeConnectionIds],
  );

  const initialViewport = useMemo(
    () => ({
      x: config.viewport.padding,
      y: config.viewport.padding,
      zoom: 0.8,
    }),
    [config.viewport.padding],
  );

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-slate-800/80 bg-slate-950/70"
      style={{ height: 460 }}
    >
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.12, minZoom: 0.55, maxZoom: 1.2 }}
        defaultViewport={initialViewport}
        minZoom={0.45}
        maxZoom={1.8}
        nodesDraggable={false}
        nodesConnectable={false}
        edgesReconnectable={false}
        elementsSelectable={false}
        panOnDrag
        panOnScroll
        panOnScrollSpeed={0.8}
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        preventScrolling={false}
        zIndexMode="manual"
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node) => {
          if (node.type !== 'service') return;
          const glossaryTermId = node.data.node.glossaryTermId;
          if (glossaryTermId) onNodeClick?.(glossaryTermId);
        }}
      >
        <Background
          variant={BackgroundVariant.Lines}
          color="#1e293b"
          gap={40}
          lineWidth={1}
        />
        <Controls
          position="bottom-right"
          showInteractive={false}
          fitViewOptions={{ padding: 0.12, minZoom: 0.55, maxZoom: 1.2 }}
        />
      </ReactFlow>
    </div>
  );
};
