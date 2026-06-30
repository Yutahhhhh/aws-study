# terraform-aws / prod 構成を理解して構築するための学習教材

このディレクトリは、[`terraform-aws-prod-architecture.png`](../images/terraform-aws-prod-architecture.png) の構成を、自分の手で設計・構築できるようになるための学習教材です。

対象読者は「AWSのサービス名は聞いたことがあるが、Terraformで本番Webアプリ構成を組み切るには理解が足りない」初中級者を想定しています。

## この教材のゴール

サービス名やTerraformのリソース名を暗記することではなく、次の問いに自分の言葉で答えられるようになることをゴールにします。

- なぜ Public Subnet と Private Subnet を分けるのか
- なぜ Multi-AZ にするのか
- Security Group は「誰から誰へ」をどう設計するのか
- ECS Fargate はどの単位で増減するのか
- CloudFront の `/api/*` はどのように ALB へ流れるのか
- RDS は「DBを置く」以上に何を設計するのか
- 秘密情報（DBパスワードなど）をコードに書かずにどう渡すのか
- 管理者はどうやって Private Subnet 内のDBへ安全に接続するのか
- GitHub Actions からどうやって鍵を置かずにデプロイするのか
- 障害が起きたとき、どこから切り分けるのか
- Terraformで何を、どの順番で作れば、この構成が成立するのか

## 構成図の全体像

この教材が扱う構成を、一文で言うと次のとおりです。

> フロントエンドはS3に置いてCloudFrontで配信し、`/api/*` だけCloudFrontからALBを経由してPrivate Subnet内のECS Fargateへ流す。DBはRDS PostgreSQLとしてPrivate Subnetに置き、ECSからのみ接続できるようにする。管理者はSSM Session ManagerでDBへ安全に接続し、デプロイはGitHub Actions OIDCで行う。

```text
利用者
  -> DNS (Route 53)
  -> CloudFront ── 通常パス ──> S3 (OAC経由のみ読取)
                └ /api/*  ──> ALB -> Target Group -> ECS Fargate -> RDS PostgreSQL
                                                       (Private Subnet, Multi-AZ)
```

## 読む順番

学習しやすい順に並べています。最初から順に読むことを想定していますが、各章は独立して読めるようにも書いています。

### 基礎（ネットワークの土台）

1. [全体像とリクエストの流れ](./01-prod-architecture-map.md)
2. [Multi-AZ とサブネット設計](./02-multi-az-and-subnets.md)
3. [Security Group 設計](./03-security-groups.md)
4. [NAT Gateway と VPC Endpoint の使い分け](./04-nat-gateway-vs-vpc-endpoint.md)

### 入口とアプリケーション

5. [CloudFront / S3 / OAC / ALB と `/api/*` ルーティング](./05-cloudfront-s3-alb-api-routing.md)
6. [ECS Fargate と Auto Scaling](./06-ecs-fargate-autoscaling.md)
7. [RDS PostgreSQL（Private 配置・Multi-AZ・Read Replica）](./07-rds-postgresql.md)

### 秘密情報・運用アクセス

8. [Secrets Manager / SSM Parameter Store](./08-secrets-and-parameters.md)
9. [SSM Session Manager で Private RDS へ接続する](./09-admin-access-ssm-port-forwarding.md)

### CI/CD・運用

10. [IAM と GitHub Actions OIDC](./10-iam-and-github-actions-oidc.md)
11. [デプロイフロー（フロントエンドとバックエンド）](./11-deploy-flow.md)
12. [監視・ログ・アラーム](./12-observability-logs-alarms.md)
13. [障害時の切り分け](./13-troubleshooting.md)

### 組み立てとコスト

14. [Terraform の構成案と作る順序](./14-terraform-structure-and-order.md)
15. [コスト観点](./15-cost.md)
16. [構築チェックリスト](./16-build-checklist.md)

## 各章の読み方

各章は、できるだけ次の見出しで統一しています。

- **この章で理解すること** … この章を読み終えたときに説明できるようになること
- **構成図のどこに該当するか** … `terraform-aws-prod-architecture.png` のどの箱の話か
- **通信の流れ** … リクエストやデータがどう流れるか
- **なぜ必要か** … その構成を選ぶ理由
- **Terraformで作る主なリソース** … 対応する `aws_*` リソース
- **よくある誤解** … つまずきやすいポイント
- **理解チェック** … 自分の言葉で説明できるか確認する問い
- **公式ドキュメント** … 一次情報へのリンク

## 用語の前提

最初に押さえておくと、各章が読みやすくなる用語です。

| 用語 | 意味 |
| --- | --- |
| **Region** | 地理的に離れた独立したインフラ群。例: `ap-northeast-1`（東京） |
| **AZ (Availability Zone)** | 1つのRegion内にある、電源・ネットワークが独立したデータセンター群 |
| **VPC** | AWS上に作る論理的に隔離された自分のネットワーク |
| **Subnet** | VPCのIP範囲を分割した領域。1つのSubnetは必ず1つのAZに属する |
| **Public Subnet** | ルートテーブルに `0.0.0.0/0 -> Internet Gateway` を持つSubnet |
| **Private Subnet** | インターネットから直接入れないSubnet。外へ出る場合はNAT GatewayやVPC Endpointを使う |
| **Route Table** | Subnetから出る通信の宛先（次のホップ）を決める表 |
| **Security Group (SG)** | リソース単位のステートフルなファイアウォール |
| **ECS Task** | コンテナが実際に動く単位 |
| **ECS Service** | 指定した数のTaskを維持し、必要に応じて増減させる管理単位 |
| **Target Group** | ALBが転送先として見る、登録済みターゲット（ここではECS TaskのIP）の一覧 |
| **OAC (Origin Access Control)** | CloudFrontからだけS3を読めるようにする仕組み |

## 学習の進め方のヒント

- まず [01 全体像](./01-prod-architecture-map.md) で「リクエストがどこを通るか」を頭に入れてから、各コンポーネントの章へ進むと理解しやすくなります。
- 各章末の「理解チェック」に口頭で答えられるかを基準にすると、暗記ではなく理解の確認になります。
- 構築まで進む場合は、最後の [14 作る順序](./14-terraform-structure-and-order.md) と [16 チェックリスト](./16-build-checklist.md) を手元に置いてください。

## 注意

- 料金は変動するため、本教材では具体的な金額を断定しません。コストの考え方は [15 コスト観点](./15-cost.md) で扱います。
- AWSの仕様・画面・APIは更新されます。各章末の公式ドキュメントを一次情報として確認してください。
