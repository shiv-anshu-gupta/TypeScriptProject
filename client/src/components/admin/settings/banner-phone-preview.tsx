import { useState } from "react";

import { BANNER_RATIO } from "@/features/admin/settings/banner-status";
import type { AdminBanner } from "@/features/admin/settings/types";

// Same measurements as the app's Home carousel (mobile BannerCarousel), scaled
// to a 300px-wide phone: 16px sides, 12px gap, and a peek of the next banner.
const SCREEN = 300;
const SIDE = 12;
const GAP = 9;
const PEEK = 21;

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
