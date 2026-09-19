/**
 * The shell every admin page renders inside: sidebar, header, content area.
 *
 * @packageDocumentation
 */
import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Menu } from "lucide-react";
import { UserButton } from "@clerk/react";

import {
  AdminBrand,
  AdminNavList,
  AdminSidebar,
} from "../admin/common/sidebar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AdminPushBell } from "@/components/admin/AdminPushBell";

/**
 * Frames the admin pages with navigation and a sticky header.
 *
 * @remarks
 * Mounted beneath both guards, so by the time this renders the user is signed
 * in and holds the admin role. It does no checking of its own.
 *
 * Navigation appears in one of two forms depending on width. From the `lg`
 * breakpoint upwards the fixed 280px sidebar is shown; below it the sidebar is
 * hidden and the same nav list is served from a slide-over drawer behind the
 * menu button. Both render `AdminNavList`, so a new nav entry is added in one
 * place and appears in both. The drawer closes itself on a tap, since the
 * shopkeeper is usually on a phone behind the counter.
 *
 * The header is sticky and holds the push bell and Clerk's account menu. The
 * bell renders nothing at all when Firebase is unconfigured, so an empty space
 * there is expected rather than a fault.
 *
 * The only state kept here is whether the mobile drawer is open. It is not
 * persisted, so the drawer is always closed after a reload.
 *
 * @returns The layout with the matched admin page in its content area.
 */
export function AdminLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-secondary/45">
      <div className="flex min-h-screen">
        {/* Desktop sidebar (lg+) */}
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-6">
            {/* Mobile menu — only shown where the sidebar is hidden (< lg) */}
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <SheetDescription className="sr-only">
                  Admin navigation
                </SheetDescription>
                <div className="flex h-16 items-center border-b border-border px-5">
                  <AdminBrand />
                </div>
                {/* Tapping a link closes the drawer */}
                <AdminNavList onNavigate={() => setMobileNavOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Brand on mobile so the shopkeeper always sees where they are */}
            <div className="lg:hidden">
              <AdminBrand />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <AdminPushBell />
              <UserButton />
            </div>
          </header>

          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
