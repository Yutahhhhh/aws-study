# 08. Secrets Manager / SSM Parameter Store

DBパスワードやAPIキーのような秘密情報を、コードやGitに書かずにアプリへ渡す方法を扱います。この構成では主にECS Task Definitionと組み合わせます。

## この章で理解すること

- なぜ秘密情報をコード・環境変数のベタ書きにしてはいけないのか
- Secrets Manager と SSM Parameter Store の違いと使い分け
- ECS Task Definition の `environment` と `secrets` の違い
- ECSが秘密を取得するために必要な権限と経路
- 秘密のローテーションの考え方

## 構成図のどこに該当するか

- 「VPCエンドポイント（… Secrets Manager …）」の箱（[04章](./04-nat-gateway-vs-vpc-endpoint.md)）
- ECS Fargateタスク（Task Definitionの `secrets` で注入。[06章](./06-ecs-fargate-autoscaling.md)）
- RDS PostgreSQL（接続情報の供給元。[07章](./07-rds-postgresql.md)）

## なぜ必要か

DBパスワードやAPIキーをソースコードやTerraformのtfファイルに書くと、次の問題が起きます。

- Gitの履歴に残り、消しても過去のコミットから読める
- リポジトリにアクセスできる全員が見られる
- ローテーション（定期更新）が難しい
- Terraform stateに平文で残る

これを避けるため、秘密は専用サービスに保管し、**実行時に必要な権限を持つものだけが取得**する形にします。

## Secrets Manager と Parameter Store

どちらも秘密や設定値を保管できますが、性格が異なります。

| | Secrets Manager | SSM Parameter Store |
| --- | --- | --- |
| 主目的 | 秘密情報の管理 | 設定値・パラメータの管理（秘密も可） |
| 自動ローテーション | あり（RDS等と統合） | 標準ではなし |
| 暗号化 | 標準でKMS暗号化 | SecureString型でKMS暗号化 |
| 料金 | シークレット数＋APIコールで課金 | 標準パラメータは無料枠あり（Advancedは課金） |
| ECS連携 | `secrets` で注入可 | `secrets` で注入可（SecureString） |

使い分けの目安:

- **DBパスワードなど、ローテーションしたい本物の秘密** → Secrets Manager
- **環境ごとの設定値や、軽い秘密** → Parameter Store（コスト面で有利）
- 混在も一般的です（DB資格情報はSecrets Manager、その他の設定はParameter Store など）

## ECS Task Definition の `environment` と `secrets`

Task Definitionには、コンテナへ値を渡す2つの仕組みがあります。

```jsonc
"containerDefinitions": [{
  "environment": [
    { "name": "RAILS_ENV", "value": "production" }   // 平文。秘密にしない値だけ
  ],
  "secrets": [
    {
      "name": "DATABASE_PASSWORD",
      "valueFrom": "arn:aws:secretsmanager:ap-northeast-1:123456789012:secret:prod/db-AbCdEf"
    },
    {
      "name": "DATABASE_URL",
      "valueFrom": "arn:aws:ssm:ap-northeast-1:123456789012:parameter/prod/database_url"
    }
  ]
}]
```

- **`environment`**: 平文の環境変数。Task Definition（=設定情報）にそのまま残るので、秘密を入れてはいけません。
- **`secrets`**: Secrets ManagerやParameter StoreのARN（または特定キー）を指定すると、Task起動時にECSが取得して環境変数としてコンテナに注入します。Task Definitionには **ARNだけ** が残り、値そのものは残りません。

```text
ECS Task 起動
  -> execution role の権限で Secrets Manager / SSM から値を取得
  -> 環境変数としてコンテナへ注入
  -> アプリは普通の環境変数として読む
```

## 通信の流れと必要な権限・経路

### 権限（IAM）

秘密を取得するのは **task execution role** です（アプリ起動前のセットアップを行うロール）。このロールに、対象のSecrets Manager / SSMパラメータを読む権限と、必要ならKMS復号権限を付けます。

```text
execution role:
  secretsmanager:GetSecretValue (対象シークレットのARNに限定)
  ssm:GetParameters             (対象パラメータに限定)
  kms:Decrypt                   (カスタムKMSキーを使う場合)
```

IAMの考え方は [10章](./10-iam-and-github-actions-oidc.md)。「対象のARNだけ」に絞るのが最小権限です。

### ネットワーク経路

Private SubnetのECSがSecrets Manager / SSMへ到達するには、次のどちらかが必要です（[04章](./04-nat-gateway-vs-vpc-endpoint.md)）。

- NAT Gateway 経由
- Secrets Manager / SSM の **Interface VPC Endpoint** 経由（よりPrivate）

経路がないと、Taskは秘密を取得できず起動に失敗します。

## RDSパスワードとの組み合わせ

[07章](./07-rds-postgresql.md) のとおり、RDSは `manage_master_user_password = true` でmasterパスワードをSecrets Managerに自動生成・管理させられます。この場合、生成されたシークレットのARNをTask Definitionの `secrets` から参照すれば、パスワードを一度も平文で扱わずにアプリへ渡せます。

```text
RDS (manage_master_user_password)
  -> Secrets Manager にパスワードを自動生成・保管
  -> ECS Task Definition の secrets が そのARNを参照
  -> アプリへ注入
```

## ローテーションの考え方

- Secrets Managerは、Lambdaを使った自動ローテーションに対応します（RDSは統合された仕組みあり）。
- ローテーションすると値が変わるため、アプリが**起動時だけ**読む設計だと、古い値を使い続けることがあります。ローテーション運用をするなら、再取得や再起動（新Taskのデプロイ）の方針も併せて決めます。
- まずは「平文で持たない」ことを優先し、自動ローテーションは要件に応じて段階的に導入するのが現実的です。

## Terraformで作る主なリソース

- `aws_secretsmanager_secret` / `aws_secretsmanager_secret_version`
- `aws_ssm_parameter`（`type = "SecureString"`）
- task execution role への `aws_iam_policy`（`secretsmanager:GetSecretValue` / `ssm:GetParameters` / 必要なら `kms:Decrypt`）
- ECS Task Definition（`secrets` に `valueFrom`）
- （Private化する場合）Secrets Manager / SSM の Interface VPC Endpoint（[04章](./04-nat-gateway-vs-vpc-endpoint.md)）

> 注意: `aws_secretsmanager_secret_version` の値をtfにベタ書きするとstateに平文で残ります。初期値はAWS側で生成する、または別経路で投入し、tfでは「箱」だけ作る運用も検討します。

## よくある誤解

### 「`environment` に書いても暗号化されるから安全」

`environment` は平文です。Task Definitionを見れば誰でも読めます。秘密は必ず `secrets` を使います。

### 「`secrets` で注入すれば値はどこにも残らない」

コンテナ内では環境変数として見えます（アプリプロセスからは読める）。「Task Definitionや設定に平文が残らない」のがポイントで、プロセス内に値が存在すること自体は避けられません。

### 「Parameter Storeは無料だから常にこちらでよい」

標準パラメータは無料枠がありますが、ローテーションや高度な機能はSecrets Managerが優位です。秘密の重要度で選びます。

### 「VPC Endpointがなくても取得できる」

Private SubnetでNATもVPC Endpointも無ければ、Secrets Manager/SSMへ到達できず起動に失敗します。経路は必須です。

## 理解チェック

- 秘密をコードや `environment` に書いてはいけない理由を説明できるか
- Secrets Manager と Parameter Store の使い分けを説明できるか
- Task Definitionの `environment` と `secrets` の違いを説明できるか
- ECSが秘密を取得するのに必要な権限（どのロール）と経路を説明できるか
- RDSの `manage_master_user_password` と `secrets` をどう繋ぐか説明できるか

## 公式ドキュメント

- [Passing sensitive data to a container (ECS secrets)](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/specifying-sensitive-data.html)
- [What is AWS Secrets Manager?](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html)
- [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [Password management with Amazon RDS and AWS Secrets Manager](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-secrets-manager.html)
- [Rotate AWS Secrets Manager secrets](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)
