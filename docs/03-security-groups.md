# 03. Security Group 設計

ネットワークの土台（Subnet）の次に来るのが、「誰が誰に通信してよいか」を決めるSecurity Group（SG）です。この構成の安全性は、ほぼSGの設計で決まります。

## この章で理解すること

- Security Group と Network ACL の違い
- SGが「ステートフル」であることの意味
- IPアドレスではなく **SG参照（source security group）** で許可する設計のメリット
- この構成における各SGの inbound / outbound 設計
- 最小権限なSGチェーンの作り方

## 構成図のどこに該当するか

構成図の「セキュリティグループ」の箱に、次の方針が書かれています。

- ALB: 80/443 をインターネットから許可
- ECS: 3000 を ALB からだけ許可

この章では、これに RDS（5432 を ECS からだけ許可）と、管理用EC2（[09章](./09-admin-access-ssm-port-forwarding.md)）も加えて、SGの連鎖として設計します。

## なぜ必要か

Subnetのルートテーブルは「どの経路で出入りするか」を決めますが、「どのリソースがどのポートで通信してよいか」までは細かく制御しません。そこを担うのがSGです。

SGはリソース（ENI）単位のファイアウォールで、**ステートフル**です。つまり、許可した通信に対する戻りの通信は、明示的に書かなくても自動的に通ります。

> Network ACL（NACL）はSubnet単位・ステートレスのフィルタで、戻り通信も明示が必要です。本構成では基本的にSGで制御し、NACLはデフォルト（全許可）のまま、あるいは粗い追加防御として扱うことが多いです。

## SGの2つの許可方法

SGのinboundルールでは、許可元（source）を次のどちらかで指定できます。

1. **CIDR**（例: `0.0.0.0/0`、`10.2.0.0/16`）
2. **別のSGのID**（source security group）

本構成の肝は、**できるだけSG参照で書く**ことです。

```text
RDS SG の inbound:
  port 5432, source = ECS SG   ← IPではなくSGを指定
```

こうすると、ECS TaskのIPが入れ替わっても（Fargateでは普通に起きる）、ECS SGを持つTaskであれば許可され続けます。IPベースだと、IPが変わるたびにルール更新が必要になり、運用が破綻します。

## 通信の流れ（SGチェーン）

この構成のSGは、入口から奥へ向かって「数珠つなぎ」になります。

```text
インターネット
  │ (80/443)
  ▼
[ALB SG]  inbound: 80/443 from 0.0.0.0/0
  │ (3000)
  ▼
[ECS SG]  inbound: 3000(コンテナポート) from ALB SG
  │ (5432)
  ▼
[RDS SG]  inbound: 5432 from ECS SG

[管理用EC2 SG]  inbound: なし(SSH不要)
  │ (5432)
  ▼
[RDS SG]  inbound: 5432 from 管理用EC2 SG も追加
```

各段で「1つ手前のSGからだけ」許可するのがポイントです。インターネットに直接さらすのはALBの80/443だけで、ECSもRDSもインターネットからは到達できません。

## 各SGの設計

### ALB SG

| 方向 | ポート | 相手 | 目的 |
| --- | --- | --- | --- |
| inbound | 443 | `0.0.0.0/0`（またはCloudFront managed prefix list） | HTTPS受け口 |
| inbound | 80 | `0.0.0.0/0` | HTTP→HTTPSリダイレクト用 |
| outbound | 3000 | ECS SG | ECSへ転送 |

> よりCloudFront経由に絞るなら、`0.0.0.0/0` の代わりに AWS managed prefix list `com.amazonaws.global.cloudfront.origin-facing` を source に使えます。詳細は [05章](./05-cloudfront-s3-alb-api-routing.md)。

### ECS SG（Fargate Task用）

| 方向 | ポート | 相手 | 目的 |
| --- | --- | --- | --- |
| inbound | 3000（コンテナポート） | ALB SG | ALBからのリクエストだけ受ける |
| outbound | 5432 | RDS SG | DBへ接続 |
| outbound | 443 | `0.0.0.0/0` または VPC Endpoint SG | ECR/Secrets/Logs等へ |

> 図のコンテナポートは `3000`（`awsvpc` モードでTaskごとにENI/Private IPを持つ）。ALBはTarget Groupに登録されたTaskのIP:3000へ転送します。

### RDS SG

| 方向 | ポート | 相手 | 目的 |
| --- | --- | --- | --- |
| inbound | 5432 | ECS SG | アプリからの接続 |
| inbound | 5432 | 管理用EC2 SG | 管理者のSSM経由接続 |
| outbound |（デフォルト） | - | 通常は明示不要 |

### 管理用EC2 SG（[09章](./09-admin-access-ssm-port-forwarding.md)）

| 方向 | ポート | 相手 | 目的 |
| --- | --- | --- | --- |
| inbound | **なし** | - | SSHを開けない（SSM経由のため） |
| outbound | 5432 | RDS SG | RDSへポートフォワード |
| outbound | 443 | `0.0.0.0/0` または VPC Endpoint SG | Systems Managerへ |

管理用EC2にinbound 22（SSH）が不要なのは、接続をSSM Session Managerが担うためです。SSMはEC2側からSystems Managerへ **outbound** で接続を確立します。

### VPC Endpoint SG

Interface型VPC Endpoint（ECR/Secrets Manager/Logs/SSMなど）にもSGが付きます。これらは「ECS SG / 管理用EC2 SG からの443」を許可します。→ [04章](./04-nat-gateway-vs-vpc-endpoint.md)

## Terraformで作る主なリソース

- `aws_security_group`（ALB / ECS / RDS / 管理用EC2 / VPC Endpoint 用）
- `aws_vpc_security_group_ingress_rule` / `aws_vpc_security_group_egress_rule`（個別ルール）
- `aws_ec2_managed_prefix_list_data`（CloudFront origin-facing prefix list を参照する場合）

> ルールをSG本体の `ingress`/`egress` ブロックに直接書く方法もありますが、相互参照（ALB SG と ECS SG が互いを参照する等）で循環しやすいため、`aws_vpc_security_group_*_rule` リソースに分けると依存関係を解きやすくなります。

簡略な例:

```hcl
resource "aws_security_group" "ecs" {
  name   = "prod-ecs"
  vpc_id = aws_vpc.this.id
}

resource "aws_vpc_security_group_ingress_rule" "ecs_from_alb" {
  security_group_id            = aws_security_group.ecs.id
  referenced_security_group_id = aws_security_group.alb.id  # SG参照
  ip_protocol                  = "tcp"
  from_port                    = 3000
  to_port                      = 3000
}
```

## よくある誤解

### 「SGは戻りの通信も書かないといけない」

不要です。SGはステートフルなので、許可した通信の戻りは自動で通ります。戻りまで書く必要があるのはNACL（ステートレス）です。

### 「outboundを全開（`0.0.0.0/0`）にしておけば楽」

楽ですが、最小権限ではありません。本番では、ECSのoutboundを「RDS SGへ5432」「VPC Endpointへ443」などに絞ると、侵害時の影響を小さくできます。まずは動かしてから絞る、でも構いませんが、絞る前提で設計します。

### 「IPで許可すれば確実」

FargateのTaskやNAT後のIPは変わります。固定IP前提の設計は壊れやすいので、VPC内ではSG参照を基本にします。

### 「SGとWAFは同じもの」

別物です。SGはL3/L4（IP・ポート）の制御、WAFはL7（HTTPの中身、SQLiやXSS、レート制限など）の制御です。役割が重なりません。→ [12章](./12-observability-logs-alarms.md)

## 理解チェック

- SGがステートフルであることの意味を説明できるか
- IPではなくSG参照で許可するメリットを説明できるか
- ALB→ECS→RDS のSGチェーンを、source指定まで含めて書けるか
- 管理用EC2にinbound 22が不要な理由を説明できるか
- SGとNACL、SGとWAFの守備範囲の違いを説明できるか

## 公式ドキュメント

- [Security groups for your VPC](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html)
- [Control traffic to your AWS resources using security groups](https://docs.aws.amazon.com/vpc/latest/userguide/security-group-rules.html)
- [Compare security groups and network ACLs](https://docs.aws.amazon.com/vpc/latest/userguide/infrastructure-security.html)
- [AWS-managed prefix lists](https://docs.aws.amazon.com/vpc/latest/userguide/working-with-aws-managed-prefix-lists.html)
