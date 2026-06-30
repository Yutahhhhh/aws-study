import type { PacketHeaders, PacketLabels } from '../../types/simulation';
import type { ModeTheme } from '../../theme/modeThemes';

interface PacketInspectorProps {
  headers: PacketHeaders;
  labels: PacketLabels;
  changes: string[];
  location: string;
  theme: ModeTheme;
  /** packet: IPパケット表示（既定） / call: API呼び出し・イベント表示 */
  kind?: 'packet' | 'call';
  onOpenGlossary?: (termId: string) => void;
}

interface FieldMeta {
  label: string;
  glossaryTermId?: string;
}

const fieldMetaByKind: Record<'packet' | 'call', { srcIp: FieldMeta; srcPort: FieldMeta; dstIp: FieldMeta; dstPort: FieldMeta }> = {
  packet: {
    srcIp: { label: '送信元 IP', glossaryTermId: 'ip-header' },
    srcPort: { label: '送信元 Port', glossaryTermId: 'port-number' },
    dstIp: { label: '宛先 IP', glossaryTermId: 'ip-header' },
    dstPort: { label: '宛先 Port', glossaryTermId: 'port-number' },
  },
  call: {
    srcIp: { label: '呼び出し元' },
    srcPort: { label: '補足' },
    dstIp: { label: '呼び出し先' },
    dstPort: { label: '操作 / イベント' },
  },
};

export const PacketInspector = ({
  headers,
  labels,
  changes,
  location,
  theme,
  kind = 'packet',
  onOpenGlossary
}: PacketInspectorProps) => {
  const fieldMeta = fieldMetaByKind[kind];

  const renderRow = (
    field: keyof PacketHeaders,
    valueColor: string,
    options: { borderTop?: boolean } = {},
  ) => {
    const meta = fieldMeta[field];
    return (
      <div
        className={`grid grid-cols-12 gap-1 py-1.5 items-center ${options.borderTop ? 'border-t border-slate-900' : ''} ${changes.includes(field) ? 'header-diff' : ''}`}
      >
        <div className="col-span-3 text-slate-400 font-semibold">
          {meta.glossaryTermId ? (
            <span
              onClick={() => onOpenGlossary?.(meta.glossaryTermId!)}
              className="glossary-link cursor-pointer"
            >
              {meta.label}
            </span>
          ) : (
            <span>{meta.label}</span>
          )}
        </div>
        <div className="col-span-9 flex items-center space-x-2">
          <span className={`${valueColor} font-bold`}>{headers[field]}</span>
          <span className="text-[10px] text-slate-500">{labels[field]}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col p-3">
      {/* Header Table */}
      <div className="bg-slate-950 rounded-lg border border-slate-800 p-3 font-mono text-xs space-y-3">
        <div className="grid grid-cols-12 gap-1 border-b border-slate-900 pb-2 text-slate-500 font-bold">
          <div className="col-span-3 text-left">属性</div>
          <div className="col-span-9">{kind === 'packet' ? 'パケット内のデータ値' : '呼び出しの内容'}</div>
        </div>

        {renderRow('srcIp', 'text-emerald-400')}
        {renderRow('srcPort', 'text-emerald-300', { borderTop: true })}
        {renderRow('dstIp', 'text-rose-400', { borderTop: true })}
        {renderRow('dstPort', 'text-rose-300', { borderTop: true })}
      </div>

      {/* Packet Location */}
      <div className="mt-4 p-3 bg-slate-950/50 rounded-lg border border-slate-800">
        <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
          {kind === 'packet' ? '現在のパケット位置:' : '現在の処理位置:'}
        </span>
        <span className={`text-sm font-bold ${theme.accentText}`}>{location}</span>
      </div>
    </div>
  );
};
