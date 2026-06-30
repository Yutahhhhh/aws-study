import type { SimulationMode } from '../../types/simulation';
import { albL7Steps } from './steps/albL7';
import { nlbL4Steps } from './steps/nlbL4';

export const modes: SimulationMode[] = [
  {
    id: 'alb-l7',
    label: 'ALB (L7 / HTTP)',
    themeId: 'primary',
    icon: 'Globe',
    steps: albL7Steps,
  },
  {
    id: 'nlb-l4',
    label: 'NLB (L4 / TCP)',
    themeId: 'tertiary',
    icon: 'Cable',
    steps: nlbL4Steps,
  },
];
