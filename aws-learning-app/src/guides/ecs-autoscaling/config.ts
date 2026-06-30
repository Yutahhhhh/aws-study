import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'ecs-autoscaling',
  title: 'ECS Fargate と Auto Scaling',
  description: 'Cluster / Task Definition / Task / Service の関係と、何が増減するのかを図解で理解する',
  headerLabel: 'AWS ECS FARGATE',
  homeIcon: 'Gauge',
  homeColor: 'blue',
  intro:
    'ECSで一番つかみにくいのは「何が増えているのか」です。結論から言うと、Fargateで増減する主役は<strong>EC2ではなくECS Task</strong>です。まず構成要素の関係を整理し、その上でAuto Scalingが何をするのかを見ていきます。',
  sections: [
    {
      id: 'building-blocks',
      title: 'ECSの構成要素',
      icon: 'Boxes',
      blocks: [
        {
          type: 'flow',
          title: '設計図から実体、そして数の維持へ',
          steps: [
            { label: 'Task Definition', sublabel: '設計図 (image/CPU/port)', accent: 'purple' },
            { label: 'Task', sublabel: '起動された実体', accent: 'emerald' },
            { label: 'Service', sublabel: 'Task数を維持', accent: 'blue' },
            { label: 'Target Group', sublabel: 'ALBの転送先', accent: 'amber' },
          ],
        },
        {
          type: 'compare',
          columns: [
            {
              title: 'Cluster',
              accent: 'slate',
              points: ['ServiceやTaskをまとめる論理的な箱', 'Fargateでは「EC2の集合」ではなく管理単位として捉える'],
            },
            {
              title: 'Task Definition',
              accent: 'purple',
              points: [
                'コンテナの設計図',
                'image / CPU・メモリ / ポート / <code>environment</code> / <code>secrets</code>',
                'execution role と task role',
                '更新ごとに revision が増える',
              ],
            },
            {
              title: 'Task / Service',
              accent: 'emerald',
              points: [
                'Task = 設計図から起動された実体',
                'Service = desired_count 個のTaskを維持',
                'Taskが落ちれば代わりを起動する',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'alb-relation',
      title: 'ALB との関係（awsvpc）',
      icon: 'Network',
      blocks: [
        {
          type: 'paragraph',
          html:
            'ECS ServiceをALBのTarget Groupに紐づけると、起動したTaskが自動で登録されます。Fargateの<code>awsvpc</code>モードでは<strong>TaskごとにENIとPrivate IP</strong>が割り当てられ、ALBは <code>target_type = "ip"</code> でTaskのIP:3000へ直接転送します。',
        },
        {
          type: 'flow',
          steps: [
            { label: 'ALB', accent: 'amber' },
            { label: 'Target Group', sublabel: '健全なTaskのIP一覧', accent: 'blue' },
            { label: '10.2.11.x:3000', sublabel: 'AZ-a の Task', accent: 'emerald' },
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'health check が振り分けを決める',
          html: 'ALBはhealth check(例: <code>/health</code>)に通ったTaskにだけ振り分けます。新しいTaskはhealth checkに通って初めてトラフィックを受けます。',
        },
      ],
    },
    {
      id: 'autoscaling',
      title: 'Auto Scaling が増減するもの',
      icon: 'Gauge',
      blocks: [
        {
          type: 'paragraph',
          html: 'ECS <strong>Service</strong> Auto Scalingは、Serviceの <code>desired_count</code> を自動で増減します。EC2台数の話ではありません。',
        },
        {
          type: 'table',
          headers: ['パラメータ', '意味'],
          rows: [
            ['<code>min_capacity</code>', 'これ未満には減らさない下限'],
            ['<code>desired_count</code>', '現在の希望Task数(Auto Scalingが書き換える)'],
            ['<code>max_capacity</code>', 'これより上には増やさない上限'],
          ],
        },
        {
          type: 'compare',
          columns: [
            { title: 'CPU使用率', accent: 'blue', points: ['CPUを使う処理が中心なら分かりやすい', '例: 60%付近を維持'] },
            { title: 'メモリ使用率', accent: 'rose', points: ['メモリが先に詰まるアプリ向け', '例: 70%付近を維持'] },
            { title: 'Request Count Per Target', accent: 'amber', points: ['1Taskあたりリクエスト数で増減', 'I/O待ちが多いHTTP APIに合うことがある'] },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Target Tracking のイメージ',
          html: 'エアコンの設定温度のように、目標値(例: CPU 60%)から外れると増減します。現在85%→増やす、35%→減らす。急な増減を抑えるためクールダウンも検討します。',
        },
      ],
    },
    {
      id: 'deployment',
      title: 'デプロイ（ローリング）で何が起きるか',
      icon: 'RefreshCw',
      blocks: [
        {
          type: 'steps',
          steps: [
            { title: '新しいrevisionのTaskを起動', accent: 'emerald' },
            { title: 'ALB health check に通るのを待つ', accent: 'blue' },
            { title: '通ったら古いTaskを停止', accent: 'amber' },
            { title: 'desired_count を保ちながら徐々に入れ替え', accent: 'purple' },
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'health checkに通らないと進まない',
          html: '新Taskがhealth checkに通らないと、デプロイは進まず(または失敗してロールバック)、本番に壊れたTaskが出にくくなります。これが安全弁です。',
        },
      ],
    },
    {
      id: 'two-autoscaling',
      title: '混同しやすい2つのAuto Scaling',
      icon: 'Layers',
      blocks: [
        {
          type: 'compare',
          columns: [
            {
              title: 'ECS Service Auto Scaling',
              subtitle: 'Fargateで普段考えるのはこちら',
              accent: 'emerald',
              points: ['Task数(desired_count)を増減', 'CPU/メモリ/リクエスト数で動く'],
            },
            {
              title: 'ECS Cluster Auto Scaling',
              subtitle: 'EC2起動タイプの話',
              accent: 'slate',
              points: ['ClusterのEC2インスタンス台数を増減', 'Fargateでは自分でEC2を持たないため考えなくてよい'],
            },
          ],
        },
      ],
    },
  ],
  checkpoints: [
    'ECS ServiceとECS Taskの違いを説明できるか',
    'Fargateで増減する単位がTaskである理由を説明できるか',
    'Target Groupに何が登録されるか(awsvpcとの関係)を説明できるか',
    'desired_count / min_capacity / max_capacity の違いを説明できるか',
    'デプロイ中にhealth checkが果たす役割を説明できるか',
  ],
  references: [
    { label: 'Amazon ECS service auto scaling', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-auto-scaling.html' },
    { label: 'Target tracking scaling policies for Amazon ECS', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-autoscaling-targettracking.html' },
    { label: 'Fargate task networking (awsvpc)', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-task-networking.html' },
    { label: 'Amazon ECS deployment types', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-types.html' },
  ],
};

export default config;
