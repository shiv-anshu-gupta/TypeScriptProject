/**
 * The banner edit dialog: name, tap target and optional schedule.
 *
 * @remarks
 * The image itself cannot be changed here — replacing a picture means uploading
 * a new banner and deleting the old one.
 *
 * Category and product targets are resolved against the products feature's own
 * endpoints, so this dialog is the reason the Products pages are not dead
 * weight for banners.
 *
 * @packageDocumentation
 */

import { useEffect, useState } from "react";
import { Check, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { getAdminCategories, getAdminProducts } from "@/features/admin/products/api";
import type { Category, Product } from "@/features/admin/products/types";
import {
  BANNER_HEIGHT,
  BANNER_WIDTH,
  LINK_LABELS,
  fromLocalInput,
  toLocalInput,
} from "@/features/admin/settings/banner-status";
import type { AdminBanner, BannerLinkType, UpdateBannerBody } from "@/features/admin/settings/types";

/**
 * Link types in the order the dropdown lists them.
 *
 * @remarks
 * The labels come from `LINK_LABELS`. `category` and `product` are the two that
 * reveal a picker and require a target.
 */
const LINK_TYPES: BannerLinkType[] = ["none", "writeList", "shop", "category", "product"];

/**
 * Search box and result list for choosing the product a banner opens.
 *
 * @remarks
 * Calls `GET /admin/products?search=` through `getAdminProducts`, **debounced
 * 300 ms**, and shows the first 8 results. The effect runs on mount as well, so
 * an empty query lists the first products rather than nothing. In-flight
 * results are discarded by a `cancelled` flag when the query changes or the
 * picker unmounts, which keeps a slow earlier response from overwriting a newer
 * one.
 *
 * A failed search clears the results and shows "No products found" — there is
 * no separate error state.
 *
 * Products with `status === "inactive"` are still listed, marked "(hidden in
 * app)", so it is possible to point a banner at a product customers cannot see.
 *
 * The search text and results are local to this component and are lost when the
 * link type changes away from `product`.
 *
 * @param selectedId - Currently chosen product id, used to tick its row.
 * @param selectedName - Its title, shown above the search box; it survives even
 * when the product is not in the current results.
 * @returns The picker.
 */
function ProductPicker({
  selectedId,
  selectedName,
  onPick,
}: {
  selectedId?: string;
  selectedName?: string;
  onPick: (product: { _id: string; title: string }) => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Search as the admin types, once they pause.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const products = await getAdminProducts(search);
        if (!cancelled) setResults(products.slice(0, 8));
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  return (
    <div className="space-y-2">
      {selectedName ? (
        <p className="text-sm text-foreground">
          Opens: <span className="font-semibold">{selectedName}</span>
        </p>
      ) : null}
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="banner-product-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products"
          className="pl-8"
        />
      </div>
      <ul className="max-h-48 overflow-y-auto border border-border">
        {loading && !results.length ? (
          <li className="px-3 py-2 text-sm text-muted-foreground">Searching…</li>
        ) : !results.length ? (
          <li className="px-3 py-2 text-sm text-muted-foreground">No products found</li>
        ) : (
          results.map((product) => {
            const picked = product._id === selectedId;
            return (
              <li key={product._id}>
                <button
                  type="button"
                  onClick={() => onPick({ _id: product._id, title: product.title })}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted ${
                    picked ? "bg-muted font-semibold" : ""
                  }`}
                >
                  <span className="truncate">
                    {product.title}
                    {product.status === "inactive" ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">(hidden in app)</span>
                    ) : null}
                  </span>
                  {picked ? <Check className="size-4 shrink-0 text-primary" /> : null}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

/**
 * Modal form for one banner's name, tap target and schedule.
 *
 * @remarks
 * Open state is implicit: the dialog is open whenever `banner` is not `null`.
 * Every field is local state, seeded from the banner by an effect each time a
 * different banner is passed, so unsaved edits are dropped on close.
 *
 * Categories are fetched once per dialog session via `getAdminCategories`
 * (`GET /admin/categories`) and cached in state; the effect skips the call once
 * `categories` is non-empty. A failure leaves the list empty and the dropdown
 * shows nothing to choose. Products use the debounced {@link ProductPicker}
 * instead, because the list is too long to load whole.
 *
 * Changing the link type clears `targetId` and `targetName`, so a stale product
 * id cannot be saved against a category link.
 *
 * Two checks run before saving, both shown inline: a `category` or `product`
 * link must have a target, and an end date must be after a start date.
 * `datetime-local` values are converted to ISO by `fromLocalInput`, and an
 * empty field becomes `null`, which clears that end of the schedule.
 *
 * Only `targetId` is sent — the server resolves `targetName`. The dialog closes
 * only when `onSave` resolves `true`, so a rejected save keeps the edits on
 * screen with the hook's toast explaining why.
 *
 * @param banner - The banner being edited, or `null` to keep the dialog closed.
 * @param saving - Whether the patch is in flight; disables both footer buttons.
 * @param onSave - Resolves `true` when the patch succeeded.
 * @returns The dialog.
 */
export function BannerEditDialog({
  banner,
  saving,
  onClose,
  onSave,
}: {
  banner: AdminBanner | null;
  saving: boolean;
  onClose: () => void;
  onSave: (banner: AdminBanner, body: UpdateBannerBody) => Promise<boolean>;
}) {
  const [title, setTitle] = useState("");
  const [linkType, setLinkType] = useState<BannerLinkType>("none");
  const [targetId, setTargetId] = useState<string | undefined>();
  const [targetName, setTargetName] = useState<string | undefined>();
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");

  // Start from the banner's saved values each time the dialog opens.
  useEffect(() => {
    if (!banner) return;
    setTitle(banner.title);
    setLinkType(banner.link.type);
    setTargetId(banner.link.targetId);
    setTargetName(banner.link.targetName);
    setStartsAt(toLocalInput(banner.startsAt));
    setEndsAt(toLocalInput(banner.endsAt));
    setError("");
  }, [banner]);

  useEffect(() => {
    if (!banner || categories.length) return;
    getAdminCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [banner, categories.length]);

  /** Whether the chosen link type requires a target to be picked. */
  const needsTarget = linkType === "category" || linkType === "product";

  /**
   * Validates the form, then patches the banner.
   *
   * @remarks
   * Refuses a `category` or `product` link with no target, and an end date at or
   * before the start; both refusals show inline text rather than a toast. The
   * title is trimmed, the dates converted to ISO, and the dialog closes only on
   * a successful save.
   */
  const save = async () => {
    if (!banner) return;
    if (needsTarget && !targetId) {
      setError(`Pick the ${linkType} this banner opens.`);
      return;
    }
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      setError("The end must be after the start.");
      return;
    }
    const saved = await onSave(banner, {
      title: title.trim(),
      link: needsTarget ? { type: linkType, targetId } : { type: linkType },
      startsAt: fromLocalInput(startsAt),
      endsAt: fromLocalInput(endsAt),
    });
    if (saved) onClose();
  };

  return (
    <Dialog open={!!banner} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit banner</DialogTitle>
          <DialogDescription>Changes reach the app the next time a customer opens Home.</DialogDescription>
        </DialogHeader>

        {banner ? (
          <div className="space-y-5">
            <img
              src={banner.imageUrl}
              alt=""
              className="w-full bg-muted object-cover"
              style={{ aspectRatio: `${BANNER_WIDTH} / ${BANNER_HEIGHT}` }}
            />

            <div className="space-y-1.5">
              <Label htmlFor="banner-title">Name</Label>
              <Input
                id="banner-title"
                value={title}
                maxLength={80}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Diwali offer"
              />
              <p className="text-xs text-muted-foreground">
                For you to recognise it; also read aloud to customers who use a screen reader.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="banner-link">When a customer taps it, open</Label>
              <Select
                value={linkType}
                onValueChange={(value) => {
                  setLinkType(value as BannerLinkType);
                  setTargetId(undefined);
                  setTargetName(undefined);
                  setError("");
                }}
              >
                <SelectTrigger id="banner-link" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINK_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {LINK_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {linkType === "category" ? (
              <div className="space-y-1.5">
                <Label htmlFor="banner-category">Category</Label>
                <Select
                  value={targetId ?? ""}
                  onValueChange={(value) => {
                    setTargetId(value);
                    setTargetName(categories.find((c) => c._id === value)?.name);
                    setError("");
                  }}
                >
                  <SelectTrigger id="banner-category" className="w-full">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {linkType === "product" ? (
              <div className="space-y-1.5">
                <Label htmlFor="banner-product-search">Product</Label>
                <ProductPicker
                  selectedId={targetId}
                  selectedName={targetName}
                  onPick={(product) => {
                    setTargetId(product._id);
                    setTargetName(product.title);
                    setError("");
                  }}
                />
              </div>
            ) : null}

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">Show only between (optional)</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="banner-starts" className="text-xs text-muted-foreground">
                    Start
                  </Label>
                  <Input
                    id="banner-starts"
                    type="datetime-local"
                    value={startsAt}
                    onChange={(event) => setStartsAt(event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="banner-ends" className="text-xs text-muted-foreground">
                    End
                  </Label>
                  <Input
                    id="banner-ends"
                    type="datetime-local"
                    value={endsAt}
                    onChange={(event) => setEndsAt(event.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave both empty to show it until you hide or delete it.
              </p>
            </fieldset>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
