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

export const inboundSteps: SimulationStep[] = [
  {
    title: '【送信】ユーザーPCからリクエスト発信',
    location: 'インターネット世界 (送信中)',
    diagramState: {
      activeNodeIds: ['user-pc', 'igw'],
      activeConnectionIds: ['user-to-igw'],
      packetAtNodeId: 'user-pc',
      dimmedNodeIds: ['slack'],
    },
    headers: {
      srcIp: '198.51.100.50',
      srcPort: '52345',
      dstIp: '203.0.113.10',
      dstPort: '443',
    },
    labels: {
      srcIp: '(ユーザーPC自身のIP)',
      srcPort: '(ブラウザが自動割り当てしたランダムポート)',
      dstIp: '(ALBの公開エンドポイントが解決されるIP例)',
      dstPort: '(HTTPS規格ポート)',
    },
    changes: [],
    desc: `<p>一般ユーザーがブラウザに <code>https://your-domain.com</code> と打ち込み、パケットを送信した直後の状態です。</p>
           <p class='mt-2'>DNSで名前解決された<strong>ALBの公開エンドポイント (203.0.113.10:443 の例)</strong> を宛先として、パケットがVPCの入り口へ向かいます。</p>`,
    keyPoints,
  },
  {
    title: '【変換と経路制御】インターネットゲートウェイ(IGW)を通過',
    location: 'VPC境界 (インターネットゲートウェイ)',
    diagramState: {
      activeNodeIds: ['igw', 'alb'],
      activeConnectionIds: ['igw-to-alb'],
      packetAtNodeId: 'igw',
      dimmedNodeIds: ['slack'],
    },
    headers: {
      srcIp: '198.51.100.50',
      srcPort: '52345',
      dstIp: '10.0.1.10',
      dstPort: '443',
    },
    labels: {
      srcIp: '(変わらず：ユーザーPCのIP)',
      srcPort: '(変わらず)',
      dstIp: '-> 10.0.1.10 (ALBノードのプライベートIPへ対応付け)',
      dstPort: '(HTTPS規格ポート)',
    },
    changes: ['dstIp'],
    desc: `<p>パケットがVPCのインターネット向け出入口である<strong><span onclick="openGlossary('igw')" class="glossary-link font-bold">IGW(インターネットゲートウェイ)</span></strong>に到達しました。ここでは主に次の2つが関わります。</p>
           <ul class='list-disc pl-4 space-y-1 mt-2 text-[11px]'>
             <li><strong class='text-orange-400 cursor-pointer hover:underline' onclick="openGlossary('nat')">1. NAT:</strong> インターネット向けALBの公開アドレスを、VPC内部で使う<strong>ALBノードのプライベートIP (10.0.1.10)</strong> に対応付けます。</li>
             <li><strong class='text-blue-400 cursor-pointer hover:underline' onclick="openGlossary('routing')">2. ルーティング:</strong> ルートテーブルに従って、Public Subnet内のALBへパケットを転送します。</li>
           </ul>`,
    keyPoints,
  },
  {
    title: '【受信と転送】パブリック受信窓口(ALB)に到達',
    location: 'Public Subnet (ALB内部)',
    diagramState: {
      activeNodeIds: ['alb', 'ecs'],
      activeConnectionIds: ['alb-to-ecs'],
      packetAtNodeId: 'alb',
      dimmedNodeIds: ['slack'],
    },
    headers: {
      srcIp: '10.0.1.10',
      srcPort: '49152',
      dstIp: '10.0.2.20',
      dstPort: '3000',
    },
    labels: {
      srcIp: '-> 10.0.1.10 (ALBからECSへの新しい接続)',
      srcPort: '-> 49152 (ALB側の一時ポート)',
      dstIp: '-> 10.0.2.20 (ECSタスクのプライベートIP)',
      dstPort: '-> 3000 (Railsが待ち受けるターゲットポート)',
    },
    changes: ['srcIp', 'srcPort', 'dstIp', 'dstPort'],
    desc: `<p>パケットがPublic Subnetにいる<strong><span onclick="openGlossary('alb')" class="glossary-link font-bold">ALB</span></strong>に届きました。ここでALBがHTTP/HTTPSのリバースプロキシとしてリクエストを受け付けます。</p>
           <p class='mt-2'>ALBはリスナーの<strong>443番ポート</strong>で通信を受け取り、ターゲットグループに登録されたPrivate SubnetのECS(10.0.2.20)へ、Railsが待ち受ける<strong>3000番ポート</strong>で転送します。</p>
           <p class='mt-2 text-slate-400 text-[10px]'>※ECS側のセキュリティグループ(SG)では、ALBのSGから3000番ポートへの通信だけを許可するのが基本です。</p>`,
    keyPoints,
  },
  {
    title: '【完了】ECS Fargate (Railsアプリ)に到達！',
    location: 'Private Subnet (ECSコンテナ内)',
    diagramState: {
      activeNodeIds: ['ecs'],
      activeConnectionIds: [],
      packetAtNodeId: 'ecs',
      dimmedNodeIds: ['slack'],
    },
    headers: {
      srcIp: '10.0.1.10',
      srcPort: '49152',
      dstIp: '10.0.2.20',
      dstPort: '3000',
    },
    labels: {
      srcIp: '(ALBのIP)',
      srcPort: '(ALBが通信を識別するポート)',
      dstIp: '(ECSコンテナ自身のプライベートIP)',
      dstPort: '(Rails起動ポート)',
    },
    changes: [],
    desc: `<p>ついにパケットがPrivate Subnet内の<strong><span onclick="openGlossary('ecs')" class="glossary-link font-bold">ECSコンテナ上のRailsアプリ</span></strong>に届きました。</p>
           <p class='mt-2 text-emerald-400 font-bold'>重要なのは、インターネット上のユーザーがECSのプライベートIP (10.0.2.20) やRailsの3000番ポートへ直接到達しているわけではない、という点です。</p>
           <p class='mt-1 text-slate-400'>公開窓口はALBに集約し、ECSはPrivate SubnetとSGで守る。これがWebアプリを安全に公開する基本形です。</p>`,
    keyPoints,
  },
];
