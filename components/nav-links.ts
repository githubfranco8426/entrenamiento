import {
  LayoutDashboardIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  DumbbellIcon,
  CalendarRangeIcon,
  SparklesIcon,
  SettingsIcon,
  LineChartIcon,
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
  { href: "/exercises", label: "Ejercicios", icon: DumbbellIcon },
  { href: "/program", label: "Programa", icon: CalendarRangeIcon },
  { href: "/data", label: "Data", icon: LineChartIcon },
  { href: "/ai", label: "IA", icon: SparklesIcon },
  { href: "/settings", label: "Ajustes", icon: SettingsIcon },
];
