/**
 * Design Tokens - 全コンポーネント共通のビジュアル定数
 * 色、スペーシング、角丸、影、タイポグラフィを一元管理する
 */
export const tokens = {
  colors: {
    bg: {
      primary: 'bg-slate-950',
      secondary: 'bg-slate-900',
      tertiary: 'bg-slate-900/50',
      surface: 'bg-slate-950/90',
      overlay: 'bg-slate-950/80',
      diagram: 'bg-slate-950/70',
    },
    border: {
      primary: 'border-slate-800',
      secondary: 'border-slate-800/80',
      subtle: 'border-slate-800/60',
      accent: 'border-slate-700',
    },
    text: {
      primary: 'text-slate-100',
      secondary: 'text-slate-300',
      tertiary: 'text-slate-400',
      muted: 'text-slate-500',
      faint: 'text-slate-600',
    },
    packet: {
      srcValue: 'text-emerald-400',
      srcValueAlt: 'text-emerald-300',
      dstValue: 'text-rose-400',
      dstValueAlt: 'text-rose-300',
    },
  },
  spacing: {
    panel: 'p-4 lg:p-6',
    card: 'p-5',
    cardCompact: 'p-3',
    section: 'space-y-6',
  },
  radii: {
    card: 'rounded-xl',
    panel: 'rounded-lg',
    badge: 'rounded-full',
    button: 'rounded-lg',
  },
  shadows: {
    card: 'shadow-2xl',
    button: 'shadow-lg',
  },
  typography: {
    label: 'text-xs font-bold uppercase tracking-wider',
    badge: 'text-xs px-2.5 py-1 rounded-full font-mono',
    mono: 'font-mono text-xs',
    sectionTitle: 'text-sm font-bold',
  },
} as const;
