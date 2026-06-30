import type { ChallengeRequirement } from '../../types/challenge';

interface RequirementsPanelProps {
  scenario: string;
  requirements: ChallengeRequirement[];
}

/** FloatingPanel の中身として表示する（外枠・見出しはパネル側が描画）。 */
export const RequirementsPanel = ({ scenario, requirements }: RequirementsPanelProps) => {
  return (
    <div className="p-3">
      <p className="mb-4 text-xs leading-6 text-slate-300">{scenario}</p>

      <div className="space-y-2">
        {requirements.map((requirement, index) => (
          <div
            key={requirement.id}
            className="rounded-lg border border-slate-800 bg-slate-950/70 p-3"
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-950 text-[10px] font-black text-blue-300">
                {index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="text-xs font-bold leading-5 text-slate-100">
                  {requirement.title}
                </h3>
                <p className="text-xs leading-5 text-slate-400">{requirement.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
