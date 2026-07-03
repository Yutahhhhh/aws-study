import type { SimulationMode } from '../../types/simulation';
import { naiveSteps } from './steps/naive';
import { presignedSteps } from './steps/presigned';

export const modes: SimulationMode[] = [
  {
    id: 'naive',
    label: 'サーバー経由の問題点',
    themeId: 'secondary',
    icon: 'TriangleAlert',
    steps: naiveSteps,
  },
  {
    id: 'presigned',
    label: 'Presigned URL方式',
    themeId: 'primary',
    icon: 'FileUp',
    steps: presignedSteps,
  },
];
