# 09. SSM Session Manager で Private RDS へ接続する

RDSはPrivate Subnetに置くため（[07章](./07-rds-postgresql.md)）、管理者PCから直接 `host:5432` へは繋げません。RDSをpublicにせず、SSHも開けずに、安全にDBへ接続する方法を扱います。

## この章で理解すること

- なぜRDSへ直接接続できないのか
- SSM Session Manager のポートフォワーディングが何をしているのか
- なぜRDS自身ではなく管理用EC2を中継役にするのか
- 管理用EC2にinbound SSH（22番）が不要な理由
- 必要なIAM権限・ネットワーク経路・監査ログ

## 構成図のどこに該当するか

- RDS PostgreSQL（接続先）
- Private Subnet内に置く管理用EC2（図の明示はないが、この構成の管理経路として必要）
- VPCエンドポイント（SSM関連。NATがなければ必須。[04章](./04-nat-gateway-vs-vpc-endpoint.md)）

## 実現したいこと

手元のPCから、privateなRDSへ接続したい。ただしRDSをpublicにしたくない。

```text
管理者PC
  -> localhost:15432
  -> SSM Session Manager (トンネル)
  -> 管理用EC2 (Private Subnet内のManaged Node)
  -> RDS:5432
```

管理者は手元では `localhost:15432` に繋ぎます。その通信がSSMのセッションを通り、VPC内の管理用EC2を経由してRDSへ転送されます。

## 通信の流れ（なぜlocalhostがRDSに繋がるのか）

ポートフォワーディングは「手元のポート」と「リモート側の接続先」をトンネルで結びます。

```text
1. 管理者PCで localhost:15432 を待ち受けるトンネルを張る
2. localhost:15432 へ来た通信は SSM 経由で管理用EC2に届く
3. 管理用EC2が それを RDS:5432 へ転送する
4. 戻りは逆順で localhost:15432 に返る
```

`AWS-StartPortForwardingSessionToRemoteHost` ドキュメントを使うと、「管理用EC2を中継して、その先の別ホスト（RDS）へ」転送できます。だからEC2自身ではなくRDSへ届きます。

## なぜ必要か

### なぜ管理用EC2が必要なのか

Session Managerのポートフォワーディングは、中継役となる **Managed Node** を必要とします。Managed Nodeは、SSM Agentが動いていてSystems Managerから管理できるEC2などです。

RDSにはSSM Agentを入れられません。そのため、RDSへネットワーク的に到達できるPrivate Subnet内のEC2を中継役（Managed Node）にします。これは従来のSSH踏み台に似ていますが、**インターネットから22番を開ける必要がない**点が決定的に違います。

### なぜSSHを開けなくてよいのか

Session Managerでは、接続は **EC2側からSystems Managerへ outbound** で確立されます。管理者→EC2の inbound 22 を開ける必要がありません。

```text
管理用EC2 SG:
  inbound  : なし(SSH不要)
  outbound : 443 -> Systems Manager (NAT または VPC Endpoint)
  outbound : 5432 -> RDS SG

RDS SG:
  inbound  : 5432 from 管理用EC2 SG
```

inbound 22 を開けないことで、SSH総当たり攻撃などの面を消せます。SSH鍵の配布・管理も不要になります。

## 管理用EC2がSystems Managerと通信する方法

Private SubnetのEC2がSSMへ繋がるには、次のどちらかが必要です（[04章](./04-nat-gateway-vs-vpc-endpoint.md)）。

### NAT Gateway 経由

```text
管理用EC2 -> NAT Gateway -> Systems Manager public endpoint
```

既にNAT Gatewayがある構成なら手軽です。

### VPC Endpoint 経由（よりPrivate）

Systems Manager関連のInterface VPC Endpointを作ります。代表例:

- `com.amazonaws.<region>.ssm`
- `com.amazonaws.<region>.ssmmessages`
- `com.amazonaws.<region>.ec2messages`

セッションログをCloudWatch LogsやS3へ出すなら、その経路（`logs` エンドポイントやS3 Gateway Endpoint）も考えます。

## 接続コマンドの例

RDSエンドポイントが `prod-db.xxxxxx.ap-northeast-1.rds.amazonaws.com` だとします。手元PCで実行します。

```bash
aws ssm start-session \
  --target i-xxxxxxxxxxxxxxxxx \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["prod-db.xxxxxx.ap-northeast-1.rds.amazonaws.com"],"portNumber":["5432"],"localPortNumber":["15432"]}'
```

その後、DBクライアントからはこう繋ぎます。

```text
host:     localhost
port:     15432
user:     DB user
password: DB password
database: DB name
```

> 手元PCには AWS CLI と Session Manager plugin が必要です。

## 認証・認可（最小権限）

SSM接続にはIAM権限が必要です。管理者に何でも許すのではなく、次を絞ります。

- 接続できるEC2インスタンス（リソース/タグで限定）
- 使えるSSMドキュメント（`AWS-StartPortForwardingSessionToRemoteHost` など）
- セッション開始権限
- セッションログの保存先

EC2側にはIAM Roleが必要です。代表的には `AmazonSSMManagedInstanceCore` 相当の権限を持たせます（[10章](./10-iam-and-github-actions-oidc.md)）。

## 監査ログ

Session Managerはセッションログを CloudWatch Logs や S3 に保存できます。ポートフォワーディングの「中身（実際のDBクエリ）」を完全に記録できるわけではありませんが、「誰が・いつ・どのManaged Nodeへセッションを開始したか」は CloudTrail / SSM 側で追えます。本番DBへの手動接続は、権限と監査を必ず設計します。

## この方式のメリット

- RDSをpublicにしなくてよい
- SSH 22番を開けなくてよい
- SSH鍵の管理を避けられる
- IAMで接続権限を一元管理できる
- CloudTrail / SSM で監査しやすい

## Terraformで作る主なリソース

- `aws_instance`（管理用EC2、Private Subnet）
- `aws_iam_role` / `aws_iam_instance_profile`（`AmazonSSMManagedInstanceCore`）
- `aws_security_group`（管理用EC2用。inbound無し、outbound 5432→RDS / 443→SSM。[03章](./03-security-groups.md)）
- RDS SGに「管理用EC2 SGから5432」を許可するルール
- （NATがなければ）SSM関連の Interface VPC Endpoint（[04章](./04-nat-gateway-vs-vpc-endpoint.md)）
- （任意）セッションログ用 `aws_cloudwatch_log_group` / S3 と SSM の設定
- 管理者向け `aws_iam_policy`（`ssm:StartSession` を対象インスタンス・ドキュメントに限定）

## よくある誤解

### 「RDSにSSM Agentを入れれば直接繋げる」

RDSにはAgentを入れられません。だからRDSへ到達できるEC2を中継役にします。

### 「ポートフォワーディングするなら22番を開ける必要がある」

不要です。接続はEC2→Systems Managerのoutboundで確立します。inbound 22は開けません。

### 「localhost:15432 に繋ぐのは自分のPCのDB」

トンネルが張られている間は、その通信がSSM経由でRDSへ転送されます。手元のDBではありません。

### 「NAT GatewayがないとどうやってもSSMは使えない」

VPC Endpoint（`ssm`/`ssmmessages`/`ec2messages`）を作ればNATなしでも使えます。

## 理解チェック

- なぜRDSへ直接接続できないのか説明できるか
- なぜRDSではなくEC2をManaged Nodeにするのか説明できるか
- `localhost:15432` がなぜRDSに繋がるのか説明できるか
- 管理用EC2にinbound 22が不要な理由を説明できるか
- NAT GatewayなしでSSM接続するには何が必要か説明できるか

## 公式ドキュメント

- [AWS Systems Manager Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)
- [Starting a session (port forwarding to a remote host)](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-sessions-start.html)
- [Connect to your EC2 instance using Session Manager](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/connect-with-systems-manager-session-manager.html)
- [VPC endpoints for Systems Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/setup-create-vpc.html)
- [Logging session activity](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-logging.html)
