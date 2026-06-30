# AWS Learning Visualizer - プロジェクト指示

## プロジェクト概要

AWSの構成をビジュアルベースで解説する学習プラットフォーム。テーマ別に学習コンテンツを増やしていく構造になっている。

## 技術スタック

- React 19 + TypeScript 6 + Vite 8
- TailwindCSS 4（PostCSS経由）
- React Router DOM 7
- lucide-react（アイコン）
- ダークテーマ固定（slate-950 ベース）

## アーキテクチャの原則

### データ駆動

全てのページはデータ（TopicConfig）によって描画される。コンポーネント側にテーマ固有のロジックやハードコードされたテキストを持たない。

### SVGを使わない構成図

アーキテクチャ図はCSS Grid + HTML要素で構成する。SVGの座標ハードコードは行わない。ノード間の接続線はDOMRect計算によるCSS位置指定で描画する。

### AWSアイコン

`src/assets/aws/` にAWS公式SVGアイコンが約1,875件ある。リソースアイコンはアーキテクチャ図と用語集の両方で使用する。パスは `/src/assets/aws/...` 形式で指定し、`resolveIcon()` で統一的に解決する。

---

## 新しい学習テーマの追加手順

テーマと内容が決まったら、以下の手順でページとコンポーネントを追加する。

### Step 1: トピックディレクトリの作成

```
src/topics/{slug}/
  config.ts          ← TopicConfig（全設定の集約）
  diagram.ts         ← DiagramConfig（ノード、ゾーン、接続線の定義）
  modes.ts           ← SimulationMode[]（モード定義 + ステップ紐づけ）
  glossary.ts        ← GlossaryDatabase + GlossaryCategory[]
  steps/
    {mode1}.ts       ← SimulationStep[]（各モードのステップデータ）
    {mode2}.ts
```

### Step 2: diagram.ts の作成

`DiagramConfig` を定義する。

```typescript
import type { DiagramConfig } from '../../types/diagram';

export const diagramConfig: DiagramConfig = {
  grid: {
    columns: 4,   // グリッドの列数
    rows: 3,      // グリッドの行数
    gap: 'gap-4',
  },
  zones: [
    // VPC、サブネットなどの境界ボックス
    {
      id: 'vpc',
      label: 'VPC (10.0.0.0/16)',
      position: { row: 1, col: 2, rowSpan: 3, colSpan: 3 },
      style: {
        borderColor: 'border-slate-600',
        borderStyle: 'border-dashed',
        bgColor: 'bg-transparent',
        labelColor: 'text-slate-500',
      },
    },
  ],
  nodes: [
    // AWSリソースや外部エンティティ
    {
      id: 'ecs',
      label: 'ECS (Rails)',
      sublabel: 'アプリ本体',
      metadata: '10.0.2.20',
      icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.svg',
      position: { row: 1, col: 4 },
      glossaryTermId: 'ecs',
      style: {
        bgColor: 'bg-emerald-950',
        borderColor: 'border-emerald-500',
        textColor: 'text-emerald-200',
        accentColor: 'text-emerald-500',
      },
    },
  ],
  connections: [
    // ノード間の接続線
    { id: 'alb-to-ecs', from: 'alb', to: 'ecs' },
    { id: 'nat-to-igw', from: 'nat-gw', to: 'igw', style: { dashed: true } },
  ],
};
```

### Step 3: steps/ のステップデータ作成

各ステップで `diagramState` を使い、図のどのノード/接続が光るかを宣言的に指定する。

```typescript
import type { SimulationStep } from '../../../types/simulation';

export const steps: SimulationStep[] = [
  {
    title: '【送信】ユーザーからリクエスト発信',
    location: 'インターネット世界',
    diagramState: {
      activeNodeIds: ['user-pc', 'igw'],       // 光るノード
      activeConnectionIds: ['user-to-igw'],     // 光る接続線
      packetAtNodeId: 'user-pc',                // パケット表示位置
      dimmedNodeIds: ['slack'],                  // 暗くするノード（任意）
    },
    headers: { srcIp: '...', srcPort: '...', dstIp: '...', dstPort: '...' },
    labels: { srcIp: '...', srcPort: '...', dstIp: '...', dstPort: '...' },
    changes: [],                                 // 変化したヘッダーフィールド名
    desc: '<p>HTML解説テキスト</p>',
    keyPoints: [                                 // 「ここが理解のポイント」（任意）
      {
        glossaryTermId: 'nat',
        title: '相互に変換(NAT)とは',
        description: '説明テキスト',
        accentColor: 'text-orange-400',
      },
    ],
  },
];
```

### Step 4: modes.ts の作成

```typescript
import type { SimulationMode } from '../../types/simulation';
import { steps } from './steps/example';

export const modes: SimulationMode[] = [
  {
    id: 'mode-id',
    label: 'モード表示名',
    themeId: 'primary',     // primary | secondary | tertiary（色テーマ）
    icon: 'Download',       // Lucideアイコン名
    steps: steps,
  },
];
```

### Step 5: glossary.ts の作成

```typescript
import type { GlossaryDatabase } from '../../types/glossary';
import type { GlossaryCategory } from '../../types/topic';

export const glossary: GlossaryDatabase = {
  'term-id': {
    icon: '/src/assets/aws/...',  // or Lucideアイコン名
    title: '日本語名',
    eng: 'ENGLISH NAME',
    oneLiner: '端的にいうと？の回答',
    detail: '技術詳細HTML',
    focus: '開発エンジニアとしての重要ポイントHTML',
  },
};

export const glossaryCategories: GlossaryCategory[] = [
  { label: 'カテゴリ名', termIds: ['term-id'] },
];
```

### Step 6: config.ts で集約

```typescript
import type { TopicConfig } from '../../types/topic';
import { diagramConfig } from './diagram';
import { modes } from './modes';
import { glossary, glossaryCategories } from './glossary';
import { defaultModeThemes } from '../../theme/modeThemes';

const config: TopicConfig = {
  slug: 'topic-slug',
  title: 'テーマタイトル',
  description: 'Homeページ用の説明',
  headerLabel: 'AWS XXXX',
  homeBadge: 'インタラクティブ',
  homeIcon: 'Network',
  homeColor: 'blue',
  diagram: diagramConfig,
  modes,
  defaultModeId: 'mode-id',
  glossary,
  glossaryCategories,
  modeThemes: defaultModeThemes,
};

export default config;
```

### Step 7: src/topics/index.ts に登録

```typescript
// topicLoaders に追加
'topic-slug': () => import('./topic-slug/config'),

// topicManifest に追加
{
  slug: 'topic-slug',
  title: 'テーマタイトル',
  description: '説明',
  icon: 'Network',
  color: 'blue',
  badge: 'インタラクティブ',
  path: '/topics/topic-slug',
},
```

これだけで新しいテーマページが自動的に動作する。コンポーネントの変更は不要。

---

## ディレクトリ構造

```
src/
  App.tsx                              ← ルーター
  main.tsx                             ← エントリーポイント
  index.css                            ← グローバルアニメーション

  theme/
    tokens.ts                          ← 色・スペーシング・影の定数
    modeThemes.ts                      ← モードごとの色テーマ (ModeTheme)

  types/
    diagram.ts                         ← DiagramConfig, DiagramNode, DiagramZone, DiagramConnection, DiagramStepState
    simulation.ts                      ← SimulationStep, SimulationMode, PacketHeaders, PacketLabels, KeyPoint
    glossary.ts                        ← GlossaryTerm, GlossaryDatabase
    topic.ts                           ← TopicConfig, TopicManifest, GlossaryCategory

  components/
    common/Header.tsx                  ← アプリヘッダー（topicLabel props）
    glossary/GlossaryModal.tsx         ← 用語集モーダル（glossaryData, categories props）
    diagram/
      ArchitectureDiagram.tsx          ← CSS Grid ベースの構成図
      DiagramNode.tsx                  ← 1つのリソースノード
      DiagramZone.tsx                  ← VPC/サブネット境界ボックス
      DiagramConnection.tsx            ← ノード間接続線
    simulation/
      PacketInspector.tsx              ← Wireshark風パケットヘッダー表示
      StepExplanation.tsx              ← ステップ解説パネル（keyPoints データ駆動）
      StepController.tsx               ← ステップ操作ボタン
      ModeSelector.tsx                 ← モード切替タブ
    layout/
      LearningPage.tsx                 ← 汎用学習ページテンプレート
      SimulationLayout.tsx             ← 左右パネルグリッドレイアウト

  hooks/
    useSimulation.ts                   ← ステップ/モード状態管理
    useGlossary.ts                     ← 用語集モーダル状態管理
    useTopicLoader.ts                  ← トピック設定の遅延読み込み

  utils/
    iconResolver.tsx                   ← アイコン解決（AWS SVG or Lucide）

  topics/
    index.ts                           ← トピック登録（manifest + lazy loader）
    network-simulation/                ← 既存テーマ
      config.ts
      diagram.ts
      modes.ts
      glossary.ts
      steps/
        inbound.ts
        outboundNat.ts
        outboundPublicEcs.ts

  pages/
    Home.tsx                           ← トピック一覧（topicManifest から自動生成）
    TopicPage.tsx                      ← 汎用トピックページ（URL slug でロード）

  assets/aws/                          ← AWS公式アイコン（約1,875件）
```

## コンポーネント責務一覧

| コンポーネント | 責務 | 主要 Props |
|---|---|---|
| `LearningPage` | トピック全体のオーケストレーション | `topicConfig: TopicConfig` |
| `SimulationLayout` | 左右パネルのグリッド配置 | `diagram`, `inspector`, `explanation`, `controller`, `modeSelector` |
| `ArchitectureDiagram` | CSS Grid で構成図を描画 | `config: DiagramConfig`, `stepState: DiagramStepState`, `activeTheme: ModeTheme` |
| `DiagramNode` | 1つのAWSリソースカード | `node: DiagramNode`, `isActive`, `isDimmed`, `hasPacket` |
| `DiagramConnection` | ノード間の接続線（DOM計算） | `connection`, `fromRect`, `toRect`, `isActive` |
| `PacketInspector` | パケットヘッダーのWireshark風表示 | `headers`, `labels`, `changes`, `theme: ModeTheme` |
| `StepExplanation` | ステップのテキスト解説 + Key Points | `title`, `description`, `keyPoints?: KeyPoint[]` |
| `StepController` | 前/次/リセットのナビゲーション | `currentStep`, `totalSteps`, `theme: ModeTheme` |
| `ModeSelector` | モード切替タブ | `modes: SimulationMode[]`, `modeThemes`, `currentModeId` |
| `GlossaryModal` | 用語集の2ペインモーダル | `glossaryData: GlossaryDatabase`, `categories?: GlossaryCategory[]` |

## 表現方法の拡張が必要な場合

もしテーマの内容が既存コンポーネントでは表現しきれない場合（例: フローチャート、テーブル比較、コスト計算パネルなど）:

1. `src/components/` 配下に適切なサブディレクトリへ新コンポーネントを追加する
2. `SimulationLayout` の slot（`diagram`, `inspector`, `explanation`）に渡すか、新しい Layout コンポーネントを作成する
3. `LearningPage` をそのまま使うか、テーマ固有のページコンポーネントを `src/pages/` に作成する
4. 必ずデータ駆動の原則を守り、コンポーネントにハードコードされた内容を持たせない

## 色テーマ

モードテーマは `src/theme/modeThemes.ts` で定義済み:

- `primary` → blue（インバウンド系）
- `secondary` → rose（アウトバウンド NAT 系）
- `tertiary` → amber（コスト削減/代替構成系）

テーマ固有の色が必要な場合は `TopicConfig.modeThemes` でオーバーライドする。

## desc（解説テキスト）内の用語集リンク

ステップ解説の HTML テキスト内で用語集を開くには以下の形式を使う:

```html
<span onclick="openGlossary('term-id')" class="glossary-link font-bold">用語名</span>
```

`StepExplanation` がイベントデリゲーションで `openGlossary('...')` パターンを検出し、用語集モーダルを開く。
