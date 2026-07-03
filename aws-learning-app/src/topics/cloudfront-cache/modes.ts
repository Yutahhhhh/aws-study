import type { SimulationMode } from '../../types/simulation';
import { cacheFlowSteps } from './steps/cacheFlow';
import { staleReleaseSteps } from './steps/staleRelease';

export const modes: SimulationMode[] = [
  {
    id: 'cache-flow',
    label: 'キャッシュHIT / MISSの流れ',
    themeId: 'primary',
    icon: 'Zap',
    steps: cacheFlowSteps,
  },
  {
    id: 'stale-release',
    label: 'リリースしたのに反映されない',
    themeId: 'secondary',
    icon: 'TriangleAlert',
    steps: staleReleaseSteps,
  },
];
