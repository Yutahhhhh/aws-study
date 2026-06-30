# 13. 障害時の切り分け

「APIが500を返す」「画面が出ない」と言われたとき、どこから疑うか。この章は、これまでの章で作った構成を前提に、症状から原因へたどる切り分けの地図です。

## この章で理解すること

- 症状を「経路のどの区間の問題か」に分解する考え方
- 代表的な症状ごとの確認順序
- 各区間で見るべきログ・メトリクス（[12章](./12-observability-logs-alarms.md)）
- 切り分けでよく出る設定ミスのパターン

## 構成図のどこに該当するか

構成図の経路全体が対象です。切り分けは「経路を区間に分けて、どこで切れているか」を特定する作業です。

```text
利用者 ─[A]─ CloudFront ─[B]─ S3
                 └────[C]─ ALB ─[D]─ ECS ─[E]─ RDS
GitHub Actions ─[F]─ ECR / ECS
管理者 ─[G]─ SSM ─ EC2 ─ RDS
```

各区間（A〜G）のどこで失敗しているかを切り分けます。

## 基本の考え方：上流から区間で切る

闇雲に全部を見ず、「リクエストの経路を区間に分け、どこまで届いているか」を上流から確認します。エラーのステータスコードと、どのコンポーネントのログに記録があるかが手がかりです。

## 症状別の切り分け

### 症状1: 画面が表示されない（静的ファイル）

経路: 利用者 → CloudFront → S3（区間 A, B）

1. ブラウザの開発者ツールでステータスコードを確認（403/404/5xx）。
2. **403/404でAccessDenied** → S3のOAC設定 / bucket policyを疑う（[05章](./05-cloudfront-s3-alb-api-routing.md)）。CloudFrontからS3を読めていない。
3. **404だがファイルはある（SPAのパス直打ち）** → Custom Error Responseでindex.htmlに戻す設定が無い/誤り。
4. **古いファイルが出る** → CloudFrontキャッシュ。invalidation漏れ（[11章](./11-deploy-flow.md)）。
5. CloudFrontのログ・メトリクスで4xx/5xxの傾向を確認。

### 症状2: APIが5xxを返す

経路: CloudFront → ALB → ECS → RDS（区間 C, D, E）

ここでの最重要分岐は **「ALBの5xxが `ELB_5XX` か `Target_5XX` か」** です（[12章](./12-observability-logs-alarms.md)）。

```text
HTTPCode_ELB_5XX_Count が増えている
  -> ALB側/ターゲット不在の問題
     - 健全なTargetがいない(UnHealthyHostCount)
     - Target Groupに登録が無い
     - ECS Serviceが起動できていない

HTTPCode_Target_5XX_Count が増えている
  -> アプリ側の問題
     - ECSのCloudWatch Logsにアプリのエラースタックトレース
     - DB接続失敗、未処理例外 など
```

確認順序:

1. ALBメトリクスで `ELB_5XX` / `Target_5XX` / `UnHealthyHostCount` を見る。
2. `UnHealthyHostCount > 0` → ECS TaskがALB health checkに落ちている。health checkのパス（例 `/health`）・ポート・タイムアウトを確認。アプリが起動直後にDB接続で落ちていないかも確認。
3. `Target_5XX` → ECSのCloudWatch Logsでアプリのエラーを読む。多くはここで原因が出る。
4. DB絡みなら症状3へ。

### 症状3: アプリからDBに繋がらない

経路: ECS → RDS（区間 E）

1. ECSログのエラー内容を見る（タイムアウトか認証エラーか）。
2. **接続タイムアウト** → ネットワーク/SGの問題。
   - RDS SGがECS SGからの5432を許可しているか（[03章](./03-security-groups.md)）。
   - ECSとRDSが同じVPCで、ルーティングできるか。
   - 接続先ホスト（RDSエンドポイント）が正しいか。
3. **認証エラー（password authentication failed）** → 認証情報の問題。
   - Secrets Manager/SSMの値が正しいか、Task Definitionの `secrets` が正しいARNを指すか（[08章](./08-secrets-and-parameters.md)）。
4. **接続数エラー（too many connections）** → `DatabaseConnections` を確認。コネクションプール設定やTask数を見直す。

### 症状4: ECS Taskが起動しない / すぐ停止する

経路: ECR → ECS（区間 F, D）

1. ECSのService events / stopped taskの「停止理由」を確認（コンソールや `describe-tasks`）。
2. **`CannotPullContainerError`** → imageをpullできていない。
   - ECR URI/タグが正しいか。
   - execution roleにECR pull権限があるか（[10章](./10-iam-and-github-actions-oidc.md)）。
   - NATまたはECR/S3エンドポイントの経路があるか（[04章](./04-nat-gateway-vs-vpc-endpoint.md)）。
3. **secret取得エラー（ResourceInitializationError）** → execution roleの権限 / Secrets・SSMへの経路を確認（[08章](./08-secrets-and-parameters.md)）。
4. **起動直後にexit** → アプリがクラッシュ。CloudWatch Logsを確認。環境変数・migration未実行などが典型。

### 症状5: デプロイが終わらない / ロールバックされる

経路: ECS デプロイ（区間 D）

1. 新Taskがhealth checkに通っているか（`UnHealthyHostCount`、Service events）。
2. health checkのパス/ポート、起動猶予（health check grace period）が短すぎないか。
3. migration順序の問題で新コードが落ちていないか（[11章](./11-deploy-flow.md)）。

### 症状6: 管理者がSSMでDBに繋げない

経路: 管理者 → SSM → EC2 → RDS（区間 G）

1. 対象EC2がSSMのManaged Nodeとして「オンライン」か。
   - EC2のIAMロールに `AmazonSSMManagedInstanceCore` があるか。
   - EC2からSystems Managerへの経路（NAT or `ssm`/`ssmmessages`/`ec2messages` エンドポイント）があるか（[09章](./09-admin-access-ssm-port-forwarding.md)）。
2. 手元PCにSession Manager pluginが入っているか。
3. RDS SGが管理用EC2 SGからの5432を許可しているか。
4. 管理者のIAMに `ssm:StartSession` 権限があるか。

## つまずきやすい設定ミス早見表

| 症状 | よくある原因 | 参照 |
| --- | --- | --- |
| 静的ファイルがAccessDenied | OAC/bucket policy不整合 | [05](./05-cloudfront-s3-alb-api-routing.md) |
| SPAのパス直打ちで404 | Custom Error Response未設定 | [05](./05-cloudfront-s3-alb-api-routing.md) |
| 古い画面が出る | invalidation漏れ | [11](./11-deploy-flow.md) |
| API 503 / 健全Targetなし | health check失敗 | [06](./06-ecs-fargate-autoscaling.md) |
| DB接続タイムアウト | SG許可漏れ | [03](./03-security-groups.md) |
| DB認証エラー | secrets参照ミス | [08](./08-secrets-and-parameters.md) |
| Taskがpullできない | ECR権限/経路不足 | [04](./04-nat-gateway-vs-vpc-endpoint.md) [10](./10-iam-and-github-actions-oidc.md) |
| CloudFrontに証明書を割当できない | ACMが`us-east-1`にない | [05](./05-cloudfront-s3-alb-api-routing.md) |
| ホスト不正でRailsがエラーEvent | Host header / `config.hosts` | [05](./05-cloudfront-s3-alb-api-routing.md) |

## なぜこの順番で見るのか

上流から区間で切ると、「問題の範囲」を半分ずつ絞れます。例えばAPI 5xxで `ELB_5XX` だけが増えていれば、原因はALB〜ECSの接続（health/登録/起動）に絞られ、アプリのコードを読み始める前に範囲を狭められます。逆に `Target_5XX` ならアプリログに直行できます。

## 理解チェック

- 「APIが500」と言われて、最初に確認するメトリクスを答えられるか
- `ELB_5XX` と `Target_5XX` で、次に見る場所がどう変わるか説明できるか
- DB接続失敗を「ネットワーク起因」と「認証起因」にどう切り分けるか説明できるか
- ECS Taskがpullできないときの確認項目を挙げられるか
- 上流から区間で切る切り分けの利点を説明できるか

## 公式ドキュメント

- [Troubleshooting your Application Load Balancers](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-troubleshooting.html)
- [Amazon ECS troubleshooting](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/troubleshooting.html)
- [Amazon ECS stopped task error messages](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/stopped-task-error-codes.html)
- [Troubleshooting CloudFront errors](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/http-status-codes.html)
- [Troubleshoot Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-troubleshooting.html)
