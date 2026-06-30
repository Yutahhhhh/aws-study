import { useState, useEffect } from 'react';
import { X, BookOpen, Maximize2, Minimize2 } from 'lucide-react';
import { resolveIcon } from '../../utils/iconResolver';
import type { GlossaryDatabase } from '../../types/glossary';
import type { GlossaryCategory } from '../../types/topic';

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTerm?: string;
  glossaryData: GlossaryDatabase;
  categories?: GlossaryCategory[];
}

export const GlossaryModal = ({
  isOpen,
  onClose,
  initialTerm = 'ip-header',
  glossaryData,
  categories,
}: GlossaryModalProps) => {
  const [selectedTerm, setSelectedTerm] = useState(initialTerm);
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);

  useEffect(() => {
    if (initialTerm) {
      setSelectedTerm(initialTerm);
    }
  }, [initialTerm]);

  useEffect(() => {
    if (isOpen) {
      setIsDetailExpanded(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const termData = glossaryData[selectedTerm];
  if (!termData) return null;

  const termKeys = Object.keys(glossaryData);

  const effectiveCategories: GlossaryCategory[] = categories ?? [
    { label: '用語一覧', termIds: termKeys },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl h-[92dvh] md:h-[85vh] md:max-h-[700px] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="shrink-0 px-4 py-3 md:px-6 md:py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="min-w-0 flex items-center space-x-2">
            <BookOpen size={20} className="shrink-0" />
            <h3 className="truncate text-sm font-bold text-slate-100 md:text-base">
              AWS Webインフラ専門用語辞典
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition"
            aria-label="用語集を閉じる"
            title="閉じる"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* Left Pane: Term List */}
          <div
            className={`w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/40 overflow-y-auto p-2 md:p-3 space-y-1 ${
              isDetailExpanded ? 'hidden md:block' : 'max-h-44 shrink-0 md:max-h-none'
            }`}
          >
            {effectiveCategories.map((category, catIdx) => (
              <div key={catIdx}>
                {catIdx > 0 && <div className="border-t border-slate-800/60 my-2" />}
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-2 block">
                  {category.label}
                </span>
                {category.termIds
                  .filter(key => glossaryData[key])
                  .map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedTerm(key);
                        setIsDetailExpanded(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 md:py-2 rounded-lg text-[11px] md:text-xs font-semibold transition flex items-center gap-2 ${
                        selectedTerm === key
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                          : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                      }`}
                    >
                      <span className="shrink-0">{resolveIcon(glossaryData[key].icon)}</span>
                      <span className="min-w-0 truncate">{glossaryData[key].title}</span>
                    </button>
                  ))}
              </div>
            ))}
          </div>

          {/* Right Pane: Term Details */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 bg-slate-900/30 flex flex-col space-y-4">
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-800">
              <div className="min-w-0 flex items-center space-x-2.5">
                <span className="shrink-0 text-blue-400">{resolveIcon(termData.icon)}</span>
                <div className="min-w-0">
                  <h4 className="truncate text-lg font-bold text-slate-100 md:text-base">{termData.title}</h4>
                  <span className="block truncate text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                    {termData.eng}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailExpanded((current) => !current)}
                className="md:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-slate-100"
                aria-label={isDetailExpanded ? '用語一覧を表示する' : '説明を広げる'}
                title={isDetailExpanded ? '用語一覧を表示する' : '説明を広げる'}
              >
                {isDetailExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>

            {/* One-liner Summary */}
            <div className="p-3 bg-blue-950/40 border border-blue-900/60 rounded-lg">
              <span className="text-[10px] font-bold text-blue-400 uppercase block mb-1">
                端的にいうと？
              </span>
              <p className="text-sm text-blue-200 leading-relaxed font-semibold md:text-xs">
                {termData.oneLiner}
              </p>
            </div>

            {/* Technical Details */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">技術詳細</span>
              <p
                className="text-sm text-slate-300 leading-relaxed md:text-xs"
                dangerouslySetInnerHTML={{ __html: termData.detail }}
              />
            </div>

            {/* Practical Focus */}
            <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800/80 space-y-2">
              <span className="text-[10px] font-bold text-orange-400 uppercase flex items-center">
                開発エンジニアとしての重要ポイント
              </span>
              <p
                className="text-sm text-slate-300 leading-relaxed md:text-xs"
                dangerouslySetInnerHTML={{ __html: termData.focus }}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 px-4 py-3 md:px-6 md:py-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
