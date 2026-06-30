import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'cost',
  title: 'コスト観点',
  description: 'どこに費用が出やすいか、可用性・セキュリティとのトレードオフをどう判断するか',
  homeIcon: 'Wallet',
  headerLabel: 'AWS COST',
  homeColor: 'amber',
  intro:
    'クラウドは「使った分だけ」と言われますが、実際には<strong>起動しているだけで時間課金される</strong>リソースが多くあります。金額は変動するため、ここでは具体額を断定せず「考え方」を整理します。実額は公式の料金ページと Pricing Calculator で確認してください。',
  sections: [
    {
      id: 'fixed-vs-variable',
      title: '固定費と変動費を分けて考える',
      icon: 'Wallet',
      blocks: [
        {
          type: 'compare',
          columns: [
            {
              title: '固定費(起動で課金)',
              subtitle: '使っていなくても発生',
              accent: 'rose',
              points: ['NAT Gateway', 'ALB', 'RDSインスタンス', 'Interface VPC Endpoint', 'Fargateの最低稼働分(min)'],
            },
            {
              title: '変動費(使った分だけ)',
              subtitle: '量に比例',
              accent: 'emerald',
              points: ['CloudFront/S3の転送・リクエスト', 'Fargateの増えた分', 'ログ取り込み量', 'AZ間/外部へのデータ転送'],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          html: '本番では固定費が下支えになります。アクセスが少ない夜間も、最低限の冗長構成は動き続けるためです。',
        },
      ],
    },
    {
      id: 'hotspots',
      title: '費用が発生しやすいポイント',
      icon: 'Activity',
      blocks: [
        {
          type: 'table',
          headers: ['コンポーネント', '課金の主な性質', 'コメント'],
          rows: [
            ['NAT Gateway', '時間課金＋処理データ量', 'AZごとに置くと台数分の固定費。見落としやすい'],
            ['ALB', '時間課金＋処理量(LCU)', '常時起動の固定費'],
            ['ECS Fargate', 'vCPU・メモリ×稼働時間', 'Task数とサイズに比例。minが常時費用'],
            ['RDS', 'インスタンス時間＋ストレージ', 'Multi-AZは概ね倍のインスタンス費用'],
            ['Interface VPC Endpoint', 'ENI時間課金＋処理量', 'エンドポイント数×AZ数で増える'],
            ['CloudWatch Logs', '取り込み量＋保存量', '無期限保存・ログ過多に注意'],
          ],
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'トレードオフの判断',
      icon: 'Layers',
      blocks: [
        {
          type: 'steps',
          steps: [
            { title: 'NAT Gateway: AZごと or 1つ', html: '本番はAZごと(可用性)。devは1つに集約してコスト削減。AWSサービス向けをVPC Endpointに寄せるとNAT経由の転送を減らせる。', accent: 'rose' },
            { title: 'RDS Multi-AZ', html: '本番は有効(可用性)。devは無効でコスト削減という判断はあり得る。', accent: 'sky' },
            { title: 'Fargate min capacity', html: '下げると常時費用は減るが急増に弱い。本番は最低2、devは1など。', accent: 'emerald' },
            { title: 'VPC Endpoint vs NAT', html: 'Endpointは数×AZで固定費が積む。必要なものに絞る。通信量が多いならEndpointが安くなる場合も。', accent: 'amber' },
            { title: 'ログの保持期間', html: 'Log Groupに retention を設定し、無期限保存を避ける。', accent: 'purple' },
          ],
        },
      ],
    },
    {
      id: 'dev-prod',
      title: 'dev環境を安くする現実的な判断',
      icon: 'Boxes',
      blocks: [
        {
          type: 'table',
          headers: ['項目', '本番', 'dev(例)'],
          rows: [
            ['NAT Gateway', 'AZごと', '1つに集約 / 不要なら無し'],
            ['RDS Multi-AZ', '有効', '無効'],
            ['RDSサイズ', '要件に応じ', '小さく'],
            ['Fargate min', '2以上', '1'],
            ['VPC Endpoint', '必要分', 'NATで代替'],
            ['ログ保持', '長め', '短め'],
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          html: 'dev/prodの差分はTerraformの変数(<code>multi_az</code> / <code>nat_gateway_count</code> / <code>min_capacity</code> / <code>log_retention_days</code> 等)で吸収します。全リソースにタグを付け、コスト配分タグで可視化します。',
        },
      ],
    },
    {
      id: 'myths',
      title: 'よくある誤解',
      icon: 'TriangleAlert',
      blocks: [
        {
          type: 'list',
          items: [
            '<strong>「使っていなければ課金されない」</strong> → NAT/ALB/RDS/Interface Endpoint/Fargate minは起動だけで課金',
            '<strong>「Multi-AZでも料金はほぼ同じ」</strong> → RDS Multi-AZはstandby分の費用が増える',
            '<strong>「VPC Endpointは安いから全部作る」</strong> → 数×AZで固定費が積む。必要分に絞る',
            '<strong>「ログは無期限でよい」</strong> → 取り込み量・保存量で課金。保持期間を設定',
          ],
        },
      ],
    },
  ],
  checkpoints: [
    'この構成で「起動しているだけで課金される」リソースを3つ挙げられるか',
    'NAT GatewayをAZごとに置く/1つにする判断のトレードオフを説明できるか',
    'RDS Multi-AZがコストに与える影響を説明できるか',
    'dev環境で安くする具体策を3つ挙げられるか',
    'VPC Endpoint と NAT のコスト判断軸を説明できるか',
  ],
  references: [
    { label: 'AWS Pricing Calculator', url: 'https://calculator.aws/' },
    { label: 'Amazon VPC pricing (NAT gateway / endpoints)', url: 'https://aws.amazon.com/vpc/pricing/' },
    { label: 'AWS Fargate pricing', url: 'https://aws.amazon.com/fargate/pricing/' },
    { label: 'Amazon RDS pricing', url: 'https://aws.amazon.com/rds/pricing/' },
    { label: 'Using cost allocation tags', url: 'https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/cost-alloc-tags.html' },
  ],
};

export default config;
