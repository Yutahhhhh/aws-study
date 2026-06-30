import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'ecs-operations',
  title: 'ECS 運用の実務',
  description: 'Fargate vs EC2・タスクサイジング・ヘルスチェック・イメージ供給(ECR/スキャン)・ECS vs EKS の判断',
  headerLabel: 'AWS ECS OPS',
  homeIcon: 'Container',
  homeColor: 'blue',
  intro:
    '設計演習では「ECS FargateをPrivate Subnetに置く」までを扱いました。本番運用ではその先――<strong>起動タイプの選択・タスクの大きさ・健全性の判定・イメージの供給と安全性</strong>――が効いてきます。',
  sections: [
    {
      id: 'launch-type',
      title: '起動タイプ：Fargate と EC2',
      icon: 'Server',
      blocks: [
        {
          type: 'compare',
          columns: [
            {
              title: 'Fargate',
              subtitle: 'サーバーレス',
              accent: 'emerald',
              points: ['EC2を管理しない(パッチ/容量不要)', 'Taskごとに必要分だけ起動', '価格は割高・特殊要件に制約'],
            },
            {
              title: 'EC2 起動タイプ',
              subtitle: '自前のインスタンス群',
              accent: 'amber',
              points: ['ホストを自分で運用', 'GPU/特殊インスタンス・高密度詰め込み', '大規模で単価を下げやすい'],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          html: 'まずは<strong>Fargate</strong>で運用負荷を下げ、コストや特殊要件(GPU/常時高稼働)が顕在化したらEC2を検討、が定石です。',
        },
      ],
    },
    {
      id: 'sizing',
      title: 'タスクサイジングとコンテナ構成',
      icon: 'Gauge',
      blocks: [
        {
          type: 'list',
          items: [
            'Task Definitionで<strong>CPU/メモリ</strong>を決める。Fargateは取りうる組合せが決まっている',
            '1 Task = 1つの役割。<strong>サイドカー</strong>(ログ転送・プロキシ・X-Ray collector)は同じTaskに同居させてよい',
            '小さいTaskを多数 vs 大きいTaskを少数：<strong>スケールの粒度・起動の速さ・コスト効率</strong>のトレードオフ',
            'メモリ不足はOOMでTask強制終了になるため、実測に基づき余裕を持たせる',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'スケールは「測れる指標」に紐づける',
          html: 'Auto Scalingの目標追従は<strong>CPU使用率・メモリ・ALBのリクエスト数(per target)</strong>などに対して設定します。仕組みは<span class="font-bold">ECS Auto Scaling の動き</span>シミュレーションと<span class="font-bold">ECS Fargate と Auto Scaling</span>ガイド参照。',
        },
      ],
    },
    {
      id: 'health',
      title: 'ヘルスチェックと安全な入れ替え',
      icon: 'Activity',
      blocks: [
        {
          type: 'steps',
          steps: [
            { title: 'ALBターゲットグループのヘルスチェック', html: '<code>/health</code>等が通った新Taskだけがトラフィックを受ける。', accent: 'blue' },
            { title: 'コンテナ自体のヘルスチェック', html: 'Task内のプロセス健全性を判定し、異常Taskを置換。', accent: 'amber' },
            { title: 'デプロイサーキットブレーカー', html: '安定しないデプロイを検知し自動ロールバック(<span class="font-bold">デプロイ戦略とCI/CD</span>参照)。', accent: 'emerald' },
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: '起動直後に流さない',
          html: 'ヘルスチェックの猶予(<strong>health check grace period</strong>)が短いと、起動途中のTaskを不健全と誤判定して再起動ループになります。アプリの起動時間に合わせて設定します。',
        },
      ],
    },
    {
      id: 'images',
      title: 'イメージの供給と安全性（ECR）',
      icon: 'Boxes',
      blocks: [
        {
          type: 'list',
          items: [
            'イメージは<strong>ECR</strong>に置き、タグはコミットSHA等で<strong>不変</strong>に(<code>latest</code>運用は避ける)',
            '<strong>脆弱性スキャン</strong>(ECR/Amazon Inspector)を通し、既知CVEのあるイメージを止める',
            '<strong>ライフサイクルポリシー</strong>で古いイメージを自動削除し、保管コストを抑える',
            'Private SubnetのTaskは<strong>ECR用のInterface Endpoint</strong>でPull(<span class="font-bold">VPC間とハイブリッド接続</span>参照)',
          ],
        },
      ],
    },
    {
      id: 'ecs-vs-eks',
      title: 'ECS と EKS、どちらを選ぶか',
      icon: 'Layers',
      blocks: [
        {
          type: 'compare',
          columns: [
            {
              title: 'ECS',
              subtitle: 'AWSネイティブ',
              accent: 'blue',
              points: ['学習・運用がシンプル', 'AWS各サービスと統合しやすい', '多くのWebアプリはこれで十分'],
            },
            {
              title: 'EKS (Kubernetes)',
              subtitle: '標準・移植性',
              accent: 'amber',
              points: ['K8sエコシステム/移植性', 'マルチクラウド・既存K8s資産', '運用の複雑さとコストは増す'],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          html: '<strong>「Kubernetesが要る明確な理由」が無ければECS</strong>で始めるのが無難です。移植性・K8s人材・エコシステムの要求が強いときにEKSを選びます。',
        },
      ],
    },
  ],
  checkpoints: [
    'Fargate と EC2 起動タイプの使い分けを説明できるか',
    'サイドカーを同一Taskに同居させる例を挙げられるか',
    '小さいTask多数 vs 大きいTask少数 のトレードオフを説明できるか',
    'ALBヘルスチェックとgrace periodの役割を説明できるか',
    'ECRでの不変タグ・スキャン・ライフサイクルの意義を説明できるか',
    'ECS と EKS の選定基準を説明できるか',
  ],
  references: [
    { label: 'Amazon ECS launch types (Fargate/EC2)', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/launch_types.html' },
    { label: 'Task definition parameters (CPU/memory)', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html' },
    { label: 'Amazon ECR image scanning', url: 'https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-scanning.html' },
    { label: 'Choosing ECS or EKS', url: 'https://docs.aws.amazon.com/whitepapers/latest/aws-overview/containers.html' },
  ],
};

export default config;
