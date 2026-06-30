import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'distributed-tracing',
  title: '分散トレーシングと深い観測',
  description: 'X-Ray / OpenTelemetry。複数サービスをまたぐ1リクエストを追い、「どこで遅いか」を特定する',
  headerLabel: 'AWS TRACING',
  homeIcon: 'Radar',
  homeColor: 'rose',
  intro:
    'マイクロサービスや非同期処理では、1つの遅延・エラーが<strong>どのサービスの、どの区間で</strong>起きたのかをログ単体では追えません。リクエストに一意のIDを付けて全区間を貫いて記録するのが<strong>分散トレーシング</strong>です。',
  sections: [
    {
      id: 'three-pillars',
      title: 'ログ・メトリクスの先にある「トレース」',
      icon: 'Activity',
      blocks: [
        {
          type: 'compare',
          columns: [
            { title: 'ログ', subtitle: '点の記録', accent: 'blue', points: ['1イベントの詳細', '「何が起きたか」'] },
            { title: 'メトリクス', subtitle: '集計値', accent: 'emerald', points: ['数値の時系列', '「全体の傾向」'] },
            { title: 'トレース', subtitle: '線(因果)', accent: 'rose', points: ['1リクエストの全区間', '「どこで時間を使ったか」'] },
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          html: '「5xxが増えた」(メトリクス)→「どのリクエストか」(トレース)→「その時アプリは何を出したか」(ログ)、と3つを行き来して原因にたどり着きます。トレースは<span class="font-bold">監視・ログ・アラーム</span>ガイドの続きです。',
        },
      ],
    },
    {
      id: 'xray',
      title: 'X-Ray（セグメントとサービスマップ）',
      icon: 'Radar',
      blocks: [
        {
          type: 'flow',
          title: '1つのtraceは区間(segment)の連なり',
          steps: [
            { label: 'ALB/API', sublabel: 'trace開始', accent: 'blue' },
            { label: 'ECSアプリ', sublabel: 'segment', accent: 'emerald' },
            { label: 'RDS呼び出し', sublabel: 'subsegment', accent: 'sky' },
            { label: '外部API', sublabel: 'subsegment', accent: 'amber' },
          ],
        },
        {
          type: 'list',
          items: [
            '<strong>trace ID</strong>が全区間を貫き、各サービスの処理を<strong>segment / subsegment</strong>として記録',
            'X-Rayは収集したsegmentから<strong>サービスマップ</strong>を自動生成し、遅い区間・エラー率を可視化',
            'ECS/Lambdaでは<strong>サイドカー(X-Ray daemon)やSDK</strong>でsegmentを送信する',
          ],
        },
      ],
    },
    {
      id: 'otel',
      title: 'OpenTelemetry / ADOT（ベンダ中立）',
      icon: 'Boxes',
      blocks: [
        {
          type: 'paragraph',
          html:
            '<strong>OpenTelemetry(OTel)</strong>は計装(instrumentation)の標準仕様です。アプリはOTelで計装し、<strong>ADOT(AWS Distro for OpenTelemetry) Collector</strong>がトレース/メトリクスを受けて、X-RayやCloudWatch、あるいは他社バックエンドへ<strong>送り先を差し替え可能</strong>な形で転送します。',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'なぜOTelか',
          html: '計装をAWS固有APIに縛らないため、将来バックエンドを変えてもアプリのコードを書き換えずに済みます。新規ならX-Ray SDKよりOTelベースが無難です。',
        },
      ],
    },
    {
      id: 'correlation',
      title: 'コンテキスト伝播と相関ID',
      icon: 'Share2',
      blocks: [
        {
          type: 'steps',
          steps: [
            { title: '入口でtrace contextを生成', html: 'ALB/CloudFront/アプリが<code>traceparent</code>等のヘッダを付与。', accent: 'blue' },
            { title: '下流へ伝播', html: 'HTTP呼び出しやSQSメッセージ属性に<strong>trace IDを載せて引き継ぐ</strong>。', accent: 'amber' },
            { title: 'ログにも相関IDを出す', html: '各サービスのログに同じIDを記録し、トレースとログを突き合わせる。', accent: 'emerald' },
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: '非同期で途切れやすい',
          html: 'SQS/EventBridgeを挟むと文脈が切れがちです。<strong>メッセージ属性にtrace IDを明示的に載せて</strong>引き継がないと、キューの前後がつながらず「どこで詰まったか」が追えません（<span class="font-bold">イベント駆動</span>シミュレーション参照）。',
        },
      ],
    },
  ],
  checkpoints: [
    'ログ・メトリクス・トレースの役割の違いを説明できるか',
    'trace IDとsegment/subsegmentの関係を説明できるか',
    'サービスマップが何を可視化するか説明できるか',
    'OpenTelemetry/ADOTを使う利点(ベンダ中立)を説明できるか',
    '非同期処理でtrace contextを伝播させる必要性を説明できるか',
  ],
  references: [
    { label: 'AWS X-Ray concepts', url: 'https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html' },
    { label: 'AWS Distro for OpenTelemetry', url: 'https://aws-otel.github.io/docs/introduction' },
    { label: 'Instrumenting your application (X-Ray)', url: 'https://docs.aws.amazon.com/xray/latest/devguide/xray-instrumenting-your-app.html' },
  ],
};

export default config;
