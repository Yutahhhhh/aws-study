# 15. コスト観点

本番構成は、可用性とセキュリティを優先すると費用がかさみます。この章では、どこに費用が出やすいか、どこで節約の判断ができるかを **考え方** として整理します。

> 注意: AWSの料金は変動し、リージョン・使用量・契約形態で変わります。本章では具体的な金額を断定しません。実際の見積もりは公式の料金ページと AWS Pricing Calculator で確認してください。

## この章で理解すること

- この構成で費用が発生しやすいポイント
- 「固定費（時間課金）」と「変動費（使用量課金）」の区別
- 可用性・セキュリティとコストのトレードオフ
- 非本番（dev）でコストを下げる現実的な判断

## 構成図のどこに該当するか

構成図上のほぼ全コンポーネントが課金対象です。特に「常時起動で時間課金されるもの」に注意します。

## なぜ必要か

クラウドは「使った分だけ」と言われますが、実際には **起動しているだけで時間課金される**リソースが多くあります。設計段階でコスト構造を理解しておくと、「本番では冗長化、devでは縮小」といった判断ができ、無駄を避けられます。

## 費用が発生しやすいポイント

| コンポーネント | 課金の主な性質 | コメント |
| --- | --- | --- |
| **NAT Gateway** | 時間課金＋処理データ量 | AZごとに置くと台数分の固定費。見落としやすい常時費用（[04章](./04-nat-gateway-vs-vpc-endpoint.md)） |
| **ALB** | 時間課金＋LCU（処理量） | 常時起動の固定費 |
| **ECS Fargate** | vCPU・メモリ×稼働時間 | Task数とサイズに比例。Auto Scalingの下限(min)が常時費用（[06章](./06-ecs-fargate-autoscaling.md)） |
| **RDS** | インスタンス時間＋ストレージ＋I/O | Multi-AZは概ね倍のインスタンス費用。常時費用 |
| **Interface VPC Endpoint** | ENI時間課金＋処理量 | エンドポイント数×AZ数で増える（[04章](./04-nat-gateway-vs-vpc-endpoint.md)） |
| **CloudFront** | データ転送＋リクエスト | 変動費。キャッシュ効率で変わる |
| **S3** | ストレージ＋リクエスト＋転送 | 比較的小さいことが多い |
| **データ転送** | AZ間/リージョン外への転送 | AZをまたぐ通信に課金（[02章](./02-multi-az-and-subnets.md)） |
| **CloudWatch Logs** | 取り込み量＋保存量 | ログ過多・無期限保存に注意（[12章](./12-observability-logs-alarms.md)） |

## 固定費と変動費を分けて考える

- **固定費（起動しているだけでかかる）**: NAT Gateway、ALB、RDSインスタンス、Interface VPC Endpoint、Fargateの最低稼働分。これらは「使っていなくても」発生します。
- **変動費（使った分だけ）**: CloudFront/S3の転送・リクエスト、Fargateの増えた分、ログ取り込み量、データ転送。

本番では固定費が下支えになります。「アクセスが少ない夜間も、最低限の冗長構成は動き続ける」ためです。

## トレードオフの判断

### NAT Gateway: AZごと vs 1つ

- 本番: AZごと（可用性重視、AZ障害を閉じ込める）。
- dev: 1つに集約してコスト削減、という判断はあり得ます（[02章](./02-multi-az-and-subnets.md)）。
- さらに、AWSサービス向けをVPC Endpointに寄せると、NAT経由のデータ転送を減らせます（ただしEndpoint自体の固定費とのバランス）。

### RDS Multi-AZ

- 本番: 有効（可用性）。概ねインスタンス費用が増えます。
- dev: 無効でコスト削減、という判断はあり得ます（[07章](./07-rds-postgresql.md)）。

### Fargate の min capacity

- `min_capacity` を下げると常時費用は減りますが、急なアクセス増に弱くなります（[06章](./06-ecs-fargate-autoscaling.md)）。
- 本番は可用性のため最低2を維持、devは1、といった分け方。
- 長期的に安定した負荷があるなら、Fargate向けの料金割引プラン（Savings Plans等）も検討対象。

### VPC Endpoint vs NAT

- Endpointは数×AZで固定費が積み上がります。必要なサービスだけに絞り、不要なものは作らない。
- 一方で、NAT経由のデータ転送が多いならEndpointの方が安くなる場合もあります。通信量で判断します。

### ログの保存期間

- CloudWatch Logsは取り込み量・保存量で課金されます。Log Groupに **保持期間（retention）** を設定し、無期限保存を避けます（[12章](./12-observability-logs-alarms.md)）。

## dev環境を安くする現実的な判断

| 項目 | 本番 | dev（例） |
| --- | --- | --- |
| NAT Gateway | AZごと | 1つに集約 / 不要なら無し |
| RDS Multi-AZ | 有効 | 無効 |
| RDSサイズ | 要件に応じ | 小さく |
| Fargate min | 2以上 | 1 |
| VPC Endpoint | 必要分 | NATで代替 |
| ログ保持 | 長め | 短め |

> dev/prodはTerraformの変数で差分を吸収します（[14章](./14-terraform-structure-and-order.md)）。

## Terraformで意識すること

コスト自体はTerraformリソースではありませんが、設計に直結します。

- 変数で `multi_az`、`nat_gateway_count`、`min_capacity`、`log_retention_days` などを環境ごとに切り替える。
- 使わない環境は `terraform destroy` で落とせるようにしておく（state分離が前提）。
- タグ（`Environment`、`Project` 等）を全リソースに付け、コスト配分タグで可視化する。

## よくある誤解

### 「使っていなければ課金されない」

NAT Gateway・ALB・RDS・Interface Endpoint・Fargateのminは、起動しているだけで時間課金されます。

### 「Multi-AZにしても料金はほぼ変わらない」

RDS Multi-AZはstandbyの分、概ねインスタンス費用が増えます。可用性の対価です。

### 「VPC Endpointは安いから全部作る」

Interface Endpointは数×AZで固定費が積み上がります。必要なものに絞ります。

### 「ログは全部無期限に取っておけばよい」

取り込み量・保存量で課金されます。保持期間を設定します。

## 理解チェック

- この構成で「起動しているだけで課金される」リソースを3つ挙げられるか
- NAT GatewayをAZごとに置く/1つにする判断のトレードオフを説明できるか
- RDS Multi-AZがコストに与える影響を説明できるか
- dev環境で安くする具体策を3つ挙げられるか
- VPC Endpoint と NAT のコスト判断軸を説明できるか

## 公式ドキュメント

- [AWS Pricing Calculator](https://calculator.aws/)
- [Amazon VPC pricing (NAT gateway / endpoints)](https://aws.amazon.com/vpc/pricing/)
- [AWS Fargate pricing](https://aws.amazon.com/fargate/pricing/)
- [Amazon RDS pricing](https://aws.amazon.com/rds/pricing/)
- [Amazon CloudWatch pricing](https://aws.amazon.com/cloudwatch/pricing/)
- [Using cost allocation tags](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/cost-alloc-tags.html)
