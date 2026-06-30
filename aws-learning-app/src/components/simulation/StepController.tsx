import { Activity, ChevronLeft, ChevronRight, Info, RotateCcw } from 'lucide-react';
import type { ModeTheme } from '../../theme/modeThemes';

interface StepControllerProps {
  currentStep: number;
  totalSteps: number;
  theme: ModeTheme;
  onPrevStep: () => void;
  onNextStep: () => void;
  onReset: () => void;
  onOpenInspector?: () => void;
  onOpenExplanation?: () => void;
}

export const StepController = ({
  currentStep,
  totalSteps,
  theme,
  onPrevStep,
  onNextStep,
  onReset,
  onOpenInspector,
  onOpenExplanation,
}: StepControllerProps) => {
  return (
    <div className="mt-4 p-3 lg:p-4 bg-slate-950/90 rounded-lg border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-4">
      <div className="w-full lg:w-auto flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            ステップ制御:
          </span>
          <span
            className={`${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder} text-xs px-2.5 py-1 rounded-full font-mono`}
          >
            STEP {currentStep + 1} / {totalSteps}
          </span>
        </div>

        {(onOpenInspector || onOpenExplanation) && (
          <div className="lg:hidden shrink-0 flex items-center gap-2">
            {onOpenInspector && (
              <button
                type="button"
                onClick={onOpenInspector}
                className="w-9 h-9 rounded-lg bg-slate-900 border border-orange-500/60 text-orange-300 flex items-center justify-center active:scale-95 transition"
                aria-label="WIRESHARK VIEWを開く"
                title="WIRESHARK VIEW"
              >
                <Activity size={17} />
              </button>
            )}
            {onOpenExplanation && (
              <button
                type="button"
                onClick={onOpenExplanation}
                className="w-9 h-9 rounded-lg bg-slate-900 border border-amber-500/60 text-amber-300 flex items-center justify-center active:scale-95 transition"
                aria-label="ステップ解説を開く"
                title="ステップ解説"
              >
                <Info size={17} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="w-full lg:w-auto flex flex-wrap justify-center lg:justify-end gap-2">
        <button
          onClick={onPrevStep}
          disabled={currentStep === 0}
          className="shrink-0 whitespace-nowrap px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center gap-1"
        >
          <ChevronLeft size={14} />
          前に戻る
        </button>
        <button
          onClick={onNextStep}
          disabled={currentStep === totalSteps - 1}
          className="shrink-0 whitespace-nowrap px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-[11px] sm:text-xs font-bold text-slate-950 transition flex items-center gap-1"
        >
          1ステップ進む
          <ChevronRight size={14} />
        </button>
        <button
          onClick={onReset}
          className="shrink-0 whitespace-nowrap px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center gap-1"
        >
          <RotateCcw size={14} />
          リセット
        </button>
      </div>
    </div>
  );
};
