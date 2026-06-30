import type { GlossaryDatabase } from '../../types/glossary';
import type { GlossaryCategory } from '../../types/topic';

export const glossary: GlossaryDatabase = {
  'ssm-session-manager': {
    icon: 'Network',
    title: 'SSM Session Manager',
    eng: 'AWS SYSTEMS MANAGER SESSION MANAGER',
    oneLiner: 'SSH/RDPやポート開放なしで、IAM認可のもとManaged Nodeへ接続する仕組み',
    detail: `AWS Systems Managerの機能で、EC2などのManaged NodeへブラウザやCLIから接続できます。
            <br><br>接続はNode側からSystems Managerへのoutboundで確立されるため、踏み台に inbound 22 を開ける必要がありません。ポートフォワーディングにも対応します。`,
    focus: `接続権限はIAMで制御し、誰がいつどのNodeへ接続したかをCloudTrail/SSMで追えます。本番DBへの手動接続は、この認可と監査を必ず設計します。`,
  },
  'port-forwarding': {
    icon: 'ArrowLeftRight',
    title: 'ポートフォワーディング (remote host)',
    eng: 'PORT FORWARDING TO REMOTE HOST',
    oneLiner: '手元のローカルポートへの通信を、中継Nodeの先のホスト(RDS)へトンネルで転送する',
    detail: `<code>AWS-StartPortForwardingSessionToRemoteHost</code> ドキュメントを使うと、中継となる管理用EC2の<strong>さらに先のホスト</strong>(例: RDSエンドポイント:5432)へ通信を転送できます。
            <br><br>手元では <code>localhost:15432</code> を指定し、その通信がSSM経由でRDSへ届きます。`,
    focus: `「localhost:15432 に繋いでいるのに、なぜRDSに届くのか?」の答えがこれです。トンネルが張られている間、ローカルポートへの通信がリモートのRDSへ運ばれます。手元のDBに繋いでいるわけではありません。`,
  },
  'managed-node': {
    icon: 'Server',
    title: 'Managed Node (管理用EC2)',
    eng: 'SSM MANAGED NODE',
    oneLiner: 'SSM Agentが動き、Systems Managerから管理できる中継役のEC2',
    detail: `RDSにはSSM Agentを入れられません。そこで、RDSへネットワーク的に到達できるPrivate Subnet内のEC2をManaged Nodeにし、中継役にします。
            <br><br>EC2にはSSM用のIAMロール(AmazonSSMManagedInstanceCore 相当)を付与します。`,
    focus: `中継EC2は従来の踏み台に似ていますが、inbound SSHを開けない点が決定的に違います。EC2がSSMへ到達できる経路(NAT または ssm/ssmmessages/ec2messages エンドポイント)の確保がセットアップの肝です。`,
  },
  'no-ssh': {
    icon: 'KeyRound',
    title: 'SSH inbound が不要',
    eng: 'NO INBOUND SSH',
    oneLiner: '接続はEC2からのoutboundで成立するため、22番を開けず鍵管理も不要',
    detail: `Session Managerでは、管理者→EC2の inbound 22 を一切開けません。EC2側からSystems Managerへ outbound で接続を確立し、その上で管理者のセッションが中継されます。
            <br><br>これにより、SSH鍵の配布・ローテーション・漏洩リスクから解放されます。`,
    focus: `「踏み台=22番を開ける」という思い込みを捨てるのが第一歩です。攻撃面(開いたSSHポート)を消し、認可をIAMに寄せることで、運用とセキュリティの両方が改善します。`,
  },
  'rds-private': {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Database/48/Arch_Amazon-RDS_48.svg',
    title: '非公開のRDS',
    eng: 'PRIVATE RDS',
    oneLiner: 'Private Subnetに置き publicly_accessible=false にしたDB。外から直接は届かない',
    detail: `本番DBはPrivate Subnetに置き、インターネットからの直接到達を遮断します(<code>publicly_accessible = false</code>)。
            <br><br>その結果、手元PCからは直接繋げません。だからこそSSMポートフォワーディングのような安全な中継経路が必要になります。`,
    focus: `「DBに繋げないから public にする」は最も避けたい選択です。非公開のままSSM経由で接続するのが、利便性と安全性を両立する本番のやり方です。`,
  },
};

export const glossaryCategories: GlossaryCategory[] = [
  {
    label: 'SSM接続の仕組み',
    termIds: ['ssm-session-manager', 'port-forwarding', 'managed-node'],
  },
  {
    label: 'なぜ安全か',
    termIds: ['no-ssh', 'rds-private'],
  },
];
