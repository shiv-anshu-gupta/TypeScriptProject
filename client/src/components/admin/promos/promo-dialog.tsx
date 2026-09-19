/**
 * The create/edit promo dialog.
 *
 * @remarks
 * One dialog serves both modes: it is in edit mode when a `promo` is passed and
 * in create mode when `promo` is `null`. The form is held in local component
 * state and every field is a string, matching `PromoFormValues`; the server
 * does the numeric parsing.
 *
 * The dialog itself makes no API call — it hands the values to `onSaved`, which
 * the page wires to `savePromo` in {@link useAdminPromos}.
 *
 * @packageDocumentation
 */

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Promo, PromoFormValues } from "@/features/admin/promo/types";
import { useEffect, useState } from "react";

const dialogContentClass =
  "max-h-[92vh] overflow-y-auto border-border bg-background sm:max-w-2xl";

const layoutClass = "grid gap-6";

const firstRowClass = "grid gap-4 md:grid-cols-2";

const secondRowClass = "grid gap-4 md:grid-cols-2";

const thirdRowClass = "grid gap-4 md:grid-cols-2";

const fieldWrapClass = "space-y-2";

const inputClass = "rounded-none";

const footerClass = "flex justify-end gap-3";

const outlineButtonClass = "rounded-none";

const primaryButtonClass = "rounded-none";

/**
 * Props for {@link PromoDialog}.
 *
 * @remarks
 * `promo` doubles as the mode switch: `null` means create, a value means edit.
 */
type PromoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promo: Promo | null;
  saving: boolean;
  onSaved: (values: PromoFormValues) => Promise<void>;
};

/**
 * The blank form, used for a new promo and whenever the dialog closes.
 *
 * @remarks
 * Every field is an empty string rather than `undefined` so each input stays
 * controlled for the life of the dialog.
 */
const defaultForm: PromoFormValues = {
  code: "",
  percentage: "",
  count: "",
  minimumOrderValue: "",
  startsAt: "",
  endsAt: "",
};

/**
 * Converts an ISO timestamp into the `YYYY-MM-DDTHH:mm` string an
 * `<input type="datetime-local">` expects.
 *
 * @remarks
 * The parts are read with the local-time getters, so the input shows the
 * browser's local time. `submit` performs the reverse with `new Date(...)
 * .toISOString()`, which reads the value back as local time, so the round trip
 * holds. An empty or missing value yields an empty string.
 *
 * @param value - ISO timestamp, or `undefined` for a new promo.
 * @returns The `datetime-local` value.
 */
function toDateTimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Modal form for creating or editing one promo.
 *
 * @remarks
 * The form lives only in this component's state. An effect reseeds it whenever
 * `open` or `promo` changes: closing resets to {@link defaultForm}, opening with
 * a `promo` copies its values in (numbers stringified, dates passed through
 * {@link toDateTimeLocal}), and opening without one shows a blank form. Nothing
 * typed here is kept once the dialog closes.
 *
 * Validation is a presence check only: if any of the six fields is blank,
 * `submit` returns without calling `onSaved` and without showing a message, so
 * the button appears to do nothing. Beyond that the inputs only carry `min` and
 * `max` attributes; the server is the real validator.
 *
 * On submit the code is trimmed and upper-cased, and both dates are converted
 * to ISO. A rejected save is caught and logged to the console — the dialog stays
 * open and shows no error of its own.
 *
 * @param promo - The promo being edited, or `null` to create a new one.
 * @param saving - Whether a save is in flight; disables the submit button.
 * @param onSaved - Receives the cleaned values. The page routes this to
 * `savePromo`, which POSTs or PATCHes and then closes the dialog.
 * @returns The dialog.
 */
function PromoDialog({
  open,
  onOpenChange,
  promo,
  saving,
  onSaved,
}: PromoDialogProps) {
  const [form, setForm] = useState<PromoFormValues>(defaultForm);
  const isEditMode = !!promo;

  useEffect(() => {
    if (!open) {
      setForm(defaultForm);
      return;
    }

    if (promo) {
      setForm({
        code: promo.code,
        percentage: String(promo.percentage),
        count: String(promo.count),
        minimumOrderValue: String(promo.minimumOrderValue),
        startsAt: toDateTimeLocal(promo.startsAt),
        endsAt: toDateTimeLocal(promo.endsAt),
      });

      return;
    }

    setForm(defaultForm);
  }, [open, promo]);

  /**
   * Writes one field of the local form state.
   *
   * @param key - Field to change.
   * @param value - New value, always a string in `PromoFormValues`.
   */
  function updateField<K extends keyof PromoFormValues>(
    key: K,
    value: PromoFormValues[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  /**
   * Checks every field is non-blank, then hands the cleaned values to
   * `onSaved`.
   *
   * @remarks
   * Returns silently when a field is empty — no message is shown. The code is
   * trimmed and upper-cased, and both `datetime-local` values become ISO
   * strings. A failed save is swallowed into `console.log`, so the shopkeeper
   * sees only that the dialog stayed open.
   */
  async function submit() {
    if (
      !form.code.trim() ||
      !form.percentage.trim() ||
      !form.count.trim() ||
      !form.minimumOrderValue.trim() ||
      !form.startsAt.trim() ||
      !form.endsAt.trim()
    ) {
      return;
    }

    try {
      await onSaved({
        code: form.code.trim().toUpperCase(),
        percentage: form.percentage,
        count: form.count,
        minimumOrderValue: form.minimumOrderValue,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
      });
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Promo" : "Add Promo"}</DialogTitle>
        </DialogHeader>
        <div className={layoutClass}>
          <div className={firstRowClass}>
            <div className={fieldWrapClass}>
              <Label>Promo Code</Label>
              <Input
                className={inputClass}
                type="text"
                value={form.code}
                placeholder="SUMMARY10"
                onChange={(e) => updateField("code", e.target.value)}
              />
            </div>

            <div className={fieldWrapClass}>
              <Label>Discount Percentage</Label>
              <Input
                className={inputClass}
                type="number"
                min={"1"}
                max={"100"}
                value={form.percentage}
                placeholder="10"
                onChange={(e) => updateField("percentage", e.target.value)}
              />
            </div>
          </div>

          <div className={secondRowClass}>
            <div className={fieldWrapClass}>
              <Label>Promo Count</Label>
              <Input
                className={inputClass}
                type="number"
                min={"1"}
                value={form.count}
                placeholder="100"
                onChange={(e) => updateField("count", e.target.value)}
              />
            </div>

            <div className={fieldWrapClass}>
              <Label>Minimum Order Value</Label>
              <Input
                className={inputClass}
                type="number"
                min={"0"}
                value={form.minimumOrderValue}
                placeholder="999"
                onChange={(e) =>
                  updateField("minimumOrderValue", e.target.value)
                }
              />
            </div>
          </div>

          <div className={thirdRowClass}>
            <div className={fieldWrapClass}>
              <Label>Valid From</Label>
              <Input
                className={inputClass}
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => updateField("startsAt", e.target.value)}
              />
            </div>

            <div className={fieldWrapClass}>
              <Label>Valid Till</Label>
              <Input
                className={inputClass}
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => updateField("endsAt", e.target.value)}
              />
            </div>
          </div>

          <div className={footerClass}>
            <Button
              className={outlineButtonClass}
              variant={"secondary"}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={saving}
              className={primaryButtonClass}
            >
              {saving
                ? "Saving..."
                : isEditMode
                  ? "Update Promo"
                  : "Create Promo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PromoDialog;
