import type { DiagramNode as DiagramNodeType } from '../../types/diagram';
import { resolveIcon } from '../../utils/iconResolver';

interface AssociationChipProps {
  node: DiagramNodeType;
  isActive?: boolean;
  /** アクティブ時の枠線色クラス（編集時の成否トーン用） */
  activeBorderClass?: string;
}

/**
 * Security Group / Route Table など「対象に関連付ける」リソースの表現。
 * Subnet内に置く箱ではなく、対象に貼り付くチップとして描画する。
 */
export const AssociationChip = ({
  node,
  isActive = false,
  activeBorderClass,
}: AssociationChipProps) => {
  const borderClass = isActive ? activeBorderClass ?? node.style.borderColor : node.style.borderColor;

  return (
    <div
      className={`
        flex h-full w-full items-center gap-1.5 rounded-full border px-2.5 py-1
        ${node.style.bgColor} ${borderClass}
        ${isActive ? 'shadow-lg shadow-rose-500/20' : ''}
        transition-all duration-200
      `}
      title={node.sublabel ? `${node.label} — ${node.sublabel}` : node.label}
    >
      <span className={`shrink-0 ${node.style.accentColor}`}>{resolveIcon(node.icon, { size: 15 })}</span>
      <span className="min-w-0 leading-tight">
        <span className={`block truncate text-[10px] font-bold ${node.style.textColor}`}>
          {node.label}
        </span>
        {node.sublabel && (
          <span className={`block truncate text-[8px] font-mono ${node.style.accentColor}`}>
            {node.sublabel}
          </span>
        )}
      </span>
    </div>
  );
};
