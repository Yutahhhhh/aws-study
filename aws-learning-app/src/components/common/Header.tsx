import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  topicLabel?: string;
  onOpenGlossary?: () => void;
  showGlossaryButton?: boolean;
}

export const Header = ({ topicLabel, onOpenGlossary, showGlossaryButton = true }: HeaderProps) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
      <div className="hidden md:flex px-6 py-4 justify-between items-center">
        <div className="flex items-center space-x-3">
          <span className="bg-orange-600 text-white font-bold px-2.5 py-0.5 rounded text-xs tracking-wider">
            {topicLabel ?? 'AWS LEARNING'}
          </span>
          <Link
            to="/"
            className="text-lg font-bold tracking-tight hover:text-blue-400 transition-colors"
          >
            AWS学習ビジュアライザー
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          {showGlossaryButton && onOpenGlossary && (
            <button
              onClick={onOpenGlossary}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-950 hover:bg-blue-900 text-blue-400 hover:text-blue-300 border border-blue-800/80 hover:border-blue-700 rounded-lg text-xs font-bold transition"
            >
              <BookOpen size={14} />
              <span>インフラ用語集を開く</span>
            </button>
          )}
        </div>
      </div>

      <div className="md:hidden h-12 px-3 flex items-center justify-between gap-3">
        <Link
          to="/"
          className="min-w-0 flex items-center gap-2 text-slate-100 hover:text-blue-300 transition-colors"
          aria-label="ホームへ戻る"
        >
          <span className="bg-orange-600 text-white font-black px-2 py-1 rounded text-[10px] leading-none tracking-wider">
            AWS
          </span>
          <span className="min-w-0 truncate text-xs font-bold tracking-tight">
            {topicLabel ?? 'AWS学習'}
          </span>
        </Link>
        {showGlossaryButton && onOpenGlossary && (
          <button
            onClick={onOpenGlossary}
            className="shrink-0 w-9 h-9 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800/80 hover:border-blue-700 rounded-lg flex items-center justify-center transition"
            aria-label="インフラ用語集を開く"
            title="インフラ用語集"
          >
            <BookOpen size={16} />
          </button>
        )}
      </div>
    </header>
  );
};
