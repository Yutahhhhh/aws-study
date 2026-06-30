import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'observability',
  title: '監視・ログ・アラーム',
  description: '「動いている」だけでなく「異常に気づける」ための、ログ・メトリクス・アラームの土台',
  headerLabel: 'AWS OBSERVABILITY',
  homeIcon: 'Activity',
  homeColor: 'rose',
  intro:
    '障害は必ず起きます。重要なのは「早く気づき、どこが原因かを切り分けられる」こと。そのために各レイヤがログとメトリクスを出し、閾値を超えたらアラームで通知する土台を最初から作ります。',
  sections: [
    {
      id: 'three-roles',
      title: '3つの役割を区別する',
      icon: 'Layers',
      blocks: [
        {
          type: 'compare',
          columns: [
            { title: 'ログ', subtitle: '事後調査', accent: 'blue', points: ['何が起きたかの記録', '例: アプリのエラーログ、ALBアクセスログ'] },
            { title: 'メトリクス', subtitle: '傾向・現状把握', accent: 'emerald', points: ['数値の時系列', '例: CPU使用率、5xxの数、DB接続数'] },
            { title: 'アラーム', subtitle: '即時検知', accent: 'rose', points: ['閾値超過の通知', '例: 5xx急増、CPU高止まり'] },
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          html: 'ログだけでは「気づけない」、メトリクスだけでは「原因がわからない」ことがあります。3つを組み合わせます。',
        },
      ],
    },
    {
      id: 'per-layer',
      title: 'レイヤ別に取れるもの',
      icon: 'Network',
      blocks: [
        {
          type: 'table',
          headers: ['レイヤ', 'ログ', '主なメトリクス'],
          rows: [
            ['CloudFront', '標準/リアルタイムログ', 'リクエスト数, 4xx/5xxレート, キャッシュヒット率'],
            ['ALB', 'アクセスログ(S3)', '<code>HTTPCode_ELB_5XX</code>, <code>HTTPCode_Target_5XX</code>, <code>TargetResponseTime</code>, <code>UnHealthyHostCount</code>'],
            ['ECS(アプリ)', 'CloudWatch Logs(awslogs)', 'CPU/メモリ使用率, 稼働Task数'],
            ['RDS', 'ログエクスポート(スロークエリ等)', '<code>CPUUtilization</code>, <code>FreeStorageSpace</code>, <code>DatabaseConnections</code>'],
            ['VPC', 'VPC Flow Logs', '(許可/拒否の通信記録)'],
          ],
        },
      ],
    },
    {
      id: 'alarms',
      title: '本番で最低限作るアラーム',
      icon: 'Activity',
      blocks: [
        {
          type: 'table',
          headers: ['対象', 'メトリクス', '意図'],
          rows: [
            ['ALB', '<code>HTTPCode_Target_5XX</code> 急増', 'アプリがエラーを返している'],
            ['ALB', '<code>HTTPCode_ELB_5XX</code> 急増', 'ターゲット不在/ALB側問題'],
            ['ALB', '<code>UnHealthyHostCount</code> &gt; 0 継続', 'Taskがhealth checkに落ちている'],
            ['ECS', 'CPU/メモリ 高止まり', 'スケール不足・リーク'],
            ['RDS', '<code>FreeStorageSpace</code> 低下', 'ディスク枯渇(停止に直結)'],
            ['RDS', '<code>DatabaseConnections</code> 上限接近', 'コネクション枯渇'],
          ],
        },
        {
          type: 'flow',
          title: '通知の流れ',
          steps: [
            { label: 'CloudWatch Alarm', accent: 'rose' },
            { label: 'SNS Topic', accent: 'amber' },
            { label: 'メール / Slack / PagerDuty', accent: 'emerald' },
          ],
        },
      ],
    },
    {
      id: 'waf-sg-auth',
      title: 'WAF / SG / 認証認可 の守備範囲',
      icon: 'Shield',
      blocks: [
        {
          type: 'compare',
          columns: [
            { title: 'Security Group', subtitle: 'L3/L4', accent: 'blue', points: ['IP・ポートの制御', '「誰が誰に接続してよいか」'] },
            { title: 'WAF', subtitle: 'L7', accent: 'rose', points: ['HTTPの中身を見る', 'SQLi/XSS, レート制限, 地理制限'] },
            { title: '認証・認可', subtitle: 'アプリ/IAM', accent: 'emerald', points: ['「このユーザーはこの操作をしてよいか」'] },
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'どれか1つでは足りない',
          html: '層が違うため役割が重なりません。SGがポートを閉じても、開いているポートに来る悪性リクエストはWAFやアプリで弾きます。WAFはCloudFrontまたはALBに関連付けます。',
        },
      ],
    },
    {
      id: 'triage-5xx',
      title: '5xxの切り分け（最重要）',
      icon: 'Stethoscope',
      blocks: [
        {
          type: 'compare',
          columns: [
            {
              title: 'HTTPCode_ELB_5XX が増加',
              accent: 'amber',
              points: ['ALB側/ターゲット不在の問題', '健全なTargetがいない / 登録が無い / Serviceが起動できていない'],
            },
            {
              title: 'HTTPCode_Target_5XX が増加',
              accent: 'rose',
              points: ['アプリ側の問題', 'ECSのCloudWatch Logsにエラースタックトレース', 'DB接続失敗、未処理例外など'],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'danger',
          html: '「5xxは全部アプリのバグ」は誤りです。<code>ELB_5XX</code> と <code>Target_5XX</code> を区別しないと原因を見誤ります。詳しい切り分けは「障害時の切り分け」ガイドへ。',
        },
      ],
    },
  ],
  checkpoints: [
    'ログ・メトリクス・アラームの役割の違いを説明できるか',
    'ALBの ELB_5XX と Target_5XX の違いを説明できるか',
    '本番で最低限作るべきアラームを3つ以上挙げられるか',
    'WAF / SG / 認証認可 の守備範囲の違いを説明できるか',
    'RDSの FreeStorageSpace アラームが重要な理由を説明できるか',
  ],
  references: [
    { label: 'Logging and monitoring in Amazon ECS', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-logging-monitoring.html' },
    { label: 'CloudWatch metrics for your ALB', url: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-cloudwatch-metrics.html' },
    { label: 'Monitoring metrics in an Amazon RDS instance', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/monitoring-cloudwatch.html' },
    { label: 'VPC Flow Logs', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs.html' },
    { label: 'How AWS WAF works', url: 'https://docs.aws.amazon.com/waf/latest/developerguide/how-aws-waf-works.html' },
  ],
};

export default config;
