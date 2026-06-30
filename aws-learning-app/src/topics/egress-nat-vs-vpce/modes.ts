import type { SimulationMode } from '../../types/simulation';
import { viaNatSteps } from './steps/viaNat';
import { viaVpceSteps } from './steps/viaVpce';

export const modes: SimulationMode[] = [
  {
    id: 'via-nat',
    label: '外部APIへ (NAT Gateway経由)',
    themeId: 'secondary',
    icon: 'Globe',
    steps: viaNatSteps,
  },
  {
    id: 'via-vpce',
    label: 'AWSサービスへ (VPC Endpoint経由)',
    themeId: 'tertiary',
    icon: 'Plug',
    steps: viaVpceSteps,
  },
];
