import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import type { ModeTheme } from '../../theme/modeThemes';

interface StepControllerProps {
  currentStep: number;
  totalSteps: number;
  theme: ModeTheme;
  onPrevStep: () => void;
  onNextStep: () => void;
  onReset: () => void;
}

/** キャンバス下中央にドックするステップ操作。常時表示。 */
export const StepController = ({
  currentStep,
  totalSteps,
  theme,
  onPrevStep,
  onNextStep,
  onReset,
}: StepControllerProps) => {
  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 p-1.5 shadow-2xl backdrop-blur">
      <span
        className={`${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder} mr-0.5 whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[11px]`}
      >
        STEP {currentStep + 1}/{totalSteps}
      </span>

      <button
        onClick={onPrevStep}
        disabled={currentStep === 0}
        className="flex h-9 items-center gap-1 rounded-lg bg-slate-800 px-2.5 text-[11px] font-bold transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="前に戻る"
      >
        <ChevronLeft size={15} />
        <span className="hidden sm:inline">前へ</span>
      </button>
      <button
        onClick={onNextStep}
        disabled={currentStep === totalSteps - 1}
        className="flex h-9 items-center gap-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3 text-[11px] font-bold text-slate-950 transition hover:from-orange-600 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="1ステップ進む"
      >
        <span className="hidden sm:inline">進む</span>
        <ChevronRight size={15} />
      </button>
      <button
        onClick={onReset}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-300 transition hover:bg-slate-700"
        aria-label="リセット"
        title="リセット"
      >
        <RotateCcw size={15} />
      </button>
    </div>
  );
};
