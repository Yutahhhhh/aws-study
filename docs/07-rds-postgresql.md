# 07. RDS PostgreSQL（Private 配置・Multi-AZ・Read Replica）

RDSは「DBを置くサービス」で間違いありませんが、本番で理解すべきは、DBエンジンそのものより **周辺設計** です。どこに置き、誰から許可し、どう冗長化し、どう復旧し、接続情報をどう渡すか。

## この章で理解すること

- なぜRDSをPrivate Subnetに置くのか
- DB subnet group が何を指定しているのか
- Multi-AZ（高可用性）と Read Replica（読み取り負荷分散）の違い
- Multi-AZ DB instance と Multi-AZ DB cluster の違い
- 接続情報（特にパスワード）の渡し方
- migration（スキーマ変更）を本番でどう実行するか

## 構成図のどこに該当するか

- 「RDS PostgreSQL（プライベート配置・外部公開なし・5432はECSのセキュリティグループからだけ許可）」の箱
- ECS Fargateタスクから RDS へ伸びる線

## 通信の流れ

DBへ接続するのはECSです。利用者がDBへ直接触れることはありません。

```text
利用者 -> CloudFront -> ALB -> ECS -> RDS:5432
管理者 -> SSM Session Manager -> 管理用EC2 -> RDS:5432   (09章)
```

したがってRDSのSecurity Groupは、ECS SG（と管理用EC2 SG）からの5432番のみを許可します。

```text
RDS SG inbound:
  port 5432, source = ECS SG
  port 5432, source = 管理用EC2 SG
```

## なぜ必要か

### RDSをPrivate Subnetに置く理由

利用者や外部がDBへ直接アクセスする必要がないからです。インターネットに公開すると攻撃面が一気に広がります。DBはVPCの奥（Private Subnet）に置き、`publicly_accessible = false` にし、SGで接続元をECSに限定します。これで「アプリ経由でしか触れないDB」になります。

### DB subnet group とは

RDSは **DB subnet group** で「DBを配置できるSubnet群」を指定します。本番では複数AZのPrivate Subnetを入れます。

```text
DB subnet group:
  private-subnet-a (AZ a)
  private-subnet-c (AZ c)
```

RDSをVPC内に置くには、**少なくとも2つの異なるAZのSubnet** が必要です。これはMulti-AZにしない場合でも要件で、AWSがstandbyやfailover先を確保できるようにするためです。

## Multi-AZ（高可用性）

RDSのMulti-AZは、DBの **可用性** を高める構成です。最も一般的な「Multi-AZ DB instance」では次のように動きます。

```text
AZ A: Primary DB   ← アプリが読み書きする
AZ C: Standby DB   ← 同期レプリケーション、通常は接続できない
```

- アプリが接続するのは1つの **エンドポイント**。普段はPrimaryに繋がります。
- Primaryに障害が起きると、RDSがStandbyへ **failover** し、同じエンドポイントの向き先が切り替わります。
- failover中は一時的に接続が切れるため、**アプリ側に再接続（リトライ）処理が必要**です。
- standbyは通常、読み取りにも使えません（あくまでfailover用）。

> 補足: 別形態として「Multi-AZ DB cluster」があり、こちらは1 writer + 2 readerの構成で、reader側を読み取りに使えます。要件が合えば選択肢になりますが、対応エンジン・バージョンに制約があります。まずは「Multi-AZ instance = 高可用性、standbyは読めない」を基準に理解してください。

## Read Replica（読み取り負荷分散）

Read Replicaは、読み取り専用のコピーを別に作って **読み取り負荷を分散** する仕組みです。

```text
Primary (読み書き)
   │ 非同期レプリケーション
   ▼
Read Replica (読み取り専用、別エンドポイント)
```

- 別のエンドポイントを持ち、アプリは「書き込みはPrimary、重い読み取りはReplica」と振り分けます。
- 非同期レプリケーションのため、**レプリケーション遅延**があり得ます（最新の書き込みが即座に反映されないことがある）。
- 主目的は負荷分散で、自動failoverの仕組みとは異なります。

## Multi-AZ と Read Replica の違い（まとめ）

| | Multi-AZ (instance) | Read Replica |
| --- | --- | --- |
| 主目的 | 高可用性・障害時failover | 読み取り負荷分散 |
| standby/replicaを読むか | 読まない | 読む |
| エンドポイント | 同じ（failoverで向き先が変わる） | 別エンドポイント |
| レプリケーション | 同期 | 非同期（遅延あり） |
| 自動failover | あり | （単体では）目的外 |

**よくある誤解:**「Multi-AZにすれば読み取り性能も自動で上がる」は誤りです。Multi-AZは可用性のための仕組みで、standbyは普通読めません。読み取りを分散したいならRead Replicaです。両方を組み合わせることもできます。

## 接続情報の渡し方（特にパスワード）

アプリ（Rails等）には次が必要です。

- DB host（RDSエンドポイント）/ port（5432）/ database / user / password

本番では、**passwordをTerraformコードやGitHubに直接書かない**ようにします。選択肢:

- **AWS Secrets Manager**（RDSと統合した自動ローテーションが可能）
- **SSM Parameter Store**（SecureString）
- ECS Task Definitionの `secrets` で、起動時にコンテナへ注入する

詳細とTerraform例は [08章](./08-secrets-and-parameters.md)。Private SubnetのECSがSecrets Managerへ到達するには、NAT GatewayまたはSecrets Manager Interface Endpointが必要です（[04章](./04-nat-gateway-vs-vpc-endpoint.md)）。

> Terraformの注意: `aws_db_instance` の `password` をtfに平文で書くと、stateにも平文で残ります。`manage_master_user_password = true`（Secrets Manager管理）を使うと、masterパスワードをAWS側で生成・管理でき、tfに平文を持たずに済みます。

## migration（スキーマ変更）の実行場所

RailsならDB migrationが必要です。代表的な選択肢:

### GitHub Actionsから直接RDSへ接続

RDSをpublicにしない限り直接は届きません。SSMトンネル等を挟む方法もありますが、本番デプロイの標準手段としてはおすすめしません。

### ECS Run Task でmigrationを実行（推奨）

本番構成では自然な方法です。アプリと同じVPC・SG・環境変数・secretsで、migration専用Taskを起動します。

```text
GitHub Actions
  -> aws ecs run-task (migration command)
  -> migration task (同じネットワーク/権限)
  -> RDS
```

再現性が高く、ネットワーク・権限の整合も取れます。デプロイ手順との組み込みは [11章](./11-deploy-flow.md)。

### SSM経由で管理用EC2から実行

手動運用や緊急対応ではあり得ます（[09章](./09-admin-access-ssm-port-forwarding.md)）。ただし再現性のあるデプロイにはECS Run Taskが向きます。

## バックアップ・保護の設定

- **自動バックアップ**（`backup_retention_period`）: 一定期間のスナップショットとポイントインタイムリカバリ。本番では1日以上に設定。
- **deletion protection**（`deletion_protection = true`）: 誤削除防止。
- **storage encryption**（`storage_encrypted = true`）: 保管時暗号化。後から有効化しづらいので最初から。
- **ログエクスポート / 拡張モニタリング**: スロークエリ等の調査用（[12章](./12-observability-logs-alarms.md)）。

## Terraformで作る主なリソース

- `aws_db_subnet_group`（Private Subnet 複数AZ）
- `aws_security_group`（RDS用。ECS SG / 管理用EC2 SG からの5432。[03章](./03-security-groups.md)）
- `aws_db_parameter_group`（必要に応じて）
- `aws_db_instance`（または Multi-AZ cluster 用に `aws_rds_cluster` + `aws_rds_cluster_instance`）
  - `multi_az`, `publicly_accessible = false`, `storage_encrypted`, `backup_retention_period`, `deletion_protection`, `manage_master_user_password`
- （任意）`aws_db_instance` の Read Replica（`replicate_source_db`）

## よくある誤解

### 「RDSはECSと同じSubnetに置かないと繋がらない」

同じVPC内でルーティングでき、SGが許可していれば別Subnetでも繋がります。

### 「Multi-AZにすれば読み取りも速くなる」

なりません。standbyは読めません。読み取り分散はRead Replicaです。

### 「failoverすればアプリは何もしなくてよい」

failover中は一時的に接続が切れます。アプリ側に再接続/リトライが必要です。

### 「パスワードはtfに書くしかない」

`manage_master_user_password` やSecrets Manager/SSMで、tfに平文を残さず渡せます。

### 「migrationはGitHub ActionsからRDSへ直接繋げばよい」

RDSがprivateなら直接は届きません。ECS Run Taskが本番では自然です。

## 理解チェック

- RDSをPublic Subnetに置かない理由を説明できるか
- DB subnet group が何を指定し、なぜ複数AZが必要か説明できるか
- Multi-AZ と Read Replica の違い（目的・読めるか・エンドポイント・遅延）を説明できるか
- failover時にアプリ側で必要な対応を説明できるか
- DBパスワードをtfに平文で持たない方法を説明できるか
- 本番でmigrationをどう実行するか説明できるか

## 公式ドキュメント

- [Working with an Amazon RDS DB instance in a VPC](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_VPC.WorkingWithRDSInstanceinaVPC.html)
- [Multi-AZ DB instance deployments](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html)
- [Multi-AZ DB cluster deployments](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZDBClusters.html)
- [Working with read replicas](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html)
- [Password management with Amazon RDS and Secrets Manager](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-secrets-manager.html)
- [Controlling access with security groups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.RDSSecurityGroups.html)
