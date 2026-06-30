import type { GlossaryDatabase } from '../../types/glossary';
import type { GlossaryCategory } from '../../types/topic';

export const glossary: GlossaryDatabase = {
  'subnet-per-az': {
    icon: 'Grid2x2',
    title: '1 Subnet = 1 AZ',
    eng: 'ONE SUBNET PER AZ',
    oneLiner: 'Subnetは1つのAZにしか属せない。Multi-AZにはAZの数だけSubnetが要る',
    detail: `1つのSubnetは必ず1つのAZに属し、複数AZにまたがれません。
            <br><br>そのため、Multi-AZ構成にするには、Public/PrivateそれぞれをAZの数だけ作り(例: Public A/C、Private A/C)、ECSやRDSをそれらに分散配置します。`,
    focus: `「大きいSubnetを1つ作ればMulti-AZ」にはなりません。AZ分散はSubnetの数で決まります。ECS ServiceにはAZ分のPrivate Subnetを、RDSのDB subnet groupにもAZ分のSubnetを指定します。`,
  },
  'alb-multi-az': {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Elastic-Load-Balancing_48.svg',
    title: 'ALB の Multi-AZ とヘルスチェック',
    eng: 'ALB ACROSS AVAILABILITY ZONES',
    oneLiner: '複数AZのPublic Subnetにノードを持ち、健全なターゲットだけに振り分ける',
    detail: `ALBは指定した各AZのPublic Subnetにノードを配置します。各ターゲットへ定期的にhealth checkを行い、健全なターゲットだけにリクエストを流します。
            <br><br>片方のAZのTaskが落ちても、ALBがそれを検知して外し、もう片方のAZへ振り分けます。`,
    focus: `デプロイや障害で重要なのがhealth checkです。新Taskはhealth checkに通って初めてトラフィックを受け、不健全なTaskは自動で外れます。health checkのパスやタイムアウト設定がデプロイ可否にも影響します。`,
  },
  'multi-az-rds': {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Database/48/Arch_Amazon-RDS_48.svg',
    title: 'RDS Multi-AZ',
    eng: 'RDS MULTI-AZ DEPLOYMENT',
    oneLiner: '別AZにStandbyを持ち、Primary障害時にfailoverする高可用性構成',
    detail: `最も一般的なMulti-AZ DB instanceでは、別AZにStandbyを持ち、Primaryから同期レプリケーションします。アプリは単一エンドポイントに接続し、Primary障害時はStandbyへfailoverします。
            <br><br>Standbyは通常、読み取りには使えません(failover用)。`,
    focus: `「Multi-AZにすれば読み取りも速くなる」は誤解です。Standbyは読めません。読み取りを分散したいならRead Replica(別エンドポイント・非同期)を使います。目的が高可用性か負荷分散かで選びます。`,
  },
  failover: {
    icon: 'RefreshCw',
    title: 'failover (フェイルオーバー)',
    eng: 'FAILOVER',
    oneLiner: 'Primary障害時に、エンドポイントの向き先をStandbyへ自動で切り替えること',
    detail: `RDSはPrimaryの障害を検知すると、StandbyをPrimaryに昇格させ、エンドポイントの向き先を切り替えます。アプリは同じエンドポイントを使い続けられます。
            <br><br>ただし切替の間は一時的に接続が切れます。`,
    focus: `failoverは自動ですが「瞬断ゼロ」ではありません。アプリ側に再接続・リトライ処理が必要です。「failoverすればアプリは何もしなくてよい」は誤解です。`,
  },
  'multi-az-limits': {
    icon: 'OctagonAlert',
    title: 'Multi-AZで守れないもの',
    eng: 'WHAT MULTI-AZ DOES NOT PROTECT',
    oneLiner: 'AZ障害には強いが、バグ・誤操作・設定ミス・リージョン障害は守れない',
    detail: `Multi-AZが守りやすくするのは「1つのAZの障害」です。次は守れません。
            <br><br>・アプリのバグ / 誤ったDB migration
            <br>・SGやルートテーブルの設定ミス(全AZに等しく効く)
            <br>・認証情報の漏洩
            <br>・リージョン全体の障害`,
    focus: `Multi-AZは可用性設計の一部であり、万能ではありません。設定ミスやバグはMulti-AZでも防げないため、デプロイ手順、バックアップ、監視・アラーム、必要に応じてマルチリージョンなど、別の対策と組み合わせます。`,
  },
};

export const glossaryCategories: GlossaryCategory[] = [
  {
    label: 'Multi-AZの土台',
    termIds: ['subnet-per-az', 'alb-multi-az'],
  },
  {
    label: 'RDSと冗長化',
    termIds: ['multi-az-rds', 'failover', 'multi-az-limits'],
  },
];
