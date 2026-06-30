/**
 * アイコン名を受け取り、AWS SVGアイコン or Lucideアイコンの React要素を返す
 * GlossaryModal・DiagramNode など複数箇所で使う共通ロジック
 */
import * as LucideIcons from 'lucide-react';

interface IconProps {
  size?: number;
  className?: string;
}

export function resolveIcon(iconName: string, props: IconProps = {}): React.ReactNode {
  const { size = 20, className = '' } = props;

  if (iconName.startsWith('/src/assets/') || iconName.endsWith('.svg') || iconName.endsWith('.png')) {
    return <img src={iconName} alt="" className={`w-5 h-5 ${className}`} />;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LucideIcon = (LucideIcons as any)[iconName] as React.ComponentType<{ size?: number; className?: string }> | undefined;
  if (LucideIcon) {
    return <LucideIcon size={size} className={className} />;
  }

  return <LucideIcons.BookOpen size={size} className={className} />;
}
