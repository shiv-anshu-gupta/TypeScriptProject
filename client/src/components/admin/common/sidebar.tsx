import {
  BadgePercent,
  ClipboardList,
  LayoutDashboard,
  MessagesSquare,
  Package,
  Settings2,
  Store,
  type LucideIcon,
} from "lucide-react";
import { NavLink } from "react-router-dom";

type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

// Ordered by how often the shopkeeper needs them: their daily job is pricing
// and fulfilling grocery lists + orders, so those sit right under Dashboard.
export const adminNavItems: AdminNavItem[] = [
  { label: "Grocery lists", href: "/admin/grocery-lists", icon: ClipboardList },
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Messages", href: "/admin/messages", icon: MessagesSquare },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Coupons", href: "/admin/coupons", icon: BadgePercent },
  { label: "Settings", href: "/admin/settings", icon: Settings2 },
];

const sidebarRoot =
  "hidden w-[280px] shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col";

const brandRow =
  "flex h-16 items-center border-b border-sidebar-border px-5";
const navWrap = "space-y-1 px-3 py-3";
const navItem =
  "flex h-11 items-center gap-3 rounded-md px-4 text-[15px] font-medium transition-colors";

const activeItem = "bg-sidebar-primary text-sidebar-primary-foreground";
const idleItem =
  "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

export function AdminBrand() {
  return (
    <div className="flex items-center gap-2">
      <Store className="h-7 w-7 text-foreground" />
      <span className="text-xl font-semibold text-foreground">sKirana</span>
    </div>
  );
}

// Shared nav. `onNavigate` lets the mobile drawer close itself after a tap.
export function AdminNavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className={navWrap}>
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.label}
            to={item.href}
            end={item.href === "/admin"}
            onClick={onNavigate}
            className={({ isActive }) =>
              `${navItem} ${isActive ? activeItem : idleItem}`
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export function AdminSidebar() {
  return (
    <aside className={sidebarRoot}>
      <div className={brandRow}>
        <AdminBrand />
      </div>

      <div className="flex-1 overflow-y-auto">
        <AdminNavList />
      </div>
    </aside>
  );
}
