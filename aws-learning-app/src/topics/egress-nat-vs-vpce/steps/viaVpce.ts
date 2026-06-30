import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'vpce-interface',
    title: 'Interface型 (PrivateLink)',
    description: 'Subnet内にENIを作り、そのIPでAWSサービスへ到達。ECR API/Secrets/Logs/SSMなど多数が対象。SGを付けられる。',
    accentColor: 'text-orange-400',
  },
  {
    glossaryTermId: 'vpce-gateway',
    title: 'Gateway型 (S3/DynamoDB)',
    description: 'ルートテーブルにエントリを足す方式で追加料金なし。S3とDynamoDBだけが対象。',
    accentColor: 'text-purple-400',
  },
];

export const viaVpceSteps: SimulationStep[] = [
  {
    title: '【外向き】ECSがAWSサービスへ',
    location: 'Private Subnet (ECS)',
    diagramState: {
      activeNodeIds: ['ecs', 'vpce'],
      activeConnectionIds: ['ecs-to-vpce'],
      packetAtNodeId: 'ecs',
      dimmedNodeIds: ['nat', 'igw', 'external'],
    },
    headers: { srcIp: '10.2.11.20', srcPort: '*', dstIp: 'VPC Endpoint', dstPort: '443' },
    labels: {
      srcIp: '(ECSのPrivate IP)',
      srcPort: '(任意)',
      dstIp: '(Endpointの ENI / ルート)',
      dstPort: '(HTTPS)',
    },
    changes: [],
    desc: `<p>今度の宛先はECR・Secrets Manager・S3などの<strong>AWSサービス</strong>です。インターネットを経由せず、VPC Endpointで到達できます。</p>
           <p class='mt-2'>NATを通らないので、データ転送がVPC内で完結し、よりPrivateです。</p>`,
    keyPoints,
  },
  {
    title: '【PrivateLink】Interface/Gateway経由でAWSサービスへ',
    location: 'VPC Endpoint',
    diagramState: {
      activeNodeIds: ['vpce', 'aws-svc'],
      activeConnectionIds: ['vpce-to-aws'],
      packetAtNodeId: 'vpce',
      dimmedNodeIds: ['nat', 'igw', 'external'],
    },
    headers: { srcIp: 'ECS', srcPort: '*', dstIp: 'AWSサービス', dstPort: '443' },
    labels: {
      srcIp: '(Private IP のまま)',
      srcPort: '(任意)',
      dstIp: '(S3/ECR/Secrets)',
      dstPort: '(HTTPS)',
    },
    changes: ['dstIp'],
    desc: `<p><strong><span onclick="openGlossary('vpce-interface')" class="glossary-link font-bold">Interface型</span></strong>(ECR/Secrets/Logs/SSM)はENI経由、<strong><span onclick="openGlossary('vpce-gateway')" class="glossary-link font-bold">Gateway型</span></strong>(S3/DynamoDB)はルートテーブル経由で到達します。</p>
           <p class='mt-2 text-slate-400'>S3はGateway型が無料。ECR pullには ecr.api + ecr.dkr のInterface に加え、レイヤ取得用のS3 Gateway Endpoint も必要です。</p>`,
    keyPoints,
  },
  {
    title: '【使い分け】どちらを使うか',
    location: 'まとめ',
    diagramState: {
      activeNodeIds: ['ecs', 'vpce', 'nat'],
      activeConnectionIds: ['ecs-to-vpce', 'ecs-to-nat'],
      packetAtNodeId: 'ecs',
      dimmedNodeIds: [],
    },
    headers: { srcIp: 'ECS', srcPort: '*', dstIp: '宛先で経路が変わる', dstPort: '443' },
    labels: {
      srcIp: '(宛先がAWSサービスか外部か)',
      srcPort: '-',
      dstIp: 'AWSサービス→VPCe / 外部→NAT',
      dstPort: '(HTTPS)',
    },
    changes: [],
    desc: `<ul class='list-disc pl-4 space-y-1 text-[11px]'>
             <li><strong>外部インターネット(SaaS等)</strong> → NAT Gateway(VPC Endpointでは届かない)</li>
             <li><strong>S3</strong> → Gateway Endpoint(無料)</li>
             <li><strong>ECR / Secrets / Logs / SSM</strong> → Interface Endpoint</li>
           </ul>
           <p class='mt-2 text-emerald-400 font-bold'>AWSサービス向けはVPC Endpointに寄せ、外部インターネット通信だけNATに任せると、コストと露出を抑えられます。</p>`,
    keyPoints,
  },
];
