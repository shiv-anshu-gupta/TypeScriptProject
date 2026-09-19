/**
 * The controls above the promos table: a search box and an "Add promo" button.
 *
 * @remarks
 * Fully controlled — it owns no state and calls no API. The search value lives
 * in {@link useAdminPromos}.
 *
 * @packageDocumentation
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

const wrapClass =
  "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between";

const searchWrapClass = "relative w-full max-w-sm";

const searchIconClass =
  "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground";

const searchInputClass = "rounded-none pl-9";

const addButtonClass = "rounded-none";

const addButtonIconClass = "mr-2 h-4 w-4";

/** Props for {@link PromoToolbar}. */
type PromoToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onAddPromo: () => void;
};

/**
 * Search field plus "Add promo" button.
 *
 * @remarks
 * Every keystroke calls `onSearchChange` — there is no debounce, because the
 * filter is client-side and matches the `code` field only
 * (`filteredPromos` in {@link useAdminPromos}). Nothing is sent to the server
 * while the admin types.
 *
 * @returns The toolbar row.
 */
function PromoToolbar({
  search,
  onSearchChange,
  onAddPromo,
}: PromoToolbarProps) {
  return (
    <div className={wrapClass}>
      <div className={searchWrapClass}>
        <Search className={searchIconClass} />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search Promos"
          className={searchInputClass}
        />
      </div>

      <Button onClick={onAddPromo} className={addButtonClass}>
        <Plus className={addButtonIconClass} />
        Add promo
      </Button>
    </div>
  );
}

export default PromoToolbar;
