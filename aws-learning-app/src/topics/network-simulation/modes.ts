import type { SimulationMode } from '../../types/simulation';
import { inboundSteps } from './steps/inbound';
import { outboundNatSteps } from './steps/outboundNat';
import { outboundPublicEcsSteps } from './steps/outboundPublicEcs';

export const modes: SimulationMode[] = [
  {
    id: 'inbound',
    label: 'インバウンド(外部ユーザーからRailsへ)',
    themeId: 'primary',
    icon: 'Download',
    steps: inboundSteps,
  },
  {
    id: 'outbound-nat',
    label: 'アウトバウンド(NAT経由でSlackへ)',
    themeId: 'secondary',
    icon: 'Upload',
    steps: outboundNatSteps,
  },
  {
    id: 'outbound-public-ecs',
    label: 'アウトバウンド(ECSをパブリック配置)',
    themeId: 'tertiary',
    icon: 'Zap',
    steps: outboundPublicEcsSteps,
  },
];
