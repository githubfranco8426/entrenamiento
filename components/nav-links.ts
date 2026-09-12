import {
  LayoutDashboardIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  CalendarRangeIcon,
  SparklesIcon,
  SettingsIcon,
  LineChartIcon,
  UsersIcon,
  UtensilsIcon,
  type LucideIcon,
} from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboardIcon },
  { href: "/calendar", label: "Calendario", icon: CalendarDaysIcon },
  { href: "/routines", label: "Rutinas", icon: ClipboardListIcon },
  { href: "/program", label: "Programa", icon: CalendarRangeIcon },
  { href: "/data", label: "Data", icon: LineChartIcon },
  { href: "/nutricion", label: "Nutrición", icon: UtensilsIcon },
  { href: "/ai", label: "IA", icon: SparklesIcon },
  { href: "/coach", label: "Coach", icon: UsersIcon },
  { href: "/settings", label: "Ajustes", icon: SettingsIcon },
];
