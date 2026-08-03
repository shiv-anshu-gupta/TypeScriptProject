import { toast } from "sonner";

// Audible + visible "new order" alert for the admin, so the shopkeeper notices
// a new list while the page is open — without Firebase or a refresh.

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  const Ctx =
    (window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext) ?? null;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

// Browsers block audio until a user gesture. Unlock the context on the first
// interaction so later beeps play even while the page sits idle at the counter.
if (typeof window !== "undefined") {
  const unlock = () => {
    const ctx = getCtx();
    if (ctx && ctx.state === "suspended") void ctx.resume();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}

function beep() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  const now = ctx.currentTime;
  // two rising tones — a friendly "ding-dong"
  ([
    [880, 0],
    [1175, 0.18],
  ] as const).forEach(([freq, t]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + t);
    gain.gain.exponentialRampToValueAtTime(0.35, now + t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + t);
    osc.stop(now + t + 0.18);
  });
}

let titleTimer: number | null = null;
const baseTitle = typeof document !== "undefined" ? document.title : "";

// Flash the browser-tab title so it's noticed even when the tab is in the
// background. Clears the moment the tab is focused again.
function flashTitle(count: number) {
  if (typeof document === "undefined") return;
  const msg = `🔔 ${count} new order${count > 1 ? "s" : ""}`;
  let on = false;
  if (titleTimer) window.clearInterval(titleTimer);

  const stop = () => {
    if (titleTimer) {
      window.clearInterval(titleTimer);
      titleTimer = null;
    }
    document.title = baseTitle;
    window.removeEventListener("focus", stop);
    document.removeEventListener("visibilitychange", onVis);
  };
  const onVis = () => {
    if (!document.hidden) stop();
  };

  titleTimer = window.setInterval(() => {
    document.title = on ? baseTitle : msg;
    on = !on;
  }, 1000);
  window.addEventListener("focus", stop);
  document.addEventListener("visibilitychange", onVis);
}

export function notifyNewOrders(count: number, customer?: string) {
  beep();
  flashTitle(count);
  toast.success(
    count > 1
      ? `${count} new grocery lists received`
      : customer
        ? `New list from ${customer}`
        : "New grocery list received",
    { duration: 8000 },
  );
}
