import type { ChallengeService } from '../types/challenge';
import type {
  DiagramNode,
  DiagramPosition,
  DiagramZone,
  ResourceCategory,
} from '../types/diagram';

export const ICON = {
  alb: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Elastic-Load-Balancing_48.svg',
  cloudfront: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Amazon-CloudFront_48.svg',
  ecr: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Registry_48.svg',
  ecs: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.svg',
  igw: '/src/assets/aws/Resource-Icons_07312025/Res_Networking-Content-Delivery/Res_Amazon-VPC_Internet-Gateway_48.svg',
  rds: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Database/48/Arch_Amazon-RDS_48.svg',
  routeTable: '/src/assets/aws/Resource-Icons_07312025/Res_Networking-Content-Delivery/Res_Amazon-Route-53_Route-Table_48.svg',
  s3: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Storage/48/Arch_Amazon-Simple-Storage-Service_48.svg',
};

export const nodeStyle = {
  app: {
    bgColor: 'bg-emerald-950',
    borderColor: 'border-emerald-500',
    textColor: 'text-emerald-100',
    accentColor: 'text-emerald-300',
  },
  data: {
    bgColor: 'bg-sky-950',
    borderColor: 'border-sky-500',
    textColor: 'text-sky-100',
    accentColor: 'text-sky-300',
  },
  edge: {
    bgColor: 'bg-indigo-950',
    borderColor: 'border-indigo-500',
    textColor: 'text-indigo-100',
    accentColor: 'text-indigo-300',
  },
  external: {
    bgColor: 'bg-slate-800',
    borderColor: 'border-slate-500',
    textColor: 'text-slate-100',
    accentColor: 'text-slate-400',
  },
  gateway: {
    bgColor: 'bg-orange-950',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-100',
    accentColor: 'text-orange-300',
  },
  observability: {
    bgColor: 'bg-purple-950',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-100',
    accentColor: 'text-purple-300',
  },
  queue: {
    bgColor: 'bg-amber-950',
    borderColor: 'border-amber-500',
    textColor: 'text-amber-100',
    accentColor: 'text-amber-300',
  },
  routeTable: {
    bgColor: 'bg-cyan-950',
    borderColor: 'border-cyan-500',
    textColor: 'text-cyan-100',
    accentColor: 'text-cyan-300',
  },
  security: {
    bgColor: 'bg-rose-950',
    borderColor: 'border-rose-500',
    textColor: 'text-rose-100',
    accentColor: 'text-rose-300',
  },
  worker: {
    bgColor: 'bg-teal-950',
    borderColor: 'border-teal-500',
    textColor: 'text-teal-100',
    accentColor: 'text-teal-300',
  },
} satisfies Record<string, DiagramNode['style']>;

export const makeZone = (
  id: string,
  label: string,
  position: DiagramPosition,
  tone: 'vpc' | 'public' | 'private' | 'ops' = 'vpc',
  parentZoneId?: string,
): DiagramZone => {
  const zoneStyle = {
    vpc: {
      borderColor: 'border-slate-600',
      borderStyle: 'border-dashed',
      bgColor: 'bg-transparent',
      labelColor: 'text-slate-500',
    },
    public: {
      borderColor: 'border-emerald-600',
      borderStyle: 'border-dashed',
      bgColor: 'bg-emerald-500/[0.03]',
      labelColor: 'text-emerald-400',
    },
    private: {
      borderColor: 'border-blue-500',
      borderStyle: 'border-dashed',
      bgColor: 'bg-blue-500/[0.03]',
      labelColor: 'text-blue-400',
    },
    ops: {
      borderColor: 'border-amber-600',
      borderStyle: 'border-dashed',
      bgColor: 'bg-amber-500/[0.03]',
      labelColor: 'text-amber-400',
    },
  } satisfies Record<string, DiagramZone['style']>;

  return {
    id,
    label,
    parentZoneId,
    position,
    contentPadding: { top: 48, right: 16, bottom: 16, left: 16 },
    style: zoneStyle[tone],
  };
};

interface NodeExtra {
  category: ResourceCategory;
  parentId?: string;
  glossaryTermId?: string;
}

export const makeNode = (
  id: string,
  label: string,
  sublabel: string,
  icon: string,
  position: DiagramPosition,
  style: DiagramNode['style'],
  extra: NodeExtra,
  metadata?: string,
): DiagramNode => ({
  id,
  label,
  sublabel,
  metadata,
  icon,
  position,
  style,
  ...extra,
});

export const makeServiceFactory =
  (nodes: DiagramNode[]) =>
  (
    serviceId: string,
    description: string,
    category?: Exclude<ResourceCategory, 'network'>,
  ): ChallengeService => {
    const node = nodes.find((item) => item.id === serviceId);
    if (!node) throw new Error(`Unknown challenge node: ${serviceId}`);
    const serviceCategory = category ?? (node.category as Exclude<ResourceCategory, 'network'>);

    return {
      serviceId,
      label: node.label,
      description,
      kind: 'node',
      category: serviceCategory,
      defaultPosition: { ...node.position },
      node: {
        label: node.label,
        sublabel: node.sublabel,
        metadata: node.metadata,
        icon: node.icon,
        glossaryTermId: node.glossaryTermId,
        category: serviceCategory,
        style: { ...node.style },
      },
    };
  };

export const makeZoneServiceFactory =
  (zones: DiagramZone[]) =>
  (serviceId: string, description: string, icon = 'Network'): ChallengeService => {
    const zone = zones.find((item) => item.id === serviceId);
    if (!zone) throw new Error(`Unknown challenge zone: ${serviceId}`);

    return {
      serviceId,
      label: zone.label,
      description,
      kind: 'zone',
      category: 'network',
      icon,
      zone: {
        ...zone,
        position: { ...zone.position },
        contentPadding: zone.contentPadding ? { ...zone.contentPadding } : undefined,
        style: { ...zone.style },
      },
    };
  };

export const pickNodes = (nodes: DiagramNode[], ids: string[]) =>
  ids.map((id) => {
    const node = nodes.find((item) => item.id === id);
    if (!node) throw new Error(`Unknown initial node: ${id}`);
    return { ...node, position: { ...node.position }, style: { ...node.style } };
  });
