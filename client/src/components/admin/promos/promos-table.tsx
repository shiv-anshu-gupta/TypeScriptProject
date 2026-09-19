/**
 * The promos table: one row per promo code, with edit and delete controls.
 *
 * @remarks
 * Presentational only. It receives the already-filtered list from the page and
 * raises `onEdit` / `onDelete`; it holds no state and makes no API call.
 *
 * @packageDocumentation
 */

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Promo } from "@/features/admin/promo/types";
import { Pencil, Trash2 } from "lucide-react";

/**
 * Props for {@link PromoTable}.
 *
 * @remarks
 * `promos` is expected to be the filtered list, not the raw one — the search
 * filter is applied in {@link useAdminPromos}, not here.
 */
type PromoTableProps = {
  promos: Promo[];
  loading: boolean;
  deletingPromoId: string;
  onEdit: (promo: Promo) => void;
  onDelete: (promoId: string) => Promise<void>;
};

const wrapClass = "overflow-x-auto rounded-xl border border-border";

const tableHeaderClass = "bg-muted/50";

const loadingCellClass = "h-28 text-center text-muted-foreground";

const codeCellClass = "font-medium text-foreground";

const rightWrapClass = "flex justify-end";

const iconButtonClass = "rounded-none";

const deleteButtonClass =
  "rounded-none text-destructive hover:text-destructive";

/**
 * Formats an ISO timestamp as a date for the "valid From" / "Valid Till"
 * columns.
 *
 * @remarks
 * Despite the name it prints the date only — `toLocaleDateString` drops the
 * time — and it uses the browser's locale, so the same row reads differently on
 * a differently-configured machine. An unparsable value renders as
 * "Invalid Date" rather than throwing.
 *
 * @param value - ISO timestamp from `Promo.startsAt` or `Promo.endsAt`.
 * @returns The locale date string.
 */
function formatDateTime(value: string) {
  return new Date(value).toLocaleDateString();
}

/**
 * Renders the promo rows, or a single full-width cell while loading or when the
 * list is empty.
 *
 * @remarks
 * Columns are code, discount percentage, count, minimum order value, valid
 * from, valid till, then an edit and a delete button. Dates go through
 * {@link formatDateTime}. There is no sorting and no pagination — every promo
 * the server returned is drawn.
 *
 * The delete button does not confirm here; the `window.confirm` prompt lives in
 * `removePromo` inside {@link useAdminPromos}.
 *
 * @param deletingPromoId - Id of the promo whose delete request is in flight.
 * Only that row's delete button is disabled; the rest stay live.
 * @returns The table.
 */
function PromoTable({
  promos,
  loading,
  onDelete,
  onEdit,
  deletingPromoId,
}: PromoTableProps) {
  return (
    <div className={wrapClass}>
      <Table>
        <TableHeader className={tableHeaderClass}>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Count</TableHead>
            <TableHead>Min Order</TableHead>
            <TableHead>valid From</TableHead>
            <TableHead>Valid Till</TableHead>
            <TableHead className="w-[80px] text-right">Edit</TableHead>
            <TableHead className="w-[80px] text-right">Delete</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} className={loadingCellClass}>
                Loading Promos...
              </TableCell>
            </TableRow>
          ) : promos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className={loadingCellClass}>
                No Promos found
              </TableCell>
            </TableRow>
          ) : (
            promos.map((promo) => (
              <TableRow key={promo._id}>
                <TableCell className={codeCellClass}>{promo.code}</TableCell>
                <TableCell>{promo.percentage}%</TableCell>
                <TableCell>{promo.count}</TableCell>
                <TableCell>{promo.minimumOrderValue}</TableCell>
                <TableCell>{formatDateTime(promo.startsAt)}</TableCell>
                <TableCell>{formatDateTime(promo.endsAt)}</TableCell>
                <TableCell>
                  <div className={rightWrapClass}>
                    <Button
                      size={"icon"}
                      variant={"ghost"}
                      className={iconButtonClass}
                      onClick={() => onEdit(promo)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className={rightWrapClass}>
                    <Button
                      size={"icon"}
                      variant={"ghost"}
                      className={deleteButtonClass}
                      disabled={deletingPromoId === promo._id}
                      onClick={() => onDelete(promo._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default PromoTable;
