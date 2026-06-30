import { useMemo } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
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
import { AssociationChip } from './AssociationChip';
import {
  buildFlowEdge,
  nodeFlowExtent,
  orderByParentDepth,
  toZoneFlowId,
  zoneFlowExtent,
  zoneFlowParentId,
} from './flowMapping';

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
type ChipFlowNode = Node<ServiceNodeData, 'chip'>;
type ZoneFlowNode = Node<ZoneNodeData, 'zone'>;
type DiagramFlowNode = ServiceFlowNode | ChipFlowNode | ZoneFlowNode;
type DiagramFlowEdge = Edge;

const chipHandles = (
  <>
    <Handle id="top-source" type="source" position={Position.Top} className="diagram-handle" />
    <Handle id="top-target" type="target" position={Position.Top} className="diagram-handle" />
    <Handle id="right-source" type="source" position={Position.Right} className="diagram-handle" />
    <Handle id="right-target" type="target" position={Position.Right} className="diagram-handle" />
    <Handle id="bottom-source" type="source" position={Position.Bottom} className="diagram-handle" />
    <Handle id="bottom-target" type="target" position={Position.Bottom} className="diagram-handle" />
    <Handle id="left-source" type="source" position={Position.Left} className="diagram-handle" />
    <Handle id="left-target" type="target" position={Position.Left} className="diagram-handle" />
  </>
);

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
  chip: ({ data }: NodeProps<ChipFlowNode>) => (
    <div className="relative h-full w-full">
      {chipHandles}
      <AssociationChip node={data.node} isActive={data.isActive} />
    </div>
  ),
  zone: ({ data }: NodeProps<ZoneFlowNode>) => <DiagramZone zone={data.zone} />,
} satisfies NodeTypes;

export const ArchitectureDiagram = ({
  config,
  stepState,
  onNodeClick,
  activeTheme,
}: ArchitectureDiagramProps) => {
  const flowNodes = useMemo<DiagramFlowNode[]>(() => {
    const zoneNodes: ZoneFlowNode[] = config.zones.map((zone) => ({
      id: toZoneFlowId(zone.id),
      type: 'zone',
      position: { x: zone.position.x, y: zone.position.y },
      parentId: zoneFlowParentId(zone),
      extent: zoneFlowExtent(zone),
      data: { zone },
      width: zone.position.width,
      height: zone.position.height,
      draggable: false,
      selectable: false,
      connectable: false,
      zIndex: zone.parentZoneId ? 1 : 0,
      ariaLabel: zone.label,
    }));

    const serviceNodes: (ServiceFlowNode | ChipFlowNode)[] = config.nodes.map((node) => {
      const isChip = node.category === 'association';
      return {
        id: node.id,
        type: isChip ? 'chip' : 'service',
        position: { x: node.position.x, y: node.position.y },
        parentId: node.parentId,
        extent: nodeFlowExtent(node),
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
        zIndex: isChip ? 30 : 20,
        ariaLabel: node.label,
      } as ServiceFlowNode | ChipFlowNode;
    });

    return orderByParentDepth<DiagramFlowNode>([...zoneNodes, ...serviceNodes]);
  }, [activeTheme, config.nodes, config.zones, stepState]);

  const flowEdges = useMemo<DiagramFlowEdge[]>(
    () =>
      config.connections.map((connection) =>
        buildFlowEdge(connection, {
          isActive: stepState.activeConnectionIds.includes(connection.id),
          activeColor: activeTheme.pathHex,
          idleColor: '#475569',
          selectable: false,
        }),
      ),
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
    <div className="relative h-full w-full overflow-hidden bg-slate-950/70">
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
