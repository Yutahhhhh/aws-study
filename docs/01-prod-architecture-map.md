# 01. 全体像とリクエストの流れ

対象図: [`terraform-aws-prod-architecture.png`](../images/terraform-aws-prod-architecture.png)

この章は、以降の章を読むための地図です。個々のサービスの詳細に入る前に、「リクエストがどこを通り、何がどこに置かれているか」を先に頭に入れます。

## この章で理解すること

- このWebアプリ構成全体で、リクエストがどの順番で流れるか
- 画面表示（静的ファイル）とAPI通信で、経路がどう分かれるか
- 「外から入ってくる通信」と「内側から外へ出る通信」が別物であること
- 各コンポーネントが何を担当しているか（詳細は各章で扱う）

## 構成図のどこに該当するか

この章は構成図 **全体** を扱います。図には大きく分けて4つのまとまりがあります。

1. **入口** … 利用者 / DNS / CloudFront / S3
2. **VPC内のネットワーク** … Public Subnet・Private Subnet（AZ a / c の2系統）
3. **アプリとデータ** … ALB / Target Group / ECS Fargate / RDS PostgreSQL
4. **周辺** … GitHub Actions・ECR（デプロイ）、VPC Endpoint、セキュリティ・監視

```text
                                    ┌──────────── 入口 ────────────┐
利用者 ─> DNS ─> CloudFront ─┬─ 通常パス ─> S3 (静的ファイル)
                             └─ /api/*  ─> ALB
                                            │
┌──────────────────────────── VPC 10.2.0.0/16 ────────────────────────────┐
│  Public Subnet A / C                                                     │
│     ├─ ALB (internet-facing)                                            │
│     └─ NAT Gateway A / C                                                │
│                          │                                              │
│  Private Subnet A / C    ▼                                              │
│     ├─ ECS Fargate Task ──> RDS PostgreSQL (Multi-AZ)                   │
│     └─ (管理用EC2 / VPC Endpoint)                                       │
└──────────────────────────────────────────────────────────────────────┘
```

## 通信の流れ

### 1. 通常の画面表示（静的ファイル）

```text
利用者
  -> DNS (Route 53 などで example.com を解決)
  -> CloudFront (default behavior に一致)
  -> S3 (OAC経由で HTML / CSS / JS を取得)
  -> ブラウザへ返す
```

### 2. API通信

```text
利用者
  -> DNS
  -> CloudFront (/api/* の behavior に一致)
  -> ALB
  -> Target Group
  -> ECS Fargate Task (Private Subnet)
  -> RDS PostgreSQL (Private Subnet)
```

ポイントは、**同じドメイン**（例: `https://example.com`）に来たリクエストを、CloudFrontがパスで振り分けることです。画面はS3、APIはALBへ向かいます。詳細は [05章](./05-cloudfront-s3-alb-api-routing.md) で扱います。

### 3. デプロイ（イメージ取得）

```text
GitHub Actions (OIDCでAWSへ一時認証)
  -> ECR へ Docker image を push
  -> ECS Service を更新
  -> ECS Task が ECR から image を pull して起動
```

デプロイの詳細は [10章](./10-iam-and-github-actions-oidc.md) と [11章](./11-deploy-flow.md) で扱います。

### 4. 管理者のDB接続

```text
管理者PC
  -> AWS Systems Manager Session Manager
  -> 管理用EC2（Private Subnet内のManaged Node）
  -> RDS PostgreSQL:5432
```

詳細は [09章](./09-admin-access-ssm-port-forwarding.md) で扱います。

## なぜ必要か（各コンポーネントの役割）

### DNS（Route 53）

利用者がアクセスするドメインをCloudFrontへ向けます。Route 53を使う場合、CloudFront distributionへAliasレコードを張る構成が一般的です。

### CloudFront

入口のCDNです。静的ファイルはS3 originへ、APIはALB originへ、**パスによって振り分け**ます。この構成ではCloudFrontが「フロントエンド配信」と「APIルーティング」の両方を担います。→ [05章](./05-cloudfront-s3-alb-api-routing.md)

### S3

ビルド済みフロントエンド（HTML/CSS/JS）を置く場所です。bucketを直接公開せず、CloudFront OAC経由でのみ読めるようにするのが基本です。→ [05章](./05-cloudfront-s3-alb-api-routing.md)

### ALB（Application Load Balancer）

APIリクエストを受けるロードバランサーです。CloudFrontから来た `/api/*` のリクエストを、ECS Taskが登録されているTarget Groupへ転送します。Public Subnetに置きます。→ [05章](./05-cloudfront-s3-alb-api-routing.md)

### ECS Fargate

APIアプリケーション（RailsなどのバックエンドAPI）をコンテナとして動かす場所です。Fargateを使うとEC2インスタンスの管理は不要で、増減する単位はEC2ではなく **ECS Task** です。Private Subnetに置きます。→ [06章](./06-ecs-fargate-autoscaling.md)

### RDS PostgreSQL

アプリケーションの永続データを持つDBです。Private Subnetに置き、ECSのSecurity Groupからの5432番のみを許可します。→ [07章](./07-rds-postgresql.md)

### NAT Gateway

Private Subnet内のECS Taskが「外（インターネット）へ出る」ための出口です。外部APIへの接続などで使います。AWSサービス向けの通信はVPC Endpointで代替できる場合があります。→ [04章](./04-nat-gateway-vs-vpc-endpoint.md)

### VPC Endpoint

Private SubnetからAWSサービス（S3 / ECR / CloudWatch Logs / Secrets Manager など）へ、NAT GatewayやInternet Gatewayを通らずに接続する経路です。→ [04章](./04-nat-gateway-vs-vpc-endpoint.md)

## この構成の核心：2つの通信を混ぜない

この構成を理解するうえで最も大事なのは、次の2つを **別々の仕組み** として捉えることです。

**1つ目：外から入ってくる通信（ingress）**

```text
CloudFront -> ALB -> ECS
```

CloudFrontやALBという「公開された入口」を通って、Private SubnetのECSへ届きます。

**2つ目：内側から外へ出る通信（egress）**

```text
ECS -> NAT Gateway または VPC Endpoint -> 外部 / AWSサービス
```

ECS自身が外部APIやAWSサービスへ接続するための経路です。

初学者がつまずくのは、この2つを混同して「Private SubnetのECSにCloudFrontが直接つながる」「Private Subnetだから一切外と通信できない」と考えてしまうケースです。入口（ingress）と出口（egress）は別物です。

## Terraformで作る主なリソース

この章は全体像のため、各リソースは各章で詳しく扱います。全体としては次のグループを作ります。

- ネットワーク: `aws_vpc` / `aws_subnet` / `aws_internet_gateway` / `aws_nat_gateway` / `aws_route_table` / `aws_vpc_endpoint`
- 入口・配信: `aws_cloudfront_distribution` / `aws_s3_bucket` / `aws_lb`（ALB）
- アプリ: `aws_ecs_cluster` / `aws_ecs_service` / `aws_ecs_task_definition` / `aws_lb_target_group`
- データ: `aws_db_instance`（または `aws_rds_cluster`）/ `aws_db_subnet_group`
- 権限・秘密: `aws_iam_role` / `aws_secretsmanager_secret` / `aws_ssm_parameter`
- 監視: `aws_cloudwatch_log_group` / `aws_cloudwatch_metric_alarm`

作る順序と依存関係は [14章](./14-terraform-structure-and-order.md) にまとめています。

## よくある誤解

### Private SubnetのECSへCloudFrontが直接つながる？

つながりません。CloudFrontが転送できるoriginは、基本的にインターネットから到達可能である必要があります。この図ではCloudFrontのAPI originはALBで、ALBがPublic Subnetにいて、そこからPrivate SubnetのECSへ転送します。

### ECSがPrivate Subnetならインターネットへ一切出られない？

そのままでは外部インターネットへは出られません。外部APIへ出るならNAT Gatewayが必要です。AWSサービスへ出るだけならVPC Endpointで代替できる場合があります（[04章](./04-nat-gateway-vs-vpc-endpoint.md)）。

### RDSはECSと同じSubnetに置かないと接続できない？

そんなことはありません。同じVPC内でルーティングでき、Security Groupが許可していれば、別のSubnetでも接続できます。RDSは可用性のためPrivate Subnet群（複数AZ）に配置します。

### ALBは完全に非公開にできる？

この構成ではCloudFrontのAPI originがALBなので、ALBはCloudFrontから到達できる必要があり、通常はinternet-facingです。ただしSecurity Groupやカスタムヘッダー、WAFで「CloudFront経由だけ」に絞ることはできます（[05章](./05-cloudfront-s3-alb-api-routing.md)）。

## 理解チェック

- `/api/users` はS3とALBのどちらへ向かうか、その理由とともに説明できるか
- 静的ファイル（例: `/assets/index.js`）とAPIで経路が分かれる仕組みを説明できるか
- 「外から入る通信」と「内側から外へ出る通信」をそれぞれ図のどの経路か指させるか
- ECS TaskがECRからimageをpullするための経路を説明できるか
- RDSがPublic SubnetではなくPrivate Subnetにある理由を説明できるか
- 管理者がDBへ接続するとき、なぜRDSをpublicにしないのか説明できるか

## 公式ドキュメント

- [How Amazon VPC works](https://docs.aws.amazon.com/vpc/latest/userguide/how-it-works.html)
- [Amazon CloudFront Developer Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)
- [What is an Application Load Balancer?](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html)
- [Amazon ECS on AWS Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [Working with an Amazon RDS DB instance in a VPC](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_VPC.WorkingWithRDSInstanceinaVPC.html)
