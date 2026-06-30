/**
 * アイコン名を受け取り、AWS SVGアイコン or Lucideアイコンの React要素を返す
 * GlossaryModal・DiagramNode など複数箇所で使う共通ロジック
 */
import * as LucideIcons from 'lucide-react';
import ecrIconUrl from '../assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Registry_48.svg?url';
import ecsIconUrl from '../assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.svg?url';
import rdsIconUrl from '../assets/aws/Architecture-Service-Icons_07312025/Arch_Database/48/Arch_Amazon-RDS_48.svg?url';
import cloudFrontIconUrl from '../assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Amazon-CloudFront_48.svg?url';
import vpcIconUrl from '../assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Amazon-Virtual-Private-Cloud_48.svg?url';
import elbIconUrl from '../assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Elastic-Load-Balancing_48.svg?url';
import s3IconUrl from '../assets/aws/Architecture-Service-Icons_07312025/Arch_Storage/48/Arch_Amazon-Simple-Storage-Service_48.svg?url';
import igwIconUrl from '../assets/aws/Resource-Icons_07312025/Res_Networking-Content-Delivery/Res_Amazon-VPC_Internet-Gateway_48.svg?url';
import natGatewayIconUrl from '../assets/aws/Resource-Icons_07312025/Res_Networking-Content-Delivery/Res_Amazon-VPC_NAT-Gateway_48.svg?url';

interface IconProps {
  size?: number;
  className?: string;
}

const assetIconUrls: Record<string, string> = {
  '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Registry_48.svg': ecrIconUrl,
  '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.svg': ecsIconUrl,
  '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Database/48/Arch_Amazon-RDS_48.svg': rdsIconUrl,
  '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Amazon-CloudFront_48.svg': cloudFrontIconUrl,
  '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Amazon-Virtual-Private-Cloud_48.svg': vpcIconUrl,
  '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Networking-Content-Delivery/48/Arch_Elastic-Load-Balancing_48.svg': elbIconUrl,
  '/src/assets/aws/Architecture-Service-Icons_07312025/Arch_Storage/48/Arch_Amazon-Simple-Storage-Service_48.svg': s3IconUrl,
  '/src/assets/aws/Resource-Icons_07312025/Res_Networking-Content-Delivery/Res_Amazon-VPC_Internet-Gateway_48.svg': igwIconUrl,
  '/src/assets/aws/Resource-Icons_07312025/Res_Networking-Content-Delivery/Res_Amazon-VPC_NAT-Gateway_48.svg': natGatewayIconUrl,
};

export function resolveIcon(iconName: string, props: IconProps = {}): React.ReactNode {
  const { size = 20, className = '' } = props;

  if (iconName.startsWith('/src/assets/') || iconName.endsWith('.svg') || iconName.endsWith('.png')) {
    return <img src={assetIconUrls[iconName] ?? iconName} alt="" className={`w-5 h-5 ${className}`} />;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LucideIcon = (LucideIcons as any)[iconName] as React.ComponentType<{ size?: number; className?: string }> | undefined;
  if (LucideIcon) {
    return <LucideIcon size={size} className={className} />;
  }

  return <LucideIcons.BookOpen size={size} className={className} />;
}
