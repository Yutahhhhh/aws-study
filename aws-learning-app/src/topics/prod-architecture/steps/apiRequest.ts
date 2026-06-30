import type { SimulationStep } from '../../../types/simulation';

const keyPoints = [
  {
    glossaryTermId: 'alb',
    title: 'ALBとTarget Group',
    description: 'ALBは443で受け、listener ruleでパスを見てTarget Groupへ転送します。Target Groupにはhealth checkに通ったECS TaskのPrivate IP:3000が登録されています。',
    accentColor: 'text-indigo-400',
  },
  {
    glossaryTermId: 'rds',
    title: 'RDSはECSからのみ許可',
    description: 'RDSはPrivate Subnetに置き、Security GroupでECSのSGからの5432番だけを許可します。利用者やインターネットから直接は到達できません。',
    accentColor: 'text-sky-400',
  },
];

export const apiRequestSteps: SimulationStep[] = [
  {
    title: '【送信】利用者が /api/users を要求',
    location: 'インターネット世界 (送信中)',
    diagramState: {
      activeNodeIds: ['user-pc', 'cloudfront'],
      activeConnectionIds: ['user-to-cf'],
      packetAtNodeId: 'user-pc',
      dimmedNodeIds: ['github', 'ecr', 's3'],
    },
    headers: {
      srcIp: '198.51.100.50',
      srcPort: '52346',
      dstIp: '(CloudFront edge)',
      dstPort: '443',
    },
    labels: {
      srcIp: '(利用者PCのIP)',
      srcPort: '(ブラウザのランダムポート)',
      dstIp: '(CloudFrontのエッジ)',
      dstPort: '(HTTPS)',
    },
    changes: [],
    desc: `<p>同じドメインの <code>https://example.com/api/users</code> へのAPIリクエストです。</p>
           <p class='mt-2'>画面表示と同じくCloudFrontのエッジへ届きますが、ここからの行き先が変わります。</p>`,
    keyPoints,
  },
  {
    title: '【振り分け】CloudFrontが /api/* Behavior でALBを選ぶ',
    location: 'CloudFront (エッジ)',
    diagramState: {
      activeNodeIds: ['cloudfront', 'alb'],
      activeConnectionIds: ['cf-to-alb'],
      packetAtNodeId: 'cloudfront',
      dimmedNodeIds: ['github', 'ecr', 's3'],
    },
    headers: {
      srcIp: '(CloudFront)',
      srcPort: '-',
      dstIp: '(ALBの公開エンドポイント)',
      dstPort: '443',
    },
    labels: {
      srcIp: '(CloudFrontがOriginへ転送)',
      srcPort: '-',
      dstIp: '(ALB origin)',
      dstPort: '(HTTPS)',
    },
    changes: ['srcIp', 'dstIp'],
    desc: `<p>パス <code>/api/users</code> は <strong><span onclick="openGlossary('cloudfront')" class="glossary-link font-bold">/api/* Behavior</span></strong> に一致するため、OriginはS3ではなく<strong>ALB</strong>になります。</p>
           <p class='mt-2'>API behaviorではキャッシュを無効(または極小)にし、Authorizationヘッダーなど必要な情報をALBへ転送します。</p>`,
    keyPoints,
  },
  {
    title: '【転送】ALBがTarget GroupのECS Taskへ振り分け',
    location: 'Public Subnet (ALB)',
    diagramState: {
      activeNodeIds: ['alb', 'ecs'],
      activeConnectionIds: ['alb-to-ecs'],
      packetAtNodeId: 'alb',
      dimmedNodeIds: ['github', 'ecr', 's3'],
    },
    headers: {
      srcIp: '10.2.1.10',
      srcPort: '49152',
      dstIp: '10.2.11.20',
      dstPort: '3000',
    },
    labels: {
      srcIp: '(ALBノードのPrivate IP)',
      srcPort: '(ALB側の一時ポート)',
      dstIp: '(ECS TaskのPrivate IP)',
      dstPort: '(コンテナの待ち受けポート)',
    },
    changes: ['srcIp', 'srcPort', 'dstIp', 'dstPort'],
    desc: `<p>ALBは443で受け、listener ruleに従って<strong><span onclick="openGlossary('alb')" class="glossary-link font-bold">Target Group</span></strong>へ転送します。</p>
           <p class='mt-2'>Target Groupには、health checkに通ったECS TaskのPrivate IP(<code>10.2.11.20:3000</code>)が登録されています。Fargateの<code>awsvpc</code>モードでTaskごとにIPが付くためIP単位で登録されます。</p>
           <p class='mt-2 text-slate-400 text-[10px]'>※ECSのSGはALBのSGからの3000番だけを許可するのが基本です。</p>`,
    keyPoints,
  },
  {
    title: '【DB接続】ECSがRDSへクエリ',
    location: 'Private Subnet (ECS → RDS)',
    diagramState: {
      activeNodeIds: ['ecs', 'rds'],
      activeConnectionIds: ['ecs-to-rds'],
      packetAtNodeId: 'ecs',
      dimmedNodeIds: ['github', 'ecr', 's3'],
    },
    headers: {
      srcIp: '10.2.11.20',
      srcPort: '50210',
      dstIp: '10.2.11.200',
      dstPort: '5432',
    },
    labels: {
      srcIp: '(ECS TaskのPrivate IP)',
      srcPort: '(一時ポート)',
      dstIp: '(RDSエンドポイントのPrivate IP)',
      dstPort: '(PostgreSQL)',
    },
    changes: ['srcIp', 'srcPort', 'dstIp', 'dstPort'],
    desc: `<p>APIアプリが必要なデータを得るため<strong><span onclick="openGlossary('rds')" class="glossary-link font-bold">RDS PostgreSQL</span></strong>へ5432番で接続します。</p>
           <p class='mt-2'>RDSのSGはECSのSGからの5432番だけを許可しています。同じVPC内でルーティングでき、SGが許可しているため接続が成立します。</p>`,
    keyPoints,
  },
  {
    title: '【完了】応答が逆順で利用者へ返る',
    location: 'Private Subnet → 利用者',
    diagramState: {
      activeNodeIds: ['rds', 'ecs', 'alb', 'cloudfront', 'user-pc'],
      activeConnectionIds: ['ecs-to-rds', 'alb-to-ecs', 'cf-to-alb', 'user-to-cf'],
      packetAtNodeId: 'user-pc',
      dimmedNodeIds: ['github', 'ecr', 's3'],
    },
    headers: {
      srcIp: '(各ホップで応答)',
      srcPort: '-',
      dstIp: '198.51.100.50',
      dstPort: '52346',
    },
    labels: {
      srcIp: '(RDS→ECS→ALB→CloudFront)',
      srcPort: '-',
      dstIp: '(利用者PCへ)',
      dstPort: '(最初に開いたポート)',
    },
    changes: ['srcIp', 'dstIp', 'dstPort'],
    desc: `<p>RDSの結果をもとにECSがJSONを生成し、<strong>ECS → ALB → CloudFront → 利用者</strong> の逆順で応答が返ります。</p>
           <p class='mt-2 text-emerald-400 font-bold'>利用者はインターネットからECSやRDSへ直接到達していません。公開窓口はCloudFront/ALBに集約され、アプリとDBはPrivate Subnetで守られています。</p>`,
    keyPoints,
  },
];
