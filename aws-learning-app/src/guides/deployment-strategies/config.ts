import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'deployment-strategies',
  title: 'デプロイ戦略と CI/CD',
  description: 'ローリング / Blue-Green / カナリア の違いと、ECSでの安全なリリース・ロールバック・パイプライン設計',
  headerLabel: 'AWS DEPLOYMENT',
  homeIcon: 'Rocket',
  homeColor: 'blue',
  intro:
    '「新しいバージョンをどう本番へ出すか」は可用性に直結します。止めずに切り替え、異常なら<strong>素早く戻せる</strong>こと。ここではデプロイ方式の違いと、ECSでの具体的なやり方、安全なパイプラインを整理します。',
  sections: [
    {
      id: 'strategies',
      title: '3つのデプロイ方式',
      icon: 'GitBranch',
      blocks: [
        {
          type: 'compare',
          columns: [
            {
              title: 'ローリング',
              subtitle: '少しずつ入れ替え',
              accent: 'blue',
              points: ['既存Taskを数台ずつ新版へ置換', '追加コスト小', '新旧が一時混在／戻しは再デプロイ'],
            },
            {
              title: 'Blue/Green',
              subtitle: '丸ごと用意して切替',
              accent: 'emerald',
              points: ['新環境(green)を別に立ててから切替', '<strong>即時ロールバック</strong>(向き先を戻すだけ)', '一時的に2倍のリソース'],
            },
            {
              title: 'カナリア',
              subtitle: '一部だけ先行',
              accent: 'amber',
              points: ['例: 10%だけ新版へ流す', 'メトリクスを見て段階的に拡大', '異常の影響を最小化'],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: '選び方の軸',
          html: '<strong>戻しやすさ</strong>を最重視するならBlue/Green。<strong>リスクを段階的に確かめたい</strong>ならカナリア。<strong>コストと手軽さ</strong>ならローリング。トラフィックや重要度で選びます。',
        },
      ],
    },
    {
      id: 'ecs-deploy',
      title: 'ECSでの実際のリリース',
      icon: 'Boxes',
      blocks: [
        {
          type: 'steps',
          steps: [
            { title: '新しいイメージをECRへpush', html: 'タグ(コミットSHA等)で不変に管理。CI/CDから登録。', accent: 'blue' },
            { title: '新リビジョンのTask Definitionを登録', html: 'イメージタグや環境/secretsを差し替えた新版を作る。', accent: 'amber' },
            { title: 'Serviceを更新しTaskをローリングでLB配下に入れ替え', html: 'ALBのターゲットグループでヘルスチェックが通った新Taskから受け始める。', accent: 'emerald' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'デプロイサーキットブレーカー',
          html: 'ECSの<strong>deployment circuit breaker</strong>を有効にすると、新Taskが安定起動しない/ヘルスチェックを通らないデプロイを検知して<strong>自動で前リビジョンへロールバック</strong>します。「壊れたまま全置換」を防ぐ安全装置です。',
        },
        {
          type: 'paragraph',
          html:
            'より厳密な切替が要るなら<strong>CodeDeploy のBlue/Green(ECS)</strong>を使い、新タスクセットへ一括 or カナリアでトラフィックを移し、CloudWatchアラームで異常を見て自動ロールバックできます。',
        },
      ],
    },
    {
      id: 'pipeline',
      title: 'パイプライン（Source → Build → Test → Deploy）',
      icon: 'Workflow',
      blocks: [
        {
          type: 'flow',
          steps: [
            { label: 'Source', sublabel: 'Git push', accent: 'slate' },
            { label: 'Build', sublabel: 'image作成/push', accent: 'blue' },
            { label: 'Test', sublabel: 'lint/test/scan', accent: 'amber' },
            { label: 'Deploy', sublabel: 'ECS更新', accent: 'emerald' },
          ],
        },
        {
          type: 'list',
          items: [
            'AWSネイティブなら <strong>CodePipeline + CodeBuild + CodeDeploy</strong>。GitHub中心なら <strong>GitHub Actions</strong>',
            'デプロイ権限は<strong>OIDCフェデレーションでAssumeRole</strong>し、長期アクセスキーを置かない（<span class="font-bold">IAMと権限設計</span>ガイド参照）',
            '本番前に<strong>承認(manual approval)</strong>やステージング環境を挟む',
            'イメージは<strong>脆弱性スキャン</strong>(ECR/Inspector)を通してからデプロイ',
          ],
        },
      ],
    },
    {
      id: 'rollback',
      title: 'ロールバックとDBマイグレーションの順序',
      icon: 'Undo2',
      blocks: [
        {
          type: 'callout',
          variant: 'warn',
          title: 'コードは戻せてもDBは戻せない',
          html: 'アプリは前リビジョンへ即戻せますが、<strong>スキーマ変更は簡単に戻せません</strong>。だから「旧コードでも新スキーマで動く」ように<strong>後方互換なマイグレーション</strong>を先に当て、コードを切り替え、不要列の削除は安定後に行う（expand → migrate → contract）。',
        },
        {
          type: 'list',
          items: [
            'ヘルスチェック・5xxアラーム・レイテンシをデプロイ直後に監視し、閾値超過で自動ロールバック',
            'カラム追加は許容、<strong>破壊的変更(リネーム/削除)は段階を分ける</strong>',
            '機能の出し分けは<strong>フィーチャーフラグ</strong>でデプロイとリリースを分離する手もある',
          ],
        },
      ],
    },
  ],
  checkpoints: [
    'ローリング / Blue-Green / カナリア の違いと選定軸を説明できるか',
    'ECSのデプロイサーキットブレーカーが何を防ぐか説明できるか',
    'CodeDeploy Blue/Green(ECS)で自動ロールバックをどう実現するか説明できるか',
    'デプロイ権限にOIDCを使う理由を説明できるか',
    '後方互換なDBマイグレーション(expand/contract)の順序を説明できるか',
  ],
  references: [
    { label: 'Amazon ECS deployment types', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-types.html' },
    { label: 'ECS rolling update & circuit breaker', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-type-ecs.html' },
    { label: 'CodeDeploy blue/green on ECS', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-type-bluegreen.html' },
    { label: 'AWS CodePipeline', url: 'https://docs.aws.amazon.com/codepipeline/latest/userguide/welcome.html' },
  ],
};

export default config;
