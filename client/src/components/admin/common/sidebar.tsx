/**
 * The admin navigation: its item list and the three pieces that render it.
 *
 * @remarks
 * {@link adminNavItems} here and `router.tsx` are separate lists and neither
 * checks the other. A route added to the router without an entry here is
 * reachable only by typing the URL — which is exactly the state the dead
 * `/admin/orders` page is in.
 *
 * @packageDocumentation
 */
import {
  BadgePercent,
  ClipboardList,
  LayoutDashboard,
  MessagesSquare,
  Package,
  GalleryHorizontal,
  Store,
  type LucideIcon,
  ShieldCheck,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store";
import type { UserRole } from "@/lib/types";

/** One entry in the admin navigation. */
type AdminNavItem = {
  /** Text shown in the sidebar. Need not match the page's own heading. */
  label: string;
  /** Absolute path, matched against the current URL to highlight the entry. */
  href: string;
  /** Lucide icon component, rendered at 18px. */
  icon: LucideIcon;
  /**
   * Who sees this entry.
   *
   * Cosmetic only. Hiding a link hides nothing: the wall is the server, which
   * answers 403 to a staff member who types the URL anyway. This exists so
   * their sidebar shows the one page they can actually use.
   */
  roles: UserRole[];
};

/** Everyone who can sign into the panel. */
const EVERYONE: UserRole[] = ["admin", "staff"];
/** The shopkeeper alone. */
const OWNER: UserRole[] = ["admin"];

// Ordered by how often the shopkeeper needs them: their daily job is pricing
// and fulfilling grocery lists + orders, so those sit right under Dashboard.
/**
 * The navigation entries, in display order.
 *
 * @remarks
 * The order is deliberate and should not be re-sorted alphabetically. Grocery
 * lists is first because it is the screen the shop uses all day, which is also
 * why `/admin` redirects straight to it rather than to the dashboard.
 *
 * Two labels do not match their targets, which is worth knowing before
 * searching for either:
 *
 * - "Coupons" points at `/admin/coupons`, whose page heading reads "Promos".
 * - "Home banners" points at `/admin/settings`, and controls the picture strip
 *   in the mobile app rather than any setting of this web app.
 *
 * There is no entry for `/admin/orders`. That page still exists on disk but is
 * not routed, and it should stay off this list.
 */
export const adminNavItems: AdminNavItem[] = [
  { label: "Grocery lists", href: "/admin/grocery-lists", icon: ClipboardList, roles: EVERYONE },
  { label: "Messages", href: "/admin/messages", icon: MessagesSquare, roles: EVERYONE },
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, roles: OWNER },
  { label: "Products", href: "/admin/products", icon: Package, roles: OWNER },
  { label: "Coupons", href: "/admin/coupons", icon: BadgePercent, roles: OWNER },
  { label: "Home banners", href: "/admin/settings", icon: GalleryHorizontal, roles: OWNER },
  { label: "Staff & security", href: "/admin/staff", icon: ShieldCheck, roles: OWNER },
];

/**
 * The entries one role may see.
 *
 * @param role - The signed-in user's role, or `undefined` while it loads.
 * @returns The visible entries. An unknown role sees nothing, which is the
 * safe direction: a blank sidebar is a bug report, a full one is a leak.
 */
export function navItemsForRole(role: UserRole | undefined): AdminNavItem[] {
  if (!role) return [];
  return adminNavItems.filter((item) => item.roles.includes(role));
}

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

/**
 * The shop name and icon.
 *
 * @remarks
 * Rendered three times: at the top of the desktop sidebar, at the top of the
 * mobile drawer, and in the mobile header. Unlike the sign-in screen's logo it
 * is not a link — there is nowhere useful to go from inside the panel.
 */
export function AdminBrand() {
  return (
    <div className="flex items-center gap-2">
      <Store className="h-7 w-7 text-foreground" />
      <span className="text-xl font-semibold text-foreground">sKirana</span>
    </div>
  );
}

// Shared nav. `onNavigate` lets the mobile drawer close itself after a tap.
/**
 * Renders {@link adminNavItems} as router links, highlighting the current page.
 *
 * @remarks
 * Shared by the desktop sidebar and the mobile drawer, so both always show the
 * same entries.
 *
 * `NavLink` marks an entry active on prefix match, which would light up every
 * entry when the path is `/admin`. The `end` flag on that one entry restricts
 * it to an exact match. No current entry actually uses `/admin` as its `href`,
 * so the condition is inert today but guards a future top-level entry.
 *
 * @param onNavigate - Called after a link is tapped. The mobile drawer passes
 * its own close function here; the desktop sidebar passes nothing, since it is
 * always visible.
 */
export function AdminNavList({ onNavigate }: { onNavigate?: () => void }) {
  const role = useAuthStore((state) => state.user?.role);
  return (
    <nav className={navWrap}>
      {navItemsForRole(role).map((item) => {
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

/**
 * The fixed 280px sidebar, shown only from the `lg` breakpoint upwards.
 *
 * @remarks
 * Hidden entirely below `lg` by its own class, not by the layout, so nothing
 * needs to be conditionally mounted. Below that width `AdminLayout` puts the
 * same nav list inside a drawer instead.
 */
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
