import { useState } from 'react';
import { ArrowRight, ArrowDown, Info, Lightbulb, TriangleAlert, OctagonAlert, CheckCircle2, ExternalLink } from 'lucide-react';
import type {
  GuideConfig,
  GuideBlock,
  GuideAccent,
} from '../../types/guide';
import { resolveIcon } from '../../utils/iconResolver';

/** accent名 → 実在するTailwindクラス(リテラルで列挙しビルド時に生成させる) */
const ACCENT: Record<GuideAccent, { border: string; text: string; bg: string; dot: string }> = {
  blue: { border: 'border-blue-700', text: 'text-blue-300', bg: 'bg-blue-950/40', dot: 'bg-blue-500' },
  rose: { border: 'border-rose-700', text: 'text-rose-300', bg: 'bg-rose-950/40', dot: 'bg-rose-500' },
  amber: { border: 'border-amber-700', text: 'text-amber-300', bg: 'bg-amber-950/40', dot: 'bg-amber-500' },
  emerald: { border: 'border-emerald-700', text: 'text-emerald-300', bg: 'bg-emerald-950/40', dot: 'bg-emerald-500' },
  sky: { border: 'border-sky-700', text: 'text-sky-300', bg: 'bg-sky-950/40', dot: 'bg-sky-500' },
  purple: { border: 'border-purple-700', text: 'text-purple-300', bg: 'bg-purple-950/40', dot: 'bg-purple-500' },
  slate: { border: 'border-slate-600', text: 'text-slate-300', bg: 'bg-slate-800/40', dot: 'bg-slate-500' },
};

const CALLOUT = {
  info: { icon: Info, border: 'border-blue-700', bg: 'bg-blue-950/40', text: 'text-blue-300' },
  tip: { icon: Lightbulb, border: 'border-emerald-700', bg: 'bg-emerald-950/40', text: 'text-emerald-300' },
  warn: { icon: TriangleAlert, border: 'border-amber-700', bg: 'bg-amber-950/40', text: 'text-amber-300' },
  danger: { icon: OctagonAlert, border: 'border-rose-700', bg: 'bg-rose-950/40', text: 'text-rose-300' },
} as const;

const accentOf = (a?: GuideAccent) => ACCENT[a ?? 'slate'];

const Block = ({ block }: { block: GuideBlock }) => {
  switch (block.type) {
    case 'paragraph':
      return (
        <div
          className="text-sm leading-relaxed text-slate-300 [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[12px] [&_strong]:text-slate-100"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      );

    case 'list':
      return block.ordered ? (
        <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-300 [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_strong]:text-slate-100">
          {block.items.map((it, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: it }} />
          ))}
        </ol>
      ) : (
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-300 [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_strong]:text-slate-100">
          {block.items.map((it, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: it }} />
          ))}
        </ul>
      );

    case 'callout': {
      const c = CALLOUT[block.variant];
      const Icon = c.icon;
      return (
        <div className={`flex gap-3 rounded-lg border ${c.border} ${c.bg} p-4`}>
          <Icon size={18} className={`${c.text} shrink-0 mt-0.5`} />
          <div className="flex-1">
            {block.title && <p className={`font-bold text-sm mb-1 ${c.text}`}>{block.title}</p>}
            <div
              className="text-sm text-slate-300 leading-relaxed [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_strong]:text-slate-100"
              dangerouslySetInnerHTML={{ __html: block.html }}
            />
          </div>
        </div>
      );
    }

    case 'table':
      return (
        <div className="overflow-x-auto">
          {block.caption && <p className="text-xs text-slate-500 mb-2">{block.caption}</p>}
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                {block.headers.map((h, i) => (
                  <th key={i} className="text-left py-2 px-3 font-bold text-slate-200 bg-slate-900">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-slate-800">
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="py-2 px-3 align-top text-slate-300 [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_strong]:text-slate-100"
                      dangerouslySetInnerHTML={{ __html: cell }}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'flow':
      return (
        <div>
          {block.title && <p className="text-xs font-bold text-slate-400 mb-2">{block.title}</p>}
          <div className="flex flex-col md:flex-row md:items-stretch gap-2">
            {block.steps.map((s, i) => {
              const a = accentOf(s.accent);
              return (
                <div key={i} className="flex flex-col md:flex-row md:items-center gap-2 md:flex-1">
                  <div className={`flex-1 rounded-lg border ${a.border} ${a.bg} px-3 py-2.5 text-center`}>
                    <p className={`font-bold text-sm ${a.text}`}>{s.label}</p>
                    {s.sublabel && <p className="text-[11px] text-slate-400 mt-0.5">{s.sublabel}</p>}
                  </div>
                  {i < block.steps.length - 1 && (
                    <>
                      <ArrowRight size={18} className="text-slate-600 hidden md:block shrink-0" />
                      <ArrowDown size={16} className="text-slate-600 md:hidden mx-auto" />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );

    case 'compare':
      return (
        <div className={`grid gap-3 ${block.columns.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {block.columns.map((col, i) => {
            const a = accentOf(col.accent);
            return (
              <div key={i} className={`rounded-lg border ${a.border} ${a.bg} p-4`}>
                <p className={`font-bold ${a.text}`}>{col.title}</p>
                {col.subtitle && <p className="text-[11px] text-slate-400 mb-2">{col.subtitle}</p>}
                <ul className="mt-2 space-y-1.5">
                  {col.points.map((p, pi) => (
                    <li key={pi} className="flex gap-2 text-[13px] text-slate-300">
                      <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${a.dot} shrink-0`} />
                      <span
                        className="[&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_strong]:text-slate-100"
                        dangerouslySetInnerHTML={{ __html: p }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      );

    case 'steps':
      return (
        <div className="space-y-2">
          {block.steps.map((s, i) => {
            const a = accentOf(s.accent);
            return (
              <div key={i} className={`flex gap-3 rounded-lg border ${a.border} ${a.bg} p-3`}>
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${a.dot} text-xs font-bold text-slate-950`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className={`font-bold text-sm ${a.text}`}>{s.title}</p>
                  {s.html && (
                    <div
                      className="text-[13px] text-slate-300 mt-1 leading-relaxed [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_strong]:text-slate-100"
                      dangerouslySetInnerHTML={{ __html: s.html }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );

    case 'code':
      return (
        <div>
          {block.caption && <p className="text-xs text-slate-500 mb-1">{block.caption}</p>}
          <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900 p-4 text-[12px] leading-relaxed text-slate-300">
            <code>{block.code}</code>
          </pre>
        </div>
      );

    default:
      return null;
  }
};

export const GuideArticle = ({ config }: { config: GuideConfig }) => {
  const [activeId, setActiveId] = useState(config.sections[0]?.id);

  return (
    <div className="max-w-6xl w-full mx-auto p-6 lg:p-10 grid lg:grid-cols-[220px_1fr] gap-8">
      {/* 目次 */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">目次</p>
          <nav className="space-y-1">
            {config.sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setActiveId(s.id)}
                className={`block text-sm px-3 py-1.5 rounded-lg transition border-l-2 ${
                  activeId === s.id
                    ? 'border-blue-500 bg-slate-900 text-blue-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {s.title}
              </a>
            ))}
            {config.checkpoints && config.checkpoints.length > 0 && (
              <a
                href="#checkpoints"
                className="block text-sm px-3 py-1.5 rounded-lg border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              >
                理解チェック
              </a>
            )}
          </nav>
        </div>
      </aside>

      {/* 本文 */}
      <article className="min-w-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-3">{config.title}</h1>
          <p className="text-slate-400">{config.description}</p>
          {config.intro && (
            <div
              className="mt-4 text-sm leading-relaxed text-slate-300 [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_strong]:text-slate-100"
              dangerouslySetInnerHTML={{ __html: config.intro }}
            />
          )}
        </div>

        <div className="space-y-10">
          {config.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-slate-800">
                {section.icon && (
                  <span className="text-blue-400">{resolveIcon(section.icon, { size: 20 })}</span>
                )}
                <h2 className="text-xl font-bold text-slate-100">{section.title}</h2>
              </div>
              <div className="space-y-4">
                {section.blocks.map((block, i) => (
                  <Block key={i} block={block} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {config.checkpoints && config.checkpoints.length > 0 && (
          <section id="checkpoints" className="scroll-mt-24 mt-10">
            <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-slate-800">
              <CheckCircle2 size={20} className="text-emerald-400" />
              <h2 className="text-xl font-bold text-slate-100">理解チェック</h2>
            </div>
            <ul className="space-y-2">
              {config.checkpoints.map((c, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-slate-300">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span dangerouslySetInnerHTML={{ __html: c }} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {config.references && config.references.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-slate-800">
              <ExternalLink size={18} className="text-slate-400" />
              <h2 className="text-lg font-bold text-slate-100">公式ドキュメント</h2>
            </div>
            <ul className="space-y-1.5">
              {config.references.map((r, i) => (
                <li key={i}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1.5"
                  >
                    <ExternalLink size={13} />
                    {r.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
};
