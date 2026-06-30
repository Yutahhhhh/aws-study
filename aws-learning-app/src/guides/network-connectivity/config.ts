import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'network-connectivity',
  title: 'VPC間とハイブリッド接続',
  description: 'VPC Endpoint(Gateway/Interface) / Peering / Transit Gateway / PrivateLink / VPN・Direct Connect の使い分け',
  headerLabel: 'AWS NETWORKING',
  homeIcon: 'Cable',
  homeColor: 'blue',
  intro:
    '1つのVPCに閉じた構成を超えると、「AWSサービスへPrivateに出る」「VPC同士をつなぐ」「オンプレと結ぶ」という接続設計が要ります。似た用途のサービスが多いので、<strong>何と何を、どの粒度でつなぐか</strong>で整理します。',
  sections: [
    {
      id: 'endpoints',
      title: 'VPC Endpoint：AWSサービスへPrivateに出る',
      icon: 'Plug',
      blocks: [
        {
          type: 'compare',
          columns: [
            {
              title: 'Gateway型',
              subtitle: 'S3 / DynamoDB のみ',
              accent: 'emerald',
              points: ['ルートテーブルに経路を足す方式', '<strong>追加料金なし</strong>', 'S3・DynamoDB専用'],
            },
            {
              title: 'Interface型 (PrivateLink)',
              subtitle: '多くのAWSサービス',
              accent: 'blue',
              points: ['Subnet内にENIを作る方式', '時間/データ課金あり', 'SSM・ECR・Secrets・SQS等に対応'],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'NATの代わりにEndpointで出す',
          html: 'Private SubnetからS3やECRへ行くのに、わざわざNAT経由でインターネットへ出す必要はありません。<strong>VPC Endpointなら経路がAWS内部に閉じ</strong>、NATのデータ処理料も不要に。詳細は<span class="font-bold">NAT vs VPCエンドポイント</span>シミュレーション参照。',
        },
      ],
    },
    {
      id: 'peering-tgw',
      title: 'VPC Peering と Transit Gateway',
      icon: 'Network',
      blocks: [
        {
          type: 'compare',
          columns: [
            {
              title: 'VPC Peering',
              subtitle: '1対1',
              accent: 'amber',
              points: ['2つのVPCを直結', '<strong>推移的ルーティング不可</strong>(AとCはBを経由できない)', 'VPCが増えると接続が組合せ爆発'],
            },
            {
              title: 'Transit Gateway',
              subtitle: 'ハブ&スポーク',
              accent: 'blue',
              points: ['多数のVPC/オンプレを<strong>中央ハブ</strong>に集約', 'ルーティングを一元管理', '大規模・マルチアカウント向き'],
            },
          ],
        },
        {
          type: 'paragraph',
          html:
            'VPCが2〜3個ならPeeringで十分。<strong>数が増える・オンプレも混ざる・ルーティングを集中管理したい</strong>ならTransit Gatewayに寄せます。CIDRの重複があるとどちらも繋げないため、設計初期にアドレス計画を立てます。',
        },
      ],
    },
    {
      id: 'privatelink',
      title: 'PrivateLink：自前サービスをPrivateに公開する',
      icon: 'Share2',
      blocks: [
        {
          type: 'paragraph',
          html:
            'Interface型Endpointの仕組みを使い、<strong>自分(や他社)のサービスを、相手のVPCにENIとして「生やす」</strong>形で公開できます。相手はインターネットにもVPC Peeringにも頼らず、<strong>そのサービスだけ</strong>へ到達します。',
        },
        {
          type: 'list',
          items: [
            'VPC Peeringと違い<strong>ネットワーク全体を相互接続しない</strong>(露出は対象サービスのみ)',
            'CIDR重複があっても使える（ENI経由のため）',
            'SaaS提供者が顧客VPCへサービスを届ける定番手段',
          ],
        },
      ],
    },
    {
      id: 'hybrid',
      title: 'オンプレとつなぐ（ハイブリッド）',
      icon: 'Building2',
      blocks: [
        {
          type: 'compare',
          columns: [
            {
              title: 'Site-to-Site VPN',
              subtitle: 'すぐ・安い',
              accent: 'emerald',
              points: ['インターネット上に暗号化トンネル', '即日〜で開通', '帯域/遅延はネット依存'],
            },
            {
              title: 'Direct Connect',
              subtitle: '専用線',
              accent: 'amber',
              points: ['物理専用線で接続', '安定した帯域・低遅延', '開通に時間とコスト'],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          html: 'まずVPNで始め、帯域/遅延/安定性が要件化したらDirect Connectへ。両者を併用しDXの冗長としてVPNを残す構成も一般的です。Transit Gateway配下にまとめると拡張が楽になります。',
        },
      ],
    },
    {
      id: 'cheatsheet',
      title: '使い分け早見表',
      icon: 'Layers',
      blocks: [
        {
          type: 'table',
          headers: ['つなぎたいもの', '第一候補'],
          rows: [
            ['Private SubnetからS3/DynamoDB', 'Gateway型 VPC Endpoint(無料)'],
            ['Private SubnetからSSM/ECR/Secrets等', 'Interface型 VPC Endpoint'],
            ['VPC 2〜3個を相互接続', 'VPC Peering'],
            ['多数VPC/マルチアカウントを集約', 'Transit Gateway'],
            ['特定サービスだけを相手VPCへ公開', 'PrivateLink'],
            ['オンプレと接続(手早く)', 'Site-to-Site VPN'],
            ['オンプレと接続(安定・低遅延)', 'Direct Connect'],
          ],
        },
      ],
    },
  ],
  checkpoints: [
    'Gateway型とInterface型 VPC Endpoint の違いと対象サービスを説明できるか',
    'VPC Peeringが推移的でないことと、その帰結を説明できるか',
    'Transit Gateway を選ぶ規模感を説明できるか',
    'PrivateLinkがVPC Peeringと露出範囲でどう違うか説明できるか',
    'VPN と Direct Connect の使い分けを説明できるか',
  ],
  references: [
    { label: 'Gateway endpoints (S3/DynamoDB)', url: 'https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html' },
    { label: 'Interface endpoints (PrivateLink)', url: 'https://docs.aws.amazon.com/vpc/latest/privatelink/create-interface-endpoint.html' },
    { label: 'VPC peering', url: 'https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html' },
    { label: 'AWS Transit Gateway', url: 'https://docs.aws.amazon.com/vpc/latest/tgw/what-is-transit-gateway.html' },
    { label: 'AWS Direct Connect', url: 'https://docs.aws.amazon.com/directconnect/latest/UserGuide/Welcome.html' },
  ],
};

export default config;
