/**
 * The products table on `/admin/products`.
 *
 * @remarks
 * Display only — it fetches nothing and mutates nothing. Editing is delegated
 * upwards through `onEdit`.
 *
 * @packageDocumentation
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Product } from "@/features/admin/products/types";
import { getCoverImage } from "@/features/admin/products/use-product-form";
import { Pencil } from "lucide-react";

const wrapperClass = "overflow-x-auto rounded-xl border border-border";

const tableHeaderClass = "bg-muted/50";

const imageHeadClass = "w-[90px]";

const editHeadClass = "w-[80px] text-right";

const stateCellClass = "h-28 text-center text-muted-foreground";

const imageBoxClass =
  "h-14 w-14 overflow-hidden rounded-lg border border-border bg-muted";

const imageClass = "h-full w-full object-cover";

const editCellWrapClass = "flex justify-end";

const editIconClass = "h-4 w-4";

/**
 * Props for {@link ProductsTable}.
 *
 * @param onEdit - Given the whole product, not an id: the page keeps it in
 * `editingProduct` and seeds the dialog from it rather than refetching.
 */
type ProductsTableProps = {
  products: Product[];
  onEdit: (product: Product) => void;
  loading: boolean;
};

/**
 * Lists products with cover image, title, brand, category, unit, status and
 * stock.
 *
 * @remarks
 * Renders the whole `products` array — no pagination, no client-side
 * filtering, no sorting. What arrives is what is shown, and the search that
 * produced it ran on the server.
 *
 * Three states share the same body: a "Loading Products..." row while
 * `loading`, a "No products found!!!" row when the array is empty, and the
 * rows themselves. Because the hook swallows a failed fetch, a request error
 * looks like whichever of those two the previous state left behind.
 *
 * The cover comes from `getCoverImage` (the `isCover` image, else the first);
 * a product with no images shows an empty grey box rather than a broken
 * image. The unit cell hides `unitValue` when it is 1, so "per kg" rather
 * than "per 1 kg", and falls back to `piece` for older products with no unit.
 */
export function ProductsTable({
  products,
  onEdit,
  loading,
}: ProductsTableProps) {
  return (
    <div className={wrapperClass}>
      <Table>
        <TableHeader className={tableHeaderClass}>
          <TableRow>
            <TableHead className={imageHeadClass}>Image</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className={editHeadClass}>Edit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} className={stateCellClass}>
                Loading Products...
              </TableCell>
            </TableRow>
          ) : products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className={stateCellClass}>
                No products found!!!
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => {
              const cover = getCoverImage(product.images);
              return (
                <TableRow key={product._id}>
                  <TableCell>
                    <div className={imageBoxClass}>
                      {cover ? (
                        <img
                          src={cover.url}
                          alt={product.title}
                          className={imageClass}
                        />
                      ) : null}
                    </div>
                  </TableCell>

                  <TableCell>{product.title}</TableCell>
                  <TableCell>{product.brand}</TableCell>
                  <TableCell>{product.category?.name}</TableCell>
                  <TableCell>
                    per{" "}
                    {product.unitValue && product.unitValue !== 1
                      ? `${product.unitValue} ${product.unit ?? "piece"}`
                      : (product.unit ?? "piece")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.status === "active" ? "default" : "secondary"
                      }
                    >
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <div className={editCellWrapClass}>
                      <Button
                        size={"icon"}
                        variant="ghost"
                        onClick={() => onEdit(product)}
                      >
                        <Pencil className={editIconClass} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
