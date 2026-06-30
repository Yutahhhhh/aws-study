import { useParams } from 'react-router-dom';
import { useGuideLoader } from '../hooks/useGuideLoader';
import { Header } from '../components/common/Header';
import { GuideArticle } from '../components/guide/GuideArticle';

export const GuidePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { config, loading, error } = useGuideLoader(slug!);

  if (loading) {
    return (
      <div className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">ガイドを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg font-bold mb-2">読み込みエラー</p>
          <p className="text-slate-400 text-sm">{error?.message ?? 'ガイドが見つかりませんでした'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans">
      <Header topicLabel={config.headerLabel} showGlossaryButton={false} />
      <main className="flex-1 w-full">
        <GuideArticle config={config} />
      </main>
      <footer className="border-t border-slate-800 py-6 text-center text-sm text-slate-500">
        <p>&copy; 2026 AWS Learning Visualizer. Built with React + TypeScript + Tailwind CSS</p>
      </footer>
    </div>
  );
};
