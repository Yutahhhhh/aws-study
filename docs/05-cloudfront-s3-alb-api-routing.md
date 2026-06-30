# 05. CloudFront / S3 / OAC / ALB と `/api/*` ルーティング

この構成の入口であるCloudFrontが、どうやって1つのドメインで「静的ファイルはS3」「APIはALB」を両立させるかを扱います。

## この章で理解すること

- CloudFrontが複数Originとパスでリクエストを振り分ける仕組み（Cache Behavior）
- `/api/*` がS3ではなくALBへ流れる理由
- OAC（Origin Access Control）でS3を「CloudFront経由だけ」にする仕組み
- SPA（React等）での404対策と、それを`/api/*`に適用してはいけない理由
- API向けのキャッシュ・ヘッダー転送の注意点
- ALBからECSへ届くまで

## 構成図のどこに該当するか

- 「CloudFront（通常パス → S3 / `/static/*` → S3でキャッシュ / `/api/*` → ALBへ転送）」の箱
- 「S3（フロントエンド配置先・OAC経由のみ読取）」の箱
- 「ALB: アプリケーションロードバランサー（80/443を受け、HTTPのパスを見て転送。`/api/*` と `/health` をECSのターゲットグループへ）」の箱
- 「ターゲットグループ（生きているECSタスクのIP一覧）」の箱

## やりたいこと

ブラウザから見えるURLを、すべて同じドメインに統一したい、という話です。

```text
https://example.com/                -> 画面 (S3)
https://example.com/assets/index.js -> 静的ファイル (S3)
https://example.com/api/users       -> API (ALB -> ECS)
```

同一ドメインに統一すると、フロントエンドからAPIを呼ぶときにCORSや別ドメインCookieの問題を避けやすくなります。これを実現するのがCloudFrontのパス振り分けです。

## 通信の流れ

### API通信（`/api/*`）

```text
GET https://example.com/api/users
  -> CloudFront: パスが /api/* に一致
  -> ALB origin へ転送 (HTTPS)
  -> ALB listener (443)
  -> listener rule / target group
  -> ECS Task (Private Subnet, :3000)
  -> RDS
```

### 静的ファイル（その他のパス）

```text
GET https://example.com/assets/index.js
  -> CloudFront: /api/* に一致しない -> default behavior
  -> S3 origin (OAC経由)
  -> index.js を返す
```

## なぜ必要か / 仕組みの詳細

### CloudFrontのOrigin

Originは「CloudFrontが裏で取りに行く先」です。この構成では最低2つあります。

```text
Origin 1: S3 bucket   … 静的ファイル
Origin 2: ALB         … API
```

- **S3 origin**: HTML/CSS/JS/画像を返す。OACでCloudFrontからだけ読めるようにする。
- **ALB origin**: `/api/*` を受ける。CloudFront→ALBはHTTPSにする。

### Cache Behavior（パス振り分けの本体）

Cache Behaviorは「どのパスのリクエストを、どのOriginへ送り、どうキャッシュするか」のルールです。CloudFrontはリクエストパスに一致するBehaviorを探してOriginを選びます。

```text
[Behavior 1] Path pattern: /api/*
  Origin: ALB
  Cache: キャッシュしない（または非常に短く）
  Allowed methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
  転送: Authorization / Cookie / Query string を必要に応じてALBへ渡す

[Default Behavior] Path pattern: *（上記に一致しない全部）
  Origin: S3
  Cache: 静的向けにキャッシュする
  Allowed methods: GET, HEAD
```

パスは具体的なBehaviorが優先され、最後にDefault Behaviorが受けます。だから `/api/users` はBehavior 1に一致し、`/assets/index.js` はDefaultに落ちます。

### OAC（Origin Access Control）でS3を守る

S3 bucketをpublicにすると、CloudFrontを通さず直接URLで読めてしまい、アクセス制御やキャッシュ・ログの一元管理が崩れます。

OACを使うと、CloudFrontがS3へリクエストする際に署名を付け、S3のbucket policyで「このCloudFront distributionからの署名付きリクエストだけ許可」にできます。

```text
利用者 -> CloudFront -> (署名付き) -> S3   … 許可
利用者 -> S3 直接アクセス               … 拒否
```

> OAC は旧来の OAI（Origin Access Identity）の後継で、現在はOACが推奨です。新規構築ではOACを使います。

### SPAの404対策（フロントエンドのみ）

ReactなどのSPAでは、利用者がブラウザで直接 `https://example.com/settings` を開くことがあります。S3には `/settings` というオブジェクトがないため、そのままだと403/404になります。

対策として、CloudFrontの **Custom Error Response**（403/404を200 + `/index.html` に変換）や **CloudFront Functions** で、存在しないパスを `index.html` に返す設計を検討します。

```text
GET /settings -> S3に無い -> 403/404
  -> Custom Error Response で 200 + index.html を返す
  -> ブラウザ側のルーターが /settings を描画
```

**重要:** この「index.htmlに戻す」処理を `/api/*` に適用してはいけません。APIの404やエラーまでHTMLに化けてしまい、フロント側が壊れます。SPA fallbackは画面パス（Default Behavior側）に限定し、`/api/*` は別Behaviorとして分離します。

### API向けのキャッシュ・ヘッダーの注意

APIはユーザーごと・リクエストごとに結果が変わります。静的ファイルと同じ強いキャッシュをかけると、他人のレスポンスを返すなどの事故になります。API behaviorでは次を検討します。

- GET/HEAD以外（POST/PUT/PATCH/DELETE）を許可するか
- `Authorization` ヘッダーをALB（=アプリ）へ転送するか
- Cookie・Query stringを転送するか
- キャッシュを無効化（またはTTLを極小）にするか
- CORSが必要か

CloudFrontでは、これらを **Cache Policy** と **Origin Request Policy** で指定します（古い「Forwarded Values」より新しいPolicyベースが推奨）。

### CloudFront → ALB の Host ヘッダー問題

CloudFrontからALBへ転送するとき、`Host` ヘッダーの扱いで挙動が変わります。ALBがHostベースルーティングをしていたり、Rails側で許可Hostを検査している（`config.hosts`）場合、届くHostが想定と違うとエラーになります。構築時は次を突き合わせます。

- CloudFrontのドメイン / 独自ドメイン
- ALBのDNS名
- Railsの `config.hosts`
- ALB listener ruleのHost条件
- Origin Request Policyで転送するヘッダー

### ALBからECSへ

ALBはlistener（80/443）でリクエストを受け、listener ruleでパス（例: `/api/*`, `/health`）を見てTarget Groupへ転送します。Target Groupには、ECS Serviceが登録したTaskのPrivate IP:3000が入っています（[06章](./06-ecs-fargate-autoscaling.md)）。

```text
CloudFront -> ALB:443 -> listener rule(/api/*) -> Target Group -> 10.2.11.x:3000 (ECS Task)
```

ALBはTarget Groupのhealth check（例: `/health`）に通ったTaskだけに振り分けます。

### ALBを「CloudFront経由だけ」に絞れるか

この構成ではCloudFrontのAPI originがALBなので、ALBは到達可能（通常internet-facing）である必要があります。ただし、より厳密にCloudFront経由だけを通すなら次を検討します。

- ALBのSGのsourceを、AWS managed prefix list `com.amazonaws.global.cloudfront.origin-facing` に絞る（[03章](./03-security-groups.md)）
- CloudFront→ALBにカスタムヘッダー（秘密のトークン）を付け、ALB listener ruleやアプリ側で検証する
- WAFをCloudFront（またはALB）に付ける（[12章](./12-observability-logs-alarms.md)）

## Terraformで作る主なリソース

- `aws_s3_bucket` / `aws_s3_bucket_policy`（OAC許可）
- `aws_cloudfront_origin_access_control`
- `aws_cloudfront_distribution`（Origin: S3 / ALB、default behavior、`/api/*` behavior）
- `aws_cloudfront_cache_policy` / `aws_cloudfront_origin_request_policy`
- `aws_acm_certificate`（CloudFront用は **`us-east-1`** リージョンで発行）
- `aws_route53_record`（CloudFrontへのAliasレコード）
- `aws_lb`（ALB） / `aws_lb_listener`（80→443リダイレクト, 443） / `aws_lb_listener_rule`（`/api/*`）
- `aws_lb_target_group`（ECS用、`target_type = "ip"`）

> 注意: CloudFrontに紐づけるACM証明書は必ず `us-east-1` で発行します（ALB用の証明書はALBと同じリージョンで発行）。これは初学者がよくハマる点です。

## よくある誤解

### 「`/api/users` もS3に取りに行く」

行きません。`/api/*` Behaviorが先に一致し、ALB originへ向かいます。S3に落ちるのはどのBehaviorにも一致しなかったパスです。

### 「S3をpublicにしないとCloudFrontが読めない」

逆です。OACを使えばpublicにせずにCloudFrontからだけ読めます。publicにする必要はありません。

### 「SPAのindex.html fallbackは全パスに掛ければよい」

`/api/*` に掛けるとAPIレスポンスがHTMLに化けます。fallbackは画面パスに限定します。

### 「APIもキャッシュすれば速くて安い」

ユーザー依存のAPIをキャッシュすると情報漏れや誤表示の事故になります。API behaviorはキャッシュ無効（または極小TTL）を基本にします。

### 「ACM証明書はどのリージョンでもよい」

CloudFront用は `us-east-1` 固定です。ALB用はALBのリージョンです。混同するとCloudFrontに証明書を割り当てられません。

## 理解チェック

- `/api/users` がS3に行かない理由を、Cache Behaviorの観点で説明できるか
- `/assets/index.js` がALBに行かない理由を説明できるか
- OACが何を守っているか、publicバケットとの違いを説明できるか
- SPA fallbackを `/api/*` に適用してはいけない理由を説明できるか
- API behaviorで `Authorization` ヘッダーをどう扱うべきか説明できるか
- CloudFront用ACM証明書のリージョン制約を説明できるか
- ALBをCloudFront経由だけに絞る方法を1つ以上挙げられるか

## 公式ドキュメント

- [Cache behavior settings](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html)
- [Restricting access to an Amazon S3 origin (OAC)](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [Use various origins with CloudFront distributions](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DownloadDistS3AndCustomOrigins.html)
- [Require HTTPS between CloudFront and your custom origin](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-https-cloudfront-to-custom-origin.html)
- [Requirements for using SSL/TLS certificates with CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html)
- [Listener rules for your Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-update-rules.html)
