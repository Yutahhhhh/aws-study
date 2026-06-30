import type { SimulationMode } from '../../types/simulation';
import { allowedSteps } from './steps/allowed';
import { blockedSteps } from './steps/blocked';

export const modes: SimulationMode[] = [
  {
    id: 'allowed',
    label: '許可される通信 (ALB→ECS→RDS)',
    themeId: 'primary',
    icon: 'ShieldCheck',
    steps: allowedSteps,
  },
  {
    id: 'blocked',
    label: '遮断される通信 (直接アクセス / 設定ミス)',
    themeId: 'secondary',
    icon: 'ShieldX',
    steps: blockedSteps,
  },
];
