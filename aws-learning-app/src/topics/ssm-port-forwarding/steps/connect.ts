import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'port-forwarding',
    title: 'ポートフォワーディング',
    description: '手元のlocalhost:15432への通信を、SSMのトンネル経由で管理用EC2まで運び、そこからRDS:5432へ転送します。',
    accentColor: 'text-orange-400',
  },
  {
    glossaryTermId: 'managed-node',
    title: '中継役のManaged Node',
    description: 'RDSにはSSM Agentを入れられないため、RDSへ到達できるPrivate Subnet内のEC2を中継役(Managed Node)にします。',
    accentColor: 'text-emerald-400',
  },
];

export const connectSteps: SimulationStep[] = [
  {
    title: '【開始】管理者PCで start-session を実行',
    location: '管理者PC',
    diagramState: {
      activeNodeIds: ['admin-pc', 'ssm'],
      activeConnectionIds: ['admin-to-ssm'],
      packetAtNodeId: 'admin-pc',
      dimmedNodeIds: ['rds'],
    },
    headers: { srcIp: '管理者PC', srcPort: '*', dstIp: 'Systems Manager', dstPort: '443' },
    labels: {
      srcIp: '(手元のPC)',
      srcPort: '(任意)',
      dstIp: '(SSMのAPIエンドポイント)',
      dstPort: '(HTTPS)',
    },
    changes: [],
    desc: `<p>管理者が <code>aws ssm start-session --document-name AWS-StartPortForwardingSessionToRemoteHost ...</code> を実行します。</p>
           <p class='mt-2'><strong><span onclick="openGlossary('ssm-session-manager')" class="glossary-link font-bold">SSM Session Manager</span></strong> はIAMで認可され、誰がどのEC2へ接続したかをCloudTrail/SSMで追えます。手元では <code>localhost:15432</code> が待ち受けになります。</p>`,
    keyPoints,
  },
  {
    title: '【トンネル確立】SSM ↔ 管理用EC2',
    location: 'SSM → 管理用EC2',
    diagramState: {
      activeNodeIds: ['ssm', 'bastion'],
      activeConnectionIds: ['ssm-to-bastion'],
      packetAtNodeId: 'ssm',
      dimmedNodeIds: [],
    },
    headers: { srcIp: '管理用EC2', srcPort: '*', dstIp: 'Systems Manager', dstPort: '443' },
    labels: {
      srcIp: '(EC2 → SSMへ outbound)',
      srcPort: '(任意)',
      dstIp: '(SSM / ssmmessages)',
      dstPort: '(HTTPS)',
    },
    changes: ['srcIp'],
    desc: `<p>管理用EC2はSSM Agentが動く<strong><span onclick="openGlossary('managed-node')" class="glossary-link font-bold">Managed Node</span></strong>です。接続は<strong>EC2側からSSMへ outbound</strong>で確立されます。</p>
           <p class='mt-2 text-emerald-400 font-bold'>→ だから管理用EC2に inbound 22(SSH) を開ける必要がありません。</p>
           <p class='mt-1 text-slate-400'>EC2がSSMへ到達するには、NAT または ssm/ssmmessages/ec2messages のVPCエンドポイントが要ります。</p>`,
    keyPoints,
  },
  {
    title: '【転送】管理用EC2 → RDS:5432',
    location: 'Private Subnet (EC2 → RDS)',
    diagramState: {
      activeNodeIds: ['bastion', 'rds'],
      activeConnectionIds: ['bastion-to-rds'],
      packetAtNodeId: 'bastion',
      dimmedNodeIds: ['ssm'],
    },
    headers: { srcIp: '管理用EC2', srcPort: '*', dstIp: 'RDS', dstPort: '5432' },
    labels: {
      srcIp: '(管理用EC2のSG)',
      srcPort: '(任意)',
      dstIp: '(RDSエンドポイント)',
      dstPort: '(PostgreSQL)',
    },
    changes: ['srcIp', 'dstIp', 'dstPort'],
    desc: `<p>トンネルを抜けた通信は、管理用EC2から<strong>RDS:5432</strong>へ転送されます。RDSのSGは「管理用EC2 SGからの5432」を許可しています。</p>
           <p class='mt-2'><code>AWS-StartPortForwardingSessionToRemoteHost</code> は、中継EC2の先にある<strong>別ホスト(RDS)</strong>へ転送できるドキュメントです。だからEC2自身ではなくRDSに届きます。</p>`,
    keyPoints,
  },
  {
    title: '【完了】DBクライアントは localhost:15432 に繋ぐ',
    location: '管理者PC ↔ RDS',
    diagramState: {
      activeNodeIds: ['admin-pc', 'ssm', 'bastion', 'rds'],
      activeConnectionIds: ['admin-to-ssm', 'ssm-to-bastion', 'bastion-to-rds'],
      packetAtNodeId: 'admin-pc',
      dimmedNodeIds: [],
    },
    headers: { srcIp: 'localhost', srcPort: '15432', dstIp: '(→ RDS)', dstPort: '5432' },
    labels: {
      srcIp: '(手元のDBクライアント)',
      srcPort: '(ローカル待ち受けポート)',
      dstIp: '(トンネル経由でRDSへ)',
      dstPort: '(PostgreSQL)',
    },
    changes: [],
    desc: `<p>DBクライアントからは <code>host: localhost / port: 15432</code> に接続するだけです。その通信がSSMトンネルを通ってRDSへ届きます。</p>
           <p class='mt-2 text-emerald-400 font-bold'>RDSをpublicにせず、SSH鍵も使わず、IAMで認可した安全な経路でDBへ接続できました。</p>`,
    keyPoints,
  },
];
