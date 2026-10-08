import React from 'react';
import {
  LucideIcon,
  ShoppingCart,
  RefreshCw,
  Package,
  ShieldAlert,
  MoreHorizontal,
  Utensils,
  Car,
  FileText,
  ShoppingBag,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  Gift,
  Banknote,
  Trophy,
  Sparkles,
  Server,
  Megaphone,
  Coffee,
  Heart,
  Home,
  Briefcase,
  Smartphone,
  Plane,
  Tv,
  Music,
  Tag,
  CircleDot
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  'shopping-cart': ShoppingCart,
  'refresh-cw': RefreshCw,
  'package': Package,
  'shield-alert': ShieldAlert,
  'more-horizontal': MoreHorizontal,
  'utensils': Utensils,
  'coffee': Coffee,
  'car': Car,
  'file-text': FileText,
  'shopping-bag': ShoppingBag,
  'gamepad-2': Gamepad2,
  'heart-pulse': HeartPulse,
  'heart': Heart,
  'graduation-cap': GraduationCap,
  'gift': Gift,
  'banknote': Banknote,
  'trophy': Trophy,
  'sparkles': Sparkles,
  'server': Server,
  'megaphone': Megaphone,
  'home': Home,
  'briefcase': Briefcase,
  'smartphone': Smartphone,
  'plane': Plane,
  'tv': Tv,
  'music': Music,
  'tag': Tag
};

export const AVAILABLE_ICONS = [
  { name: 'utensils', label: 'Ăn uống' },
  { name: 'coffee', label: 'Cà phê' },
  { name: 'car', label: 'Di chuyển' },
  { name: 'shopping-bag', label: 'Mua sắm' },
  { name: 'shopping-cart', label: 'Giỏ hàng' },
  { name: 'home', label: 'Nhà cửa' },
  { name: 'file-text', label: 'Hóa đơn' },
  { name: 'gamepad-2', label: 'Giải trí' },
  { name: 'heart-pulse', label: 'Sức khỏe' },
  { name: 'graduation-cap', label: 'Giáo dục' },
  { name: 'gift', label: 'Quà tặng' },
  { name: 'banknote', label: 'Lương/Tiền' },
  { name: 'trophy', label: 'Thưởng' },
  { name: 'sparkles', label: 'Đặc biệt' },
  { name: 'package', label: 'Hàng hóa' },
  { name: 'refresh-cw', label: 'Gia hạn' },
  { name: 'shield-alert', label: 'Bảo hành' },
  { name: 'server', label: 'Máy chủ/VPS' },
  { name: 'megaphone', label: 'Quảng cáo' },
  { name: 'briefcase', label: 'Công việc' },
  { name: 'plane', label: 'Du lịch' },
  { name: 'more-horizontal', label: 'Khác' }
];

export const AVAILABLE_COLORS = [
  '#10b981', // Emerald
  '#059669', // Dark Emerald
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#64748b', // Slate
  '#6b7280'  // Gray
];

export const CategoryIcon = ({ name, className = 'w-4 h-4', style = {} }: { name?: string; className?: string; style?: React.CSSProperties }) => {
  const IconComponent = (name && ICON_MAP[name.toLowerCase()]) || Tag;
  return <IconComponent className={className} style={style} />;
};

export default CategoryIcon;
