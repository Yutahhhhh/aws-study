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

export const outboundNatSteps: SimulationStep[] = [
  {
    title: '【送信】ECSコンテナからSlackへ通知発信',
    location: 'Private Subnet (ECSコンテナ発)',
    diagramState: {
      activeNodeIds: ['ecs', 'nat-gw'],
      activeConnectionIds: ['ecs-to-nat'],
      packetAtNodeId: 'ecs',
    },
    headers: {
      srcIp: '10.0.2.20',
      srcPort: '51234',
      dstIp: '3.120.0.1',
      dstPort: '443',
    },
    labels: {
      srcIp: '(ECSのプライベートIP)',
      srcPort: '(Railsが一時的に使った送信ポート)',
      dstIp: '(Slack APIのグローバルIP)',
      dstPort: '(HTTPS規格ポート)',
    },
    changes: [],
    desc: `<p>Private SubnetのECSコンテナが「外部のSlack API(3.120.0.1)にWebhookを送りたい」とリクエストを送った直後の状態です。</p>
           <p class='mt-2 text-rose-400 font-bold'>この時点の送信元IPはVPC内部だけで使える「10.0.2.20」です。このままではインターネット上で返信先として使えないため、外部通信を成立させるにはNATが必要です。</p>`,
    keyPoints,
  },
  {
    title: '【送信元変換】NAT Gatewayを経由',
    location: 'Public Subnet (NAT Gateway)',
    diagramState: {
      activeNodeIds: ['nat-gw', 'igw'],
      activeConnectionIds: ['nat-to-igw'],
      packetAtNodeId: 'nat-gw',
    },
    headers: {
      srcIp: '203.0.113.99',
      srcPort: '10001',
      dstIp: '3.120.0.1',
      dstPort: '443',
    },
    labels: {
      srcIp: '-> 203.0.113.99 (NAT-GWのElastic IPとして外へ出る)',
      srcPort: '-> 10001 (戻り通信を対応付ける一時ポート)',
      dstIp: '(変わらず：Slack APIのグローバルIP)',
      dstPort: '(HTTPS規格ポート)',
    },
    changes: ['srcIp', 'srcPort'],
    desc: `<p>パケットはルートテーブルの指示に従って、Public Subnetにある<strong><span onclick="openGlossary('nat-gateway')" class="glossary-link font-bold">NAT Gateway (NAT-GW)</span></strong>へ転送されます。</p>
           <p class='mt-2'>NAT-GWは内部の送信元IP/ポートを記録し、外部から見る送信元が<strong>NAT-GWに関連付けられたElastic IP (203.0.113.99)</strong>になるように変換します。戻り通信はこの対応表を使って、元のECSへ返されます。</p>`,
    keyPoints,
  },
  {
    title: '【経路制御】IGWを通過してインターネットへ送信',
    location: 'VPC境界 (インターネットゲートウェイ)',
    diagramState: {
      activeNodeIds: ['igw', 'slack'],
      activeConnectionIds: ['igw-to-slack'],
      packetAtNodeId: 'igw',
    },
    headers: {
      srcIp: '203.0.113.99',
      srcPort: '10001',
      dstIp: '3.120.0.1',
      dstPort: '443',
    },
    labels: {
      srcIp: '(NAT-GWのパブリックIP)',
      srcPort: '(一時ポート)',
      dstIp: '(Slack APIのグローバルIP)',
      dstPort: '(HTTPS規格ポート)',
    },
    changes: [],
    desc: `<p>パケットは<strong><span onclick="openGlossary('igw')" class="glossary-link font-bold">インターネットゲートウェイ (IGW)</span></strong>を通って、VPCの外へ出ます。</p>
           <p class='mt-2'>ここから先のインターネット上では、送信元はNAT-GWのElastic IPとして見えます。Slack側はECSのプライベートIPではなく、この公開IPへ返信します。</p>`,
    keyPoints,
  },
  {
    title: '【完了】Slack APIサーバーに安全に到達！',
    location: 'インターネット世界 (Slack)',
    diagramState: {
      activeNodeIds: ['slack'],
      activeConnectionIds: [],
      packetAtNodeId: 'slack',
    },
    headers: {
      srcIp: '203.0.113.99',
      srcPort: '10001',
      dstIp: '3.120.0.1',
      dstPort: '443',
    },
    labels: {
      srcIp: '(VPCからのパブリックIP)',
      srcPort: '(NAT-GWが管理しているポート)',
      dstIp: '(Slack自身のグローバルIP)',
      dstPort: '(HTTPS)',
    },
    changes: [],
    desc: `<p>パケットが無事に<strong>SlackのAPIサーバーに到達</strong>しました。</p>
           <p class='mt-2 text-emerald-400 font-bold'>NAT Gatewayを挟むことで、Slackからは「203.0.113.99(NAT-GWのElastic IP)」からリクエストが来たように見えます。Private Subnet内のECSは、インターネットから新規接続を受け付けないまま外部APIを呼び出せます。</p>`,
    keyPoints,
  },
];
