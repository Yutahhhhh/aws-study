import { CheckCircle2, Play, Route, XCircle } from 'lucide-react';
import type { ChallengeAction, ChallengeRunResult } from '../../types/challenge';

type ChallengeViewState = 'editing' | 'running' | 'success' | 'failure' | 'answer-trace';

interface ChallengeResultPanelProps {
  state: ChallengeViewState;
  actions: ChallengeAction[];
  result: ChallengeRunResult | null;
  onRun: () => void;
  onShowAnswerTrace: () => void;
}

const statusClasses = {
  success: {
    border: 'border-emerald-800',
    bg: 'bg-emerald-950/40',
    text: 'text-emerald-200',
    subtle: 'text-emerald-300',
  },
  failure: {
    border: 'border-red-800',
    bg: 'bg-red-950/40',
    text: 'text-red-100',
    subtle: 'text-red-300',
  },
};

export const ChallengeResultPanel = ({
  state,
  actions,
  result,
  onRun,
  onShowAnswerTrace,
}: ChallengeResultPanelProps) => {
  const isRunning = state === 'running';
  const hasResult = state === 'success' || state === 'failure';
  const tone = result?.status === 'failure' ? statusClasses.failure : statusClasses.success;

  return (
    <div className="p-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onRun}
          disabled={isRunning}
          className="flex h-10 items-center justify-center gap-2 rounded-lg border border-blue-700 bg-blue-600 px-3 text-xs font-bold text-white transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-70"
        >
          <Play size={14} />
          <span>{isRunning ? '実行中' : '動作確認'}</span>
        </button>
        <button
          type="button"
          onClick={onShowAnswerTrace}
          className="flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-800 bg-amber-950 px-3 text-xs font-bold text-amber-200 transition hover:border-amber-700 hover:bg-amber-900"
        >
          <Route size={14} />
          <span>模範解答</span>
        </button>
      </div>

      {!hasResult && (
        <div className="mt-4 space-y-2">
          {actions.map((action) => (
            <div key={action.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <h3 className="text-xs font-bold text-slate-200">{action.title}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">{action.description}</p>
            </div>
          ))}
        </div>
      )}

      {hasResult && result && (
        <div className={`mt-4 rounded-lg border ${tone.border} ${tone.bg} p-3`}>
          <div className="mb-2 flex items-start gap-2">
            {result.status === 'success' ? (
              <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-300" />
            ) : (
              <XCircle size={17} className="mt-0.5 shrink-0 text-red-300" />
            )}
            <div className="min-w-0">
              <h3 className={`text-sm font-bold ${tone.text}`}>{result.title}</h3>
              <p className={`mt-1 text-xs leading-5 ${tone.subtle}`}>{result.message}</p>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {result.actionResults.map((actionResult) => {
              const actionTone =
                actionResult.status === 'success' ? statusClasses.success : statusClasses.failure;

              return (
                <div
                  key={actionResult.actionId}
                  className={`rounded-lg border ${actionTone.border} bg-slate-950/60 p-3`}
                >
                  <div className="flex items-start gap-2">
                    {actionResult.status === 'success' ? (
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-300" />
                    ) : (
                      <XCircle size={15} className="mt-0.5 shrink-0 text-red-300" />
                    )}
                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold ${actionTone.text}`}>
                        {actionResult.title}
                      </h4>
                      <p className={`mt-1 whitespace-pre-line text-xs leading-5 ${actionTone.subtle}`}>
                        {actionResult.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
