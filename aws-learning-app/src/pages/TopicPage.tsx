import { useParams } from 'react-router-dom';
import { useTopicLoader } from '../hooks/useTopicLoader';
import { LearningPage } from '../components/layout/LearningPage';

export const TopicPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { config, loading, error } = useTopicLoader(slug!);

  if (loading) {
    return (
      <div className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">トピックを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg font-bold mb-2">読み込みエラー</p>
          <p className="text-slate-400 text-sm">{error?.message ?? 'トピックが見つかりませんでした'}</p>
        </div>
      </div>
    );
  }

  return <LearningPage topicConfig={config} />;
};
