import type { SimulationMode } from '../../types/simulation';
import { requestSteps } from './steps/request';
import { coldStartSteps } from './steps/coldStart';

export const modes: SimulationMode[] = [
  {
    id: 'request',
    label: 'リクエストの流れ',
    themeId: 'primary',
    icon: 'Zap',
    steps: requestSteps,
  },
  {
    id: 'cold-start',
    label: 'コールドスタート / 同時実行',
    themeId: 'tertiary',
    icon: 'Snowflake',
    steps: coldStartSteps,
  },
];
