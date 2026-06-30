import { ChevronLeft, ChevronRight, Pencil, Route } from 'lucide-react';
import type { AnswerTraceStep } from '../../types/challenge';

interface AnswerTracePanelProps {
  step: AnswerTraceStep;
  currentIndex: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
}

export const AnswerTracePanel = ({
  step,
  currentIndex,
  totalSteps,
  onPrev,
  onNext,
  onExit,
}: AnswerTracePanelProps) => {
  return (
    <section className="rounded-xl border border-amber-800 bg-amber-950/30 p-4 shadow-2xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Route size={16} className="shrink-0 text-amber-300" />
          <h2 className="truncate text-sm font-bold text-amber-100">模範解答トレース</h2>
        </div>
        <span className="shrink-0 rounded border border-amber-800 bg-slate-950/60 px-2 py-1 text-[11px] font-bold text-amber-200">
          {currentIndex + 1} / {totalSteps}
        </span>
      </div>

      <div className="rounded-lg border border-amber-900/80 bg-slate-950/70 p-3">
        <h3 className="text-sm font-bold text-amber-100">{step.title}</h3>
        <p className="mt-2 text-sm leading-6 text-amber-200/80">{step.description}</p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="flex h-9 items-center justify-center rounded-lg border border-amber-900 bg-slate-950/70 text-amber-200 transition hover:border-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="前のステップ"
          title="前のステップ"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={onExit}
          className="flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 text-xs font-bold text-slate-200 transition hover:bg-slate-700"
        >
          <Pencil size={14} />
          <span>編集</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={currentIndex === totalSteps - 1}
          className="flex h-9 items-center justify-center rounded-lg border border-amber-900 bg-slate-950/70 text-amber-200 transition hover:border-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="次のステップ"
          title="次のステップ"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </section>
  );
};
