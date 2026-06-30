import type { SimulationMode } from '../../types/simulation';
import type { ModeTheme } from '../../theme/modeThemes';
import { resolveIcon } from '../../utils/iconResolver';

interface ModeSelectorProps {
  modes: SimulationMode[];
  currentModeId: string;
  modeThemes: Record<string, ModeTheme>;
  onModeChange: (modeId: string) => void;
}

export const ModeSelector = ({ modes, currentModeId, modeThemes, onModeChange }: ModeSelectorProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4 z-10">
      {modes.map((mode) => {
        const theme = modeThemes[mode.themeId];
        if (!theme) return null;
        const isActive = currentModeId === mode.id;

        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
              isActive ? theme.activeClass : theme.inactiveClass
            }`}
          >
            {resolveIcon(mode.icon, { size: 14 })}
            {mode.label}
          </button>
        );
      })}
    </div>
  );
};
