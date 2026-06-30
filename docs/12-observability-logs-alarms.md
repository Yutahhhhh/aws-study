# 12. 監視・ログ・アラーム

本番構成では「動いている」だけでなく「異常に気づける」ことが必要です。この章では、最低限見るべきログ・メトリクス・アラーム、そしてWAFの位置づけを整理します。

## この章で理解すること

- 各レイヤ（CloudFront / ALB / ECS / RDS / VPC）でどんなログ・メトリクスが取れるか
- 本番で最低限作るべきアラームの例
- ログとメトリクスとアラームの役割の違い
- WAF / Security Group / 認証認可 の守備範囲の違い

## 構成図のどこに該当するか

- 「セキュリティ・監視（CloudWatch Logs / アラーム / X-Ray / VPC Flow Logs）」の箱
- 「WAF WebACLは定義あり。関連付けはこの図では経路に含めない」の注記
- 各コンポーネント（CloudFront / ALB / ECS / RDS）が監視対象

## なぜ必要か

障害は必ず起きます。重要なのは「起きたことに早く気づき、どこが原因かを切り分けられる」ことです。そのために、各レイヤがログとメトリクスを出し、閾値を超えたらアラームで通知する、という土台を最初から作ります。切り分けの実践は [13章](./13-troubleshooting.md)。

## 3つの役割を区別する

| 種類 | 役割 | 例 |
| --- | --- | --- |
| **ログ** | 何が起きたかの記録（事後調査） | アプリのエラーログ、ALBアクセスログ |
| **メトリクス** | 数値の時系列（傾向・現状把握） | CPU使用率、5xxの数、DB接続数 |
| **アラーム** | 閾値超過の通知（即時検知） | 5xxが急増、CPUが高止まり |

ログだけでは「気づけない」、メトリクスだけでは「原因がわからない」ことがあります。3つを組み合わせます。

## レイヤ別に取れるもの

### CloudFront

- **標準/リアルタイムログ**: リクエスト単位の記録（エッジでの結果、キャッシュヒット率など）。
- **メトリクス**: リクエスト数、4xx/5xxレート、キャッシュヒット率など。

### ALB

- **アクセスログ**: S3へ出力。各リクエストの処理時間、ターゲット応答、ステータスコードがわかる。切り分けに有用。
- **メトリクス**: `HTTPCode_ELB_5XX_Count`（ALB自身の5xx）、`HTTPCode_Target_5XX_Count`（ターゲット=ECSの5xx）、`TargetResponseTime`、`HealthyHostCount` / `UnHealthyHostCount`、`RequestCount`。

> `ELB_5XX` と `Target_5XX` の区別が切り分けの鍵です。前者はALB/インフラ側、後者はアプリ側の問題を示唆します。

### ECS（アプリ）

- **CloudWatch Logs**: Task Definitionの `logConfiguration`（`awslogs` ドライバ）でコンテナの標準出力をLog Groupへ送る。アプリのエラーはここに出ます（[06章](./06-ecs-fargate-autoscaling.md)）。
- **メトリクス**: Service単位のCPU/メモリ使用率、稼働Task数。
- **X-Ray**（任意）: 分散トレーシング。リクエストがどのサービスでどれだけ時間を使ったかを追える。

### RDS

- **メトリクス**: `CPUUtilization`、`FreeStorageSpace`、`DatabaseConnections`、`FreeableMemory`、`ReadLatency` / `WriteLatency`、レプリカ遅延。
- **ログエクスポート**: PostgreSQLログ（スロークエリ等）をCloudWatch Logsへ。

### VPC

- **VPC Flow Logs**: ENI単位の通信の許可/拒否を記録。SGやルートの問題、想定外の通信の調査に使う。

## 本番で最低限作るアラームの例

すべて閾値は構成・負荷で調整します。まずは「明らかにおかしい」状態を拾うところから。

| 対象 | メトリクス | アラームの意図 |
| --- | --- | --- |
| ALB | `HTTPCode_Target_5XX_Count` 急増 | アプリがエラーを返している |
| ALB | `HTTPCode_ELB_5XX_Count` 急増 | ターゲット不在/ALB側問題 |
| ALB | `UnHealthyHostCount` > 0 が継続 | Taskがhealth checkに落ちている |
| ALB | `TargetResponseTime` 上昇 | アプリが遅い |
| ECS | CPU/メモリ使用率 高止まり | スケール不足・リーク |
| ECS | 稼働Task数 < desired | Taskが起動できていない |
| RDS | `CPUUtilization` 高止まり | クエリ過負荷 |
| RDS | `FreeStorageSpace` 低下 | ディスク枯渇（停止に直結） |
| RDS | `DatabaseConnections` 上限接近 | コネクション枯渇 |

アラームは CloudWatch Alarm → SNS → メール/Slack/PagerDuty のように通知先へ繋ぎます。

## WAF / Security Group / 認証認可 の守備範囲

「セキュリティ」と一括りにしがちですが、層が違います。

| 仕組み | 層 | 守るもの |
| --- | --- | --- |
| **Security Group** | L3/L4（IP・ポート） | 「誰が誰に接続してよいか」（[03章](./03-security-groups.md)） |
| **WAF** | L7（HTTPの中身） | SQLi/XSS、悪性パターン、レート制限、地理制限 |
| **認証・認可（アプリ/IAM）** | アプリ・API | 「このユーザーはこの操作をしてよいか」 |

WAFはCloudFrontまたはALBに関連付けます（構成図では「WebACL定義あり、関連付けは図に含めない」と注記）。SGがポートを閉じても、開いているポートに来る悪性リクエストはWAFやアプリ側で弾きます。役割が重ならないので、どれか1つでは足りません。

## Terraformで作る主なリソース

- `aws_cloudwatch_log_group`（ECSアプリ用、SSMセッション用など）
- `aws_cloudwatch_metric_alarm`（上表の各アラーム）
- `aws_sns_topic` / `aws_sns_topic_subscription`（通知先）
- `aws_lb`（`access_logs` ブロックでS3出力） / アクセスログ用S3 bucket + policy
- `aws_flow_log`（VPC Flow Logs）
- `aws_wafv2_web_acl` / `aws_wafv2_web_acl_association`（CloudFront/ALBに関連付け）
- （任意）`aws_cloudwatch_dashboard`（一覧ダッシュボード）

## よくある誤解

### 「ログを出していれば監視は十分」

ログは事後調査用です。即時検知にはアラームが要ります。気づけなければ調査も始まりません。

### 「5xxは全部アプリのバグ」

`ELB_5XX`（ターゲット不在やALB側）と `Target_5XX`（アプリ側）は別物です。区別しないと原因を見誤ります。

### 「WAFを付ければSGは不要」

層が違います。WAFはL7、SGはL3/L4。両方必要です。

### 「RDSのストレージは自動で無限に増える」

ストレージ自動拡張を有効にしても上限があります。`FreeStorageSpace` のアラームは必須級です（枯渇はDB停止に直結）。

## 理解チェック

- ログ・メトリクス・アラームの役割の違いを説明できるか
- ALBの `ELB_5XX` と `Target_5XX` の違いを説明できるか
- 本番で最低限作るべきアラームを3つ以上挙げられるか
- アプリエラー / ALBエラー / ECS起動失敗 / DB問題 をどのログ・メトリクスで切り分けるか説明できるか
- WAF / SG / 認証認可 の守備範囲の違いを説明できるか

## 公式ドキュメント

- [Logging and monitoring in Amazon ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-logging-monitoring.html)
- [CloudWatch metrics for your Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-cloudwatch-metrics.html)
- [Access logs for your Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-access-logs.html)
- [Monitoring metrics in an Amazon RDS instance](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/monitoring-cloudwatch.html)
- [VPC Flow Logs](https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs.html)
- [Using CloudWatch alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html)
- [How AWS WAF works](https://docs.aws.amazon.com/waf/latest/developerguide/how-aws-waf-works.html)
