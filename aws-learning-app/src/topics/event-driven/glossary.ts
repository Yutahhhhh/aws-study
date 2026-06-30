import type { GlossaryDatabase } from '../../types/glossary';
import type { GlossaryCategory } from '../../types/topic';

export const glossary: GlossaryDatabase = {
  's3-event-notification': {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Storage/48/Arch_Amazon-Simple-Storage-Service_48.svg',
    title: 'S3 イベント通知',
    eng: 'S3 EVENT NOTIFICATION',
    oneLiner: 'オブジェクト作成/削除をトリガに、Lambda/SQS/SNS/EventBridgeを起動',
    detail: `S3はObjectCreated等のイベントで他サービスを起動できます。アップロード処理(サムネイル生成・ウイルススキャン・インデックス化)を、保存をトリガに自動化できます。
            <br><br>EventBridge経由にすると、より柔軟なルーティングやフィルタが可能です。`,
    focus: `「アップロードAPIの中で重い処理まで同期実行」しないための定石。保存と処理を分けると、APIは速く返せ、処理は非同期でスケールします。`,
  },
  'async-invoke-retry': {
    icon: 'RefreshCw',
    title: '非同期invokeとリトライ',
    eng: 'ASYNC INVOKE & RETRY',
    oneLiner: '非同期Lambdaは失敗時にAWSが自動再試行し、最後はDLQへ',
    detail: `S3イベントやEventBridge経由の非同期invokeでは、関数が失敗するとAWSが既定で数回リトライします。それでも失敗したイベントはOn-failure送信先(DLQ等)へ退避されます。
            <br><br>同期invoke(API Gateway)は呼び出し側がリトライを管理する点が異なります。`,
    focus: `「呼んで終わり」ではなく、失敗時にどこへ退避し誰が気づくかまで設計します。DLQ+アラームが無いと、失敗が静かに消えます。`,
  },
  'sqs-decoupling': {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_App-Integration/48/Arch_Amazon-Simple-Queue-Service_48.svg',
    title: 'SQS と疎結合',
    eng: 'SQS DECOUPLING',
    oneLiner: '生産側と消費側をキューで切り離し、スパイクを吸収する',
    detail: `SQSはメッセージキューです。生産側は投入して即終了、消費側は自分のペースで処理します。急なトラフィック増はキューに溜まり、ワーカーがスケールして消化します。
            <br><br>標準キューはat-least-once/順序保証なし、FIFOキューは順序と重複排除あり(スループットは低め)。`,
    focus: `「直接呼び出し」をやめてキューを挟むと、下流障害でもメッセージが失われず、再処理できます。同期で繋ぐべきか、キューで切るべきかが設計判断。`,
  },
  'event-source-mapping': {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Compute/48/Arch_AWS-Lambda_48.svg',
    title: 'Event Source Mapping',
    eng: 'EVENT SOURCE MAPPING',
    oneLiner: 'LambdaがSQS/Kinesis/DynamoDB Streamsをポーリングしてバッチ処理',
    detail: `SQSやストリームは「Lambdaが取りに行く(poll)」モデルです。Event Source MappingがAWS側でポーリングし、メッセージをバッチでLambdaへ渡します。同時実行はキューの溜まりに応じて自動調整されます。
            <br><br>バッチサイズやバッチウィンドウ、同時実行上限で挙動を調整します。`,
    focus: `処理が下流(DBや外部API)を圧迫しないよう、最大同時実行を絞る判断が要ります。Lambdaは一気にスケールするため、SQSを挟んでも下流のレート制限に注意。`,
  },
  dlq: {
    icon: 'Inbox',
    title: 'DLQ (Dead Letter Queue)',
    eng: 'DEAD LETTER QUEUE',
    oneLiner: '規定回数失敗したメッセージの退避先。捨てずに後で調べる',
    detail: `処理に繰り返し失敗するメッセージ(毒メッセージ)を、規定回数を超えたらDLQへ移します。本処理を止めずに、失敗だけを隔離できます。
            <br><br>DLQの件数を監視し、原因を調べて再投入(redrive)します。`,
    focus: `DLQが無いと、失敗が無限リトライでキューを詰まらせたり、静かに消えたりします。「DLQ + 件数アラーム」をセットにするのが本番の最低ライン。`,
  },
  idempotency: {
    icon: 'Repeat',
    title: '冪等性 (idempotency)',
    eng: 'IDEMPOTENCY',
    oneLiner: '同じメッセージを2回処理しても結果が壊れないようにする',
    detail: `多くのイベント配信はat-least-once(最低1回=重複あり)です。リトライやスケール時に同じイベントが2回届くことがあります。
            <br><br>一意キーで処理済みを記録する、UPSERTにする、などで二重処理に耐えるよう作ります。`,
    focus: `「重複は来ない前提」のコードは本番で必ず壊れます。メッセージIDや業務キーで重複排除し、副作用(課金/メール送信)は特に冪等化します。`,
  },
};

export const glossaryCategories: GlossaryCategory[] = [
  {
    label: 'イベントの起点',
    termIds: ['s3-event-notification', 'sqs-decoupling'],
  },
  {
    label: '処理とスケール',
    termIds: ['async-invoke-retry', 'event-source-mapping'],
  },
  {
    label: '失敗に強くする',
    termIds: ['dlq', 'idempotency'],
  },
];
