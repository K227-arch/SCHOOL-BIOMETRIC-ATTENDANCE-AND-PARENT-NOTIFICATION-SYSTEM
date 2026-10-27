import type { StaffRole } from "./supabase";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles: StaffRole[] | "all" | "platform_admin";
}

// Navigation items. `roles` controls visibility per role.
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: "▦",
    roles: "all",
  },
  {
    href: "/dashboard/attendance",
    label: "Attendance",
    icon: "✓",
    roles: "all",
  },
  {
    href: "/dashboard/departures",
    label: "Departure control",
    icon: "🚪",
    roles: ["school_admin", "gate_staff", "supervisor"],
  },
  {
    href: "/dashboard/pupils",
    label: "Pupils",
    icon: "🎓",
    roles: ["school_admin", "gate_staff", "supervisor"],
  },
  {
    href: "/dashboard/followups",
    label: "Follow-up queue",
    icon: "!",
    roles: ["school_admin", "supervisor"],
  },
  {
    href: "/dashboard/messages",
    label: "Messages",
    icon: "✉",
    roles: "all",
  },
  {
    href: "/dashboard/reports",
    label: "Reports & health",
    icon: "📊",
    roles: ["school_admin", "supervisor"],
  },
  {
    href: "/dashboard/members",
    label: "Staff",
    icon: "👥",
    roles: ["school_admin"],
  },
  {
    href: "/dashboard/devices",
    label: "Devices & gates",
    icon: "🖥",
    roles: ["school_admin"],
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: "⚙",
    roles: ["school_admin"],
  },
  {
    href: "/dashboard/schools",
    label: "Schools",
    icon: "🏫",
    roles: "platform_admin",
  },
  {
    href: "/dashboard/audit",
    label: "Audit log",
    icon: "📜",
    roles: ["school_admin", "supervisor"],
  },
];

export function visibleNav(
  role: StaffRole | null,
  isPlatformAdmin: boolean
): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (item.roles === "all") return true;
    if (item.roles === "platform_admin") return isPlatformAdmin;
    if (isPlatformAdmin) return true; // platform admins see everything
    return role ? item.roles.includes(role) : false;
  });
}
