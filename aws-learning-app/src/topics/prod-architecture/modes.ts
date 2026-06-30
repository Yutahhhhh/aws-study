import type { SimulationMode } from '../../types/simulation';
import { staticDeliverySteps } from './steps/staticDelivery';
import { apiRequestSteps } from './steps/apiRequest';
import { deploySteps } from './steps/deploy';

export const modes: SimulationMode[] = [
  {
    id: 'static-delivery',
    label: '画面表示 (CloudFront → S3)',
    themeId: 'primary',
    icon: 'Globe',
    steps: staticDeliverySteps,
  },
  {
    id: 'api-request',
    label: 'API通信 (/api/* → ALB → ECS → RDS)',
    themeId: 'secondary',
    icon: 'Server',
    steps: apiRequestSteps,
  },
  {
    id: 'deploy',
    label: 'デプロイ (GitHub Actions → ECR → ECS)',
    themeId: 'tertiary',
    icon: 'Rocket',
    steps: deploySteps,
  },
];
