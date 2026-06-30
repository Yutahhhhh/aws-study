import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'nat',
    title: 'NATとは',
    description: 'プライベートIPとパブリックIPの境界をまたぐ通信で、返信可能なIPアドレスに変換する仕組みのこと。',
    accentColor: 'text-orange-400',
  },
  {
    glossaryTermId: 'routing',
    title: 'ルーティングとは',
    description: '宛先IPアドレスを見て、次にどのネットワーク機器へ転送するかを決める経路制御のこと。',
    accentColor: 'text-blue-400',
  },
];

export const outboundPublicEcsSteps: SimulationStep[] = [
  {
    title: '【送信】NAT Gatewayを使わず、ECSをパブリック配置',
    location: 'Public Subnet (ECSにパブリックIPを付与)',
    diagramState: {
      activeNodeIds: ['ecs', 'igw'],
      activeConnectionIds: ['alb-to-ecs', 'igw-to-alb'],
      packetAtNodeId: 'ecs',
      dimmedNodeIds: ['nat-gw'],
    },
    headers: {
      srcIp: '10.0.1.20',
      srcPort: '51234',
      dstIp: '3.120.0.1',
      dstPort: '443',
    },
    labels: {
      srcIp: '10.0.1.20 (パブリックサブネット内のECSプライベートIP)',
      srcPort: '(Railsが一時的に使った送信ポート)',
      dstIp: '(Slack APIのグローバルIP)',
      dstPort: '(HTTPS)',
    },
    changes: [],
    desc: `<p>NAT Gatewayを置かずに外部APIへ通信する構成です。ECSタスクをPublic Subnetに配置し、タスクのENIに<strong>パブリックIP (203.0.113.88 の例)</strong>を割り当てます。</p>
           <p class='mt-2'>タスク内部の通信元は引き続きプライベートIP (10.0.1.20) ですが、インターネットへ出るときはIGWによってパブリックIPに対応付けられます。</p>`,
    keyPoints,
  },
  {
    title: '【1対1 NAT】IGWで送信元がパブリックIPとして見える',
    location: 'VPC境界 (インターネットゲートウェイ)',
    diagramState: {
      activeNodeIds: ['igw', 'slack'],
      activeConnectionIds: ['igw-to-slack'],
      packetAtNodeId: 'igw',
      dimmedNodeIds: ['nat-gw'],
    },
    headers: {
      srcIp: '203.0.113.88',
      srcPort: '51234',
      dstIp: '3.120.0.1',
      dstPort: '443',
    },
    labels: {
      srcIp: '-> 203.0.113.88 (ECSタスクに割り当てたパブリックIP)',
      srcPort: '(変わらず)',
      dstIp: '(SlackのグローバルIP)',
      dstPort: '(HTTPS)',
    },
    changes: ['srcIp'],
    desc: `<p>パケットはPublic Subnetから<strong><span onclick="openGlossary('igw')" class="glossary-link font-bold">IGW</span></strong>へ到達します。</p>
           <p class='mt-2'>インターネットへ出る際、IGWはタスクのプライベートIP (10.0.1.20) と割り当て済みのパブリックIP (203.0.113.88) を対応付け、外部からはパブリックIPが送信元に見えるようにします。</p>
           <p class='mt-2 text-amber-400'>この構成ではNAT Gatewayの時間課金・処理料金は不要です。ただし、パブリックIPv4アドレスの利用料など、別のAWS料金は発生する場合があります。</p>`,
    keyPoints,
  },
  {
    title: '【完了】Slackに到達し、入口はSGで絞る',
    location: 'インターネット世界 (Slack)',
    diagramState: {
      activeNodeIds: ['slack'],
      activeConnectionIds: [],
      packetAtNodeId: 'slack',
      dimmedNodeIds: ['nat-gw'],
    },
    headers: {
      srcIp: '203.0.113.88',
      srcPort: '51234',
      dstIp: '3.120.0.1',
      dstPort: '443',
    },
    labels: {
      srcIp: '(ECS自身の持つパブリックIP)',
      srcPort: '(Rails送信元ポート)',
      dstIp: '(SlackのグローバルIP)',
      dstPort: '(HTTPS)',
    },
    changes: [],
    desc: `<p>パケットが無事にSlackへ到達しました。</p>
           <p class='mt-2 text-emerald-400 font-bold'>セキュリティの注意点</p>
           <p class='text-[11px]'>この構成はNAT Gatewayを省けますが、ECSタスクがパブリックIPを持つため、入口の制御を誤ると直接アクセスのリスクが生まれます。</p>
           <p class='text-[11px] text-amber-300'>ECS用のSG(<span onclick="openGlossary('security-group')" class="glossary-link">セキュリティグループ</span>)では、<strong>ALBのSGから3000番ポートへの通信だけを許可し、インターネット全体からの直接アクセスは許可しない</strong>設計にします。</p>`,
    keyPoints,
  },
];
