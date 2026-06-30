import type { GlossaryDatabase } from '../../types/glossary';
import type { GlossaryCategory } from '../../types/topic';

export const glossary: GlossaryDatabase = {
  'sg-stateful': {
    icon: 'Shield',
    title: 'ステートフルなSG',
    eng: 'STATEFUL SECURITY GROUP',
    oneLiner: '許可した通信の戻り(レスポンス)は自動的に通る、という性質',
    detail: `Security Groupはステートフルです。inboundで許可した通信に対する戻りの通信は、outboundルールに無くても自動的に通ります。
            <br><br>これは、Subnet単位で効く<strong>Network ACL(ステートレス)</strong>との大きな違いです。NACLでは戻り通信も明示的に許可する必要があります。`,
    focus: `「inboundは許可したのにレスポンスが返らない」と悩む必要はありません。SGでは戻りは自動です。逆に、戻りまで気にする必要があるのはNACLを使うときだけ、と覚えておくと混乱しません。`,
  },
  'sg-reference': {
    icon: 'Link',
    title: 'SG参照 (source security group)',
    eng: 'SECURITY GROUP REFERENCE',
    oneLiner: '許可元をIPアドレスではなく「別のSGのID」で指定する方法',
    detail: `SGのinboundルールでは、許可元(source)をCIDR(IP範囲)か、別のSGのIDで指定できます。
            <br><br>VPC内のリソース同士では、IPではなく<strong>SGのID</strong>で指定するのが基本です。例: ECS SGのinboundに「3000 from ALB SG」。`,
    focus: `FargateのTaskはデプロイのたびにIPが変わります。IPで許可していると、IPが変わった瞬間に通信が壊れます。SG参照なら、同じSGを持つリソースである限り許可され続けるため、運用が安定します。`,
  },
  'sg-default-deny': {
    icon: 'Ban',
    title: 'デフォルト拒否',
    eng: 'DEFAULT DENY (INBOUND)',
    oneLiner: '明示的に許可したinboundだけ通り、ルールに無い通信は黙って破棄される',
    detail: `新しく作ったSGのinboundは「許可なし」が初期状態です。許可ルールに一致しない通信は、エラーを返すのではなく黙って破棄(ドロップ)されます。
            <br><br>そのため、攻撃者がALBを飛ばしてECSやRDSへ直接到達しようとしても、許可ルールが無ければ通信は成立しません。`,
    focus: `「拒否ルールを書く」のではなく「許可するものだけ書く」のがSGの考え方です。許可した経路以外は自動的に閉じている、という前提で設計します。`,
  },
  'sg-vs-subnet': {
    icon: 'Layers',
    title: 'Subnet経路 と SG許可の二重防御',
    eng: 'SUBNET ROUTING + SECURITY GROUP',
    oneLiner: 'Private Subnetの「経路がない」とSGの「許可がない」の2層で守る',
    detail: `Private Subnetはルートテーブルがインターネットへ向いていないため、外から直接ルーティングできません(経路の防御)。
            <br><br>その上でSGが「許可した通信だけ」に絞ります(許可の防御)。この2層があることで、片方の設定ミスがあっても、もう片方が守りになります。`,
    focus: `ECSやRDSをPrivate Subnetに置く理由は、まさにこの二重防御です。SGだけ、Subnetだけ、に頼らず両方で守るのが本番の基本です。`,
  },
  'alb-sg': {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Elastic-Load-Balancing_48.svg',
    title: 'ALB の Security Group',
    eng: 'ALB SECURITY GROUP',
    oneLiner: 'インターネットからの443(と80)を受ける、唯一の公開SG',
    detail: `ALBのSGは <code>inbound 443 from 0.0.0.0/0</code>(必要なら80も)を許可します。このチェーンで、インターネットへ開くのはここだけです。
            <br><br>outboundはECS SGへ3000番、というように絞れます。`,
    focus: `よりCloudFront経由だけに絞るなら、source を <code>0.0.0.0/0</code> ではなくAWS managed prefix list(CloudFront origin-facing)にする方法もあります。`,
  },
  'ecs-sg': {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.svg',
    title: 'ECS の Security Group',
    eng: 'ECS SECURITY GROUP',
    oneLiner: 'ALB SGからのコンテナポートだけを受ける、アプリ用SG',
    detail: `ECS(Fargate Task)のSGは <code>inbound 3000 from ALB SG</code> を許可します。インターネットからは受けません。
            <br><br>outboundはRDS SGへ5432、VPCエンドポイントやNATへ443、というように必要な宛先へ絞れます。`,
    focus: `awsvpcモードではTaskごとにENIとIPが付きます。SG参照で許可しておけば、Taskが増減・再作成されてもルール変更は不要です。`,
  },
  'rds-sg': {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Database/48/Arch_Amazon-RDS_48.svg',
    title: 'RDS の Security Group',
    eng: 'RDS SECURITY GROUP',
    oneLiner: 'ECS SG(と管理EC2 SG)からの5432だけを受ける、DB用SG',
    detail: `RDSのSGは <code>inbound 5432 from ECS SG</code> を許可します。管理者がSSM経由で接続する場合は、管理用EC2のSGからの5432も追加します。
            <br><br>インターネットや他のリソースからは受けません。`,
    focus: `RDSを守る中心はこのSGです。IP直書きを避けてSG参照にすること、<code>publicly_accessible = false</code> にすることの2つが、DBを安全に保つ要点です。`,
  },
};

export const glossaryCategories: GlossaryCategory[] = [
  {
    label: 'SGの性質',
    termIds: ['sg-stateful', 'sg-reference', 'sg-default-deny', 'sg-vs-subnet'],
  },
  {
    label: '各リソースのSG',
    termIds: ['alb-sg', 'ecs-sg', 'rds-sg'],
  },
];
