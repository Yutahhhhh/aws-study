import type { SimulationMode } from '../../types/simulation';
import { querySteps } from './steps/query';
import { ingestSteps } from './steps/ingest';

export const modes: SimulationMode[] = [
  {
    id: 'query',
    label: '質問→回答 (RAG)',
    themeId: 'primary',
    icon: 'MessagesSquare',
    steps: querySteps,
  },
  {
    id: 'ingest',
    label: '取り込み / 運用・コスト',
    themeId: 'tertiary',
    icon: 'DatabaseZap',
    steps: ingestSteps,
  },
];
