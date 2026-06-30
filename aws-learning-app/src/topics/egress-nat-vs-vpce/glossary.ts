import type { GlossaryDatabase } from '../../types/glossary';
import type { GlossaryCategory } from '../../types/topic';

export const glossary: GlossaryDatabase = {
  egress: {
    icon: 'ArrowUpFromLine',
    title: 'Egress (内→外の通信)',
    eng: 'EGRESS / OUTBOUND',
    oneLiner: 'Private Subnetのリソースが外部やAWSサービスへ出ていく通信',
    detail: `「外から入る通信(ingress)」と「内から外へ出る通信(egress)」は別物です。
            <br><br>Private SubnetのECSが、外部API・ECR・Secrets・Logsなどへ接続するのがegressです。Private Subnetは外から直接入れませんが、egressはNATやVPC Endpointで実現できます。`,
    focus: `設計では「その通信は外部インターネット宛てか、AWSサービス宛てか」をまず分けます。宛先によってNATかVPC Endpointかが決まります。ingressとegressを混同しないことが第一歩です。`,
  },
  'nat-gateway': {
    icon: '/src/assets/aws/Resource-Icons_07312025/Res_Networking-Content-Delivery/Res_Amazon-VPC_NAT-Gateway_48.svg',
    title: 'NAT Gateway',
    eng: 'NAT GATEWAY',
    oneLiner: 'Private Subnetから任意のインターネット宛てへ出るための出口',
    detail: `Public Subnetに置くマネージドな出口です。Private Subnetの <code>0.0.0.0/0</code> をNAT Gatewayへ向けると、任意のインターネット宛て通信が外へ出られます(戻りも通る)。
            <br><br>外から始まる通信は通しません。料金は時間課金＋処理データ量課金です。`,
    focus: `VPC Endpointでは到達できない「外部インターネットの宛先」(SaaS APIなど)にはNATが必要です。AZごとに置くと可用性は上がりますが台数分の固定費がかかります。非本番では1つに集約してコストを抑える判断もあります。`,
  },
  'vpce-interface': {
    icon: 'Plug',
    title: 'Interface型 VPC Endpoint',
    eng: 'INTERFACE VPC ENDPOINT (PRIVATELINK)',
    oneLiner: 'Subnet内にENIを作り、AWSサービスへPrivateに到達する。多数のサービスが対象',
    detail: `AWS PrivateLinkを使い、Subnet内にENI(Private IP)を作って対象AWSサービスへ到達します。ECR API/Secrets Manager/CloudWatch Logs/SSMなど多くのサービスが対象です。
            <br><br>SGを付けられます。料金はENIの時間課金＋処理データ量課金です。`,
    focus: `NATを通らずPrivateに到達できる反面、エンドポイント数×AZ数で固定費が積み上がります。必要なサービスだけに絞ります。ECR pullには ecr.api と ecr.dkr の両方が必要です。`,
  },
  'vpce-gateway': {
    icon: 'Boxes',
    title: 'Gateway型 VPC Endpoint',
    eng: 'GATEWAY VPC ENDPOINT',
    oneLiner: 'ルートテーブルにエントリを足す方式。S3とDynamoDBだけが対象で追加料金なし',
    detail: `S3とDynamoDB専用のエンドポイントです。ENIを作らず、ルートテーブルにエントリを追加する方式で、<strong>追加料金がかかりません</strong>。
            <br><br>S3向けの通信(アプリのS3アクセス、ECRのレイヤ取得など)はこれで賄えます。`,
    focus: `S3はまずGateway型を使うのが基本です。ECR pullでは、ecr.api/ecr.dkr のInterface に加えて、画像レイヤの実体があるS3へ届くためのGateway Endpointが必要です。これが欠けるとpullに失敗します。`,
  },
};

export const glossaryCategories: GlossaryCategory[] = [
  {
    label: '考え方',
    termIds: ['egress'],
  },
  {
    label: '2つの経路',
    termIds: ['nat-gateway', 'vpce-interface', 'vpce-gateway'],
  },
];
