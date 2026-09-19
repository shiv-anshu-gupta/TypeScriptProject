/**
 * A mock phone showing the live banners as the app's Home carousel draws them.
 *
 * @remarks
 * A static drawing, not the real app: the surrounding blocks are placeholders
 * for the app's header, search bar and category circles. Only the banners are
 * real images.
 *
 * It receives the banners the page has already filtered to status `"live"`, so
 * hidden, scheduled, ended and over-the-limit banners never appear — which is
 * the point of the preview.
 *
 * @packageDocumentation
 */

import { useState } from "react";

import { BANNER_RATIO } from "@/features/admin/settings/banner-status";
import type { AdminBanner } from "@/features/admin/settings/types";

// Same measurements as the app's Home carousel (mobile BannerCarousel), scaled
// to a 300px-wide phone: 16px sides, 12px gap, and a peek of the next banner.
/**
 * Mock screen width in pixels, the basis for every other measurement.
 *
 * @remarks
 * The outer frame is 316px wide: this plus the 8px border on each side.
 */
const SCREEN = 300;
/** Horizontal padding either side of the carousel. */
const SIDE = 12;
/** Gap between two banner slides. */
const GAP = 9;
/**
 * Width kept back so the next banner peeks in from the right.
 *
 * @remarks
 * Applied only when there is more than one live banner; a single banner uses
 * the full width.
 */
const PEEK = 21;

/**
 * Renders the phone mock and its carousel.
 *
 * @remarks
 * Slide width is derived from the constants above, and slide height from
 * `BANNER_RATIO`, so the preview keeps the real 1600 × 736 shape. Paging is by
 * CSS `translateX`; there is no auto-advance and no swipe — the dots are the
 * only control.
 *
 * The selected index is clamped against the current list length, so deleting or
 * hiding the last banner cannot leave the carousel scrolled past the end. With
 * no live banners it shows a note that the app skips the space entirely.
 *
 * @param live - Banners whose computed status is exactly `"live"`, in carousel
 * order.
 * @returns The preview.
 */
export function BannerPhonePreview({ live }: { live: AdminBanner[] }) {
  const [index, setIndex] = useState(0);
  const many = live.length > 1;
  const itemWidth = SCREEN - SIDE * 2 - (many ? PEEK : 0);
  const current = Math.min(index, Math.max(live.length - 1, 0));

  return (
    <div className="mx-auto w-[316px] rounded-[36px] border-[8px] border-foreground/85 bg-[#f6f1e8] p-0 shadow-xl">
      <div className="overflow-hidden rounded-[28px]">
        {/* A hint of the Home screen around the carousel */}
        <div className="space-y-2 px-3 pb-3 pt-5">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-[8px] bg-[#3c5a64]" />
            <div className="space-y-1">
              <div className="h-2.5 w-16 rounded-[3px] bg-[#1f2a2e]/80" />
              <div className="h-1.5 w-24 rounded-[3px] bg-[#1f2a2e]/25" />
            </div>
          </div>
          <div className="h-16 rounded-[12px] border border-[#e6dccb] bg-white" />
          <div className="h-8 rounded-[8px] border border-[#e6dccb] bg-white" />
        </div>

        {live.length ? (
          <div className="space-y-2 pb-4">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-300"
                style={{
                  gap: GAP,
                  paddingInline: SIDE,
                  transform: `translateX(-${current * (itemWidth + GAP)}px)`,
                }}
              >
                {live.map((banner) => (
                  <img
                    key={banner._id}
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="shrink-0 rounded-[12px] bg-[#e9e3d6] object-cover"
                    style={{ width: itemWidth, height: Math.round(itemWidth * BANNER_RATIO) }}
                  />
                ))}
              </div>
            </div>
            {many ? (
              <div className="flex justify-center gap-1.5">
                {live.map((banner, i) => (
                  <button
                    key={banner._id}
                    type="button"
                    aria-label={`Show banner ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === current ? "w-5 bg-[#3c5a64]" : "w-1.5 bg-[#d8cfbf]"
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mx-3 mb-4 flex items-center justify-center rounded-[12px] border border-dashed border-[#d8cfbf] px-4 py-8 text-center text-xs text-[#6f6857]">
            No live banners - the app skips this space.
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 px-3 pb-6">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="size-10 rounded-full bg-[#e9e3d6]" />
              <div className="h-1.5 w-8 rounded-[3px] bg-[#1f2a2e]/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
