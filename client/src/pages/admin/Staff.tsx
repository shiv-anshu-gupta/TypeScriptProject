/**
 * Staff & security — who may work behind the counter, from where, and what
 * they did.
 *
 * @remarks
 * Three sections on one page because they are one decision, not three. Adding
 * a staff member is only safe if the shop's network is registered, and both
 * are only safe if there is a log.
 *
 * Admin-only, both in `router.tsx` and - the part that matters - on the server,
 * where every route this page calls is behind `staff:manage`,
 * `network:manage` or `audit:read`.
 *
 * @packageDocumentation
 */
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Trash2, Wifi } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  addStaff,
  getAudit,
  getShopNetworks,
  getStaff,
  registerThisNetwork,
  removeShopNetwork,
  removeStaff,
  type AuditRow,
  type ShopNetwork,
  type StaffMember,
} from "@/features/admin/staff/api";

/** Pulls a readable message out of whatever was thrown. */
function message(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

/** A date as the shop reads it. */
function when(value: string | null) {
  if (!value) return "never";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * What each recorded action is called on screen.
 *
 * @remarks
 * Anything not listed is shown verbatim, so adding an action on the server
 * needs no edit here before the log is readable.
 */
const ACTION_LABEL: Record<string, string> = {
  "list.priced": "sent prices",
  "list.availability": "changed availability",
  "list.status": "changed status",
  "list.markPaid": "marked paid",
  "list.itemEdited": "edited an item",
  "list.itemAdded": "added an item",
  "list.chatSent": "sent a message",
  "staff.added": "added staff",
  "staff.removed": "removed staff",
  "network.registered": "registered a network",
  "network.removed": "removed a network",
  "access.deniedOffNetwork": "was refused — off the shop network",
};

/**
 * The page.
 *
 * @returns Staff roster, shop networks and the activity log.
 */
function AdminStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [networks, setNetworks] = useState<ShopNetwork[]>([]);
  const [currentIp, setCurrentIp] = useState("");
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [roster, nets, log] = await Promise.all([
        getStaff(),
        getShopNetworks(),
        getAudit(100),
      ]);
      setStaff(roster.items);
      setNetworks(nets.items);
      setCurrentIp(nets.currentIp);
      setAudit(log.items);
    } catch (error) {
      toast.error(`Couldn't load this page: ${message(error)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onAddStaff = async () => {
    if (!email.trim()) return;
    setBusy(true);
    try {
      const result = await addStaff(email.trim(), name.trim());
      toast.success(
        result.appliedNow
          ? `${result.email} can price lists now`
          : `${result.email} added — they get access when they first sign in`,
      );
      setEmail("");
      setName("");
      await refresh();
    } catch (error) {
      toast.error(message(error));
    } finally {
      setBusy(false);
    }
  };

  const onRemoveStaff = async (row: StaffMember) => {
    if (!window.confirm(`Remove ${row.email}? They lose access immediately.`)) {
      return;
    }
    setBusy(true);
    try {
      await removeStaff(row.email);
      toast.success(`${row.email} removed`);
      await refresh();
    } catch (error) {
      toast.error(message(error));
    } finally {
      setBusy(false);
    }
  };

  const onRegisterNetwork = async () => {
    setBusy(true);
    try {
      const result = await registerThisNetwork(label.trim() || "shop");
      toast.success(
        result.added
          ? `${result.ip} registered as the shop's network`
          : `${result.ip} was already registered`,
      );
      setLabel("");
      await refresh();
    } catch (error) {
      toast.error(message(error));
    } finally {
      setBusy(false);
    }
  };

  const onRemoveNetwork = async (row: ShopNetwork) => {
    const last = networks.length === 1;
    const warning = last
      ? "This is the last registered network. Removing it locks every staff member out until you register one again. Continue?"
      : `Stop trusting ${row.ip}?`;
    if (!window.confirm(warning)) return;
    setBusy(true);
    try {
      await removeShopNetwork(row._id);
      toast.success(`${row.ip} removed`);
      await refresh();
    } catch (error) {
      toast.error(message(error));
    } finally {
      setBusy(false);
    }
  };

  const thisIsRegistered = networks.some((row) => row.ip === currentIp);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">
            Staff &amp; security
          </h1>
          <p className="text-sm text-muted-foreground">
            Staff can price lists and chat with customers. They never see your
            dashboard, your products, or a customer&apos;s phone number or
            email — the server does not send those to them.
          </p>
        </div>
        <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Staff
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="staff-email">Their email</Label>
              <Input
                id="staff-email"
                type="email"
                placeholder="raju@gmail.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-name">Name (for you)</Label>
              <Input
                id="staff-name"
                placeholder="Raju, evening"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <Button onClick={() => void onAddStaff()} disabled={busy || !email.trim()}>
              Add
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Tell them to open <strong>skirana.com/staff</strong> and sign in
            with that same email. Nothing is emailed from here.
          </p>

          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : staff.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nobody yet. You are the only person who can open the panel.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {staff.map((row) => (
                <li
                  key={row.email}
                  className="flex flex-wrap items-center justify-between gap-2 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{row.name || row.email}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {row.email} ·{" "}
                      {row.signedIn
                        ? `signed in, role: ${row.role}`
                        : "has not signed in yet"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => void onRemoveStaff(row)}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Shop network
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Staff can open lists only while on one of these connections. You are
            not restricted — you can work from anywhere.
          </p>

          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p>
              This browser is on <strong>{currentIp || "an unreadable address"}</strong>
              {thisIsRegistered ? " — already registered." : " — not registered."}
            </p>
            <p className="mt-1 text-muted-foreground">
              Register it while you are standing in the shop, on the shop&apos;s
              own Wi-Fi. Your broadband address changes when the router
              reconnects; when it does, staff are locked out and you register
              again here.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="net-label">Name this connection</Label>
              <Input
                id="net-label"
                placeholder="dukaan ka wifi"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
            </div>
            <Button
              onClick={() => void onRegisterNetwork()}
              disabled={busy || thisIsRegistered}
            >
              Register this connection
            </Button>
          </div>

          {loading ? (
            <Skeleton className="h-16 w-full" />
          ) : networks.length === 0 ? (
            <p className="text-sm font-medium text-destructive">
              No connection registered, so no staff member can open a list.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {networks.map((row) => (
                <li
                  key={row._id}
                  className="flex flex-wrap items-center justify-between gap-2 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {row.ip}
                      {row.ip === currentIp ? " (you, now)" : ""}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {row.label || "unnamed"} · last used {when(row.lastSeenAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => void onRemoveNetwork(row)}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Everything done from the panel, newest first. Rows cannot be edited
            or deleted by anyone, and they expire on their own after a year.
          </p>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : audit.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
          ) : (
            <ul className="divide-y rounded-md border text-sm">
              {audit.map((row) => (
                <li key={row._id} className="flex flex-wrap gap-x-2 gap-y-1 p-3">
                  <span className="font-medium">{row.actorEmail || "unknown"}</span>
                  <span className="text-muted-foreground">
                    ({row.actorRole || "?"})
                  </span>
                  <span>{ACTION_LABEL[row.action] ?? row.action}</span>
                  {row.detail ? (
                    <span className="text-muted-foreground">— {row.detail}</span>
                  ) : null}
                  <span className="ml-auto text-muted-foreground">
                    {when(row.createdAt)} · {row.ip || "no address"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminStaff;
