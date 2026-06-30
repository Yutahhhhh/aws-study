import type { DiagramZone as DiagramZoneType } from '../../types/diagram';

interface DiagramZoneProps {
  zone: DiagramZoneType;
}

export const DiagramZone = ({ zone }: DiagramZoneProps) => {
  return (
    <div
      className={`
        relative h-full w-full border-2 ${zone.style.borderColor} ${zone.style.borderStyle}
        ${zone.style.bgColor} rounded-xl pointer-events-none
      `}
    >
      <span
        className={`absolute left-3 top-2 z-10 max-w-[calc(100%-1.5rem)] rounded bg-slate-950/75 px-1.5 py-0.5 text-[11px] font-bold leading-tight ${zone.style.labelColor}`}
        title={zone.label}
      >
        {zone.label}
      </span>
    </div>
  );
};
