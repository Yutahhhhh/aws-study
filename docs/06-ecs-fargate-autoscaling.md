# 06. ECS Fargate と Auto Scaling

構成図のなかで一番つかみにくいのが「ECSが何を増やしているのか」です。この章で、Cluster / Task Definition / Task / Service / Target Group / Auto Scaling の関係を整理します。

結論を先に言うと、Fargate構成で増減する主役はEC2ではなく **ECS Task** です。

## この章で理解すること

- ECSの構成要素（Cluster / Task Definition / Task / Service）の関係
- ServiceとTaskの違い、desired_count の意味
- ECS ServiceとALB Target Groupがどう結びつくか（`awsvpc` とENI）
- Service Auto Scaling が何を増減するのか、どの指標で動くのか
- デプロイ時にTaskがどう入れ替わるか

## 構成図のどこに該当するか

- 「ECS Fargateタスク（コンテナ :3000 / awsvpc）」（Private Subnet A）
- 「ECS Fargateタスク（希望タスク数 3 / 自動スケール）」（Private Subnet C）
- 「ターゲットグループ（生きているECSタスクのIP一覧）」

## ECSの構成要素

### Cluster

ECSの論理的な置き場（グルーピング単位）です。Fargateの場合は「EC2インスタンスの集合」というより、ServiceやTaskをまとめる箱として捉えると分かりやすいです。

### Task Definition（設計図）

コンテナの設計図です。主に次を定義します。

- どのDocker imageを使うか（ECRのURI）
- CPU / メモリのサイズ
- コンテナポート（この構成では3000）
- 環境変数（`environment`）
- 秘密情報（`secrets`：Secrets ManagerやSSMから注入。[08章](./08-secrets-and-parameters.md)）
- ログ出力先（`logConfiguration`：CloudWatch Logs）
- `executionRoleArn`（imageのpullやsecret取得をECSエージェントが行うためのロール）
- `taskRoleArn`（アプリ自身がAWS APIを呼ぶためのロール）

Task Definitionは更新するたびに **revision** が増えます（`:1`, `:2`, ...）。デプロイは新しいrevisionへの差し替えです。

### Task（実体）

Task Definitionから実際に起動されたコンテナの実行単位です。構成図の「ECS Fargateタスク」がこれです。Fargateでは、Taskごとにマイクロな仮想環境が割り当てられ、EC2を意識しません。

### Service（維持する仕組み）

指定した数のTaskを **維持** する仕組みです。`desired_count = 3` なら、ECS Serviceは常に3つのTaskが動くようにし、Taskが落ちれば代わりを起動します。ALBとの紐づけや、Auto Scaling、デプロイの制御もServiceが担います。

```text
Task Definition (設計図)
      │ から起動
      ▼
   Task × desired_count   ← Service が数を維持
      │ 登録
      ▼
  Target Group  ← ALB が転送先として参照
```

## 通信の流れ（ALBとの関係）

ECS ServiceをALBのTarget Groupに紐づけると、起動したTaskが自動でTarget Groupに登録されます。

Fargateの `awsvpc` ネットワークモードでは、**TaskごとにENIとPrivate IPが割り当てられます**。ALBはTarget Group（`target_type = "ip"`）に登録されたTaskのPrivate IPへ直接転送します。

```text
ALB
  -> Target Group
  -> 10.2.11.x:3000 のTask (AZ a)
  -> 10.2.12.x:3000 のTask (AZ c)
```

ALBはhealth check（例: `GET /health`）に通ったTaskにだけ振り分けます。新しいTaskはhealth checkに通って初めてトラフィックを受けます。

## Auto Scalingが増減するもの

ECS **Service** Auto Scalingは、Serviceの `desired_count` を自動で増減します。EC2台数の話ではありません。

```text
min_capacity  = 2   ← これ未満には減らさない
desired_count = 3   ← 現在の希望数（Auto Scalingが書き換える）
max_capacity  = 8   ← これより上には増やさない
```

アクセス増でCPU使用率が高い状態が続くと `desired_count` を増やし、アクセスが減ると減らします（min未満にはならない）。

### よく使うスケーリング指標

- **CPU使用率**（`ECSServiceAverageCPUUtilization`）: CPUを使う処理が中心なら分かりやすい。例: 60%付近を維持。
- **メモリ使用率**（`ECSServiceAverageMemoryUtilization`）: メモリが先に詰まるアプリ（Rails等で起きやすい）向け。例: 70%付近。
- **ALB Request Count Per Target**（`ALBRequestCountPerTarget`）: 1Taskあたりリクエスト数で増減。I/O待ちが多くCPUに現れにくいHTTP APIに合うことがある。

### Target Trackingのイメージ

Target Tracking方式は、指定したメトリクスを目標値付近に保ちます。エアコンの設定温度のように、目標から外れると増減する、という挙動です。

```text
CPU目標 60%
  現在 85% -> Taskを増やす
  現在 35% -> Taskを減らす
```

急な増減を抑えるため、scale-in / scale-out のクールダウンも検討します。

## Multi-AZ と Task配置

ECS ServiceにPrivate Subnet A と C を指定しておくと、TaskはAZをまたいで配置されます。Fargateでは、利用可能なAZ間でTask数のバランスを保とうとします（rebalancing）。

```text
desired_count = 3 の例
  AZ A: 2 tasks
  AZ C: 1 task   ← 奇数は完全には割り切れない

desired_count = 4 の例
  AZ A: 2 tasks
  AZ C: 2 tasks
```

片方のAZが落ちても、もう片方のTaskでサービスを継続できます（[02章](./02-multi-az-and-subnets.md)）。

## デプロイ時に何が起きるか

新しいimageをECRへpushし、新しいTask Definition revisionでServiceを更新すると、典型的には次のように入れ替わります（ローリングデプロイ）。

```text
1. 新しいrevisionのTaskを起動
2. ALB Target Group の health check に通るのを待つ
3. 通ったら、古いTaskを停止
4. desired_count を保ちながら徐々に入れ替える
```

そのため、**health checkに通らないとデプロイが進まない**（または失敗してロールバック対象になる）点が重要です。デプロイの全体像は [11章](./11-deploy-flow.md)。

## 混同しやすい2つのAuto Scaling

- **ECS Service Auto Scaling**: Task数を増減。Fargateで普段考えるのはこちら。
- **ECS Cluster Auto Scaling**: EC2起動タイプで、ClusterのEC2インスタンス台数を増減する話。Fargateでは自分でEC2を持たないため、まずは考えなくてよい。

## Terraformで作る主なリソース

- `aws_ecs_cluster`
- `aws_ecs_task_definition`
- `aws_ecs_service`（`network_configuration` に Private Subnet と ECS SG、`load_balancer` に Target Group）
- `aws_lb_target_group`（`target_type = "ip"`） / `aws_lb_listener_rule`
- `aws_appautoscaling_target`（min/max capacity）
- `aws_appautoscaling_policy`（Target Tracking）
- `aws_cloudwatch_log_group`（ログ出力先）
- `aws_iam_role`（task execution role / task role。[10章](./10-iam-and-github-actions-oidc.md)）
- `aws_security_group`（ECS用。[03章](./03-security-groups.md)）

## よくある誤解

### 「Fargateでもサーバー（EC2）が増える」

増えるのはTaskです。FargateではEC2を持ちません。EC2台数を増減するのはEC2起動タイプの話です。

### 「Target Groupにはサーバー名やドメインを登録する」

この構成では `target_type = "ip"` で、TaskのPrivate IPが登録されます。Fargate + awsvpc だからこそIP単位になります。

### 「desired_count を上げれば自動でずっと増える」

`desired_count` は現在の希望値です。Auto Scalingが指標に応じてこれを書き換えます。上限は `max_capacity` で止まります。

### 「Multi-AZにすればTaskは必ず均等に分かれる」

奇数だと完全には割り切れません（例: 3 = 2 + 1）。ECSはバランスを「保とうとする」もので、常に完全均等ではありません。

### 「デプロイは即座に全Taskが入れ替わる」

ローリングデプロイでは、新Taskがhealth checkに通ってから旧Taskを止めます。health checkが通らないと進みません。

## 理解チェック

- ECS ServiceとECS Taskの違いを説明できるか
- Fargateで増減する単位がTaskである理由を説明できるか
- Target Groupに何が登録されるか（awsvpcとの関係）を説明できるか
- desired_count / min_capacity / max_capacity の違いを説明できるか
- CPUスケールとRequest Countスケールの使い分けを説明できるか
- デプロイ中にhealth checkが果たす役割を説明できるか

## 公式ドキュメント

- [Amazon ECS service auto scaling](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-auto-scaling.html)
- [Target tracking scaling policies for Amazon ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-autoscaling-targettracking.html)
- [Fargate task networking (awsvpc)](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-task-networking.html)
- [Balancing an Amazon ECS service across Availability Zones](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-rebalancing.html)
- [Amazon ECS deployment types](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-types.html)
