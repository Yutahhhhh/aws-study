# 02. Multi-AZ とサブネット設計

この章は、構成図の土台になる「ネットワークをどう区切るか」の話です。ALB・ECS・RDSをどこに置くかは、すべてこのSubnet設計の上に乗ります。

## この章で理解すること

- Region / AZ / VPC / Subnet の関係
- 1つのSubnetが1つのAZにしか属せないこと、そこから来る設計上の制約
- Public Subnet と Private Subnet の違いを「ルートテーブル」で説明できること
- なぜPublicもPrivateも複数AZに作るのか
- Multi-AZ で守れるもの・守れないもの

## 構成図のどこに該当するか

構成図の `VPC 10.2.0.0/16` の枠と、その中の `ap-northeast-1a 相当` / `ap-northeast-1c 相当` の2つの領域、そしてその中の以下が該当します。

- パブリックサブネットA `10.2.1.0/24`（ルート: `0.0.0.0/0 -> Internet Gateway`）
- パブリックサブネットC（同上）
- プライベートサブネットA `10.2.11.0/24`（ルート: `0.0.0.0/0 -> NAT Gateway A`）
- プライベートサブネットC `10.2.12.0/24`（ルート: `0.0.0.0/0 -> NAT Gateway C`）
- Internet Gateway、NAT Gateway A / C

## 通信の流れ（ルートテーブルが決める）

Subnetの性格は、関連づけられたルートテーブルで決まります。

**Public Subnet のルートテーブル:**

```text
10.2.0.0/16  -> local        (VPC内はそのまま)
0.0.0.0/0    -> Internet Gateway
```

**Private Subnet A のルートテーブル:**

```text
10.2.0.0/16  -> local
0.0.0.0/0    -> NAT Gateway A
```

**Private Subnet C のルートテーブル:**

```text
10.2.0.0/16  -> local
0.0.0.0/0    -> NAT Gateway C
```

この違いが「外から直接入れるか」「内側から外へ出られるか」を決めます。

- Public Subnet は `0.0.0.0/0` がInternet Gatewayを向くため、（SGとNACLが許せば）インターネットと双方向に通信できます。
- Private Subnet は `0.0.0.0/0` がNAT Gatewayを向くため、**内側から外へ出ることはできても、外から直接入ることはできません**。NAT Gatewayは「出ていく通信の戻り」しか通さないためです。

## なぜ必要か

### Region と AZ

- **Region** は地理的に離れたインフラ群です（例: 東京 `ap-northeast-1`）。
- **AZ (Availability Zone)** は、1つのRegion内にある、電源・空調・物理ネットワークが独立したデータセンター群です。

東京リージョンには例として次のようなAZがあります。

```text
ap-northeast-1a
ap-northeast-1c
ap-northeast-1d
```

> 補足: AZ名（`-1a` など）と物理的な場所の対応は、AWSアカウントごとにシャッフルされています。あるアカウントの `1a` と別アカウントの `1a` が同じ物理データセンターとは限りません。重要なのは名前ではなく「複数AZに分散させること」です。

### SubnetはAZをまたげない

ここが設計の出発点です。**1つのSubnetは、必ず1つのAZに属します。** 1つのSubnetを2つのAZにまたがせることはできません。

そのため、Multi-AZ構成にしたい場合は、AZの数だけSubnetを作る必要があります。

```text
Public Subnet A   -> ap-northeast-1a
Private Subnet A  -> ap-northeast-1a

Public Subnet C   -> ap-northeast-1c
Private Subnet C  -> ap-northeast-1c
```

### なぜPublic Subnetを複数AZに置くのか

ALBとNAT GatewayをAZごとに置くためです。

- **ALB** は複数AZのPublic Subnetに配置することで、片方のAZに問題が起きても、もう片方のAZで入口を維持できます。ALBは指定したSubnetそれぞれにノードを持ちます。
- **NAT Gateway** もAZごとに置くと、「Private Subnet AはNAT Gateway Aへ、Private Subnet CはNAT Gateway Cへ」という構成にでき、AZ障害の影響を閉じ込められます。

### なぜPrivate Subnetを複数AZに置くのか

ECS TaskとRDSを複数AZに配置するためです。

- **ECS Service** に複数のPrivate Subnetを指定すると、ECSはそれらのSubnet（=AZ）にTaskを分散して配置できます。→ [06章](./06-ecs-fargate-autoscaling.md)
- **RDS** をMulti-AZ構成にするには、DB subnet groupに少なくとも2つの異なるAZのSubnetが必要です。→ [07章](./07-rds-postgresql.md)

### NAT GatewayをAZごとに置く理由

Private Subnet Aが別AZのNAT Gateway Cへ出る構成でも、通信自体は成立します。ただし次の理由から、本番では「Private Subnetごとに同じAZのNAT Gatewayへ向ける」設計がよく使われます。

- AZ障害時に、片方のAZのNAT Gatewayが落ちても、もう片方のAZのPrivate Subnetは影響を受けない（障害を閉じ込められる）
- AZをまたぐ通信にはデータ転送料金がかかる
- AZをまたぐ分、わずかに遅延が増える

> コストを優先する非本番環境では、NAT Gatewayを1つだけにして両Private Subnetから共有する構成もあります。トレードオフは [04章](./04-nat-gateway-vs-vpc-endpoint.md) と [15章](./15-cost.md) で扱います。

## CIDR設計の考え方（最低限）

- VPC CIDR（例: `10.2.0.0/16`）は、後から広げにくいので最初に余裕をもって決めます。
- Subnetはその範囲を分割します。図では `/24`（256アドレス、実際に使えるのは予約分を除いて251個）を使っています。
- Public用に小さめ、Private用に大きめなど、用途に応じて分けます。ECS Fargateの `awsvpc` モードはTaskごとにIPを消費するため、Taskが増える前提のPrivate Subnetはアドレス枯渇に注意します。

## Multi-AZ で守れるもの・守れないもの

Multi-AZは「絶対に落ちない魔法」ではありません。**1つのAZに依存しないための設計**です。

**守りやすくなるもの:**

- 1つのAZ全体の障害
- 1つのECS Taskの障害（別Taskが受ける）
- 1つのALBノードの障害
- RDS primary側の障害時のfailover

**Multi-AZでは守れないもの:**

- アプリケーションのバグ
- DBスキーマ変更（migration）のミス
- 認証情報の漏洩
- 全AZにまたがるリージョン規模の障害
- Security Groupやルートテーブルの設定ミス（むしろ全AZに等しく効く）

## Terraformで作る主なリソース

- `aws_vpc`
- `aws_subnet`（Public A/C、Private A/C の計4つ以上）
- `aws_internet_gateway`
- `aws_eip`（NAT Gateway用、AZごと）
- `aws_nat_gateway`（AZごと）
- `aws_route_table`（Public用1つ、Private用はAZごと）
- `aws_route`（`0.0.0.0/0` の宛先）
- `aws_route_table_association`（SubnetとRoute Tableの紐づけ）

> Tips: 実務では `terraform-aws-modules/vpc/aws` のような公開モジュールでこの一式を作ることも多いです。モジュールの考え方は [14章](./14-terraform-structure-and-order.md)。

## よくある誤解

### 「Subnetを大きく1つ作ればMulti-AZになる」

なりません。Subnetは1AZ固定なので、AZ分散にはAZの数だけSubnetが必要です。

### 「Private Subnetは外と一切通信できない」

逆方向（内側から外へ出る通信）はNAT GatewayやVPC Endpointで可能です。「外から入れない」だけです。

### 「NAT Gatewayは安いから1つで十分」

非本番ならありです。ただし本番では、そのNAT Gatewayがあるロが落ちると全Private Subnetの外向き通信が止まります。可用性とコストのトレードオフとして判断します。

### 「ECSとRDSは同じSubnetに置かないと通信できない」

同じVPC内でルーティングでき、SGが許可していれば別Subnetでも通信できます。

## 理解チェック

- 1つのSubnetが複数AZにまたがれない理由を説明できるか
- Public SubnetとPrivate Subnetの違いを「ルートテーブル」で説明できるか
- なぜPublicもPrivateも2AZに作るのか説明できるか
- NAT Gatewayを1つだけにすると何が弱くなるか説明できるか
- ECS Serviceに複数Subnetを渡す意味を説明できるか
- RDSのDB subnet groupがなぜ複数AZのSubnetを必要とするか説明できるか
- Multi-AZで「守れること」と「守れないこと」を2つずつ挙げられるか

## 公式ドキュメント

- [Regions and Availability Zones](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html)
- [Subnets for your VPC](https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html)
- [Route tables for your VPC](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Route_Tables.html)
- [NAT gateways](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)
- [Availability Zones for Application Load Balancers](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/network-load-balancer-components.html)
- [Multi-AZ DB instance deployments](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html)
