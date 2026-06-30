import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenCheck,
  Eye,
  FileText,
  ListChecks,
  MousePointerClick,
  PenTool,
} from 'lucide-react';
import { Header } from '../components/common/Header';
import { topicManifest } from '../topics';
import { challengeManifest } from '../challenges';
import type { TopicManifest } from '../types/topic';
import { resolveIcon } from '../utils/iconResolver';

const TopicCard = ({ topic }: { topic: TopicManifest }) => (
  <Link
    to={topic.path}
    className="group relative bg-slate-900 border-2 border-slate-800 hover:border-blue-600 rounded-xl p-4 sm:p-5 md:p-6 transition-all hover:shadow-2xl hover:shadow-blue-900/20"
  >
    <div className="flex items-start gap-3 sm:gap-4">
      <div className={`shrink-0 p-2.5 sm:p-3 bg-${topic.color}-950 rounded-lg border border-${topic.color}-800`}>
        <span className={`text-${topic.color}-400`}>{resolveIcon(topic.icon, { size: 22 })}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h3 className="min-w-0 break-words text-base font-bold leading-snug text-slate-100 transition-colors group-hover:text-blue-400 sm:text-lg lg:text-xl">
            {topic.title}
          </h3>
          <span
            className={`self-start shrink-0 whitespace-nowrap text-[10px] sm:text-xs px-2 py-0.5 bg-${topic.color}-950 text-${topic.color}-400 border border-${topic.color}-800 rounded-full font-bold`}
          >
            {topic.badge}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">{topic.description}</p>
      </div>
      <ArrowRight
        className="mt-1 hidden shrink-0 text-slate-600 transition-all group-hover:translate-x-1 group-hover:text-blue-400 sm:block"
        size={20}
      />
    </div>
  </Link>
);

export const Home = () => {
  const simulations = topicManifest.filter((t) => t.kind !== 'guide');
  const guides = topicManifest.filter((t) => t.kind === 'guide');

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans">
      <Header showGlossaryButton={false} />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span className="bg-orange-600 text-white font-bold px-3 py-1 rounded text-sm tracking-wider">
              AWS LEARNING
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AWS学習ビジュアライザー
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed sm:text-lg max-w-2xl mx-auto">
            AWSの通信・ネットワーク周りの概念を、インタラクティブなビジュアルで理解する学習プラットフォーム
          </p>
        </div>

        {/* インタラクティブ・シミュレーション */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <MousePointerClick className="shrink-0 text-blue-400" size={22} />
            <h2 className="text-lg font-bold leading-snug sm:text-2xl">インタラクティブ・シミュレーション</h2>
          </div>
          <p className="text-sm text-slate-500 -mt-3">通信(パケット)の流れをステップごとに動かして理解する</p>
          <div className="grid gap-6">
            {simulations.map((topic) => (
              <TopicCard key={topic.slug} topic={topic} />
            ))}
          </div>
        </div>

        {/* 設計演習 */}
        <div className="space-y-6 mt-14">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <PenTool className="shrink-0 text-blue-400" size={22} />
            <h2 className="text-xl font-bold sm:text-2xl">設計演習</h2>
          </div>
          <p className="text-sm text-slate-500 -mt-3">要件から構成を作り、想定アクションの成功/失敗で理解する</p>
          <div className="grid gap-6">
            {challengeManifest.map((challenge) => (
              <TopicCard key={challenge.slug} topic={challenge} />
            ))}
          </div>
        </div>

        {/* 図解ガイド */}
        <div className="space-y-6 mt-14">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <FileText className="shrink-0 text-amber-400" size={22} />
            <h2 className="text-xl font-bold sm:text-2xl">図解ガイド</h2>
          </div>
          <p className="text-sm text-slate-500 -mt-3">比較表・フロー図・決定木で、概念や設計の考え方を読み解く</p>
          <div className="grid gap-6">
            {guides.map((topic) => (
              <TopicCard key={topic.slug} topic={topic} />
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {[
            {
              title: '視覚的理解',
              description: 'パケットの流れをリアルタイムで視覚化',
              icon: <Eye size={24} aria-hidden="true" />,
            },
            {
              title: 'ステップ学習',
              description: '段階的に理解を深められる構成',
              icon: <ListChecks size={24} aria-hidden="true" />,
            },
            {
              title: '用語集完備',
              description: '専門用語を即座に確認できる',
              icon: <BookOpenCheck size={24} aria-hidden="true" />,
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 text-center"
            >
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-blue-900/60 bg-blue-950/40 text-blue-300">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold mb-2 text-slate-200">{feature.title}</h3>
              <p className="text-sm text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-sm text-slate-500">
        <p>&copy; 2026 AWS Learning Visualizer. Built with React + TypeScript + Tailwind CSS</p>
      </footer>
    </div>
  );
};
