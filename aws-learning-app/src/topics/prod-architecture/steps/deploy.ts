import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'github-oidc',
    title: 'GitHub Actions OIDC',
    description: '長期アクセスキーを保存せず、実行ごとに短命の一時クレデンシャルでAWSロールをassumeします。trust policyでリポジトリ/ブランチを絞るのが重要です。',
    accentColor: 'text-slate-300',
  },
  {
    glossaryTermId: 'ecr',
    title: 'ECRとECSの関係',
    description: 'ビルドしたコンテナ画像はECRに置き、ECS Serviceを新しいTask Definition revisionへ更新すると、TaskがECRから画像をpullして起動します。',
    accentColor: 'text-fuchsia-400',
  },
];

export const deploySteps: SimulationStep[] = [
  {
    title: '【認証】GitHub ActionsがOIDCで一時クレデンシャルを取得',
    location: 'GitHub Actions (CI)',
    diagramState: {
      activeNodeIds: ['github'],
      activeConnectionIds: [],
      packetAtNodeId: 'github',
      dimmedNodeIds: ['user-pc', 's3', 'alb', 'rds'],
    },
    headers: {
      srcIp: '(GitHub runner)',
      srcPort: '-',
      dstIp: '(AWS STS)',
      dstPort: '443',
    },
    labels: {
      srcIp: '(ワークフロー実行環境)',
      srcPort: '-',
      dstIp: '(AssumeRoleWithWebIdentity)',
      dstPort: '(HTTPS)',
    },
    changes: [],
    desc: `<p>mainへのpushでワークフローが起動します。GitHubが発行する署名付きIDトークンを使い、<strong><span onclick="openGlossary('github-oidc')" class="glossary-link font-bold">OIDC</span></strong>でAWSのデプロイロールをassumeします。</p>
           <p class='mt-2'>AWSはtrust policyの条件(どのリポジトリ/ブランチか)を検証し、一致すれば数時間で失効する<strong>一時クレデンシャル</strong>を返します。長期キーはどこにも保存しません。</p>`,
    keyPoints,
  },
  {
    title: '【push】コンテナ画像をECRへ',
    location: 'GitHub Actions → ECR',
    diagramState: {
      activeNodeIds: ['github', 'ecr'],
      activeConnectionIds: ['github-to-ecr'],
      packetAtNodeId: 'github',
      dimmedNodeIds: ['user-pc', 's3', 'alb', 'rds'],
    },
    headers: {
      srcIp: '(GitHub runner)',
      srcPort: '-',
      dstIp: '(ECR registry)',
      dstPort: '443',
    },
    labels: {
      srcIp: '(一時クレデンシャルで認証)',
      srcPort: '-',
      dstIp: '(ECRリポジトリ)',
      dstPort: '(HTTPS)',
    },
    changes: ['dstIp'],
    desc: `<p><code>docker build</code> した画像に、コミットSHAなどのタグを付けて<strong><span onclick="openGlossary('ecr')" class="glossary-link font-bold">ECR</span></strong>へpushします。</p>
           <p class='mt-2'>タグを固定(例: コミットSHA)しておくと、どの画像がどのコミットかが明確になり、ロールバックもしやすくなります。</p>`,
    keyPoints,
  },
  {
    title: '【pull】ECS Serviceを更新しTaskがECRから取得',
    location: 'ECR → ECS (Private Subnet)',
    diagramState: {
      activeNodeIds: ['ecr', 'ecs'],
      activeConnectionIds: ['ecr-to-ecs'],
      packetAtNodeId: 'ecs',
      dimmedNodeIds: ['user-pc', 's3', 'alb', 'rds'],
    },
    headers: {
      srcIp: '10.2.11.21',
      srcPort: '-',
      dstIp: '(ECR / S3 layer)',
      dstPort: '443',
    },
    labels: {
      srcIp: '(新しいECS TaskのPrivate IP)',
      srcPort: '-',
      dstIp: '(ECR API + S3のレイヤ取得)',
      dstPort: '(HTTPS)',
    },
    changes: ['srcIp', 'dstIp'],
    desc: `<p>新しいTask Definition revisionでECS Serviceを更新すると、新しいTaskが起動し、execution roleの権限で<strong>ECRから画像をpull</strong>します。</p>
           <p class='mt-2'>Private SubnetのTaskがpullするには、NAT Gateway、または <code>ecr.api</code>/<code>ecr.dkr</code> のInterface Endpoint + S3 Gateway Endpoint が必要です(画像レイヤの実体はS3にあります)。</p>
           <p class='mt-2 text-emerald-400 font-bold'>新Taskがhealth checkに通ると、旧Taskと入れ替わります(ローリングデプロイ)。</p>`,
    keyPoints,
  },
];
