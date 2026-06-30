import type { KeyPoint } from '../../types/simulation';

interface StepExplanationProps {
  title: string;
  description: string;
  keyPoints?: KeyPoint[];
  onOpenGlossary?: (termId: string) => void;
}

export const StepExplanation = ({ title, description, keyPoints, onOpenGlossary }: StepExplanationProps) => {
  const handleDescriptionClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('glossary-link') && target.getAttribute('onclick')) {
      e.preventDefault();
      const onclickAttr = target.getAttribute('onclick');
      const match = onclickAttr?.match(/openGlossary\('([^']+)'\)/);
      if (match && match[1]) {
        onOpenGlossary?.(match[1]);
      }
    }
  };

  return (
    <div className="flex flex-col p-4">
      <div>
        <div className="text-xs text-slate-300 leading-relaxed space-y-3">
          <h4 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-1 mb-2">
            {title}
          </h4>
          <div
            className="space-y-2 text-slate-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: description }}
            onClick={handleDescriptionClick}
          />
        </div>
      </div>

      {/* Key Points - データ駆動 */}
      {keyPoints && keyPoints.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">
            ここが理解のポイント！
          </h4>
          <div className="space-y-2">
            {keyPoints.map((point) => (
              <div key={point.glossaryTermId} className="p-2 bg-slate-950 rounded border border-slate-800/60 text-[11px]">
                <span
                  onClick={() => onOpenGlossary?.(point.glossaryTermId)}
                  className={`font-bold ${point.accentColor} block mb-0.5 glossary-link inline-block cursor-pointer`}
                >
                  {point.title}
                </span>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
