import { Handle, Position } from '@xyflow/react';
import { resolveIcon } from '../../utils/iconResolver';
import type { DiagramNode as DiagramNodeType } from '../../types/diagram';
import type { ModeTheme } from '../../theme/modeThemes';

interface DiagramNodeProps {
  node: DiagramNodeType;
  isActive: boolean;
  isDimmed: boolean;
  hasPacket: boolean;
  activeTheme: ModeTheme;
  onClick?: () => void;
}

export const DiagramNode = ({
  node,
  isActive,
  isDimmed,
  hasPacket,
  activeTheme,
  onClick,
}: DiagramNodeProps) => {
  const glowStyle = isActive
    ? { boxShadow: `0 0 16px 2px ${activeTheme.pathHex}40` }
    : undefined;
  const isGateway = node.category === 'gateway';

  return (
    <div
      className={`
        relative flex h-full w-full flex-col items-center justify-center
        ${node.style.bgColor} border-2 ${node.style.borderColor}
        rounded-lg p-2.5 cursor-pointer transition-all duration-300
        hover:border-slate-200/70
        ${isDimmed ? 'opacity-40' : ''}
        ${node.style.width ?? ''}
        ${node.style.height ?? ''}
      `}
      style={glowStyle}
      onClick={onClick}
    >
      <Handle id="top-source" type="source" position={Position.Top} className="diagram-handle" />
      <Handle id="top-target" type="target" position={Position.Top} className="diagram-handle" />
      <Handle id="right-source" type="source" position={Position.Right} className="diagram-handle" />
      <Handle id="right-target" type="target" position={Position.Right} className="diagram-handle" />
      <Handle id="bottom-source" type="source" position={Position.Bottom} className="diagram-handle" />
      <Handle id="bottom-target" type="target" position={Position.Bottom} className="diagram-handle" />
      <Handle id="left-source" type="source" position={Position.Left} className="diagram-handle" />
      <Handle id="left-target" type="target" position={Position.Left} className="diagram-handle" />

      {/* Packet Indicator */}
      {hasPacket && (
        <div
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full pulse-node z-10"
          style={{ backgroundColor: activeTheme.pathHex }}
        />
      )}

      {/* Icon */}
      <div className={`mb-1.5 ${node.style.textColor}`}>
        {resolveIcon(node.icon, { size: isGateway ? 22 : 24 })}
      </div>

      {/* Label */}
      <span className={`max-w-full break-words px-1 text-center text-[11px] font-bold leading-tight ${node.style.textColor}`}>
        {node.label}
      </span>

      {/* Sublabel */}
      {node.sublabel && (
        <span className={`mt-0.5 max-w-full break-words px-1 text-center text-[9px] font-bold leading-tight ${node.style.accentColor}`}>
          {node.sublabel}
        </span>
      )}

      {/* Metadata (IP address etc) */}
      {node.metadata && (
        <span className="mt-0.5 max-w-full break-words px-1 text-center font-mono text-[8px] leading-tight text-slate-500">
          {node.metadata}
        </span>
      )}
    </div>
  );
};
