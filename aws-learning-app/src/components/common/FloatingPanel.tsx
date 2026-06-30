import { useState, type ReactNode } from 'react';
import { Minus } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { BottomSheet } from './BottomSheet';

interface FloatingPanelProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  /** アイコン/見出しのアクセント色クラス */
  accentClass?: string;
  /** 展開時のカード幅（Tailwind class） */
  width?: string;
  /** 本文の最大高さ（Tailwind class） */
  bodyMaxClass?: string;
  /** 初期状態を折りたたみにするか */
  defaultCollapsed?: boolean;
  /** チップ/ヘッダーの寄せ（角ドック位置に合わせる） */
  align?: 'left' | 'right';
}

/**
 * キャンバスの角にドックするフローティングパネル。
 * - デスクトップ: チップ ⇄ インライン展開カード（隅に折りたたみボタン）
 * - モバイル: チップ → タップで BottomSheet
 * 位置（四隅）はページ側の絶対配置ラッパーで指定する。
 */
export const FloatingPanel = ({
  icon,
  label,
  children,
  accentClass = 'text-slate-300',
  width = 'w-72',
  bodyMaxClass = 'max-h-[min(68vh,34rem)]',
  defaultCollapsed = false,
  align = 'left',
}: FloatingPanelProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(() => !defaultCollapsed && !isMobile);

  const chip = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={`flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs font-bold text-slate-200 shadow-lg backdrop-blur transition hover:border-slate-500 hover:bg-slate-800 ${align === 'right' ? 'flex-row-reverse' : ''}`}
    >
      <span className={accentClass}>{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );

  if (isMobile) {
    return (
      <>
        {chip}
        <BottomSheet isOpen={open} title={label} icon={<span className={accentClass}>{icon}</span>} onClose={() => setOpen(false)}>
          {children}
        </BottomSheet>
      </>
    );
  }

  if (!open) return chip;

  return (
    <div className={`${width} overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/90 shadow-2xl backdrop-blur`}>
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-3 py-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={accentClass}>{icon}</span>
          <span className="truncate text-xs font-bold text-slate-100">{label}</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-800 text-slate-300 transition hover:bg-slate-700"
          aria-label="折りたたむ"
          title="折りたたむ"
        >
          <Minus size={14} />
        </button>
      </div>
      <div className={`${bodyMaxClass} overflow-y-auto`}>{children}</div>
    </div>
  );
};
