import type { GlossaryDatabase } from '../../types/glossary';
import type { GlossaryCategory } from '../../types/topic';

export const glossary: GlossaryDatabase = {
  'l4-vs-l7': {
    icon: 'Layers',
    title: 'L4 と L7 の違い',
    eng: 'LAYER 4 VS LAYER 7',
    oneLiner: 'L4はIP/ポートだけ見る。L7はHTTPの中身(パス/ヘッダー)まで見る',
    detail: `L4(トランスポート層)はIPアドレスとポートで転送します。中身は読みません(NLB)。
            <br><br>L7(アプリ層)はHTTPを解釈し、URLパス・ホスト名・ヘッダー・Cookieで判断できます(ALB)。中身を読む分だけ機能が豊富ですが、一度接続を終端します。`,
    focus: `「賢いが少し重いL7(ALB)」「速いが素通しのL4(NLB)」と覚えると選びやすいです。HTTPアプリならALB、非HTTP/低遅延/固定IPならNLBが出発点。`,
  },
  'tls-termination': {
    icon: 'LockKeyhole',
    title: 'TLS終端',
    eng: 'TLS TERMINATION',
    oneLiner: 'ロードバランサが暗号を解いて中身を読み、必要なら張り直す',
    detail: `ALBはTLSを終端し、平文HTTPとして中身を読めるようにします。これによりパスルーティングやWAFが可能になります。ターゲットへは再度TLS(またはHTTP)で接続します。
            <br><br>NLBは基本的に終端せず素通し(TLSをターゲットで終端、またはNLBでTLSリスナーも可)。`,
    focus: `終端する=中身が見える=機能が増える。終端しない=速い・透過的。証明書(ACM)はALB/NLBのリスナーに付けます。`,
  },
  'alb-path-routing': {
    icon: '/src/assets/aws/Resource-Icons_07312025/Res_Networking-Content-Delivery/Res_Elastic-Load-Balancing_Application-Load-Balancer_48.svg',
    title: 'ALB リスナールール(パス/ホスト)',
    eng: 'ALB LISTENER RULES',
    oneLiner: 'URLパスやホスト名でターゲットグループを出し分ける',
    detail: `ALBのリスナーに条件(path-pattern, host-header, http-header等)を持つルールを並べ、上から順に評価して振り分け先(ターゲットグループ)を決めます。
            <br><br>1つのALBで /api・/img・admin.example.com などを束ねられます。`,
    focus: `「サービスごとにLBを増やす」前にルールでまとめられないか考えます。ルールには優先順位と上限があり、増えすぎたら設計を見直すサイン。`,
  },
  'x-forwarded-for': {
    icon: 'MoveRight',
    title: 'X-Forwarded-For (本当のIP)',
    eng: 'X-FORWARDED-FOR',
    oneLiner: 'ALB経由だとターゲットの送信元はALB。実IPはこのヘッダーで渡る',
    detail: `ALBは接続を張り直すため、ターゲットのTCP送信元はALBのIPになります。本当のクライアントIPは X-Forwarded-For ヘッダーに入って渡されます。
            <br><br>アプリやログはこのヘッダーを読む必要があります。`,
    focus: `「アクセスログのIPが全部ALB」になるのはこれが原因。フレームワークのproxy設定(trusted proxies)でXFFを信頼させ、実IPを取り出します。NLBなら素のIPがそのまま届きます。`,
  },
  'nlb-source-ip': {
    icon: '/src/assets/aws/Resource-Icons_07312025/Res_Networking-Content-Delivery/Res_Elastic-Load-Balancing_Network-Load-Balancer_48.svg',
    title: 'NLB と送信元IP保持',
    eng: 'NLB SOURCE IP PRESERVATION',
    oneLiner: 'L4で素通しのため、ターゲットへクライアントIPがそのまま届く',
    detail: `NLB(instance/IPターゲット)はクライアントの送信元IPを保ったまま転送します。アプリ側でXFFを気にせず実IPが使えます。
            <br><br>セキュリティ機器やIP allowlistの前段に向きます。`,
    focus: `SGはNLBではなくターゲット側で効きます(従来NLBはSGなし、近年は付与可)。allowlistはターゲットSG/アプリ側で組む点に注意。`,
  },
  'nlb-static-ip': {
    icon: 'MapPin',
    title: 'NLB 固定IP・超低遅延・非HTTP',
    eng: 'NLB STATIC IP / LOW LATENCY',
    oneLiner: 'AZごとに固定IP(EIP可)、極小レイテンシ、TCP/UDP/gRPCも扱える',
    detail: `NLBはAZごとに固定IPを持ち、Elastic IPも割り当てられます。HTTPに限らずTCP/UDP(ゲーム/MQTT/gRPC生TCP等)を扱え、レイテンシが非常に小さいのが強みです。
            <br><br>PrivateLink(VPCエンドポイントサービス)の入口にもNLBを使います。`,
    focus: `「相手にIPアドレスをファイアウォール許可してもらう必要がある」「数百万接続/超低遅延」「非HTTP」「PrivateLinkで他アカウントへ公開」=NLBの出番。`,
  },
};

export const glossaryCategories: GlossaryCategory[] = [
  {
    label: '基本の違い',
    termIds: ['l4-vs-l7', 'tls-termination'],
  },
  {
    label: 'ALB(L7)の機能',
    termIds: ['alb-path-routing', 'x-forwarded-for'],
  },
  {
    label: 'NLB(L4)の強み',
    termIds: ['nlb-source-ip', 'nlb-static-ip'],
  },
];
