import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  title: string;
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

/**
 * 下からスライドして出るシート。スマホで重めのパネルを開くのに使う。
 * （旧 LearningPage のモバイルモーダル実装を汎用化したもの）
 *
 * fixed inset-0 は transform を持つ祖先がいると基準点がその祖先に変わってしまう
 * （FloatingPanel の中央寄せ用 -translate-x-1/2 ラッパーなど）ため、document.body へ
 * portal して常にビューポート基準の全画面オーバーレイになるようにする。
 */
export const BottomSheet = ({ isOpen, title, icon, onClose, children }: BottomSheetProps) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end bg-slate-950/80 p-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[84vh] w-full flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            {icon}
            <span className="truncate text-xs font-bold text-slate-100">{title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 transition hover:bg-slate-700"
            aria-label="閉じる"
            title="閉じる"
          >
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto bg-slate-950 p-3">{children}</div>
      </div>
    </div>,
    document.body,
  );
};
