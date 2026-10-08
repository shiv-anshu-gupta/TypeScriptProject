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
 * A segmented control at the top picks the style: text only, text + picture
 * (2:1) or banner only (4:1). For the two picture styles the picture is shrunk
 * in the browser, uploaded at once to `/admin/broadcasts/image` with the
 * matching `shape`, and only the URL the server answers with is sent with the
 * notification - the server accepts no other picture URL. Switching to the
 * other picture style drops a picture of the wrong shape, with a note.
 *
 * @packageDocumentation
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, ImagePlus, Lightbulb, RefreshCw, Send, Smartphone, X } from "lucide-react";
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
  uploadBroadcastImage,
  type BroadcastBody,
  type BroadcastHistoryItem,
  type BroadcastImageShape,
  type BroadcastOverview,
  type BroadcastStyle,
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
import { compressImage, formatBytes } from "@/lib/image";

/** Used until the server reports its own limits. */
const DEFAULT_LIMITS = { titleMax: 50, bodyMax: 180, perDay: 1 };

/** The picture types the server accepts. */
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
/** The server's per-picture cap. */
const MAX_BANNER_BYTES = 5 * 1024 * 1024;
/** Both shapes are delivered 1024 wide - sharp and small. */
const UPLOAD_WIDTH = 1024;

/** The three styles, in the order the segmented control shows them. */
const STYLE_OPTIONS: Array<{ value: BroadcastStyle; label: string; help: string }> = [
  {
    value: "text",
    label: "Text only",
    help: "Title and message, with the sKirana logo.",
  },
  {
    value: "picture",
    label: "Text + picture",
    help: "Title and message; the picture shows small, and big when the customer pulls the notification down.",
  },
  {
    value: "banner",
    label: "Banner only (like a poster)",
    help: "Just the picture, full width — write your message on the banner itself. Title and message are still needed for the lock screen and older phones.",
  },
];

/** Short names for the history table. */
const STYLE_SHORT_LABEL: Record<BroadcastStyle, string> = {
  text: "Text",
  picture: "Text + picture",
  banner: "Banner",
};

/** What each picture shape needs, for the field's hint and the switch note. */
const SHAPE_HINT: Record<BroadcastImageShape, { ratio: string; aspect: string; help: string }> = {
  picture: {
    ratio: "2:1",
    aspect: "aspect-[2/1]",
    help: "Wide picture, 2:1 (e.g. 1024×512). Keep text on it large or leave it out — it shows small until the notification is pulled down.",
  },
  banner: {
    ratio: "4:1",
    aspect: "aspect-[4/1]",
    help: "Long strip, 4:1 (e.g. 1024×256). Write your message big on the banner — it is all most customers will see.",
  },
};

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
  const [style, setStyle] = useState<BroadcastStyle>("text");
  /** The current style, for an upload that finishes after a switch. */
  const styleRef = useRef<BroadcastStyle>("text");
  /** The uploaded picture and the shape it was cropped to. */
  const [image, setImage] = useState<{ url: string; shape: BroadcastImageShape } | undefined>();
  const [imageNote, setImageNote] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // The picture that goes with the chosen style - none for text, and only one
  // of the matching shape otherwise.
  const imageUrl = style !== "text" && image?.shape === style ? image.url : undefined;

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

  /**
   * Picks a style. A picture of the other shape is dropped, with a note; a
   * picture is kept (but not sent) while on text only, so switching back
   * brings it back.
   */
  const changeStyle = (next: BroadcastStyle) => {
    styleRef.current = next;
    setStyle(next);
    setFormError("");
    if (next !== "text" && image && image.shape !== next) {
      setImage(undefined);
      setImageNote(
        `The ${SHAPE_HINT[image.shape].ratio} picture was removed — ${
          next === "banner" ? "a banner" : "this style"
        } needs a ${SHAPE_HINT[next].ratio} picture. Add one below.`,
      );
    } else {
      setImageNote("");
    }
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
    if (style !== "text" && !imageUrl) {
      setFormError("Add a picture first.");
      return null;
    }
    setFormError("");
    return {
      title: cleanTitle,
      body: cleanBody,
      target,
      style,
      ...(style !== "text" && imageUrl ? { imageUrl } : {}),
    };
  };

  /** Shrinks the chosen picture, uploads it and keeps the URL the server gives back. */
  const onPickImage = async (file: File | undefined) => {
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (!file) return;
    if (style === "text") return;
    const shape: BroadcastImageShape = style;
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error("Choose a JPG, PNG or WebP picture.");
      return;
    }
    setUploadingImage(true);
    try {
      const small = await compressImage(file, UPLOAD_WIDTH);
      if (small.size > MAX_BANNER_BYTES) {
        toast.error(`That picture is ${formatBytes(small.size)}. It must be under 5 MB.`);
        return;
      }
      const result = await uploadBroadcastImage(small, shape);
      // The style may have changed while it uploaded; a picture of the other
      // shape is kept only if it is still the one wanted.
      if (styleRef.current === shape || styleRef.current === "text") {
        setImage({ url: result.imageUrl, shape });
        setImageNote("");
      }
    } catch (error) {
      toast.error(`Couldn't upload the picture: ${message(error)}`);
    } finally {
      setUploadingImage(false);
    }
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

  const busy = sendingTest || sendingAll || uploadingImage;
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
            <fieldset className="space-y-1.5" disabled={uploadingImage || sendingTest || sendingAll}>
              <legend className="mb-1.5 text-sm font-medium leading-none">Style</legend>
              <div className="grid grid-cols-1 gap-1 rounded-lg bg-muted p-1 sm:grid-cols-3">
                {STYLE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-md px-3 py-2 text-center text-sm transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 ${
                      style === option.value
                        ? "bg-background font-medium text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="broadcast-style"
                      value={option.value}
                      checked={style === option.value}
                      onChange={() => changeStyle(option.value)}
                      aria-describedby="broadcast-style-help"
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              <p id="broadcast-style-help" className="text-xs text-muted-foreground">
                {STYLE_OPTIONS.find((option) => option.value === style)?.help}
              </p>
            </fieldset>

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

            {style !== "text" ? (
              <div className="space-y-1.5">
                <Label htmlFor="broadcast-image">
                  {style === "banner" ? "Banner picture (4:1)" : "Picture (2:1)"}
                </Label>
                <input
                  ref={imageInputRef}
                  id="broadcast-image"
                  type="file"
                  accept={IMAGE_TYPES.join(",")}
                  className="sr-only"
                  aria-describedby="broadcast-image-help"
                  disabled={uploadingImage || sendingTest || sendingAll}
                  onChange={(event) => void onPickImage(event.target.files?.[0])}
                />
                {imageUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={imageUrl}
                      alt={style === "banner" ? "Banner picture" : "Notification picture"}
                      className={`${SHAPE_HINT[style].aspect} w-40 rounded-md border object-cover`}
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => imageInputRef.current?.click()}
                      >
                        <ImagePlus className="mr-2 h-4 w-4" />
                        {uploadingImage ? "Uploading…" : "Change"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => setImage(undefined)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    {uploadingImage ? "Uploading…" : style === "banner" ? "Add a banner" : "Add a picture"}
                  </Button>
                )}
                {imageNote ? (
                  <p className="text-xs text-amber-700 dark:text-amber-400" role="status">
                    {imageNote}
                  </p>
                ) : null}
                <p id="broadcast-image-help" className="text-xs text-muted-foreground">
                  {SHAPE_HINT[style].help}
                </p>
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
              <NotificationPreview
                style={style}
                title={title}
                body={body}
                opens={opensLabel}
                imageUrl={imageUrl}
              />
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
                    <TableHead>Style</TableHead>
                    <TableHead>Picture</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Opens</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead className="text-right">Recipients</TableHead>
                    <TableHead>Sent by</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((row) => {
                    const rowStyle: BroadcastStyle = row.style ?? (row.imageUrl ? "banner" : "text");
                    return (
                      <TableRow key={row._id}>
                        <TableCell className="whitespace-nowrap">{when(row.createdAt)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline">{STYLE_SHORT_LABEL[rowStyle]}</Badge>
                        </TableCell>
                        <TableCell>
                          {row.imageUrl && rowStyle !== "text" ? (
                            <img
                              src={row.imageUrl}
                              alt=""
                              loading="lazy"
                              className={`${SHAPE_HINT[rowStyle].aspect} w-16 rounded border object-cover`}
                            />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
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
                    );
                  })}
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
