import type { GlossaryDatabase } from '../../types/glossary';
import type { GlossaryCategory } from '../../types/topic';

export const glossary: GlossaryDatabase = {
  'ecs-secrets': {
    icon: 'FileLock',
    title: 'Task Definition の secrets',
    eng: 'ECS SECRETS (valueFrom)',
    oneLiner: '秘密のARNを指定すると、起動時にECSが取得して環境変数として注入する仕組み',
    detail: `Task Definitionには値を渡す2つの仕組みがあります。
            <br><br>・<code>environment</code>: 平文の環境変数。秘密を入れてはいけません。
            <br>・<code>secrets</code>: Secrets ManagerやSSMのARN(valueFrom)を指定。起動時にECSが取得し、環境変数として注入します。`,
    focus: `secretsを使うと、設定(Task Definition)にはARNしか残らず、平文の秘密が残りません。コンテナ内では環境変数として見えますが、それはどのアプリでも同じこと。「設定や履歴に平文を残さない」のが目的です。`,
  },
  'execution-role': {
    icon: 'UserCog',
    title: 'task execution role',
    eng: 'ECS TASK EXECUTION ROLE',
    oneLiner: 'Taskを起動するための裏方ロール。ECR pullや秘密取得を行う',
    detail: `executionロールは、コンテナを起動するためにECSエージェントが使うロールです。ECRからのpull、CloudWatch Logsへの書き込み、Secrets/SSMからの秘密取得などを担います。
            <br><br>アプリ自身がAWS APIを呼ぶための <code>task role</code> とは役割が異なります。`,
    focus: `秘密を取得するのはexecution roleです。<code>secretsmanager:GetSecretValue</code> や <code>ssm:GetParameters</code>(必要なら <code>kms:Decrypt</code>)を、対象ARNだけに絞って付与します。execution roleとtask roleを分けることで最小権限にしやすくなります。`,
  },
  'secrets-manager': {
    icon: 'KeyRound',
    title: 'AWS Secrets Manager',
    eng: 'AWS SECRETS MANAGER',
    oneLiner: 'DBパスワードなど本物の秘密を管理する。自動ローテーションに対応',
    detail: `秘密情報の保管に特化したサービスです。標準でKMS暗号化され、Lambdaによる自動ローテーションに対応します。RDSとは統合された仕組みがあり、masterパスワードを自動生成・管理できます。
            <br><br>料金はシークレット数とAPIコールで発生します。`,
    focus: `DB資格情報のように「ローテーションしたい本物の秘密」はSecrets Managerが向きます。RDSの <code>manage_master_user_password = true</code> と組み合わせると、パスワードを一度も平文で扱わずに運用できます。`,
  },
  'ssm-parameter': {
    icon: 'SlidersHorizontal',
    title: 'SSM Parameter Store',
    eng: 'SSM PARAMETER STORE',
    oneLiner: '設定値や軽い秘密を保管する。SecureStringでKMS暗号化できる',
    detail: `設定値・パラメータの管理サービスです。<code>SecureString</code> 型を使うとKMSで暗号化して秘密も保管できます。
            <br><br>標準パラメータは無料枠があり、コスト面で有利です(Advancedは課金)。ECSの secrets からも参照できます。`,
    focus: `「環境ごとの設定値」や「軽い秘密」はParameter Storeが手軽です。一方、自動ローテーションが要るDBパスワード等はSecrets Managerが向きます。両者を混在させるのも一般的です。`,
  },
  'secrets-route': {
    icon: 'Plug',
    title: '秘密取得のネットワーク経路',
    eng: 'NETWORK PATH FOR SECRETS',
    oneLiner: 'Private SubnetのTaskがSecrets/SSMへ到達するにはNATかVPC Endpointが必要',
    detail: `Private SubnetのECS Taskは直接インターネットへ出られません。Secrets ManagerやSSMへ到達するには、NAT Gateway、または secretsmanager / ssm のInterface VPC Endpointが必要です。
            <br><br>経路が無いと、起動時の秘密取得に失敗し <code>ResourceInitializationError</code> になります。`,
    focus: `「コードも権限も正しいのにTaskが起動しない」ときは、この経路を疑います。VPC Endpointに寄せるとNATを通らずPrivateに取得でき、露出も減らせます。`,
  },
};

export const glossaryCategories: GlossaryCategory[] = [
  {
    label: 'ECSとの連携',
    termIds: ['ecs-secrets', 'execution-role', 'secrets-route'],
  },
  {
    label: '保管サービス',
    termIds: ['secrets-manager', 'ssm-parameter'],
  },
];
