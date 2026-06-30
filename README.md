# AWS学習プロジェクト

AWSの構成理解とインタラクティブな学習ビジュアライザーを含むプロジェクト

## 📂 プロジェクト構成

### 1. AWS構成理解ノート
Terraformを題材にしたAWS構成の理解ドキュメント

- [構成図](images/terraform-aws-prod-architecture.png)
- CloudFront、S3、ALB、ECS Fargate、VPC、RDSなどの実践的な構成

### 2. [AWS学習ビジュアライザー](aws-learning-app/)
Reactで構築されたインタラクティブな学習プラットフォーム

- **ネットワークシミュレーション**: パケットの流れを視覚的に理解
- **用語集**: AWS/ネットワーク用語をすぐに参照
- **3つのモード**: インバウンド、アウトバウンド(NAT)、アウトバウンド(コスト削減版)

## 🚀 クイックスタート

### ルートから起動

```bash
# 依存関係のインストール
npm run install-all

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

開発サーバーは `http://localhost:5173/` で起動します。

## 🌐 GitHub Pagesへの自動デプロイ

`main` ブランチへ push すると、GitHub Actions が `aws-learning-app` をビルドして GitHub Pages に自動デプロイします。

初回だけ GitHub のリポジトリ設定で以下を有効にしてください:

1. `Settings` → `Pages` を開く
2. `Build and deployment` の `Source` を `GitHub Actions` に設定する

ワークフローは [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) です。通常のリポジトリ Pages では `/<repository-name>/`、`<owner>.github.io` リポジトリでは `/` を base path として自動判定します。

### 直接起動

```bash
cd aws-learning-app
npm install
npm run dev
```

## 🛠️ 技術スタック

- **React 18** + **TypeScript**
- **Vite** (高速ビルドツール)
- **Tailwind CSS** (ユーティリティファーストCSS)
- **React Router** (ページルーティング)
- **Lucide React** (オープンソースアイコン)

## 📚 学習内容

### ネットワーク・通信
- IP変換(NAT)の仕組み
- ルーティングテーブル
- パブリック/プライベートIP
- インターネットゲートウェイ(IGW)
- NAT Gateway
- セキュリティグループ

### AWS構成
- VPC設計
- サブネット分割
- ALB + ECS Fargate
- CloudFront + S3
- RDS配置
- VPCエンドポイント

## 📖 ドキュメント

詳細なドキュメントは各ディレクトリのREADMEを参照してください:

- [構成理解ノート](./README_ARCHITECTURE.md) (このファイルをリネーム予定)
- [学習ビジュアライザー](aws-learning-app/README.md)

## 🎯 学習の進め方

1. **構成図から理解**: まず全体像を把握
2. **ビジュアライザーで体験**: パケットの流れを実際に見る
3. **用語集で深掘り**: 分からない用語をその場で調べる
4. **Terraformコードを読む**: 実装レベルで理解を深める

## 📝 ライセンス

MIT License

---

**補足: oxcについて**

このプロジェクトでは、ViteテンプレートのデフォルトであるoxcをLinterとして使用しています。

oxcはRustで書かれた超高速なJavaScript/TypeScriptツールチェーンで、ESLintの代替として機能します。従来のツールより10-100倍高速に動作します。
