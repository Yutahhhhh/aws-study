# 04. NAT Gateway と VPC Endpoint の使い分け

[01章](./01-prod-architecture-map.md) で触れた「内側から外へ出る通信（egress）」を、具体的にどう実現するかを扱います。Private SubnetのECSが外部やAWSサービスへ接続する経路の選択です。

## この章で理解すること

- Private Subnetのリソースが「外へ出る」2つの経路（NAT Gateway / VPC Endpoint）
- Gateway型エンドポイントとInterface型エンドポイントの違い
- どの通信をNATで、どの通信をVPC Endpointで処理すべきか
- ECRからのimage pullに必要なエンドポイントの組み合わせ
- コスト・セキュリティ上のトレードオフ

## 構成図のどこに該当するか

- 「NAT Gateway A / C」（Public Subnet内）
- 「VPCエンドポイント（S3 / ECR / ログ / Secrets Manager / X-Ray）」の箱
- Private SubnetのECSから出ている、NAT向き・VPC Endpoint向きの線

## なぜ必要か

Private SubnetのルートテーブルはInternet Gatewayを向いていません（[02章](./02-multi-az-and-subnets.md)）。そのため、ECS Taskが次のような通信をするには別経路が要ります。

- 外部のSaaS APIや決済プロバイダへHTTPSで接続する
- ECRからコンテナimageをpullする
- CloudWatch Logsへログを送る
- Secrets Manager / SSM Parameter Storeから秘密情報を取得する

これらをどう通すかが、NAT GatewayとVPC Endpointの使い分けです。

## 2つの経路

### NAT Gateway

- Public Subnetに置く、AWSマネージドの出口です。
- Private Subnetの `0.0.0.0/0` をNAT Gatewayへ向けると、**任意のインターネット宛**の通信が外へ出られます（戻りも通る）。
- 外から始まる通信は通しません（あくまで内→外の出口）。
- 料金は「時間あたり」＋「処理データ量あたり」でかかります。

```text
ECS (Private) -> NAT Gateway (Public) -> Internet Gateway -> 外部
```

### VPC Endpoint

VPC内から **AWSサービス** へ、インターネットを経由せずに到達する経路です。2種類あります。

**Gateway型エンドポイント**

- 対象は **S3 と DynamoDB のみ**。
- ルートテーブルにエントリを追加する方式で、ENIは作りません。
- **追加料金がかからない**のが大きな利点。
- S3向けの通信（ECRのレイヤ実体、CloudFront用アセット以外のアプリからのS3アクセス等）はこれで賄えます。

```text
ECS (Private) -> (route table) -> S3 Gateway Endpoint -> S3
```

**Interface型エンドポイント（AWS PrivateLink）**

- 対象は多数のAWSサービス（ECR API、Secrets Manager、CloudWatch Logs、SSM など）。
- Subnet内に **ENI（Private IP）** を作り、そのIPでサービスへ到達します。
- SGを付けられます（[03章](./03-security-groups.md)）。
- 料金は「ENIの時間あたり」＋「処理データ量あたり」。

```text
ECS (Private) -> Interface Endpoint(ENI) -> (PrivateLink) -> AWSサービス
```

## 使い分けの指針

| 通信先 | 推奨経路 | 理由 |
| --- | --- | --- |
| 外部インターネット（SaaS API等） | NAT Gateway | VPC Endpointでは到達できない |
| S3 | Gateway Endpoint | 無料・シンプル |
| ECR（image pull） | Interface Endpoint（`ecr.api`/`ecr.dkr`）＋ S3 Gateway Endpoint | 後述 |
| CloudWatch Logs | Interface Endpoint（`logs`） | ログ送信をPrivateに |
| Secrets Manager | Interface Endpoint（`secretsmanager`） | 秘密取得をPrivateに |
| Systems Manager（SSM接続） | Interface Endpoint（`ssm`/`ssmmessages`/`ec2messages`） | [09章](./09-admin-access-ssm-port-forwarding.md) |

基本方針:

- **AWSサービス向けはVPC Endpointに寄せる**（NATを通らず、データ転送がVPC内で完結し、よりPrivate）。
- **どうしても外部インターネットへ出る通信だけNAT Gatewayに任せる**。
- 外部インターネット通信が一切ないなら、理論上NAT Gatewayなしも可能。ただし必要なAWSサービスすべてにInterface Endpointを揃える手間とコストが要ります。

## ECRからのimage pullに必要なもの（つまずきポイント）

「NATなしでECSを動かしたい」とき、ECRのpullは1つのエンドポイントでは足りません。次の組み合わせが必要です。

1. `com.amazonaws.<region>.ecr.api`（Interface） … ECR API（認証・メタデータ）
2. `com.amazonaws.<region>.ecr.dkr`（Interface） … Dockerレジストリ操作
3. **S3 Gateway Endpoint** … イメージレイヤの実体はS3に置かれているため必須
4. `com.amazonaws.<region>.logs`（Interface） … タスクのログ出力をPrivateにするなら

このうち1つでも欠けると、Taskが「imageをpullできずに起動失敗」します。NATがあればこの組み合わせを気にせず動きますが、その分インターネット経由になります。

## 通信の流れ（このプロジェクトの想定）

```text
ECS Task が必要とする外向き通信:
  - ECR pull        -> ECR Interface Endpoint + S3 Gateway Endpoint
  - ログ送信        -> CloudWatch Logs Interface Endpoint
  - 秘密取得        -> Secrets Manager Interface Endpoint
  - 外部SaaS API    -> NAT Gateway
```

AWSサービス向けをVPC Endpointに寄せると、NAT Gatewayを通る量が減り、その分のデータ転送コストとインターネット露出を抑えられます。

## Terraformで作る主なリソース

- `aws_nat_gateway` / `aws_eip`（AZごと、[02章](./02-multi-az-and-subnets.md)）
- `aws_vpc_endpoint`（`vpc_endpoint_type = "Gateway"` … S3用）
- `aws_vpc_endpoint`（`vpc_endpoint_type = "Interface"` … ECR/Logs/Secrets/SSM用、`subnet_ids` と `security_group_ids` を指定、`private_dns_enabled = true`）
- Gateway型は `route_table_ids` を、Interface型は `subnet_ids`/`security_group_ids` を指定する点が異なります。

簡略な例:

```hcl
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.this.id
  service_name      = "com.amazonaws.ap-northeast-1.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private_a.id, aws_route_table.private_c.id]
}

resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id              = aws_vpc.this.id
  service_name        = "com.amazonaws.ap-northeast-1.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.private_a.id, aws_subnet.private_c.id]
  security_group_ids  = [aws_security_group.vpce.id]
  private_dns_enabled = true
}
```

## よくある誤解

### 「VPC Endpointを1つ作ればNAT Gatewayは不要」

不要になるのは、外部インターネット通信がゼロで、かつ必要なAWSサービスすべてにエンドポイントを揃えた場合だけです。外部SaaSを叩くならNATは必要です。

### 「S3もInterface Endpointで作るべき」

S3はGateway型が無料で作れるため、まずGateway型を使うのが基本です（S3にInterface型も存在しますが、用途が限られます）。

### 「ECRエンドポイントを1つ作ればpullできる」

`ecr.api` と `ecr.dkr` の両方、さらにレイヤ取得のためS3 Gateway Endpointが必要です。1つでは起動に失敗します。

### 「NAT Gatewayは外からの入口にもなる」

なりません。NAT Gatewayは内→外の出口専用で、外から始まる通信は通しません。外からの入口はALBやCloudFrontです。

## 理解チェック

- NAT GatewayとVPC Endpointの役割の違いを説明できるか
- Gateway型とInterface型の違い（対象サービス・課金・ENIの有無）を説明できるか
- NATなしでECRからpullするのに必要なエンドポイントを挙げられるか
- どの通信をNATで、どの通信をVPC Endpointで処理すべきか判断できるか
- VPC Endpointに寄せるとコスト・セキュリティ面で何が良くなるか説明できるか

## 公式ドキュメント

- [NAT gateways](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)
- [What is AWS PrivateLink? / VPC endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/what-is-privatelink.html)
- [Gateway endpoints (S3 and DynamoDB)](https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html)
- [Amazon ECR interface VPC endpoints](https://docs.aws.amazon.com/AmazonECR/latest/userguide/vpc-endpoints.html)
- [Use interface VPC endpoints with Amazon ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/vpc-endpoints.html)
