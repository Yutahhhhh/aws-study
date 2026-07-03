import type { SimulationMode } from '../../types/simulation';
import { deploySteps } from './steps/deploy';
import { rollbackSteps } from './steps/rollback';

export const modes: SimulationMode[] = [
  {
    id: 'deploy',
    label: '正常デプロイの流れ',
    themeId: 'primary',
    icon: 'Rocket',
    steps: deploySteps,
  },
  {
    id: 'rollback',
    label: '失敗→自動ロールバック',
    themeId: 'secondary',
    icon: 'Undo2',
    steps: rollbackSteps,
  },
];
