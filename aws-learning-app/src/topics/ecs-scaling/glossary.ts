import type { GlossaryDatabase } from '../../types/glossary';
import type { GlossaryCategory } from '../../types/topic';

export const glossary: GlossaryDatabase = {
  'ecs-service': {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.svg',
    title: 'ECS Service と Desired Count',
    eng: 'ECS SERVICE',
    oneLiner: '指定した数のTaskを維持し続ける管理単位。落ちたら自動で起動し直す',
    detail: `ECS Serviceは「このTask Definitionを常に N 個動かす」を保証する仕組みです。Taskが落ちれば自動で再起動し、ALBのターゲットグループへの登録/解除も行います。
            <br><br>Auto ScalingはこのServiceのDesired Countを増減させます。`,
    focus: `スケールの主役はServiceです。手動で「Task数を3に」もできますが、本番ではTarget Tracking等で自動化します。新Taskはhealth checkに通って初めてトラフィックを受ける点に注意。`,
  },
  'desired-count': {
    icon: 'Hash',
    title: 'Desired Count (希望タスク数)',
    eng: 'DESIRED COUNT',
    oneLiner: '「いま何個のTaskを動かしたいか」。スケールとはこの数の増減',
    detail: `Fargateのスケールは、1つのコンテナを大きくする(垂直)のではなく、同じTaskを横に増やす(水平)のが基本です。Desired Countがその個数です。
            <br><br>min/maxの範囲内でAuto Scalingが調整します。`,
    focus: `「CPUを上げれば速くなる」ではなく「Taskを増やして並列で捌く」発想に切り替えます。状態はTaskの外(RDS/ElastiCache等)に置き、Taskはいつ増減してもよいステートレスにします。`,
  },
  'cloudwatch-alarm': {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Management-Governance/48/Arch_Amazon-CloudWatch_48.svg',
    title: 'CloudWatch メトリクスとアラーム',
    eng: 'CLOUDWATCH ALARM',
    oneLiner: 'CPUやリクエスト数を継続観測し、しきい値超えでアラームを上げる',
    detail: `CloudWatchはECSのCPU/メモリ使用率やALBのリクエスト数などを集計します。Auto Scalingはこれを入力に判断します。
            <br><br>ECSのスケールでよく使う指標は「ECSServiceAverageCPUUtilization」や「ALBRequestCountPerTarget」です。`,
    focus: `何を指標にスケールするかが設計の肝です。CPUが頭打ちにならないワークロード(I/O待ちが多い等)では、CPUより「ターゲットあたりリクエスト数」の方が素直にスケールします。`,
  },
  'target-tracking': {
    icon: '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Compute/48/Arch_Amazon-EC2-Auto-Scaling_48.svg',
    title: 'Target Tracking スケーリング',
    eng: 'TARGET TRACKING SCALING',
    oneLiner: '目標値(例: CPU50%)を決めると、必要なTask数を自動計算して維持する',
    detail: `「平均CPUを50%に保つ」のように目標を1つ決めるだけで、Application Auto Scalingが必要なDesired Countを逆算し、増減させます。サーモスタットのイメージです。
            <br><br>細かく段階を切るStep Scalingもありますが、まずはTarget Trackingが推奨です。`,
    focus: `目標値は低すぎると無駄に多くのTaskを抱え(高コスト)、高すぎると遅延が出ます。50〜70%あたりから始め、実トラフィックで調整します。急増対策に最小数(min)を底上げするのも有効。`,
  },
  cooldown: {
    icon: 'Timer',
    title: 'クールダウン / バタつき防止',
    eng: 'COOLDOWN',
    oneLiner: '増減直後はしばらく次の調整を待ち、増減の繰り返しを防ぐ',
    detail: `スケール直後にすぐ逆方向へ動くと、起動と停止を繰り返す“フラッピング”が起きます。クールダウンや評価期間で、変化が定常的かを見極めます。
            <br><br>scale-inはscale-outより保守的に設定するのが定石です。`,
    focus: `「増えるのは速く、減るのはゆっくり」が安全側です。減らしすぎて再び急増すると、起動待ちでユーザーに遅延が出ます。`,
  },
  'connection-draining': {
    icon: 'Unplug',
    title: 'Connection Draining (deregistration delay)',
    eng: 'CONNECTION DRAINING',
    oneLiner: 'Taskを止める前に、処理中のリクエストが終わるのを待つ',
    detail: `scale-inやデプロイでTaskを止める際、ALBはまず新規振り分けを止め(deregister)、処理中のリクエストが完了するのを一定時間待ってから接続を切ります。
            <br><br>これによりユーザーのリクエストが途中で切れるのを防ぎます。`,
    focus: `長時間のリクエスト(大きいダウンロード等)があるとdrainに時間がかかります。アプリはSIGTERMを受けたらgracefulに終了する実装にしておくと安全です。`,
  },
};

export const glossaryCategories: GlossaryCategory[] = [
  {
    label: 'スケールの単位',
    termIds: ['ecs-service', 'desired-count'],
  },
  {
    label: '自動化の仕組み',
    termIds: ['cloudwatch-alarm', 'target-tracking'],
  },
  {
    label: '安全に減らす',
    termIds: ['cooldown', 'connection-draining'],
  },
];
