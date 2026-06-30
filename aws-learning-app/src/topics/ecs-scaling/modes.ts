import type { SimulationMode } from '../../types/simulation';
import { scaleOutSteps } from './steps/scaleOut';
import { scaleInSteps } from './steps/scaleIn';

export const modes: SimulationMode[] = [
  {
    id: 'scale-out',
    label: 'スケールアウト (負荷上昇)',
    themeId: 'primary',
    icon: 'TrendingUp',
    steps: scaleOutSteps,
  },
  {
    id: 'scale-in',
    label: 'スケールイン (負荷低下)',
    themeId: 'tertiary',
    icon: 'TrendingDown',
    steps: scaleInSteps,
  },
];
