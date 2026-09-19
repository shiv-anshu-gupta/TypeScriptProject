/**
 * The image area of the product dialog: two pickers, the existing pictures and
 * previews of newly added files.
 *
 * @remarks
 * Presentation only. It neither compresses nor size-checks anything — both
 * happen in `useProductForm` after `onFilesAdd` hands the files up.
 *
 * @packageDocumentation
 */

import { Button } from "@/components/ui/button";
import type { ProductImage } from "@/features/admin/products/types";
import { Camera, ImagePlus, Star, X } from "lucide-react";
import { useEffect, useMemo } from "react";

const wrapperClass = "space-y-4";

const headerClass = "space-y-1";

const titleClass = "text-sm font-semibold text-foreground";

const uploadLabelClass =
  "flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center transition hover:bg-muted";

const uploadIconClass = "mb-2 h-5 w-5 text-muted-foreground";

const uploadTitleClass = "text-sm font-medium text-foreground";

const hiddenInputClass = "hidden";

const sectionClass = "space-y-2";

const sectionTitleClass = "text-sm font-medium text-foreground";

const gridClass = "grid grid-cols-2 gap-3 md:grid-cols-4";

const imageCardClass =
  "overflow-hidden rounded-xl border border-border bg-card";

const imageClass = "h-28 w-full object-cover";

const imageActionsClass = "flex items-center justify-between gap-2 p-2";

const starIconClass = "mr-1 h-3.5 w-3.5";

const removeIconClass = "h-4 w-4";

const fileNameClass = "p-2 text-xs text-muted-foreground";

/**
 * Props for {@link ImagePicker}.
 *
 * @param existingImages - Pictures already stored on the product. Only these
 * can be removed or made the cover; new files cannot, until they are saved.
 * @param newFiles - Files picked in this session and not yet uploaded.
 * @param onFilesAdd - Receives the raw `FileList` from either input, including
 * `null` when the admin cancels the picker.
 * @param coverImagePublicId - Which existing image is marked as the cover.
 */
type ImagePickerProps = {
  existingImages: ProductImage[];
  newFiles: File[];
  coverImagePublicId: string;
  onFilesAdd: (files: FileList | null) => void;
  onExistingRemove: (publicId: string) => void;
  onCoverImageChange: (publicId: string) => void;
};

/**
 * Picks product images and manages the ones already saved.
 *
 * @remarks
 * Two inputs feed the same `onFilesAdd`. "Choose from gallery" is `multiple`;
 * "Take photo" carries `capture="environment"`, which opens the rear camera
 * directly on a phone — the main affordance for a shopkeeper adding stock from
 * the shop floor — and behaves like an ordinary file picker on desktop. Both
 * are `accept="image/*"`, which is the only type check anywhere in the product
 * upload path, and a hint the browser is free to ignore.
 *
 * Previews for new files are `URL.createObjectURL` blobs held in a `useMemo`
 * keyed on `newFiles`, and the cleanup effect revokes them when `newFiles`
 * changes or the component unmounts. Leaving that effect out would leak a blob
 * per picked photo for the life of the tab.
 *
 * Cover selection and removal act on existing images only, by `publicId`, and
 * are staged in form state — nothing reaches the server until the dialog is
 * saved.
 */
export function ImagePicker({
  existingImages,
  newFiles,
  coverImagePublicId,
  onFilesAdd,
  onExistingRemove,
  onCoverImageChange,
}: ImagePickerProps) {
  const previewUrls = useMemo(
    () => newFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [newFiles],
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previewUrls]);

  return (
    <div className={wrapperClass}>
      <div className={headerClass}>
        <h3 className={titleClass}>Images</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className={uploadLabelClass}>
          <ImagePlus className={uploadIconClass} />
          <span className={uploadTitleClass}>Choose from gallery</span>

          <input
            type="file"
            accept="image/*"
            multiple
            className={hiddenInputClass}
            onChange={(event) => onFilesAdd(event.target.files)}
          />
        </label>

        {/* `capture` opens the phone camera DIRECTLY (rear lens) — the key
            affordance for a shopkeeper adding products from their mobile.
            On desktop browsers it simply behaves like a file picker. */}
        <label className={uploadLabelClass}>
          <Camera className={uploadIconClass} />
          <span className={uploadTitleClass}>Take photo</span>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            className={hiddenInputClass}
            onChange={(event) => onFilesAdd(event.target.files)}
          />
        </label>
      </div>

      {existingImages.length > 0 ? (
        <div className={sectionClass}>
          <p className={sectionTitleClass}>Existing Images</p>

          <div className={gridClass}>
            {existingImages.map((image) => {
              const isCover = coverImagePublicId === image.publicId;

              return (
                <div key={image.publicId} className={imageCardClass}>
                  <img src={image.url} alt="product" className={imageClass} />

                  <div className={imageActionsClass}>
                    <Button
                      type="button"
                      size="sm"
                      variant={isCover ? "default" : "secondary"}
                      onClick={() => onCoverImageChange(image.publicId)}
                    >
                      <Star className={starIconClass} />
                      {isCover ? "Cover" : "Set Cover"}
                    </Button>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => onExistingRemove(image.publicId)}
                    >
                      <X className={removeIconClass} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {previewUrls.length > 0 ? (
        <div className={sectionClass}>
          <p className={sectionTitleClass}>New Uploads</p>
          <div className={gridClass}>
            {previewUrls.map((previewItem, index) => (
              <div
                key={`${previewItem.file.name}-${index}`}
                className={imageCardClass}
              >
                <img
                  src={previewItem.url}
                  alt={previewItem.file.name}
                  className={imageClass}
                />
                <div className={fileNameClass}>{previewItem.file.name}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
