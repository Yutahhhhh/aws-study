import type { PacketHeaders, PacketLabels } from '../../types/simulation';
import type { ModeTheme } from '../../theme/modeThemes';

interface PacketInspectorProps {
  headers: PacketHeaders;
  labels: PacketLabels;
  changes: string[];
  location: string;
  theme: ModeTheme;
  onOpenGlossary?: (termId: string) => void;
}

export const PacketInspector = ({
  headers,
  labels,
  changes,
  location,
  theme,
  onOpenGlossary
}: PacketInspectorProps) => {
  return (
    <div className="flex flex-col p-3">
      {/* Header Table */}
      <div className="bg-slate-950 rounded-lg border border-slate-800 p-3 font-mono text-xs space-y-3">
        <div className="grid grid-cols-12 gap-1 border-b border-slate-900 pb-2 text-slate-500 font-bold">
          <div className="col-span-3 text-left">属性</div>
          <div className="col-span-9">パケット内のデータ値</div>
        </div>

        {/* Source IP */}
        <div className={`grid grid-cols-12 gap-1 py-1.5 items-center ${changes.includes('srcIp') ? 'header-diff' : ''}`}>
          <div className="col-span-3 text-slate-400 font-semibold">
            <span
              onClick={() => onOpenGlossary?.('ip-header')}
              className="glossary-link cursor-pointer"
            >
              送信元 IP
            </span>
          </div>
          <div className="col-span-9 flex items-center space-x-2">
            <span className="text-emerald-400 font-bold">{headers.srcIp}</span>
            <span className="text-[10px] text-slate-500">{labels.srcIp}</span>
          </div>
        </div>

        {/* Source Port */}
        <div className={`grid grid-cols-12 gap-1 py-1.5 items-center border-t border-slate-900 ${changes.includes('srcPort') ? 'header-diff' : ''}`}>
          <div className="col-span-3 text-slate-400 font-semibold">
            <span
              onClick={() => onOpenGlossary?.('port-number')}
              className="glossary-link cursor-pointer"
            >
              送信元 Port
            </span>
          </div>
          <div className="col-span-9 flex items-center space-x-2">
            <span className="text-emerald-300 font-bold">{headers.srcPort}</span>
            <span className="text-[10px] text-slate-500">{labels.srcPort}</span>
          </div>
        </div>

        {/* Destination IP */}
        <div className={`grid grid-cols-12 gap-1 py-1.5 items-center border-t border-slate-900 ${changes.includes('dstIp') ? 'header-diff' : ''}`}>
          <div className="col-span-3 text-slate-400 font-semibold">
            <span
              onClick={() => onOpenGlossary?.('ip-header')}
              className="glossary-link cursor-pointer"
            >
              宛先 IP
            </span>
          </div>
          <div className="col-span-9 flex items-center space-x-2">
            <span className="text-rose-400 font-bold">{headers.dstIp}</span>
            <span className="text-[10px] text-slate-500">{labels.dstIp}</span>
          </div>
        </div>

        {/* Destination Port */}
        <div className={`grid grid-cols-12 gap-1 py-1.5 items-center border-t border-slate-900 ${changes.includes('dstPort') ? 'header-diff' : ''}`}>
          <div className="col-span-3 text-slate-400 font-semibold">
            <span
              onClick={() => onOpenGlossary?.('port-number')}
              className="glossary-link cursor-pointer"
            >
              宛先 Port
            </span>
          </div>
          <div className="col-span-9 flex items-center space-x-2">
            <span className="text-rose-300 font-bold">{headers.dstPort}</span>
            <span className="text-[10px] text-slate-500">{labels.dstPort}</span>
          </div>
        </div>
      </div>

      {/* Packet Location */}
      <div className="mt-4 p-3 bg-slate-950/50 rounded-lg border border-slate-800">
        <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
          現在のパケット位置:
        </span>
        <span className={`text-sm font-bold ${theme.accentText}`}>{location}</span>
      </div>
    </div>
  );
};
