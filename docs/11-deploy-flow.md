# 11. デプロイフロー（フロントエンドとバックエンド）

この構成では、デプロイ対象が2つあります。フロントエンド（S3 + CloudFront）と、バックエンド（ECR + ECS）です。両者は更新のされ方が違います。それを分けて理解します。

## この章で理解すること

- フロントエンド配信の更新と、バックエンドデプロイの違い
- それぞれの具体的な手順（S3 sync + invalidation / ECR push + ECS更新）
- DB migrationをデプロイのどこで実行するか
- ローリングデプロイとロールバックの考え方
- Terraform apply（インフラ変更）とアプリデプロイの責務分離

## 構成図のどこに該当するか

- 「GitHub Actions（OIDCでAWS操作）」→「ECR」（バックエンド）
- S3 / CloudFront（フロントエンド）
- ECS Fargate / RDS（バックエンドの実行先・migration先）

## 2種類のデプロイ

```text
[フロントエンド]
  build -> S3 へ sync -> CloudFront キャッシュを invalidation

[バックエンド]
  docker build -> ECR へ push -> ECS Service 更新 -> ローリング入れ替え
  (必要なら migration を ECS Run Task で実行)
```

同じGitHub Actionsのワークフローでも、扱う対象とコマンドが別物です。

## フロントエンドのデプロイ

フロントエンドは静的ファイルなので、「S3の中身を新しいビルドに置き換える」ことがデプロイです。

```text
1. npm run build などで dist/ を生成
2. aws s3 sync dist/ s3://<bucket> --delete
3. aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```

### なぜ invalidation が必要か

CloudFrontは静的ファイルをエッジでキャッシュします（[05章](./05-cloudfront-s3-alb-api-routing.md)）。S3を更新しても、キャッシュが残っていると古いファイルが配信されます。invalidationでキャッシュを無効化し、新しいファイルを取りに行かせます。

> 実務のコツ: ファイル名にハッシュを付ける（`index.abc123.js`）ビルドにすると、`index.html` だけをinvalidateすればよく、全パス（`/*`）のinvalidationを減らせます。

## バックエンドのデプロイ

バックエンドはコンテナなので、「新しいimageを作り、ECSに新しいTaskとして入れ替える」ことがデプロイです。

```text
1. docker build でimageを作る
2. ECRへ login して push（タグ付け。例: コミットSHA）
3. 新しいimageを指すTask Definition revisionを登録
4. ECS Service を更新（新revisionへ）
5. ECSがローリングで新Taskに入れ替え（06章）
```

GitHub Actionsからの認証はOIDC（[10章](./10-iam-and-github-actions-oidc.md)）。`aws ecs update-service` や、`aws-actions/amazon-ecs-deploy-task-definition` などを使います。

### ローリングデプロイ（おさらい）

```text
新Taskを起動 -> ALB health checkに通る -> 旧Taskを停止
（desired_countを保ちながら徐々に入れ替え）
```

health checkに通らない新Taskはトラフィックを受けず、デプロイも完了しません。これが「壊れたデプロイ」を本番に出しにくくする安全弁です。詳細は [06章](./06-ecs-fargate-autoscaling.md)。

## DB migration をどこで実行するか

スキーマ変更（migration）はアプリ更新と密接です。順序を誤ると、新コードが存在しないカラムを参照して落ちる、などが起きます。

推奨は **ECS Run Task** での実行です（[07章](./07-rds-postgresql.md)）。アプリと同じVPC・SG・secretsで動かせます。

```text
... ECRへpush
  -> aws ecs run-task で migration コマンドを実行
  -> 成功を確認
  -> ECS Service を新revisionへ更新
```

### migrationの順序の考え方

- **後方互換なmigration**（カラム追加など）は、先にmigration→後でアプリ更新でも安全なことが多い。
- **破壊的なmigration**（カラム削除・リネーム）は、「新旧コードが同時に動く瞬間」を意識し、複数回のデプロイに分ける（expand & contract）と安全です。

## ロールバック

- **バックエンド**: ECSは前のTask Definition revisionに戻せます。`aws ecs update-service` で旧revisionを指すか、デプロイ失敗時に自動ロールバック（CodeDeploy Blue/Greenやサーキットブレーカー）を使います。
- **フロントエンド**: 前のビルド成果物を再syncし、invalidationします。成果物をバージョン管理しておくと戻しやすいです。
- **DB**: migrationのロールバックは難しい場合があります。バックアップ（[07章](./07-rds-postgresql.md)）と、破壊的変更を避ける設計が保険になります。

## Terraform apply とアプリデプロイの分離

- **Terraform apply**（インフラの変更: VPC、ALB、RDS、IAMなど）は、頻度が低く、影響が大きい操作です。
- **アプリデプロイ**（imageの差し替え、フロント更新）は、頻度が高く、影響範囲が限定的です。

この2つは **別ワークフロー・別ロール** にするのが安全です（[10章](./10-iam-and-github-actions-oidc.md)）。アプリデプロイのワークフローにインフラ変更権限を持たせない、という分離です。

```text
[infra ワークフロー]  terraform plan/apply  … Terraform applyロール（広い権限）
[deploy ワークフロー] ECR push / ECS更新 / S3 sync … デプロイロール（狭い権限）
```

## 通信の流れ（デプロイ全体）

```text
git push (main)
  -> GitHub Actions 起動
  -> OIDCでデプロイロールをassume(一時クレデンシャル)
  -> [front] build -> S3 sync -> CloudFront invalidation
  -> [back]  docker build -> ECR push
            -> migration (ECS Run Task)
            -> ECS Service 更新 -> ローリング入れ替え
  -> 完了
```

## Terraformで作る/前提とするリソース

デプロイ自体はGitHub Actions側の処理ですが、Terraformで土台を用意します。

- `aws_ecr_repository`（バックエンドimage置き場）
- `aws_iam_openid_connect_provider` / デプロイ用 `aws_iam_role`（[10章](./10-iam-and-github-actions-oidc.md)）
- ECS Service / Task Definition（[06章](./06-ecs-fargate-autoscaling.md)）
- S3 bucket / CloudFront distribution（[05章](./05-cloudfront-s3-alb-api-routing.md)）
- （任意）CodeDeploy 関連リソース（Blue/Greenデプロイを使う場合）

## よくある誤解

### 「S3を更新すればすぐ反映される」

CloudFrontのキャッシュが残ると古いファイルが出ます。invalidation（またはハッシュ付きファイル名）が必要です。

### 「ECSはimageをpushすれば勝手に新しくなる」

`latest` を使い回すなどしない限り、Service更新（新revisionへの差し替え）が必要です。タグはコミットSHA等で固定するのが安全です。

### 「migrationはアプリ更新と同時で問題ない」

破壊的変更では、新旧コードが混在する瞬間に壊れます。順序とexpand & contractを意識します。

### 「デプロイ用ロール1つで何でもやればよい」

インフラ変更権限とアプリデプロイ権限は分けます。被害範囲を限定するためです。

## 理解チェック

- フロントエンドとバックエンドのデプロイ手順の違いを説明できるか
- なぜCloudFront invalidationが必要か説明できるか
- migrationをECS Run Taskで実行する利点を説明できるか
- ローリングデプロイでhealth checkが果たす役割を説明できるか
- Terraform applyとアプリデプロイを分ける理由を説明できるか

## 公式ドキュメント

- [Deploying static websites with S3 and CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/GettingStarted.SimpleDistribution.html)
- [Invalidating files](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html)
- [Amazon ECS deployment types](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-types.html)
- [Running standalone tasks (ECS Run Task)](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs_run_task.html)
- [amazon-ecs-deploy-task-definition action](https://github.com/aws-actions/amazon-ecs-deploy-task-definition)
