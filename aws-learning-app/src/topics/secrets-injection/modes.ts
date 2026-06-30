import type { SimulationMode } from '../../types/simulation';
import { injectSteps } from './steps/inject';
import { failureSteps } from './steps/failure';

export const modes: SimulationMode[] = [
  {
    id: 'inject',
    label: '秘密の注入 (起動時に取得 → env)',
    themeId: 'primary',
    icon: 'KeyRound',
    steps: injectSteps,
  },
  {
    id: 'failure',
    label: '失敗パターン (経路 / 権限 / 平文)',
    themeId: 'secondary',
    icon: 'TriangleAlert',
    steps: failureSteps,
  },
];
