import type { SimulationMode } from '../../types/simulation';
import { connectSteps } from './steps/connect';
import { whySecureSteps } from './steps/whySecure';

export const modes: SimulationMode[] = [
  {
    id: 'connect',
    label: 'ポートフォワーディングで接続',
    themeId: 'primary',
    icon: 'PlugZap',
    steps: connectSteps,
  },
  {
    id: 'why-secure',
    label: 'なぜ安全か（直接接続との対比）',
    themeId: 'secondary',
    icon: 'ShieldCheck',
    steps: whySecureSteps,
  },
];
