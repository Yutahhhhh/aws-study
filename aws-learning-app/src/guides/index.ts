import type { GuideConfig } from '../types/guide';

const guideLoaders: Record<string, () => Promise<{ default: GuideConfig }>> = {
  'ecs-autoscaling': () => import('./ecs-autoscaling/config'),
  'rds-multiaz-vs-replica': () => import('./rds-multiaz-vs-replica/config'),
  'observability': () => import('./observability/config'),
  'troubleshooting': () => import('./troubleshooting/config'),
  'cost': () => import('./cost/config'),
  'terraform-structure': () => import('./terraform-structure/config'),
};

export async function loadGuideConfig(slug: string): Promise<GuideConfig> {
  const loader = guideLoaders[slug];
  if (!loader) throw new Error(`Unknown guide: ${slug}`);
  const module = await loader();
  return module.default;
}
