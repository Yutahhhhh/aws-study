# 16. 構築チェックリスト

この資料は、`terraform-aws / prod` 構成を構築する前後に、理解・設計・Terraform実装・運用を確認するためのチェックリストです。各項目には参照章を付けています。詰まったら該当章へ戻ってください。

> 使い方: 上から順に埋める必要はありません。[14章](./14-terraform-structure-and-order.md) の依存順を意識しつつ、各レイヤを行き来して構いません。

## 1. ネットワーク（[02](./02-multi-az-and-subnets.md) / [04](./04-nat-gateway-vs-vpc-endpoint.md)）

- [ ] VPC CIDRを決めた（将来の拡張を考慮）
- [ ] Public Subnetを2AZ以上に作った
- [ ] Private Subnetを2AZ以上に作った
- [ ] Public Route Tableで `0.0.0.0/0 -> Internet Gateway` を設定した
- [ ] Private Route Tableで `0.0.0.0/0 -> NAT Gateway` を設定した
- [ ] NAT GatewayをAZごとにするか、コスト優先で1つにするか判断した
- [ ] VPC Endpointで置き換える通信（S3 Gateway / ECR / Logs / Secrets / SSM）を決めた

理解確認:

- Public/Private Subnetの違いをルートテーブルで説明できる
- AZごとにSubnetを作る理由を説明できる
- NATとVPC Endpointの使い分けを説明できる

## 2. Security Group（[03](./03-security-groups.md)）

- [ ] ALB SG（80/443 inbound）を作った
- [ ] ECS SG（ALB SGからコンテナポートのみ inbound）を作った
- [ ] RDS SG（ECS SG / 管理EC2 SGから5432のみ inbound）を作った
- [ ] 管理用EC2 SG（inbound無し）を作った
- [ ] VPC Endpoint SG（ECS/管理EC2から443）を作った
- [ ] 許可元をIPではなくSG参照で書いた
- [ ] SG相互参照の循環を避ける構造にした

理解確認:

- ALB→ECS→RDS のSGチェーンをsource指定まで書ける
- SGとNACL、SGとWAFの守備範囲の違いを説明できる

## 3. CloudFront / S3 / OAC（[05](./05-cloudfront-s3-alb-api-routing.md)）

- [ ] S3 bucketを作り、publicにしていない
- [ ] CloudFront OACを作った
- [ ] S3 bucket policyでCloudFront OACからの読み取りを許可した
- [ ] CloudFront default behaviorをS3 originへ向けた
- [ ] SPA fallback（Custom Error Response等）の扱いを決めた
- [ ] ACM証明書を **us-east-1** で用意した（CloudFront用）
- [ ] Route 53 aliasをCloudFrontへ向けた

理解確認:

- CloudFrontを通さずS3を直接読ませない仕組みを説明できる
- SPAで `/settings` を直接開いた時の挙動を説明できる
- CloudFront用ACM証明書のリージョン制約を説明できる

## 4. CloudFront / API / ALB（[05](./05-cloudfront-s3-alb-api-routing.md)）

- [ ] ALB originをCloudFrontに追加した
- [ ] `/api/*` behaviorをALB originへ向けた
- [ ] API behaviorでHTTP methodsを適切に許可した
- [ ] Authorization / Cookie / Query string の転送方針を決めた
- [ ] APIのキャッシュ方針（無効/極小TTL）を決めた
- [ ] CloudFront→ALBのHTTPSを設定した
- [ ] Host header / Rails `config.hosts` の影響を確認した
- [ ] ALBをCloudFront経由に絞る方法を検討した

理解確認:

- `/api/*` がS3ではなくALBへ行く理由を説明できる
- APIに静的ファイルと同じキャッシュを使う危険を説明できる

## 5. ALB（[05](./05-cloudfront-s3-alb-api-routing.md)）

- [ ] internet-facing ALBをPublic Subnet（複数AZ）に配置した
- [ ] ALB SGで80/443を許可した
- [ ] HTTP→HTTPSのリダイレクトを設定した
- [ ] HTTPS listenerを作った
- [ ] Target Group（`target_type = "ip"`）を作った
- [ ] Health check path（例 `/health`）を決めた
- [ ] `/api/*` 等のlistener ruleでTarget Groupへ転送した

理解確認:

- ALBがPublic、ECSがPrivateにいる理由を説明できる
- Target GroupがTaskのIPを持つ理由を説明できる

## 6. ECS / ECR（[06](./06-ecs-fargate-autoscaling.md) / [08](./08-secrets-and-parameters.md) / [10](./10-iam-and-github-actions-oidc.md)）

- [ ] ECR repositoryを作った
- [ ] GitHub ActionsからECRへpushできる（OIDC）
- [ ] ECS Clusterを作った
- [ ] Task Definitionを作った（image / CPU / memory / port）
- [ ] ECS Serviceを作り、Private Subnetを複数指定した
- [ ] ECS SGでALB SGからコンテナポートのみ許可した
- [ ] CloudWatch Logsへ出力した
- [ ] task execution roleを作った（ECR pull / Logs / Secrets取得）
- [ ] task roleを作った（アプリが必要な権限のみ）
- [ ] Secrets Manager / SSM から `secrets` でsecretを渡した

理解確認:

- Task Definition / Task / Service の違いを説明できる
- execution roleとtask roleの違いを説明できる

## 7. ECS Auto Scaling（[06](./06-ecs-fargate-autoscaling.md)）

- [ ] min / desired / max capacity を決めた
- [ ] CPU / Memory / Request Count のどれでscaleするか決めた
- [ ] Target Tracking policyを作った
- [ ] scale-in / scale-out cooldownを検討した
- [ ] デプロイ中のdesired変化とローリング入れ替えを理解した

理解確認:

- desired_countとAuto Scalingの関係を説明できる
- CPU scalingとRequest Count scalingの使い分けを説明できる

## 8. RDS（[07](./07-rds-postgresql.md) / [08](./08-secrets-and-parameters.md)）

- [ ] DB subnet groupをPrivate Subnet複数AZで作った
- [ ] RDS SGでECS SGから5432のみ許可した
- [ ] `publicly_accessible = false` にした
- [ ] Multi-AZを有効にするか決めた
- [ ] backup retentionを決めた
- [ ] deletion protectionを決めた
- [ ] storage encryptionを有効にした
- [ ] DB credentialをSecrets Manager等で管理した（tfに平文を残さない）
- [ ] migration実行方法（ECS Run Task推奨）を決めた

理解確認:

- Multi-AZとRead Replicaの違いを説明できる
- ECSからRDSへ接続できる条件を説明できる
- パスワードをtfに平文で持たない方法を説明できる

## 9. Secrets / Parameter（[08](./08-secrets-and-parameters.md)）

- [ ] 秘密はSecrets Manager / SSM SecureStringに置いた
- [ ] Task Definitionの `secrets` でARN参照した
- [ ] execution roleに対象ARNだけの取得権限を付けた
- [ ] Private SubnetからSecrets/SSMへの経路（NAT or Endpoint）を確保した

理解確認:

- `environment` と `secrets` の違いを説明できる
- 秘密取得に必要な権限と経路を説明できる

## 10. SSM管理者アクセス（[09](./09-admin-access-ssm-port-forwarding.md)）

- [ ] 管理用EC2をPrivate Subnetに作った
- [ ] 管理用EC2にSSM用IAM role（`AmazonSSMManagedInstanceCore`）を付けた
- [ ] 管理用EC2がSystems Managerへ到達できる（NAT or Endpoint）
- [ ] RDS SGで管理用EC2 SGから5432を許可した
- [ ] 管理者IAM policy（`ssm:StartSession` を限定）を作った
- [ ] 手元PCにSession Manager pluginを入れた
- [ ] port forwardingコマンドを確認した
- [ ] セッションログ保存を検討した

理解確認:

- RDSをpublicにせず接続できる理由を説明できる
- 管理用EC2にSSH inboundが不要な理由を説明できる

## 11. CI/CD（[10](./10-iam-and-github-actions-oidc.md) / [11](./11-deploy-flow.md)）

- [ ] GitHub OIDC providerをAWS側に作った
- [ ] GitHub Actions用デプロイroleを作り、trust policyでrepo/branchを絞った
- [ ] ECR push / ECS update 権限を付与した
- [ ] Terraform apply用roleとアプリdeploy用roleを分けるか判断した
- [ ] frontend buildをS3 syncする
- [ ] CloudFront invalidationを実行する
- [ ] backend imageをECRへpushする
- [ ] migrationをECS Run Taskで実行する
- [ ] ECS Serviceを更新する

理解確認:

- フロントエンド配信更新とバックエンドデプロイの違いを説明できる
- OIDCで長期キーを置かない理由を説明できる

## 12. 監視・セキュリティ（[12](./12-observability-logs-alarms.md)）

- [ ] CloudWatch Logsを確認できる
- [ ] ALB access logs / CloudFront logs / RDS logs を出すか決めた
- [ ] CloudWatch Alarmを作った（ECS CPU/Mem、ALB 5xx、RDS CPU/storage/connections）
- [ ] アラーム通知先（SNS等）を設定した
- [ ] WAFをCloudFrontまたはALBに付けるか決めた
- [ ] VPC Flow Logsを出すか決めた
- [ ] Log Groupに保持期間を設定した

理解確認:

- ALBの `ELB_5XX` と `Target_5XX` の違いを説明できる
- WAF / SG / 認証認可 の守備範囲の違いを説明できる

## 13. コスト（[15](./15-cost.md)）

- [ ] 常時課金されるリソース（NAT / ALB / RDS / Endpoint / Fargate min）を把握した
- [ ] dev/prodの差分（Multi-AZ / NAT数 / min capacity / log retention）を変数化した
- [ ] コスト配分タグを付けた

理解確認:

- 「起動しているだけで課金される」リソースを挙げられる

## 14. Terraform 構成（[14](./14-terraform-structure-and-order.md)）

- [ ] モジュール/環境ディレクトリの分割方針を決めた
- [ ] リモートstate（S3 + ロック）を設定した
- [ ] dev/prodのstateを分けた
- [ ] `fmt` / `validate` / `plan` をCIで回す
- [ ] 依存順（network → SG → data → ALB → ECS → edge）を理解した

## 最後の確認：構築できる状態とは

この構成を構築できる状態とは、Terraformリソース名を暗記している状態ではありません。次を自分の言葉で説明できる状態です。

- 利用者のリクエストがどの順番で流れるか（[01](./01-prod-architecture-map.md)）
- APIだけがALBへ行く理由（[05](./05-cloudfront-s3-alb-api-routing.md)）
- ECS TaskがPrivate Subnetでも動ける理由（[02](./02-multi-az-and-subnets.md) / [04](./04-nat-gateway-vs-vpc-endpoint.md)）
- ECS Taskが外部/AWSサービスへ接続できる理由（[04](./04-nat-gateway-vs-vpc-endpoint.md)）
- RDSが外部公開されていなくてもECSから使える理由（[03](./03-security-groups.md) / [07](./07-rds-postgresql.md)）
- 秘密情報をコードに書かずに渡す方法（[08](./08-secrets-and-parameters.md)）
- 管理者がRDSへ安全に接続できる理由（[09](./09-admin-access-ssm-port-forwarding.md)）
- 鍵を置かずにデプロイする仕組み（[10](./10-iam-and-github-actions-oidc.md)）
- 障害時にどこから切り分けるか（[13](./13-troubleshooting.md)）
- Multi-AZで何が守られ、何が守られないか（[02](./02-multi-az-and-subnets.md)）
