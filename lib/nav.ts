import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookMarked,
  CalendarCheck,
  FileText,
  UserCog,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  superAdminOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/teachers", label: "المدرسون", icon: UserCog, superAdminOnly: true },
  { href: "/circles", label: "الحلقات", icon: Users, superAdminOnly: true },
  { href: "/students", label: "الطلبة", icon: GraduationCap },
  { href: "/attendance", label: "الحضور والغياب", icon: CalendarCheck },
  { href: "/memorization", label: "الحفظ والمراجعة", icon: BookMarked },
  { href: "/reports", label: "التقارير", icon: FileText },
];
