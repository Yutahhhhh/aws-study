import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'orchestration',
  title: 'ワークフローとファンアウト',
  description: 'EventBridge / SNS ファンアウト / Step Functions。疎結合な非同期処理を「振り分ける」か「手順で束ねる」か',
  headerLabel: 'AWS ORCHESTRATION',
  homeIcon: 'Workflow',
  homeColor: 'amber',
  intro:
    'イベント駆動を一歩進めると、「1つの出来事を複数の処理に配る(ファンアウト)」「複数ステップを順序・分岐・リトライ付きで束ねる(ワークフロー)」が必要になります。SQS単体の先にある選択肢を整理します。',
  sections: [
    {
      id: 'two-styles',
      title: '振り付け(choreography) と 指揮(orchestration)',
      icon: 'GitBranch',
      blocks: [
        {
          type: 'compare',
          columns: [
            {
              title: 'Choreography',
              subtitle: 'イベントで疎結合',
              accent: 'blue',
              points: ['各サービスがイベントを発行/購読', '中央に制御役を置かない', '疎結合だが全体像が追いにくい'],
            },
            {
              title: 'Orchestration',
              subtitle: '手順を1か所で定義',
              accent: 'amber',
              points: ['ワークフローが順序/分岐/リトライを制御', '全体像が明確', '制御役への依存が生まれる'],
            },
          ],
        },
        {
          type: 'paragraph',
          html:
            '「出来事を配るだけ」ならEventBridge/SNS(choreography)、「複数ステップを確実に・状態を持って進める」ならStep Functions(orchestration)。両者は併用します。',
        },
      ],
    },
    {
      id: 'eventbridge',
      title: 'EventBridge（ルールで振り分け）',
      icon: 'Workflow',
      blocks: [
        {
          type: 'flow',
          steps: [
            { label: 'イベント源', sublabel: 'アプリ/AWSサービス', accent: 'emerald' },
            { label: 'Event Bus', sublabel: 'ルールでマッチ', accent: 'amber' },
            { label: '複数ターゲット', sublabel: 'Lambda/SQS/SFn等', accent: 'blue' },
          ],
        },
        {
          type: 'list',
          items: [
            '<strong>イベントの中身でルーティング</strong>(<code>detail-type</code>や属性でフィルタ)',
            '1イベントを<strong>複数ターゲットへファンアウト</strong>できる',
            'AWSサービスのイベント(GuardDuty検出・S3変更等)も受けられ、SaaS連携やスケジュール実行も可能',
          ],
        },
      ],
    },
    {
      id: 'sns-fanout',
      title: 'SNS ファンアウト（1→多の配信）',
      icon: 'Share2',
      blocks: [
        {
          type: 'flow',
          steps: [
            { label: '発行者', accent: 'emerald' },
            { label: 'SNS Topic', sublabel: 'pub/sub', accent: 'rose' },
            { label: '複数SQS / Lambda', sublabel: '各処理が独立購読', accent: 'blue' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'SNS + SQS が定番',
          html: 'SNSの各購読者の前に<strong>SQSを挟む</strong>と、購読者ごとにバッファ・リトライ・DLQを持て、1つが落ちても他に影響しません。「通知の配布」はSNS/EventBridge、「内容のルーティング」はEventBridgeが得意です。',
        },
      ],
    },
    {
      id: 'step-functions',
      title: 'Step Functions（状態を持つワークフロー）',
      icon: 'ListChecks',
      blocks: [
        {
          type: 'steps',
          steps: [
            { title: '状態機械(state machine)で手順を定義', html: 'タスク・選択(分岐)・並列・待機などの状態をJSONで宣言。', accent: 'blue' },
            { title: '各ステップにリトライ/タイムアウト/キャッチ', html: '失敗時の再試行や代替経路を<strong>コードでなく定義</strong>で持てる。', accent: 'amber' },
            { title: '補償(ロールバック)で整合性を保つ', html: '途中失敗時に既処理を打ち消すSagaパターンを表現できる。', accent: 'emerald' },
          ],
        },
        {
          type: 'table',
          headers: ['種別', '特徴', '向き'],
          rows: [
            ['Standard', '長時間・正確に1回・履歴を保持', '注文処理・バッチ・人手承認を含む業務フロー'],
            ['Express', '高スループット・短時間・低コスト', 'イベント処理・ストリーミングの大量実行'],
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          html: '「複数サービスを順番に呼び、失敗時に戻したい」処理をアプリ内のtry/catchで抱えると壊れやすくなります。<strong>手順と失敗処理をStep Functionsに外出し</strong>すると、可視化・再実行・監査がしやすくなります。',
        },
      ],
    },
    {
      id: 'cheatsheet',
      title: '選択指針',
      icon: 'Layers',
      blocks: [
        {
          type: 'table',
          headers: ['やりたいこと', '第一候補'],
          rows: [
            ['1つの処理を確実に非同期化(バッファ/リトライ)', 'SQS'],
            ['1イベントを複数処理へ配る', 'SNS / EventBridge'],
            ['イベントの中身で振り分け・SaaS/定期実行', 'EventBridge'],
            ['複数ステップを順序・分岐・補償付きで束ねる', 'Step Functions'],
          ],
        },
      ],
    },
  ],
  checkpoints: [
    'choreography と orchestration の違いと使い分けを説明できるか',
    'EventBridgeのルールによる振り分け/ファンアウトを説明できるか',
    'SNS+SQSのファンアウトでSQSを挟む利点を説明できるか',
    'Step Functions の Standard と Express の違いを説明できるか',
    '失敗時の補償(Saga)をワークフローで持つ意義を説明できるか',
  ],
  references: [
    { label: 'Amazon EventBridge', url: 'https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html' },
    { label: 'SNS fanout to SQS', url: 'https://docs.aws.amazon.com/sns/latest/dg/sns-common-scenarios.html' },
    { label: 'AWS Step Functions', url: 'https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html' },
    { label: 'Standard vs Express workflows', url: 'https://docs.aws.amazon.com/step-functions/latest/dg/concepts-standard-vs-express.html' },
  ],
};

export default config;
