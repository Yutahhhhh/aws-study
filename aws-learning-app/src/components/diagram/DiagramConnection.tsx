import type { DiagramConnection as DiagramConnectionType } from '../../types/diagram';

interface DiagramConnectionProps {
  connection: DiagramConnectionType;
  fromRect: DOMRect | null;
  toRect: DOMRect | null;
  containerRect: DOMRect | null;
  isActive: boolean;
  activeColor: string;
}

interface Segment {
  x: number;
  y: number;
  width: number;
  height: number;
}

function calculateSegments(
  fromRect: DOMRect,
  toRect: DOMRect,
  containerRect: DOMRect,
): Segment[] {
  const fromCx = fromRect.left + fromRect.width / 2 - containerRect.left;
  const fromCy = fromRect.top + fromRect.height / 2 - containerRect.top;
  const toCx = toRect.left + toRect.width / 2 - containerRect.left;
  const toCy = toRect.top + toRect.height / 2 - containerRect.top;

  const thickness = 2;
  const halfT = thickness / 2;

  const dx = Math.abs(toCx - fromCx);
  const dy = Math.abs(toCy - fromCy);

  // Almost straight horizontal
  if (dy < 8) {
    const left = Math.min(fromCx, toCx);
    return [{ x: left, y: fromCy - halfT, width: dx, height: thickness }];
  }

  // Almost straight vertical
  if (dx < 8) {
    const top = Math.min(fromCy, toCy);
    return [{ x: fromCx - halfT, y: top, width: thickness, height: dy }];
  }

  // L-shaped: horizontal then vertical
  const midX = toCx;
  const hLeft = Math.min(fromCx, midX);
  const hWidth = Math.abs(midX - fromCx);
  const vTop = Math.min(fromCy, toCy);
  const vHeight = Math.abs(toCy - fromCy);

  return [
    { x: hLeft, y: fromCy - halfT, width: hWidth + halfT, height: thickness },
    { x: midX - halfT, y: vTop, width: thickness, height: vHeight + halfT },
  ];
}

export const DiagramConnection = ({
  connection,
  fromRect,
  toRect,
  containerRect,
  isActive,
  activeColor,
}: DiagramConnectionProps) => {
  if (!fromRect || !toRect || !containerRect) return null;

  const segments = calculateSegments(fromRect, toRect, containerRect);
  const baseColor = connection.style?.color ?? '#334155';
  const color = isActive ? activeColor : baseColor;
  const dashed = connection.style?.dashed ?? false;

  return (
    <>
      {segments.map((seg, i) => (
        <div
          key={`${connection.id}-${i}`}
          className="absolute pointer-events-none transition-colors duration-300"
          style={{
            left: seg.x,
            top: seg.y,
            width: seg.width,
            height: seg.height,
            backgroundColor: dashed && !isActive ? 'transparent' : color,
            borderTop: dashed && seg.height <= 2 ? `2px dashed ${color}` : undefined,
            borderLeft: dashed && seg.width <= 2 ? `2px dashed ${color}` : undefined,
            opacity: isActive ? 0.9 : 0.35,
          }}
        />
      ))}
    </>
  );
};
