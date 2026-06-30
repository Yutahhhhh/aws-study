# 10. IAM と GitHub Actions OIDC

この構成は複数のロールで動いています。誰が・何に・どこまで許可されているかを整理し、GitHub Actionsから **長期キーを置かずに** デプロイする仕組み（OIDC）を扱います。

## この章で理解すること

- IAMのRole / Policy / Principal の基本関係
- この構成に登場する主要なロールと、その守備範囲の違い
- 長期アクセスキーの問題点
- GitHub Actions OIDC で一時クレデンシャルを得る仕組み
- trust policy（信頼ポリシー）でリポジトリ/ブランチを絞る方法

## 構成図のどこに該当するか

- 「GitHub Actions（OIDCでAWS操作）」→「ECR」の箱
- ECS Fargateタスク（execution role / task role で動く。[06章](./06-ecs-fargate-autoscaling.md)）
- 管理用EC2（instance profile。[09章](./09-admin-access-ssm-port-forwarding.md)）

## なぜ必要か

AWSのほぼすべての操作はIAMで認可されます。「誰が（principal）」「何を（action）」「どのリソースに（resource）」できるかを、Policyで宣言します。本番では、各コンポーネントに **必要最小限** の権限だけを与えることで、1つが侵害されても被害を限定できます。

## IAMの基本要素

- **Principal**: 操作の主体（ユーザー、ロール、サービスなど）
- **Policy**: 許可/拒否のルール（action / resource / condition）
- **Role**: 一時的に引き受ける（assume する）権限のセット。ロール自身に「誰がassumeできるか」を定める **trust policy** が付く
- **Managed Policy / Inline Policy**: 使い回せるポリシー / 特定対象専用のポリシー

ロールは「鍵を持つ人」ではなく「役割」です。サービスやCIが必要なときだけ引き受け、一時的なクレデンシャルで操作します。

## この構成に登場する主要なロール

| ロール | 誰が使うか | 主な許可 |
| --- | --- | --- |
| **GitHub Actions デプロイロール** | GitHub Actions（OIDC） | ECR push、ECS更新、S3 sync、CloudFront invalidation |
| **ECS task execution role** | ECSエージェント（Task起動時） | ECR pull、CloudWatch Logs書込、Secrets/SSM取得（[08章](./08-secrets-and-parameters.md)） |
| **ECS task role** | アプリ本体（実行中） | アプリがAWS APIを呼ぶ分だけ（例: S3アップロード） |
| **管理用EC2のロール** | 管理用EC2 | `AmazonSSMManagedInstanceCore`（[09章](./09-admin-access-ssm-port-forwarding.md)） |

ポイントは、**execution role と task role を分ける**ことです。前者は「Taskを起動するための裏方権限」、後者は「アプリ自身が必要とする権限」。混ぜると過剰権限になりがちです。

## 長期アクセスキーの問題

GitHub ActionsからAWSを操作する素朴な方法は、IAMユーザーのアクセスキー（`AKIA...` と secret）をGitHub Secretsに置くことです。しかしこれには問題があります。

- キーが漏れると、誰でも・いつまでも・どこからでも使える
- ローテーション（定期更新）の運用が面倒
- 「このリポジトリのこのワークフローだけ」といった制限がしにくい

これを解決するのが OIDC（OpenID Connect）による一時クレデンシャルです。

## GitHub Actions OIDC の仕組み

OIDCを使うと、GitHub Actionsの実行ごとに、GitHubが発行する短命のIDトークンを使ってAWSロールをassumeし、**一時的な**クレデンシャルを得ます。長期キーをどこにも保存しません。

```text
1. AWSに「GitHubのOIDCプロバイダ」を1つ登録しておく
2. ワークフロー実行時、GitHubが署名付きIDトークンを発行
   （このトークンに repo / branch / 環境などの情報が入る）
3. ワークフローが sts:AssumeRoleWithWebIdentity でデプロイロールをassume
4. AWSが trust policy の条件（どのrepo/branchか）を検証
5. 一致すれば、短命の一時クレデンシャルを返す
6. 以降のデプロイ操作はそのクレデンシャルで行う(数時間で失効)
```

ワークフロー側は `aws-actions/configure-aws-credentials` にロールARNを渡すだけで、キーの保存は不要です。

## trust policy でリポジトリ/ブランチを絞る

OIDCの肝は、ロールの **trust policy** で「どのリポジトリ・どのブランチからのassumeを許すか」を条件にすることです。これを緩くすると、他人のリポジトリからassumeされる恐れがあります。

```jsonc
// デプロイロールの trust policy（概念図）
{
  "Effect": "Allow",
  "Principal": { "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com" },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringEquals": {
      "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
    },
    "StringLike": {
      // 特定リポジトリの main ブランチに限定
      "token.actions.githubusercontent.com:sub": "repo:my-org/my-repo:ref:refs/heads/main"
    }
  }
}
```

`sub` 条件を `repo:my-org/my-repo:*` のように広げすぎないこと、`aud` を必ず確認することが重要です。タグやenvironment単位で絞ることもできます。

## デプロイロールとTerraform applyロールを分ける

実務では権限を役割で分けます。

- **アプリデプロイ用ロール**: ECR push / ECS update / S3 sync / CloudFront invalidation のみ
- **Terraform apply用ロール**: インフラ変更（広い権限）

両者を1つにまとめると、アプリデプロイのワークフローがインフラを壊せてしまいます。分離すると、漏洩・誤操作時の被害を抑えられます。判断指針は [11章](./11-deploy-flow.md)。

## Terraformで作る主なリソース

- `aws_iam_openid_connect_provider`（GitHubのOIDCプロバイダ、アカウントに1つ）
- `aws_iam_role`（デプロイ用 / execution / task / EC2用）＋ 各 `assume_role_policy`（trust policy）
- `aws_iam_policy` / `aws_iam_role_policy_attachment`（最小権限の許可）
- ECS execution role には AWS管理ポリシー `AmazonECSTaskExecutionRolePolicy` を基点にしつつ、Secrets/SSM/KMSは対象ARNに絞って追加

簡略な例（OIDCプロバイダ）:

```hcl
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["<GitHubのOIDC証明書サムプリント>"]
}
```

## よくある誤解

### 「OIDCでもキーをどこかに保存する」

しません。実行ごとに一時クレデンシャルを得て、数時間で失効します。GitHub Secretsに置くのはロールARN程度です。

### 「trust policyはとりあえず広くしておけばよい」

危険です。`sub` 条件を緩めると、他リポジトリからassumeされ得ます。リポジトリ・ブランチ単位で絞ります。

### 「execution roleとtask roleは同じでよい」

役割が違います。execution roleは起動の裏方（pull/secret取得）、task roleはアプリ自身の権限。分けると最小権限にしやすいです。

### 「デプロイロールにAdministratorAccessを付ければ楽」

楽ですが、漏洩時の被害が最大化します。デプロイに必要なactionだけに絞ります。

## 理解チェック

- Role / Policy / Principal / trust policy の関係を説明できるか
- この構成の主要ロール（デプロイ / execution / task / EC2）の守備範囲を区別できるか
- 長期アクセスキーの問題点を説明できるか
- OIDCで一時クレデンシャルを得る流れを説明できるか
- trust policyの `sub` 条件でリポジトリ/ブランチを絞る理由を説明できるか

## 公式ドキュメント

- [IAM roles](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html)
- [Creating OpenID Connect (OIDC) identity providers](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
- [Configuring OpenID Connect in Amazon Web Services (GitHub Docs)](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [Amazon ECS task execution IAM role](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html)
- [Amazon ECS task IAM role](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html)
- [Policy evaluation and least privilege](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
