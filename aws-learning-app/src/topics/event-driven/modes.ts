import type { SimulationMode } from '../../types/simulation';
import { s3EventSteps } from './steps/s3Event';
import { sqsQueueSteps } from './steps/sqsQueue';

export const modes: SimulationMode[] = [
  {
    id: 's3-event',
    label: 'S3イベント → Lambda',
    themeId: 'primary',
    icon: 'FileUp',
    steps: s3EventSteps,
  },
  {
    id: 'sqs-queue',
    label: 'SQS → Lambda (キュー)',
    themeId: 'secondary',
    icon: 'ListChecks',
    steps: sqsQueueSteps,
  },
];
