import type { GlossaryDatabase } from '../../types/glossary';
import type { GlossaryCategory } from '../../types/topic';

export const glossary: GlossaryDatabase = {
  'cache-key': {
    icon: 'KeySquare',
    title: 'キャッシュキー',
    eng: 'CACHE KEY',
    oneLiner: '「同じリクエスト」とみなす条件。URL+選んだヘッダー/クエリ/Cookie',
    detail: `エッジは受け取ったリクエストからキャッシュキーを計算し、一致するキャッシュがあれば返します。既定はURLパスのみで、キャッシュポリシーでヘッダー・クエリ文字列・Cookieをキーに追加できます。
            <br><br>例: Accept-Languageをキーに含めると言語ごとに別キャッシュになります。`,
    focus: `キーに含める要素が増えるほどキャッシュが分裂し、ヒット率が落ちます。「本当にレスポンスを変化させる要素だけ」をキーに含めるのが設計の勘所。全Cookie転送+キー化はほぼキャッシュ無効化と同義です。`,
  },
  'cache-control-ttl': {
    icon: 'Timer',
    title: 'Cache-ControlとTTL',
    eng: 'CACHE-CONTROL / TTL',
    oneLiner: '「どれだけキャッシュしてよいか」。オリジンのヘッダーとポリシーで決まる',
    detail: `オリジンが返すCache-Control(max-age等)と、CloudFront側のキャッシュポリシー(Min/Default/Max TTL)の組み合わせで実際のTTLが決まります。
            <br><br>TTL内のリクエストはオリジンに一切問い合わせず、エッジだけで応答します。no-cacheは「キャッシュ禁止」ではなく「使う前に毎回オリジンへ確認(再検証)」の意味です。`,
    focus: `ブラウザキャッシュにも同じヘッダーが効く点を忘れずに。CloudFrontのInvalidationをしても、利用者のブラウザに残ったキャッシュは消せません。だからこそHTMLにはno-cache/短TTLを返す設計が重要です。`,
  },
  'cache-hit-miss': {
    icon: 'Crosshair',
    title: 'HIT / MISS とヒット率',
    eng: 'CACHE HIT RATIO',
    oneLiner: 'エッジで返せたらHIT。ヒット率がCDNの費用対効果そのもの',
    detail: `キャッシュにあればHIT(高速・オリジン負荷ゼロ)、なければMISS(オリジンへ転送)。レスポンスのX-Cacheヘッダーや、CloudWatchのCacheHitRateメトリクスで確認できます。
            <br><br>TTL切れ後に条件付きリクエストで「変わっていない」ことを確認できた場合はRefreshHitになります。`,
    focus: `ヒット率が低い時の三大原因は「TTLが短すぎる」「キャッシュキーが分裂している(不要なクエリ/ヘッダー)」「そもそもキャッシュ可能なレスポンスをオリジンが返していない」。ヒット率はコスト(オリジン転送量)と速度に直結します。`,
  },
  'invalidation': {
    icon: 'Eraser',
    title: 'Invalidation (キャッシュ削除)',
    eng: 'CACHE INVALIDATION',
    oneLiner: '全エッジからキャッシュを強制削除するAPI。確実だが遅くて有料',
    detail: `CreateInvalidationで指定パス(例: /index.html や /*)のキャッシュを全エッジから削除します。完了まで通常数十秒〜数分かかります。
            <br><br>月1,000パスまで無料、それ以降は1パスごとに課金されます。/*は1パスとして数えられます。`,
    focus: `「リリースのたびに/*をInvalidation」は動きますが、反映タイムラグ・課金・ブラウザキャッシュには無力という弱点があります。ハッシュ付きファイル名+HTML短TTLの設計にして、Invalidationは誤配信時の緊急手段に格下げするのが定石です。`,
  },
  'versioned-assets': {
    icon: 'FileDigit',
    title: 'ハッシュ付きアセット',
    eng: 'CONTENT-HASHED ASSETS',
    oneLiner: 'ビルドごとにファイル名が変わる=別キャッシュキー。無効化が不要になる',
    detail: `Vite/webpack等はapp.a1b2c3.jsのように内容ハッシュをファイル名に含めて出力します。内容が変わればURLが変わるため、キャッシュの上書きや無効化という概念自体が不要になります。
            <br><br>Cache-Control: max-age=31536000, immutable を付けて1年キャッシュするのが標準です。`,
    focus: `注意点は2つ。(1)デプロイ時に古いハッシュのファイルをすぐ消さない(旧HTMLを開いているユーザーがまだ参照する)。(2)エントリーポイントのindex.htmlだけはハッシュ名にできないので短TTL/no-cacheにする。`,
  },
  'cache-behavior': {
    icon: 'Split',
    title: 'ビヘイビア (パス別ルーティング)',
    eng: 'CACHE BEHAVIOR',
    oneLiner: 'パスパターンごとにオリジンとキャッシュ方針を切り替える設定',
    detail: `CloudFrontはパスパターン(/api/*, /assets/*など)ごとにビヘイビアを定義し、転送先オリジン・キャッシュポリシー・許可HTTPメソッドなどを切り替えます。
            <br><br>典型例: /api/*はALBへキャッシュ無効(CachingDisabled)で転送、それ以外はS3へ長期キャッシュで転送。`,
    focus: `「1つのドメインでフロントもAPIも配る」構成の背骨です。CORSが不要になり、Cookieも同一ドメインで扱えます。APIをキャッシュ無効にし忘れると「他人のマイページが表示される」重大事故になり得るので、動的パスの設定は必ず確認します。`,
  },
  'origin-request': {
    icon: 'ArrowRightLeft',
    title: 'オリジンリクエスト',
    eng: 'ORIGIN REQUEST',
    oneLiner: 'MISS時にエッジからオリジンへ飛ぶリクエスト。何を転送するかは別設定',
    detail: `キャッシュキー(何で区別するか)とオリジンリクエストポリシー(何をオリジンへ転送するか)は別の設定です。例えば全ヘッダーをオリジンへ転送しつつ、キャッシュキーはURLだけにできます。
            <br><br>S3をオリジンにする場合はOAC(Origin Access Control)でS3を非公開のまま配信します。`,
    focus: `「キーに含める」と「転送する」の混同が設定ミスの典型です。認証ヘッダーは転送は必要でもキーに含めるとキャッシュが分裂します。逆にVaryさせたい要素をキーに入れ忘れると、別ユーザー向けレスポンスの混線事故につながります。`,
  },
};

export const glossaryCategories: GlossaryCategory[] = [
  {
    label: 'キャッシュの基本',
    termIds: ['cache-key', 'cache-control-ttl', 'cache-hit-miss', 'origin-request'],
  },
  {
    label: 'リリースと運用',
    termIds: ['invalidation', 'versioned-assets', 'cache-behavior'],
  },
];
