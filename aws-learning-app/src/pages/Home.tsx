import { Link } from 'react-router-dom';
import { ArrowRight, MousePointerClick, FileText } from 'lucide-react';
import { Header } from '../components/common/Header';
import { topicManifest } from '../topics';
import type { TopicManifest } from '../types/topic';
import { resolveIcon } from '../utils/iconResolver';

const TopicCard = ({ topic }: { topic: TopicManifest }) => (
  <Link
    to={topic.path}
    className="group relative bg-slate-900 border-2 border-slate-800 hover:border-blue-600 rounded-xl p-6 transition-all hover:shadow-2xl hover:shadow-blue-900/20"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-3 bg-${topic.color}-950 rounded-lg border border-${topic.color}-800`}>
            <span className={`text-${topic.color}-400`}>{resolveIcon(topic.icon, { size: 24 })}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                {topic.title}
              </h3>
              <span
                className={`text-xs px-2 py-0.5 bg-${topic.color}-950 text-${topic.color}-400 border border-${topic.color}-800 rounded-full font-bold`}
              >
                {topic.badge}
              </span>
            </div>
            <p className="text-sm text-slate-400">{topic.description}</p>
          </div>
        </div>
      </div>
      <ArrowRight
        className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all"
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

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 lg:p-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span className="bg-orange-600 text-white font-bold px-3 py-1 rounded text-sm tracking-wider">
              AWS LEARNING
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AWS学習ビジュアライザー
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            AWSの通信・ネットワーク周りの概念を、インタラクティブなビジュアルで理解する学習プラットフォーム
          </p>
        </div>

        {/* インタラクティブ・シミュレーション */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <MousePointerClick className="text-blue-400" size={24} />
            <h2 className="text-2xl font-bold">インタラクティブ・シミュレーション</h2>
          </div>
          <p className="text-sm text-slate-500 -mt-3">通信(パケット)の流れをステップごとに動かして理解する</p>
          <div className="grid gap-6">
            {simulations.map((topic) => (
              <TopicCard key={topic.slug} topic={topic} />
            ))}
          </div>
        </div>

        {/* 図解ガイド */}
        <div className="space-y-6 mt-14">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="text-amber-400" size={24} />
            <h2 className="text-2xl font-bold">図解ガイド</h2>
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
              icon: '👁️',
            },
            {
              title: 'ステップ学習',
              description: '段階的に理解を深められる構成',
              icon: '📊',
            },
            {
              title: '用語集完備',
              description: '専門用語を即座に確認できる',
              icon: '📚',
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 text-center"
            >
              <div className="text-4xl mb-3">{feature.icon}</div>
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
