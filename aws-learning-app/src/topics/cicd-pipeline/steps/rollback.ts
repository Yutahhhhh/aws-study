import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'circuit-breaker',
    title: '失敗したデプロイを自動で巻き戻す',
    description: 'Deployment Circuit Breakerを有効にすると、新Taskが安定しないデプロイをECSが失敗と判定し、直前の正常なリビジョンへ自動ロールバックします。',
    accentColor: 'text-rose-400',
  },
  {
    glossaryTermId: 'deploy-health-check',
    title: 'ヘルスチェックが最後の砦',
    description: 'テストをすり抜けたバグでも、ヘルスチェックが落ちれば本番トラフィックは新バージョンに流れません。/healthはDB接続など「本当に稼働できるか」を確認する内容にします。',
    accentColor: 'text-indigo-400',
  },
];

export const rollbackSteps: SimulationStep[] = [
  {
    title: '【1】バグ入りのv2がデプロイされる',
    location: 'GitHub Actions → ECS',
    diagramState: {
      activeNodeIds: ['github', 'ecs', 'task-v2'],
      activeConnectionIds: ['github-to-ecs', 'ecs-to-task2'],
      packetAtNodeId: 'task-v2',
      dimmedNodeIds: ['dev', 'user', 'iam-oidc'],
    },
    headers: { srcIp: 'ECS', srcPort: 'RunTask', dstIp: 'Task v2', dstPort: '起動処理' },
    labels: { srcIp: '(新リビジョン)', srcPort: '(環境変数不足のバグ)', dstIp: '(新バージョン)', dstPort: '(起動直後にエラー)' },
    changes: [],
    desc: `<p>CIのテストは通ったものの、<strong>本番でだけ必要な環境変数が足りない</strong>バージョンがデプロイされたとします。Task v2は起動しますが、アプリの初期化でエラーになります。この間もTask v1は稼働し続けています。</p>`,
    keyPoints,
  },
  {
    title: '【2】ヘルスチェックが失敗する',
    location: 'ALB → Task v2',
    diagramState: {
      activeNodeIds: ['alb', 'task-v2'],
      activeConnectionIds: ['alb-to-task2'],
      packetAtNodeId: 'task-v2',
      dimmedNodeIds: ['dev', 'github', 'iam-oidc', 'ecr', 'user'],
    },
    headers: { srcIp: 'ALB', srcPort: 'GET /health', dstIp: 'Task v2', dstPort: '500 → unhealthy' },
    labels: { srcIp: '(Target Group)', srcPort: '(規定回数失敗)', dstIp: '(初期化エラー)', dstPort: '(振り分け対象にならない)' },
    changes: ['dstPort'],
    desc: `<p>ALBの<span onclick="openGlossary('deploy-health-check')" class="glossary-link font-bold">ヘルスチェック</span>が失敗し、v2はunhealthy判定になります。<strong>unhealthyなTargetには本番トラフィックが一切流れない</strong>ため、利用者はまだ何も影響を受けていません。ECSはv2を破棄して新しいTaskを起動し直しますが、同じ理由でまた失敗します。</p>`,
    keyPoints,
  },
  {
    title: '【3】Circuit Breakerが失敗と判定する',
    location: 'ECS Service',
    diagramState: {
      activeNodeIds: ['ecs'],
      activeConnectionIds: ['ecs-to-task2'],
      packetAtNodeId: 'ecs',
      dimmedNodeIds: ['dev', 'github', 'iam-oidc', 'ecr', 'user', 'alb'],
    },
    headers: { srcIp: 'ECS', srcPort: '起動失敗を集計', dstIp: 'Deployment', dstPort: 'FAILED' },
    labels: { srcIp: '(Circuit Breaker)', srcPort: '(失敗回数がしきい値超過)', dstIp: '(このデプロイ)', dstPort: '(継続を断念)' },
    changes: ['dstPort'],
    desc: `<p><span onclick="openGlossary('circuit-breaker')" class="glossary-link font-bold">Deployment Circuit Breaker</span>が「新Taskが何度起動しても安定しない」ことを検知し、デプロイをFAILEDにします。これが無いとECSは<strong>無限に起動と失敗を繰り返し</strong>、デプロイが「終わらない」状態で放置されます。</p>`,
    keyPoints,
  },
  {
    title: '【4】直前のリビジョンへ自動ロールバック',
    location: 'ECS → Task v1',
    diagramState: {
      activeNodeIds: ['ecs', 'task-v1'],
      activeConnectionIds: ['ecs-to-task1'],
      packetAtNodeId: 'task-v1',
      dimmedNodeIds: ['dev', 'github', 'iam-oidc', 'ecr', 'task-v2'],
    },
    headers: { srcIp: 'ECS', srcPort: 'rollback', dstIp: 'Task v1', dstPort: '前リビジョンで再デプロイ' },
    labels: { srcIp: '(自動)', srcPort: '(人の操作なし)', dstIp: '(実績のあるバージョン)', dstPort: '(ECRにイメージが残っている)' },
    changes: ['srcPort', 'dstIp'],
    desc: `<p>ロールバックオプションを有効にしていれば、ECSは<strong>直前の正常なTask Definitionリビジョン</strong>で自動的に再デプロイします。ここで効いてくるのが<span onclick="openGlossary('image-tag-strategy')" class="glossary-link font-bold">コミットSHAタグ</span>です。旧イメージがECRにそのまま残っているので、いつでも過去のバージョンに戻れます。</p>`,
    keyPoints,
  },
  {
    title: '【5】利用者は無傷。あとは原因修正だけ',
    location: '利用者 → ALB → Task v1',
    diagramState: {
      activeNodeIds: ['user', 'alb', 'task-v1', 'dev'],
      activeConnectionIds: ['user-to-alb', 'alb-to-task1'],
      packetAtNodeId: 'user',
      dimmedNodeIds: ['iam-oidc', 'ecr', 'task-v2'],
    },
    headers: { srcIp: '利用者', srcPort: 'HTTPS', dstIp: 'Task v1', dstPort: '200 OK' },
    labels: { srcIp: '(何も気づかない)', srcPort: '(通常利用)', dstIp: '(稼働継続)', dstPort: '(サービス影響ゼロ)' },
    changes: ['srcIp', 'dstIp', 'dstPort'],
    desc: `<p>失敗デプロイの間もトラフィックはずっとv1が受けており、<strong>利用者影響はゼロ</strong>でした。開発者はCloudWatch Logsでv2の起動エラーを確認し、落ち着いて修正版をpushすれば良いだけです。「デプロイの失敗」を「障害」にしないのが、ヘルスチェック+Circuit Breakerの価値です。</p>`,
    keyPoints,
  },
];
