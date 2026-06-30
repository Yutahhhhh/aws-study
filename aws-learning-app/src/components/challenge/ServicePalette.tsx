import { Plus, RotateCcw } from 'lucide-react';
import type { ChallengeService } from '../../types/challenge';
import type { ResourceCategory } from '../../types/diagram';
import { resolveIcon } from '../../utils/iconResolver';

interface ServicePaletteProps {
  services: ChallengeService[];
  existingNodeIds: string[];
  existingZoneIds: string[];
  onAddService: (service: ChallengeService) => void;
  onReset: () => void;
}

interface CategoryMeta {
  title: string;
  hint: string;
  accentClass: string;
}

/** 操作カテゴリごとの見出し。「どう扱うリソースか」を動詞で示す。 */
const categoryMeta: Record<ResourceCategory, CategoryMeta> = {
  network: {
    title: 'ネットワーク境界を作る',
    hint: 'VPCを作り、SubnetはVPCの枠内へドロップして入れ子にする',
    accentClass: 'text-slate-300',
  },
  placement: {
    title: 'Subnet内に配置する',
    hint: 'Subnetの枠の中へドロップして所属させる実体',
    accentClass: 'text-emerald-300',
  },
  gateway: {
    title: '境界に取り付ける',
    hint: 'VPCの境界へドロップして外部接続点にする',
    accentClass: 'text-orange-300',
  },
  association: {
    title: 'リソースに関連付ける',
    hint: '対象（リソース or Subnet）へドロップして貼り付ける。Subnet内に置く箱ではない',
    accentClass: 'text-rose-300',
  },
  external: {
    title: '外部サービスとして利用する',
    hint: 'VPCの外に置くマネージドサービス',
    accentClass: 'text-sky-300',
  },
};

const categoryOrder: ResourceCategory[] = ['network', 'placement', 'gateway', 'association', 'external'];

export const ServicePalette = ({
  services,
  existingNodeIds,
  existingZoneIds,
  onAddService,
  onReset,
}: ServicePaletteProps) => {
  const grouped = categoryOrder
    .map((category) => ({
      category,
      meta: categoryMeta[category],
      items: services.filter((service) => service.category === category),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="p-3">
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 transition hover:border-slate-600 hover:bg-slate-700 hover:text-slate-100"
          aria-label="キャンバスをリセット"
          title="キャンバスをリセット"
        >
          <RotateCcw size={13} />
          リセット
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {grouped.map(({ category, meta, items }) => (
          <div key={category}>
            <div className="mb-2">
              <h3 className={`text-[11px] font-bold ${meta.accentClass}`}>{meta.title}</h3>
              <p className="mt-0.5 text-[10px] leading-3.5 text-slate-500">{meta.hint}</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {items.map((service) => {
                const alreadyAdded =
                  service.kind === 'zone'
                    ? existingZoneIds.includes(service.serviceId)
                    : existingNodeIds.includes(service.serviceId);
                const icon = service.kind === 'zone' ? service.icon : service.node.icon;

                return (
                  <button
                    key={service.serviceId}
                    type="button"
                    onClick={() => onAddService(service)}
                    disabled={alreadyAdded}
                    className={`
                      flex min-h-12 items-center gap-3 rounded-lg border p-2.5 text-left transition
                      ${
                        alreadyAdded
                          ? 'border-slate-800 bg-slate-950/60 text-slate-500'
                          : 'border-slate-700 bg-slate-950 text-slate-200 hover:border-blue-600 hover:bg-blue-950/30'
                      }
                    `}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-200">
                      {resolveIcon(icon, { size: 20 })}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold">{service.label}</span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">
                        {service.description}
                      </span>
                    </span>
                    <span
                      className={`
                        flex h-6 w-6 shrink-0 items-center justify-center rounded-md border
                        ${
                          alreadyAdded
                            ? 'border-slate-800 bg-slate-900 text-slate-600'
                            : 'border-blue-800 bg-blue-950 text-blue-300'
                        }
                      `}
                      aria-hidden="true"
                    >
                      <Plus size={13} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
