import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'terraform-structure',
  title: 'Terraform 構成と作る順序',
  description: 'モジュール分割と、ネットワークからアプリまでの依存関係(作る順序)を図解する',
  headerLabel: 'TERRAFORM STRUCTURE',
  homeIcon: 'Boxes',
  homeColor: 'rose',
  intro:
    'Terraformは依存関係を自動で解決しますが、人間が構成を理解・分割・デバッグするには「何が何に依存するか」の把握が必要です。例えばSubnetが無ければNAT GatewayもRDSも作れません。',
  sections: [
    {
      id: 'modules',
      title: 'モジュール構成案',
      icon: 'Boxes',
      blocks: [
        {
          type: 'code',
          caption: 'レイヤごとに分割する例(規模に応じて粗く始める)',
          code: `terraform/
├── envs/
│   ├── dev/   (main.tf + backend.tf)
│   └── prod/  (main.tf + backend.tf)
└── modules/
    ├── network/        # VPC, Subnet, IGW, NAT, Route, VPC Endpoint
    ├── security/       # Security Group 群
    ├── alb/            # ALB, listener, target group
    ├── ecs/            # cluster, task def, service, autoscaling
    ├── rds/            # subnet group, instance
    ├── cloudfront-s3/  # S3, OAC, CloudFront, ACM, Route53
    ├── iam/            # OIDC provider, roles
    ├── secrets/        # Secrets Manager / SSM
    ├── ssm-access/     # 管理用EC2, SSM
    └── observability/  # Log group, alarms, SNS, WAF, flow logs`,
        },
        {
          type: 'callout',
          variant: 'tip',
          html: '分けすぎると逆に複雑になります。最初は <code>network</code> / <code>security</code> / <code>app(alb+ecs+rds)</code> / <code>edge(cloudfront+s3)</code> / <code>iam</code> 程度の粗い分割から始め、必要に応じて細分化するのが現実的です。',
        },
      ],
    },
    {
      id: 'state',
      title: 'state と環境の分け方',
      icon: 'Layers',
      blocks: [
        {
          type: 'compare',
          columns: [
            {
              title: 'リモートstate',
              accent: 'blue',
              points: ['S3 + DynamoDBロック(またはS3ネイティブロック)', 'チームで共有・競合防止', '本番でローカルstateは避ける'],
            },
            {
              title: '環境の分離',
              accent: 'amber',
              points: ['dev/prodは別state(別ディレクトリ or workspace)', '片方の操作が他方に影響しないように', '変数で差分(サイズ/Multi-AZ/NAT数)を吸収'],
            },
          ],
        },
      ],
    },
    {
      id: 'order',
      title: '依存関係（作る順序）',
      icon: 'Network',
      blocks: [
        {
          type: 'paragraph',
          html: '下から積み上げる順です。上のものは下のものに依存します。',
        },
        {
          type: 'steps',
          steps: [
            { title: '1. ネットワーク基盤', html: 'VPC → Subnet → IGW → NAT(EIP) → Route Table → VPC Endpoint', accent: 'blue' },
            { title: '2. IAM / OIDC', html: 'OIDC provider, デプロイロール, ECS execution/task role, EC2ロール', accent: 'purple' },
            { title: '3. Security Group', html: 'ALB/ECS/RDS/管理EC2/VPCe 用。SG参照で相互に結ぶ', accent: 'rose' },
            { title: '4. データ・秘密', html: 'ECR, S3, Secrets/SSM, RDS(subnet group → instance)', accent: 'sky' },
            { title: '5. ロードバランサ', html: 'ALB → listener → target group', accent: 'amber' },
            { title: '6. アプリ実行基盤', html: 'ECS cluster → task definition → service → autoscaling', accent: 'emerald' },
            { title: '7. エッジ・配信', html: 'S3(フロント) → OAC → ACM(us-east-1) → CloudFront → Route53', accent: 'purple' },
            { title: '8. 運用アクセス・監視', html: '管理用EC2 + SSM、Log group, alarms, WAF, flow logs', accent: 'slate' },
          ],
        },
      ],
    },
    {
      id: 'key-deps',
      title: '主要な依存の例',
      icon: 'Activity',
      blocks: [
        {
          type: 'list',
          items: [
            '<strong>NAT Gateway</strong> は Public Subnet と EIP に依存',
            '<strong>RDS</strong> は DB subnet group(=Private Subnet)と RDS SG に依存',
            '<strong>ECS Service</strong> は target group / Private Subnet / ECS SG / IAMロール / (secrets) に依存',
            '<strong>CloudFront</strong> は S3 / OAC / ALB / ACM(us-east-1) に依存',
            '<strong>SGの相互参照</strong>(ALB SG ↔ ECS SG)は、ルールを別リソース(<code>aws_vpc_security_group_*_rule</code>)に分けると循環を避けやすい',
          ],
        },
      ],
    },
    {
      id: 'ops',
      title: 'Terraform運用の基本',
      icon: 'Gauge',
      blocks: [
        {
          type: 'list',
          items: [
            '<code>fmt</code> / <code>validate</code> / <code>plan</code> をCIで回す',
            '<code>plan</code> の結果をレビューしてから <code>apply</code>。本番applyは専用ロールで',
            '<code>for_each</code> でAZ×Subnetの繰り返しを表現し、AZ追加に強くする',
            '公開モジュール(例: <code>terraform-aws-modules/vpc/aws</code>)を土台にするのも有効(中身を理解した上で)',
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'よくある誤解',
          html: '「Terraformは順序を気にしなくてよい」——依存は自動解決されますが、人間が構成を理解・分割・デバッグするには依存の向きの把握が必要です。明示的な順序が要る場面(<code>depends_on</code>)もあります。',
        },
      ],
    },
  ],
  checkpoints: [
    'ネットワーク → SG → データ → ALB → ECS → エッジ の依存順を説明できるか',
    'ECS Serviceが依存する主なリソースを4つ挙げられるか',
    'SG相互参照の循環をどう避けるか説明できるか',
    'なぜdev/prodでstateを分けるのか説明できるか',
    'リモートstateとロックがなぜ必要か説明できるか',
  ],
  references: [
    { label: 'Terraform: Modules', url: 'https://developer.hashicorp.com/terraform/language/modules' },
    { label: 'Terraform: Backend configuration (remote state)', url: 'https://developer.hashicorp.com/terraform/language/settings/backends/configuration' },
    { label: 'Terraform AWS Provider', url: 'https://registry.terraform.io/providers/hashicorp/aws/latest/docs' },
    { label: 'terraform-aws-modules/vpc', url: 'https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest' },
  ],
};

export default config;
