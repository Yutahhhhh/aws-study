import type { SimulationMode } from '../../types/simulation';
import { normalSteps } from './steps/normal';
import { failoverSteps } from './steps/failover';

export const modes: SimulationMode[] = [
  {
    id: 'normal',
    label: '平常時 (2AZへ分散)',
    themeId: 'primary',
    icon: 'Network',
    steps: normalSteps,
  },
  {
    id: 'failover',
    label: 'AZ障害時 (failover)',
    themeId: 'secondary',
    icon: 'TriangleAlert',
    steps: failoverSteps,
  },
];
