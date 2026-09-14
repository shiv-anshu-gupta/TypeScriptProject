import type { ReactNode } from "react";
import { ArrowLeft, ClipboardList, IndianRupee, PackageCheck } from "lucide-react";

const highlights = [
  { icon: ClipboardList, text: "See every list your customers send" },
  { icon: IndianRupee, text: "Price items and share the total" },
  { icon: PackageCheck, text: "Mark orders packed and ready to collect" },
];

// The frame around the admin sign-in and sign-up screens: a brand panel on
// the left (desktop only) and the Clerk form on the right.
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f6f1e8]">
      <aside className="relative hidden w-[42%] max-w-xl flex-col justify-between overflow-hidden bg-[#2b4750] p-12 text-white lg:flex">
        {/* soft circles for depth - decorative only */}
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-[9999px] bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-[9999px] bg-white/5" />

        <a href="/" className="relative flex items-center gap-3">
          <img
            src="/skirana-logo.png"
            alt=""
            className="size-11 rounded-[12px] ring-1 ring-white/20"
          />
          <span className="text-2xl font-bold tracking-tight">sKirana</span>
        </a>

        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f4b042]">
            Shop panel
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight">
            Run your kirana orders from one place.
          </h1>
          <ul className="mt-8 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/85">
                <span className="grid size-9 place-items-center rounded-[10px] bg-white/10">
                  <Icon className="size-[18px]" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/55">
          For shop staff only. Customers use the sKirana mobile app.
        </p>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        {/* On phones the brand panel is hidden, so show the name here */}
        <a href="/" className="mb-6 flex items-center gap-2.5 lg:hidden">
          <img src="/skirana-logo.png" alt="" className="size-9 rounded-[10px]" />
          <span className="text-xl font-bold tracking-tight text-[#2b4750]">
            sKirana <span className="font-medium text-[#5d6a6e]">Shop panel</span>
          </span>
        </a>

        {children}

        <a
          href="/"
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-[#5d6a6e] hover:text-[#2b4750]"
        >
          <ArrowLeft className="size-4" />
          Back to skirana.com
        </a>
      </main>
    </div>
  );
}
