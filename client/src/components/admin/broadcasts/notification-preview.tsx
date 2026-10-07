/**
 * A phone-style preview of the broadcast as an expanded Android notification.
 *
 * @remarks
 * An approximation, not a render: Android, the launcher and the user's font
 * size all change the real thing. Its job is to show roughly how much text
 * fits and that the title and message read well together.
 *
 * With a banner picture it shows Android's expanded "big picture" layout:
 * title, text, then the picture full width at 2:1. Only app version 1.0.5 and
 * newer draws it that way; older versions show the picture small, where the
 * logo would be - the caption under the phone says so.
 *
 * @packageDocumentation
 */
import { Bell } from "lucide-react";

/**
 * The preview.
 *
 * @param title - The notification title; a placeholder is shown when blank.
 * @param body - The message; a placeholder is shown when blank.
 * @param opens - Human label of what tapping it opens, shown under the card.
 * @param imageUrl - The banner picture, if one is attached.
 */
export function NotificationPreview({
  title,
  body,
  opens,
  imageUrl,
}: {
  title: string;
  body: string;
  opens: string;
  imageUrl?: string;
}) {
  const hasTitle = title.trim().length > 0;
  const hasBody = body.trim().length > 0;

  return (
    <div className="space-y-3">
      <div
        className="mx-auto w-full max-w-[340px] rounded-[2.25rem] border-[10px] border-neutral-900 bg-neutral-800 p-3 shadow-lg"
        aria-label="Notification preview"
        role="img"
      >
        <div className="mb-3 flex items-center justify-between px-2 text-[11px] font-medium text-neutral-300">
          <span>9:41</span>
          <span className="h-4 w-16 rounded-full bg-neutral-900" />
          <span>100%</span>
        </div>

        <div className="rounded-2xl bg-white p-3 text-neutral-900 shadow">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600">
              <Bell className="h-2.5 w-2.5 text-white" />
            </span>
            <span>sKirana · now</span>
          </div>

          <div className="mt-1.5 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p
                className={`break-words text-sm font-semibold leading-snug ${
                  hasTitle ? "" : "text-neutral-400"
                }`}
              >
                {hasTitle ? title : "Your title shows here"}
              </p>
              <p
                className={`mt-0.5 whitespace-pre-wrap break-words text-[13px] leading-snug ${
                  hasBody ? "text-neutral-700" : "text-neutral-400"
                }`}
              >
                {hasBody ? body : "Your message shows here, in full, like an expanded notification."}
              </p>
            </div>
            {imageUrl ? null : (
              <img
                src="/skirana-logo.png"
                alt=""
                className="h-10 w-10 shrink-0 rounded-lg object-cover"
              />
            )}
          </div>

          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="mt-2.5 aspect-[2/1] w-full rounded-lg bg-neutral-100 object-cover"
            />
          ) : null}
        </div>

        <div className={imageUrl ? "h-16" : "h-40"} />
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Tapping it opens: <span className="font-medium text-foreground">{opens}</span>
      </p>
      {imageUrl ? (
        <p className="text-center text-xs text-muted-foreground">
          On phones with app version 1.0.5 or newer this shows as a big picture; older versions show it small.
        </p>
      ) : null}
    </div>
  );
}
