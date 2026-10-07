/**
 * Broadcast notifications — one push message to every account with a phone (customers, staff and admins), once a day.
 *
 * @remarks
 * Route `/admin/notifications`, admin only (`router.tsx`), and on the server
 * the `/admin/broadcasts` routes are admin-only as well. The server enforces
 * the length limits and the one-send-per-day rule; this page mirrors them so
 * the shopkeeper sees the limit before hitting it, and shows the server's own
 * message verbatim when it refuses anyway.
 *
 * Layout: composer on the left, a phone preview on the right (stacked below on
 * narrow screens), the send history underneath.
 *
 * @packageDocumentation
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Lightbulb, RefreshCw, Send, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { NotificationPreview } from "@/components/admin/broadcasts/notification-preview";
import { CategoryPicker, ProductPicker } from "@/components/admin/broadcasts/target-pickers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  getBroadcastOverview,
  sendBroadcast,
  sendTestBroadcast,
  type BroadcastBody,
  type BroadcastHistoryItem,
  type BroadcastOverview,
  type BroadcastTarget,
  type BroadcastTargetType,
} from "@/features/admin/broadcasts/api";
import {
  BROADCAST_IDEAS,
  TARGET_OPTIONS,
  TARGET_SHORT_LABEL,
  type BroadcastIdea,
} from "@/features/admin/broadcasts/templates";
import { getAdminCategories } from "@/features/admin/products/api";
import type { Category } from "@/features/admin/products/types";

/** Used until the server reports its own limits. */
const DEFAULT_LIMITS = { titleMax: 50, bodyMax: 180, perDay: 1 };

/** Pulls a readable message out of whatever was thrown. */
function message(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

/** A date as the shop reads it. */
function when(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** A live "used / max" counter that turns red at the limit. */
function Counter({ id, used, max }: { id: string; used: number; max: number }) {
  return (
    <span
      id={id}
      className={`text-xs tabular-nums ${used >= max ? "font-medium text-destructive" : "text-muted-foreground"}`}
      aria-live="polite"
    >
      {used}/{max}
    </span>
  );
}

/**
 * The page.
 *
 * @returns Composer, preview, ideas and history.
 */
function AdminNotifications() {
  const [overview, setOverview] = useState<BroadcastOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetType, setTargetType] = useState<BroadcastTargetType>("writeList");
  const [targetId, setTargetId] = useState<string | undefined>();
  const [targetName, setTargetName] = useState<string | undefined>();

  const [sendingTest, setSendingTest] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const limits = overview?.limits ?? DEFAULT_LIMITS;
  const audience = overview?.audience ?? 0;
  const canSendToday = overview?.canSendToday ?? false;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBroadcastOverview();
      setOverview(data);
      setLoadError("");
    } catch (error) {
      setLoadError(message(error));
      toast.error(`Couldn't load notifications: ${message(error)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Categories are needed for the picker and to name category targets in the
  // history table, so they load once with the page.
  useEffect(() => {
    let cancelled = false;
    getAdminCategories()
      .then((rows) => {
        if (!cancelled) setCategories(rows);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** What the preview says tapping opens. */
  const opensLabel = useMemo(() => {
    if (targetType === "category") return targetName ? `Category: ${targetName}` : "A category (pick one)";
    if (targetType === "product") return targetName ? `Product: ${targetName}` : "A product (pick one)";
    return TARGET_SHORT_LABEL[targetType];
  }, [targetType, targetName]);

  /** Name of a history row's target. */
  const historyTargetLabel = (target: BroadcastHistoryItem["target"]) => {
    const base = TARGET_SHORT_LABEL[target.type] ?? target.type;
    if (target.type === "category") {
      const name = target.targetName ?? categories.find((c) => c._id === target.targetId)?.name;
      return name ? `${base}: ${name}` : base;
    }
    if (target.type === "product" && target.targetName) {
      return `${base}: ${target.targetName}`;
    }
    return base;
  };

  const changeTargetType = (value: BroadcastTargetType) => {
    setTargetType(value);
    setTargetId(undefined);
    setTargetName(undefined);
    setFormError("");
  };

  const applyIdea = (idea: BroadcastIdea) => {
    setTitle(idea.title.slice(0, limits.titleMax));
    setBody(idea.body.slice(0, limits.bodyMax));
    changeTargetType(idea.target);
  };

  /** Validates the form and builds the request body, or explains what is missing. */
  const buildBody = (): BroadcastBody | null => {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (!cleanTitle || !cleanBody) {
      setFormError("Write a title and a message first.");
      return null;
    }
    if (cleanTitle.length > limits.titleMax || cleanBody.length > limits.bodyMax) {
      setFormError("The title or message is too long.");
      return null;
    }
    let target: BroadcastTarget;
    if (targetType === "category" || targetType === "product") {
      if (!targetId) {
        setFormError(`Pick the ${targetType} this notification opens.`);
        return null;
      }
      target = { type: targetType, targetId };
    } else {
      target = { type: targetType };
    }
    setFormError("");
    return { title: cleanTitle, body: cleanBody, target };
  };

  const onSendTest = async () => {
    const payload = buildBody();
    if (!payload) return;
    setSendingTest(true);
    try {
      await sendTestBroadcast(payload);
      toast.success("Sent to your phone");
      await refresh();
    } catch (error) {
      toast.error(message(error));
    } finally {
      setSendingTest(false);
    }
  };

  const onAskSendAll = () => {
    if (!buildBody()) return;
    setConfirmOpen(true);
  };

  const onConfirmSendAll = async () => {
    const payload = buildBody();
    if (!payload) {
      setConfirmOpen(false);
      return;
    }
    setSendingAll(true);
    try {
      const result = await sendBroadcast(payload);
      toast.success(
        `Sent to ${result.recipients} ${result.recipients === 1 ? "phone" : "phones"}`,
      );
      setConfirmOpen(false);
      await refresh();
    } catch (error) {
      toast.error(message(error));
      setConfirmOpen(false);
      await refresh();
    } finally {
      setSendingAll(false);
    }
  };

  const busy = sendingTest || sendingAll;
  const history = overview?.history ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <Bell className="h-6 w-6" />
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            Send one notification to everyone who has the app with notifications on - customers, and the shop's own phones too.
            Once a day at most.
          </p>
        </div>
        <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loadError && !overview ? (
        <Card>
          <CardContent className="space-y-3 py-6">
            <p className="text-sm text-destructive">Couldn&apos;t load this page: {loadError}</p>
            <Button variant="outline" onClick={() => void refresh()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Compose</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="broadcast-title">Title</Label>
                <Counter id="broadcast-title-count" used={title.length} max={limits.titleMax} />
              </div>
              <Input
                id="broadcast-title"
                value={title}
                maxLength={limits.titleMax}
                aria-describedby="broadcast-title-count"
                onChange={(event) => {
                  setTitle(event.target.value);
                  setFormError("");
                }}
                placeholder="e.g. नया सामान आया है 🛒"
                lang="hi"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="broadcast-body">Message</Label>
                <Counter id="broadcast-body-count" used={body.length} max={limits.bodyMax} />
              </div>
              <Textarea
                id="broadcast-body"
                value={body}
                maxLength={limits.bodyMax}
                rows={4}
                aria-describedby="broadcast-body-count"
                onChange={(event) => {
                  setBody(event.target.value);
                  setFormError("");
                }}
                placeholder="What do you want to tell your customers?"
                lang="hi"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="broadcast-target">When tapped, open</Label>
              <Select
                value={targetType}
                onValueChange={(value) => changeTargetType(value as BroadcastTargetType)}
              >
                <SelectTrigger id="broadcast-target" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_OPTIONS.map((option) => (
                    <SelectItem key={option.type} value={option.type}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {targetType === "category" ? (
              <div className="space-y-1.5">
                <Label htmlFor="broadcast-category-search">Category</Label>
                {targetName ? (
                  <p className="text-sm">
                    Opens: <span className="font-semibold">{targetName}</span>
                  </p>
                ) : null}
                <CategoryPicker
                  categories={categories}
                  loading={categoriesLoading}
                  selectedId={targetId}
                  onPick={(category) => {
                    setTargetId(category._id);
                    setTargetName(category.name);
                    setFormError("");
                  }}
                />
              </div>
            ) : null}

            {targetType === "product" ? (
              <div className="space-y-1.5">
                <Label htmlFor="broadcast-product-search">Product</Label>
                {targetName ? (
                  <p className="text-sm">
                    Opens: <span className="font-semibold">{targetName}</span>
                  </p>
                ) : null}
                <ProductPicker
                  selectedId={targetId}
                  onPick={(product) => {
                    setTargetId(product._id);
                    setTargetName(product.title);
                    setFormError("");
                  }}
                />
              </div>
            ) : null}

            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              {loading && !overview ? (
                <Skeleton className="h-5 w-64" />
              ) : (
                <p>
                  Will reach <strong>{audience}</strong>{" "}
                  {audience === 1 ? "person" : "people"} with notifications on (customers and shop accounts)
                </p>
              )}
            </div>

            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={() => void onSendTest()}
                disabled={busy || !overview}
              >
                <Smartphone className="mr-2 h-4 w-4" />
                {sendingTest ? "Sending…" : "Send a test to my phone"}
              </Button>
              <Button
                onClick={onAskSendAll}
                disabled={busy || !overview || !canSendToday}
                aria-describedby={overview && !canSendToday ? "broadcast-limit-note" : undefined}
              >
                <Send className="mr-2 h-4 w-4" />
                Send to everyone
              </Button>
            </div>
            {overview && !canSendToday ? (
              <p id="broadcast-limit-note" className="text-sm text-muted-foreground">
                Already sent today. Next one can go tomorrow.
              </p>
            ) : null}

            <p className="flex gap-2 border-t pt-4 text-xs text-muted-foreground">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Tip: say something true and useful. Notifications that feel like
                spam get turned off — and then order updates stop reaching the
                customer too.
              </span>
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationPreview title={title} body={body} opens={opensLabel} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ideas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Tap one to fill the form, then make it your own.
              </p>
              <div className="flex flex-wrap gap-2">
                {BROADCAST_IDEAS.map((idea) => (
                  <button
                    key={idea.title}
                    type="button"
                    onClick={() => applyIdea(idea)}
                    title={idea.body}
                    lang="hi"
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {idea.title}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sent</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !overview ? (
            <Skeleton className="h-32 w-full" />
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing sent yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Opens</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead className="text-right">Recipients</TableHead>
                    <TableHead>Sent by</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell className="whitespace-nowrap">{when(row.createdAt)}</TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium" title={row.title}>
                        {row.title}
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate text-muted-foreground" title={row.body}>
                        {row.body}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{historyTargetLabel(row.target)}</TableCell>
                      <TableCell>
                        <Badge variant={row.kind === "all" ? "default" : "secondary"}>
                          {row.kind === "all" ? "Everyone" : "Test"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.recipients}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {row.sentByEmail}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={(open) => !sendingAll && setConfirmOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Send to {audience} {audience === 1 ? "person" : "people"}?
            </DialogTitle>
            <DialogDescription>
              This goes to real customers' phones. Sent a test to your phone first? You can send one notification to everyone per day.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={sendingAll}>
              Cancel
            </Button>
            <Button onClick={() => void onConfirmSendAll()} disabled={sendingAll}>
              {sendingAll ? "Sending…" : "Send now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminNotifications;
