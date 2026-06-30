import type { GuideConfig } from '../types/guide';

const guideLoaders: Record<string, () => Promise<{ default: GuideConfig }>> = {
  'ecs-autoscaling': () => import('./ecs-autoscaling/config'),
  'rds-multiaz-vs-replica': () => import('./rds-multiaz-vs-replica/config'),
  'observability': () => import('./observability/config'),
  'edge-and-auth': () => import('./edge-and-auth/config'),
  'iam-foundations': () => import('./iam-foundations/config'),
  'security-governance': () => import('./security-governance/config'),
  'deployment-strategies': () => import('./deployment-strategies/config'),
  'data-layer': () => import('./data-layer/config'),
  'network-connectivity': () => import('./network-connectivity/config'),
  'multi-region-dr': () => import('./multi-region-dr/config'),
  'distributed-tracing': () => import('./distributed-tracing/config'),
  'orchestration': () => import('./orchestration/config'),
  'ecs-operations': () => import('./ecs-operations/config'),
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
