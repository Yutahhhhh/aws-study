# 14. Terraform の構成案と作る順序

ここまでの章で「何を作るか」は分かりました。この章では、それらを **Terraformでどう分割し、どの順番で作るか**（依存関係）を整理します。

## この章で理解すること

- Terraform設定をモジュール/ディレクトリにどう分けるか
- リソース間の依存関係と、作る順序
- state・環境（dev/prod）の分け方の基本
- 「依存があるから順序が決まる」ことの理由

## 構成図のどこに該当するか

構成図 **全体** が対象です。これまでの各章で作るリソースを、1つのTerraform構成として組み立てます。

## なぜ順序と依存が重要か

Terraformは宣言的で、基本的には依存関係を自動で解決します（`terraform apply` 時に依存順で作る）。しかし、人間が構成を理解し、分割・レビュー・トラブル対応するには、「何が何に依存するか」を把握している必要があります。例えばSubnetが無ければNAT GatewayもRDSも作れません。依存の向きを理解していれば、エラーの原因も追いやすくなります。

## モジュール構成案

規模に応じて分割します。小さく始めるなら単一構成でも動きますが、本番ではレイヤごとにモジュール化すると見通しが良くなります。

```text
terraform/
├── envs/
│   ├── dev/
│   │   ├── main.tf        # モジュール呼び出し + dev用変数
│   │   └── backend.tf     # state(S3 + DynamoDBロック)
│   └── prod/
│       ├── main.tf
│       └── backend.tf
└── modules/
    ├── network/           # VPC, Subnet, IGW, NAT, Route, VPC Endpoint
    ├── security/          # Security Group 群
    ├── alb/               # ALB, listener, target group
    ├── ecs/               # cluster, task def, service, autoscaling
    ├── rds/               # subnet group, instance, parameter group
    ├── cloudfront-s3/     # S3, OAC, CloudFront, ACM, Route53
    ├── iam/               # OIDC provider, roles
    ├── secrets/           # Secrets Manager / SSM parameters
    ├── ssm-access/        # 管理用EC2, SSM関連
    └── observability/     # Log group, alarms, SNS, WAF, flow logs
```

> モジュールに分けすぎると逆に複雑になります。最初は `network` / `security` / `app(alb+ecs+rds)` / `edge(cloudfront+s3)` / `iam` 程度の粗い分割から始め、必要に応じて細分化するのが現実的です。

### state と環境の分け方

- **state**: リモートバックエンド（S3 + DynamoDBによるロック、またはS3のネイティブロック）に置き、チームで共有・競合防止します。ローカルstateは本番では避けます。
- **環境**: dev/prodは別state（別ディレクトリ or 別workspace）にして、片方の操作が他方に影響しないようにします。変数で差分（インスタンスサイズ、Multi-AZ有無、NAT数など）を吸収します。

## 依存関係（作る順序）

下から積み上げる順です。上のものは下のものに依存します。

```text
1. ネットワーク基盤
   VPC -> Subnet -> Internet Gateway -> NAT Gateway(EIP) -> Route Table -> VPC Endpoint
        ([02章] [04章])

2. IAM / OIDC
   OIDC provider, デプロイロール, ECS execution/task role, EC2ロール
        ([10章])  ※ ECRやログより先に用意しておくと後段が楽

3. セキュリティグループ
   ALB SG, ECS SG, RDS SG, 管理EC2 SG, VPC Endpoint SG
        ([03章])  ※ SG参照で相互に結ぶ

4. データストア / 秘密
   ECR, S3(アプリ用), Secrets Manager/SSM, RDS(subnet group -> instance)
        ([07章] [08章])

5. ロードバランサ
   ALB -> listener -> target group
        ([05章])

6. アプリ実行基盤
   ECS cluster -> task definition -> service -> autoscaling
   (service が target group / subnet / SG / roles / secrets に依存)
        ([06章])

7. エッジ / 配信
   S3(フロント) -> OAC -> ACM(us-east-1) -> CloudFront -> Route53
        ([05章])

8. 運用アクセス
   管理用EC2 -> SSM関連
        ([09章])

9. 監視
   Log group, alarms, SNS, WAF, flow logs
        ([12章])
```

### 主要な依存の例

- **NAT Gateway** は Public Subnet と EIP に依存（[02章](./02-multi-az-and-subnets.md)）。
- **RDS** は DB subnet group（=Private Subnet）と RDS SG に依存（[07章](./07-rds-postgresql.md)）。
- **ECS Service** は target group / Private Subnet / ECS SG / IAMロール / (secrets) に依存（[06章](./06-ecs-fargate-autoscaling.md)）。
- **CloudFront** は S3 / OAC / ALB / ACM(us-east-1) に依存（[05章](./05-cloudfront-s3-alb-api-routing.md)）。
- **SGの相互参照**（ALB SG ↔ ECS SG）は、ルールをSG本体と別リソース（`aws_vpc_security_group_*_rule`）に分けると循環を避けやすい（[03章](./03-security-groups.md)）。

## Terraform運用の基本

- `terraform fmt` / `validate` / `plan` をCIで回す（[11章](./11-deploy-flow.md)）。
- `plan` の結果をレビューしてから `apply`。本番applyは専用ロールで（[10章](./10-iam-and-github-actions-oidc.md)）。
- `for_each` でAZ×Subnetなどの繰り返しを表現すると、AZ追加に強くなる。
- 既存の公開モジュール（例: `terraform-aws-modules/vpc/aws`）を土台にするのも有効。中身を理解したうえで使う。

## よくある誤解

### 「Terraformは順序を気にしなくてよい」

依存は自動解決されますが、人間が構成を理解・分割・デバッグするには依存の向きの把握が必要です。また、明示的な順序が要る場面（`depends_on`）もあります。

### 「全部1ファイルでよい」

小規模なら可能ですが、本番ではレイヤ分割とリモートstateが保守性・安全性に効きます。

### 「dev と prod は同じstateでよい」

分けます。片方の操作が他方を壊さないため、また権限・変数を分離するためです。

### 「モジュールは細かく分けるほど良い」

分けすぎると見通しが悪化します。粗く始めて必要に応じ細分化します。

## 理解チェック

- ネットワーク → SG → データ → ALB → ECS → エッジ の依存順を説明できるか
- ECS Serviceが依存する主なリソースを4つ挙げられるか
- SG相互参照の循環をどう避けるか説明できるか
- なぜdev/prodでstateを分けるのか説明できるか
- リモートstateとロックがなぜ必要か説明できるか

## 公式ドキュメント

- [Terraform: Modules](https://developer.hashicorp.com/terraform/language/modules)
- [Terraform: Backend configuration (remote state)](https://developer.hashicorp.com/terraform/language/settings/backends/configuration)
- [Terraform: Resource dependencies](https://developer.hashicorp.com/terraform/language/resources/behavior)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [terraform-aws-modules/vpc](https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest)
