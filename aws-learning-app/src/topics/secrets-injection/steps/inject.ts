import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'ecs-secrets',
    title: 'secrets と environment',
    description: 'Task Definitionの environment は平文。秘密は secrets に valueFrom でARNを指定し、起動時にECSが取得して環境変数として注入します。',
    accentColor: 'text-emerald-400',
  },
  {
    glossaryTermId: 'execution-role',
    title: '取得するのは execution role',
    description: '秘密を取得するのはアプリ(task role)ではなく、起動の裏方である execution role です。対象ARNだけに権限を絞ります。',
    accentColor: 'text-orange-400',
  },
];

export const injectSteps: SimulationStep[] = [
  {
    title: '【起動】ECS Taskが起動を開始',
    location: 'ECS Task (起動シーケンス)',
    diagramState: {
      activeNodeIds: ['ecs'],
      activeConnectionIds: [],
      packetAtNodeId: 'ecs',
      dimmedNodeIds: ['secrets', 'ssm-param'],
    },
    headers: { srcIp: 'ECS Task', srcPort: '-', dstIp: '-', dstPort: '-' },
    labels: {
      srcIp: '(新しいTask)',
      srcPort: '-',
      dstIp: '(これから秘密を取りに行く)',
      dstPort: '-',
    },
    changes: [],
    desc: `<p>新しいECS Taskが起動します。Task Definitionの <code>secrets</code> には、Secrets ManagerやSSMの<strong>ARN</strong>だけが書かれています(値そのものは書きません)。</p>
           <p class='mt-2'>アプリ本体が立ち上がる前に、ECSが <code>execution role</code> の権限で秘密を取得します。</p>`,
    keyPoints,
  },
  {
    title: '【経路】VPC Endpoint 経由でAWSサービスへ',
    location: 'Private Subnet → PrivateLink',
    diagramState: {
      activeNodeIds: ['ecs', 'vpce'],
      activeConnectionIds: ['ecs-to-vpce'],
      packetAtNodeId: 'ecs',
      dimmedNodeIds: [],
    },
    headers: { srcIp: 'ECS Task', srcPort: '*', dstIp: 'VPC Endpoint', dstPort: '443' },
    labels: {
      srcIp: '(Private IP)',
      srcPort: '(任意)',
      dstIp: '(Interface Endpoint の ENI)',
      dstPort: '(HTTPS)',
    },
    changes: ['dstIp'],
    desc: `<p>Private SubnetのTaskは直接インターネットへ出られません。<strong><span onclick="openGlossary('secrets-route')" class="glossary-link font-bold">VPC Endpoint(またはNAT)</span></strong>を経由してAWSサービスへ到達します。</p>
           <p class='mt-2 text-slate-400'>secretsmanager / ssm のInterface Endpointを置くと、NATを通らずPrivateに取得できます。</p>`,
    keyPoints,
  },
  {
    title: '【取得】Secrets Manager / SSM から値を取得',
    location: 'Secrets Manager / Parameter Store',
    diagramState: {
      activeNodeIds: ['vpce', 'secrets', 'ssm-param'],
      activeConnectionIds: ['vpce-to-secrets', 'vpce-to-ssm'],
      packetAtNodeId: 'secrets',
      dimmedNodeIds: [],
    },
    headers: { srcIp: 'execution role', srcPort: '*', dstIp: 'Secrets/SSM', dstPort: '443' },
    labels: {
      srcIp: '(GetSecretValue / GetParameters)',
      srcPort: '(任意)',
      dstIp: '(対象ARNのみ許可)',
      dstPort: '(HTTPS)',
    },
    changes: ['srcIp'],
    desc: `<p>execution roleの権限で <code>secretsmanager:GetSecretValue</code> や <code>ssm:GetParameters</code> を実行し、値を取得します。</p>
           <p class='mt-2'>DBパスワードのような本物の秘密は<strong><span onclick="openGlossary('secrets-manager')" class="glossary-link font-bold">Secrets Manager</span></strong>、設定値や軽い秘密は<strong><span onclick="openGlossary('ssm-parameter')" class="glossary-link font-bold">Parameter Store</span></strong>、と使い分けられます。</p>`,
    keyPoints,
  },
  {
    title: '【注入】環境変数としてコンテナへ',
    location: 'ECS Task (コンテナ内)',
    diagramState: {
      activeNodeIds: ['ecs'],
      activeConnectionIds: [],
      packetAtNodeId: 'ecs',
      dimmedNodeIds: ['secrets', 'ssm-param'],
    },
    headers: { srcIp: 'ECS', srcPort: '-', dstIp: 'コンテナ env', dstPort: '-' },
    labels: {
      srcIp: '(取得した値)',
      srcPort: '-',
      dstIp: '(DATABASE_PASSWORD など)',
      dstPort: '-',
    },
    changes: [],
    desc: `<p>取得した値は<strong>環境変数</strong>としてコンテナに注入され、アプリは普通の環境変数として読みます。</p>
           <p class='mt-2 text-emerald-400 font-bold'>Task Definitionや設定にはARNしか残らず、平文の秘密は残りません。</p>
           <p class='mt-1 text-slate-400'>RDSの manage_master_user_password を使えば、生成されたシークレットのARNを secrets から参照でき、一度も平文を扱わずに済みます。</p>`,
    keyPoints,
  },
];
