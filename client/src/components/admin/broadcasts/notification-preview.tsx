/**
 * A phone-style preview of the broadcast as an Android notification, in each
 * of the three styles.
 *
 * @remarks
 * An approximation, not a render: Android, the launcher and the user's font
 * size all change the real thing. Its job is to show roughly how much text
 * fits, and how the picture sits.
 *
 * - `text` - the expanded card: title, message, the sKirana logo.
 * - `picture` - collapsed (title, one line of message, the picture as a
 *   thumbnail) and pulled down (title, message, the picture full width at 2:1).
 * - `banner` - collapsed (a full-width 4:1 strip with the small app icon on
 *   its left, like a Samsung notification) and pulled down (the picture
 *   larger).
 *
 * Only app version 1.0.5 and newer draws pictures and banners this way; the
 * caption under the phone says so.
 *
 * @packageDocumentation
 */
import { Bell } from "lucide-react";

import type { BroadcastStyle } from "@/features/admin/broadcasts/api";

/** The small green app icon and "sKirana · now" line every card starts with. */
function AppLine() {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
      <AppIcon />
      <span>sKirana · now</span>
    </div>
  );
}

function AppIcon({ size = "sm" }: { size?: "sm" | "md" }) {
  const box = size === "md" ? "h-6 w-6" : "h-4 w-4";
  const glyph = size === "md" ? "h-3.5 w-3.5" : "h-2.5 w-2.5";
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-emerald-600 ${box}`}>
      <Bell className={`text-white ${glyph}`} />
    </span>
  );
}

/** A grey stand-in where the picture goes, until one is added. */
function PicturePlaceholder({ className, label }: { className: string; label: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-neutral-200 text-[10px] text-neutral-500 ${className}`}
    >
      {label}
    </div>
  );
}

function Picture({
  src,
  className,
  placeholder,
}: {
  src?: string;
  className: string;
  placeholder: string;
}) {
  return src ? (
    <img src={src} alt="" className={`bg-neutral-100 object-cover ${className}`} />
  ) : (
    <PicturePlaceholder className={className} label={placeholder} />
  );
}

/** "Collapsed" / "Pulled down" above each card. */
function StateLabel({ children }: { children: string }) {
  return (
    <p className="mb-1 px-1 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
      {children}
    </p>
  );
}

/**
 * The preview.
 *
 * @param style - Which of the three layouts to draw.
 * @param title - The notification title; a placeholder is shown when blank.
 * @param body - The message; a placeholder is shown when blank.
 * @param opens - Human label of what tapping it opens, shown under the phone.
 * @param imageUrl - The picture, for `picture` and `banner`; a grey stand-in
 * is drawn until one is added.
 */
export function NotificationPreview({
  style,
  title,
  body,
  opens,
  imageUrl,
}: {
  style: BroadcastStyle;
  title: string;
  body: string;
  opens: string;
  imageUrl?: string;
}) {
  const hasTitle = title.trim().length > 0;
  const hasBody = body.trim().length > 0;
  const titleText = hasTitle ? title : "Your title shows here";
  const titleClass = `break-words text-sm font-semibold leading-snug ${hasTitle ? "" : "text-neutral-400"}`;
  const bodyClass = (oneLine: boolean) =>
    `mt-0.5 text-[13px] leading-snug ${hasBody ? "text-neutral-700" : "text-neutral-400"} ${
      oneLine ? "truncate" : "whitespace-pre-wrap break-words"
    }`;
  const bodyText = (oneLine: boolean) =>
    hasBody
      ? body
      : oneLine
        ? "Your message shows here"
        : "Your message shows here, in full, like an expanded notification.";

  const card = "rounded-2xl bg-white text-neutral-900 shadow";

  return (
    <div className="space-y-3">
      <div
        className="mx-auto w-full max-w-[340px] rounded-[2.25rem] border-[10px] border-neutral-900 bg-neutral-800 p-3 shadow-lg"
        aria-label={`Notification preview: ${
          style === "text" ? "text only" : style === "picture" ? "text and picture" : "banner"
        }`}
        role="img"
      >
        <div className="mb-3 flex items-center justify-between px-2 text-[11px] font-medium text-neutral-300">
          <span>9:41</span>
          <span className="h-4 w-16 rounded-full bg-neutral-900" />
          <span>100%</span>
        </div>

        {style === "text" ? (
          <>
            <div className={`${card} p-3`}>
              <AppLine />
              <div className="mt-1.5 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className={titleClass}>{titleText}</p>
                  <p className={bodyClass(false)}>{bodyText(false)}</p>
                </div>
                <img
                  src="/skirana-logo.png"
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                />
              </div>
            </div>
            <div className="h-40" />
          </>
        ) : null}

        {style === "picture" ? (
          <div className="space-y-3 pb-4">
            <div>
              <StateLabel>Collapsed</StateLabel>
              <div className={`${card} p-3`}>
                <AppLine />
                <div className="mt-1.5 flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className={`${titleClass} truncate`}>{titleText}</p>
                    <p className={bodyClass(true)}>{bodyText(true)}</p>
                  </div>
                  <Picture
                    src={imageUrl}
                    className="h-10 w-10 shrink-0 rounded-lg"
                    placeholder="2:1"
                  />
                </div>
              </div>
            </div>
            <div>
              <StateLabel>Pulled down</StateLabel>
              <div className={`${card} p-3`}>
                <AppLine />
                <p className={`mt-1.5 ${titleClass}`}>{titleText}</p>
                <p className={bodyClass(false)}>{bodyText(false)}</p>
                <Picture
                  src={imageUrl}
                  className="mt-2.5 aspect-[2/1] w-full rounded-lg"
                  placeholder="Your 2:1 picture"
                />
              </div>
            </div>
          </div>
        ) : null}

        {style === "banner" ? (
          <div className="space-y-3 pb-4">
            <div>
              <StateLabel>Collapsed</StateLabel>
              <div className={`${card} flex items-center gap-2 overflow-hidden p-2`}>
                <AppIcon size="md" />
                <Picture
                  src={imageUrl}
                  className="aspect-[4/1] min-w-0 flex-1 rounded-lg"
                  placeholder="Your 4:1 banner"
                />
              </div>
            </div>
            <div>
              <StateLabel>Pulled down</StateLabel>
              <div className={`${card} p-2`}>
                <div className="px-1 pb-2">
                  <AppLine />
                </div>
                <Picture
                  src={imageUrl}
                  className="aspect-[4/1] w-full rounded-lg"
                  placeholder="Your 4:1 banner"
                />
              </div>
            </div>
            <p className="px-1 text-[10px] leading-snug text-neutral-400">
              Lock screen and older phones: “{titleText}” — {bodyText(true)}
            </p>
          </div>
        ) : null}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Tapping it opens: <span className="font-medium text-foreground">{opens}</span>
      </p>
      {style !== "text" ? (
        <p className="text-center text-xs text-muted-foreground">
          Pictures and banners show this way on app version 1.0.5 and newer; older versions show the
          title, message and a small picture.
        </p>
      ) : null}
    </div>
  );
}
