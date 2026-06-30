import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'secrets-route',
    title: '経路が無いと起動失敗',
    description: 'Private SubnetでNATもVPC Endpointも無いと、Secrets/SSMへ到達できずTaskが起動に失敗します(ResourceInitializationError)。',
    accentColor: 'text-rose-400',
  },
  {
    glossaryTermId: 'execution-role',
    title: '権限不足でも起動失敗',
    description: 'execution roleに対象ARNの取得権限が無いと、AccessDeniedで秘密を取得できず起動に失敗します。',
    accentColor: 'text-orange-400',
  },
];

export const failureSteps: SimulationStep[] = [
  {
    title: '【失敗例1】経路が無い',
    location: 'Private Subnet (NAT/Endpoint なし)',
    diagramState: {
      activeNodeIds: ['ecs'],
      activeConnectionIds: [],
      packetAtNodeId: 'ecs',
      dimmedNodeIds: ['vpce', 'secrets', 'ssm-param'],
    },
    headers: { srcIp: 'ECS Task', srcPort: '*', dstIp: 'Secrets Manager', dstPort: '443' },
    labels: {
      srcIp: '(Private IP)',
      srcPort: '(任意)',
      dstIp: '(到達できない)',
      dstPort: '(HTTPS)',
    },
    changes: [],
    desc: `<p>NATもVPC Endpointも無いPrivate Subnetでは、TaskはSecrets Managerへ到達できません。</p>
           <p class='mt-2 text-rose-400 font-bold'>→ <code>ResourceInitializationError</code> で起動失敗。<span onclick="openGlossary('secrets-route')" class="glossary-link font-bold">経路の確保</span >が必要です。</p>`,
    keyPoints,
  },
  {
    title: '【失敗例2】execution roleの権限不足',
    location: 'IAM (execution role)',
    diagramState: {
      activeNodeIds: ['ecs', 'vpce', 'secrets'],
      activeConnectionIds: ['ecs-to-vpce', 'vpce-to-secrets'],
      packetAtNodeId: 'secrets',
      dimmedNodeIds: ['ssm-param'],
    },
    headers: { srcIp: 'execution role', srcPort: '*', dstIp: 'Secrets Manager', dstPort: '443' },
    labels: {
      srcIp: '(GetSecretValue 権限なし)',
      srcPort: '(任意)',
      dstIp: '(対象ARN)',
      dstPort: '(HTTPS)',
    },
    changes: [],
    desc: `<p>経路はあっても、execution roleに <code>secretsmanager:GetSecretValue</code> が無いと取得できません。</p>
           <p class='mt-2 text-rose-400 font-bold'>→ AccessDeniedで起動失敗。</p>
           <p class='mt-1 text-slate-400'>権限は「対象ARNだけ」に絞るのが最小権限です。広げすぎず、足りなすぎず。</p>`,
    keyPoints,
  },
  {
    title: '【やってはいけない】environment に平文で書く',
    location: 'Task Definition',
    diagramState: {
      activeNodeIds: ['ecs'],
      activeConnectionIds: [],
      packetAtNodeId: 'ecs',
      dimmedNodeIds: ['vpce', 'secrets', 'ssm-param'],
    },
    headers: { srcIp: '-', srcPort: '-', dstIp: '-', dstPort: '-' },
    labels: { srcIp: '-', srcPort: '-', dstIp: '-', dstPort: '-' },
    changes: [],
    desc: `<p>「面倒だから」と <code>environment</code> にDBパスワードを平文で書くと、Task Definitionを見られる全員に漏れます。Gitに入れれば履歴にも残ります。</p>
           <p class='mt-2 text-rose-400 font-bold'>→ environment は平文。秘密は必ず <span onclick="openGlossary('ecs-secrets')" class="glossary-link font-bold">secrets</span > を使います。</p>`,
    keyPoints,
  },
];
