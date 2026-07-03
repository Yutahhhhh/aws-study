import type { GlossaryDatabase } from '../../types/glossary';
import type { GlossaryCategory } from '../../types/topic';

export const glossary: GlossaryDatabase = {
  'presigned-url': {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Storage/48/Arch_Amazon-Simple-Storage-Service_48.svg',
    title: 'Presigned URL (署名付きURL)',
    eng: 'PRESIGNED URL',
    oneLiner: 'IAM権限を持つ側が署名した、期限・操作・キー限定のS3操作URL',
    detail: `AWS権限を持たないクライアントに、特定のS3操作(PUT/GET)を期限付きで許可するURLです。署名にはバケット、キー、HTTPメソッド、有効期限が含まれ、変更すると署名が合わず403になります。
            <br><br>アップロード(PUT)だけでなく、非公開ファイルの限定ダウンロード(GET)にも使います。`,
    focus: `「誰にどのキーへのURLを発行するか」の認可はアプリの責任です。キーをユーザー入力から組み立てるとパストラバーサル的な事故につながるため、キーはサーバー側で生成(UUID等)します。期限は用途に対して最短に。`,
  },
  'sigv4-signing': {
    icon: 'KeyRound',
    title: 'SigV4署名',
    eng: 'SIGNATURE VERSION 4',
    oneLiner: 'AWS APIリクエストの改ざん防止署名。Presigned URLの中身もこれ',
    detail: `AWSのAPI呼び出しは、リクエスト内容と時刻から計算するHMAC署名(SigV4)で認証されます。Presigned URLはこの署名をクエリ文字列として埋め込んだものです。
            <br><br>署名はIAMロールの一時認証情報から計算されるため、URLの有効期限はロールのセッション期限にも制限されます。`,
    focus: `SDKが自動でやるので普段は意識しませんが、「Presigned URLが期限より早く失効する」問題の原因は大抵これ(短命な一時認証情報で署名した)です。長めの期限が必要なら長寿命の認証情報を持つ役割で署名します。`,
  },
  'upload-cors': {
    icon: 'Globe',
    title: 'CORS設定 (S3)',
    eng: 'CROSS-ORIGIN RESOURCE SHARING',
    oneLiner: 'ブラウザから別オリジンのS3へPUTするための許可設定',
    detail: `ブラウザのJavaScriptからapp.example.com以外のオリジン(S3のURL)へPUTするには、バケットのCORS設定でAllowedOrigins/AllowedMethods/AllowedHeadersを許可する必要があります。
            <br><br>プリフライト(OPTIONS)リクエストにS3が応答し、ブラウザが本リクエストを許可します。`,
    focus: `Presigned URLアップロードが「curlでは成功するのにブラウザで失敗する」場合、ほぼCORSです。AllowedOriginsは本番ドメインに絞ること。「*」のまま本番に出すのはよくある指摘事項です。`,
  },
  's3-event-upload': {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_App-Integration/48/Arch_Amazon-Simple-Queue-Service_48.svg',
    title: 'S3イベント通知',
    eng: 'S3 EVENT NOTIFICATION',
    oneLiner: '「保存された」というS3側の事実を起点に後続処理を起動する',
    detail: `ObjectCreatedなどのイベントをSQS/SNS/Lambda/EventBridgeへ送れます。アップロード完了の検知をクライアントの自己申告に頼らず、S3の事実に基づいて処理を進められます。
            <br><br>SQSを挟むと、Workerの一時停止やスパイクに強くなり、リトライとDLQも使えます。`,
    focus: `イベントは「少なくとも1回」配信で、稀に重複します。Worker側はキー単位の冪等処理(同じファイルを2回処理しても壊れない)にしておくのが前提です。`,
  },
  'multipart-upload': {
    icon: 'Layers3',
    title: 'マルチパートアップロード',
    eng: 'MULTIPART UPLOAD',
    oneLiner: '巨大ファイルを分割して並列アップロード。失敗時は途中から再開',
    detail: `ファイルをパート(5MB以上)に分割し、並列にアップロードして最後に結合します。パート単位でリトライできるため、不安定な回線でも巨大ファイルを送り切れます。
            <br><br>5GBを超えるオブジェクトはマルチパートが必須です。ブラウザ実装ではパートごとにPresigned URLを発行します。`,
    focus: `中断されたマルチパートアップロードの断片は見えないまま課金され続けます。ライフサイクルルールで「未完了マルチパートをN日後に自動破棄」を必ず設定します。`,
  },
  'upload-validation': {
    icon: 'ShieldCheck',
    title: 'アップロード後の検証',
    eng: 'CONTENT VALIDATION',
    oneLiner: '「S3に置かれた=安全」ではない。配信前に型・サイズ・中身を検証する',
    detail: `拡張子やContent-Typeは自己申告なので偽装できます。Workerがマジックバイトで実際のファイル形式を確認し、サイズ上限、必要に応じてマルウェアスキャンを行ってから「公開可能」に昇格させます。
            <br><br>画像なら再エンコード(サニタイズを兼ねる)、サムネイル生成もこの段階で行います。`,
    focus: `検証前のファイルを配信バケットに置かない(またはstatusで配信を制御する)構造にしておくと、危険なファイルがユーザーに届く経路を構造的に塞げます。HTMLファイルをアップロードさせてXSSに使う攻撃は実際に多いです。`,
  },
  'two-phase-upload': {
    icon: 'GitCommitHorizontal',
    title: '2段階の状態管理 (pending/ready)',
    eng: 'TWO-PHASE STATE',
    oneLiner: 'URL発行時に仮登録、検証完了で本登録。迷子ファイルを作らない',
    detail: `URL発行時にDBへstatus='pending'で行を作り、Workerの検証完了でstatus='ready'に更新します。「DBにあるのにS3に無い」「S3にあるのにDBに無い」という不整合を追跡可能にします。
            <br><br>一定時間pendingのままのレコードは、アップロード放棄とみなして掃除します。`,
    focus: `この状態設計が無いと「アップロードしたのに表示されない」の調査が地獄になります。pendingの滞留数はダッシュボードに出す価値のあるメトリクスです(急増=アップロード導線の障害)。`,
  },
};

export const glossaryCategories: GlossaryCategory[] = [
  {
    label: '直接アップロードの仕組み',
    termIds: ['presigned-url', 'sigv4-signing', 'upload-cors', 'multipart-upload'],
  },
  {
    label: '後処理と安全性',
    termIds: ['s3-event-upload', 'upload-validation', 'two-phase-upload'],
  },
];
