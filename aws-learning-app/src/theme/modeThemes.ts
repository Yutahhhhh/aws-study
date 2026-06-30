/**
 * Mode Theme - シミュレーションモードごとの色テーマ定義
 * 各コンポーネントに散在していた getModeColor() を一元化する
 */
export interface ModeTheme {
  id: string;
  color: string;
  activeClass: string;
  inactiveClass: string;
  pathHex: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentText: string;
}

export const defaultModeThemes: Record<string, ModeTheme> = {
  primary: {
    id: 'primary',
    color: 'blue',
    activeClass: 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20',
    inactiveClass: 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700',
    pathHex: '#3b82f6',
    badgeBg: 'bg-blue-950',
    badgeText: 'text-blue-400',
    badgeBorder: 'border-blue-800',
    accentText: 'text-blue-400',
  },
  secondary: {
    id: 'secondary',
    color: 'rose',
    activeClass: 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-500/20',
    inactiveClass: 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700',
    pathHex: '#f43f5e',
    badgeBg: 'bg-rose-950',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-800',
    accentText: 'text-rose-400',
  },
  tertiary: {
    id: 'tertiary',
    color: 'amber',
    activeClass: 'bg-amber-600 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/20',
    inactiveClass: 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700',
    pathHex: '#ea580c',
    badgeBg: 'bg-amber-950',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-800',
    accentText: 'text-amber-400',
  },
};
