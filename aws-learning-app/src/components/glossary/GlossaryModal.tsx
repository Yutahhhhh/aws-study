import { useState, useEffect } from 'react';
import { X, BookOpen } from 'lucide-react';
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

  useEffect(() => {
    if (initialTerm) {
      setSelectedTerm(initialTerm);
    }
  }, [initialTerm]);

  if (!isOpen) return null;

  const termData = glossaryData[selectedTerm];
  if (!termData) return null;

  const termKeys = Object.keys(glossaryData);

  const effectiveCategories: GlossaryCategory[] = categories ?? [
    { label: '用語一覧', termIds: termKeys },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl h-[85vh] max-h-[700px] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <BookOpen size={20} />
            <h3 className="text-base font-bold text-slate-100">AWS Webインフラ専門用語辞典</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Pane: Term List */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/40 overflow-y-auto p-3 space-y-1">
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
                      onClick={() => setSelectedTerm(key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                        selectedTerm === key
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                          : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                      }`}
                    >
                      {resolveIcon(glossaryData[key].icon)}
                      {glossaryData[key].title}
                    </button>
                  ))}
              </div>
            ))}
          </div>

          {/* Right Pane: Term Details */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-900/30 flex flex-col space-y-4">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-800">
              <span className="text-blue-400">{resolveIcon(termData.icon)}</span>
              <div>
                <h4 className="text-base font-bold text-slate-100">{termData.title}</h4>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                  {termData.eng}
                </span>
              </div>
            </div>

            {/* One-liner Summary */}
            <div className="p-3 bg-blue-950/40 border border-blue-900/60 rounded-lg">
              <span className="text-[10px] font-bold text-blue-400 uppercase block mb-1">
                端的にいうと？
              </span>
              <p className="text-xs text-blue-200 leading-relaxed font-semibold">
                {termData.oneLiner}
              </p>
            </div>

            {/* Technical Details */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">技術詳細</span>
              <p
                className="text-xs text-slate-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: termData.detail }}
              />
            </div>

            {/* Practical Focus */}
            <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800/80 space-y-2">
              <span className="text-[10px] font-bold text-orange-400 uppercase flex items-center">
                開発エンジニアとしての重要ポイント
              </span>
              <p
                className="text-xs text-slate-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: termData.focus }}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
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
