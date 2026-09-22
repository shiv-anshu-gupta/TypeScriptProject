/**
 * Works out which address a request really came from, behind the platform's
 * proxy, and compares it against the shop's registered networks.
 *
 * The whole shop-network gate rests on this file, so it is written to be
 * pessimistic. Any header a client can set is treated as a claim, not a fact:
 *
 * - The platform's own headers (`x-vercel-forwarded-for`, `x-real-ip`) are
 *   written by the edge after the request arrives. A client's copy is
 *   overwritten, so these are believed first.
 * - `x-forwarded-for` is read from the **right**, never the left. A proxy
 *   appends the address it actually saw, so the rightmost entry is the one
 *   nobody chose. A staff member at home who sends the shop's IP gets it
 *   prepended, and their real address still wins.
 * - Nothing readable means nothing matched. The gate fails closed.
 *
 * `req.socket.remoteAddress` is the last resort and is only meaningful when the
 * server runs without a proxy in front of it, as it does in local development.
 *
 * @packageDocumentation
 */

/** Header bag as Node presents it: a value may be missing, single, or repeated. */
type HeaderBag = Record<string, string | string[] | undefined>;

/**
 * Headers the platform writes itself, in the order they are trusted.
 *
 * A client can send any of these, but the edge replaces them before the
 * function sees the request, so a forged copy never survives the hop.
 */
const PLATFORM_HEADERS = ["x-vercel-forwarded-for", "x-real-ip"] as const;

/** Bare IPv4, the only form a home or shop connection reports in practice. */
const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/**
 * Flattens a header that may arrive repeated.
 *
 * @param value - One entry from the header bag.
 * @returns The joined value, or `""` when absent.
 */
function headerValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.join(",");
  return value ?? "";
}

/**
 * Reduces one address to a comparable form, or rejects it.
 *
 * Handles the two shapes a proxy adds on its own: the IPv4-mapped IPv6 form
 * (`::ffff:1.2.3.4`) that Node reports for an IPv4 client on a dual-stack
 * socket, and a trailing `:port`.
 *
 * @param raw - One candidate address, possibly with whitespace.
 * @returns The normalised address, or `null` if it is not an address at all.
 */
function normalise(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;

  if (value.startsWith("[")) {
    // [2001:db8::1]:443 - an IPv6 literal with a port.
    const close = value.indexOf("]");
    if (close > 0) value = value.slice(1, close);
  }

  const mapped = value.toLowerCase().lastIndexOf("::ffff:");
  if (mapped !== -1) value = value.slice(mapped + "::ffff:".length);

  // A single colon means host:port; several mean it is IPv6, which keeps them.
  const firstColon = value.indexOf(":");
  if (firstColon !== -1 && value.indexOf(":", firstColon + 1) === -1) {
    value = value.slice(0, firstColon);
  }

  if (IPV4.test(value)) {
    const octets = value.split(".").map(Number);
    return octets.every((n) => n <= 255) ? value : null;
  }

  // Accept an IPv6 address as-is; reject anything that is not an address.
  return value.includes(":") ? value : null;
}

/**
 * The address a request came from, as far as the headers can be trusted.
 *
 * @param headers - `req.headers`, or any equivalent bag.
 * @returns The caller's address, or `null` when none can be read. `null` must
 * be treated as "not on the shop's network" - see {@link sameNetwork}.
 *
 * @example
 * ```ts
 * const ip = clientIpFromHeaders(req.headers) ?? req.socket.remoteAddress;
 * ```
 */
export function clientIpFromHeaders(headers: HeaderBag): string | null {
  for (const name of PLATFORM_HEADERS) {
    const direct = normalise(headerValue(headers[name]).split(",").pop() ?? "");
    if (direct) return direct;
  }

  const chain = headerValue(headers["x-forwarded-for"])
    .split(",")
    .map(normalise)
    .filter((value): value is string => value !== null);

  // Rightmost: the hop that actually connected to the proxy.
  return chain.length ? chain[chain.length - 1] : null;
}

/**
 * Whether a caller is on one of the shop's registered networks.
 *
 * Deliberately an exact match rather than a subnet: the shop registers the
 * address the server actually sees, so widening to a `/24` would admit every
 * other customer of the same ISP block for no gain.
 *
 * @param ip - The caller's address, as read by {@link clientIpFromHeaders}.
 * @param registered - Every address the shopkeeper has registered.
 * @returns `true` only on an exact match. An unreadable address, or a shop that
 * has registered nothing yet, returns `false` - the gate fails closed, so a
 * misconfiguration locks staff out rather than letting everyone in.
 */
export function sameNetwork(
  ip: string | null | undefined,
  registered: readonly string[],
): boolean {
  if (!ip || registered.length === 0) return false;
  return registered.includes(ip);
}
