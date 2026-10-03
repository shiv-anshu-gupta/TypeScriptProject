/**
 * Customer text in the shopkeeper's Telegram.
 *
 * @packageDocumentation
 */
import { describe, expect, it } from "vitest";
import { escapeTelegram } from "./telegram";

describe("escapeTelegram", () => {
  it("turns a planted link back into plain text", () => {
    const planted = '<a href="https://evil.example/pay">Payment received - tap to confirm</a>';
    const safe = escapeTelegram(planted);
    expect(safe).not.toContain("<a");
    expect(safe).toBe(
      '&lt;a href="https://evil.example/pay"&gt;Payment received - tap to confirm&lt;/a&gt;',
    );
  });

  it("escapes the ampersand first, so nothing is double-escaped", () => {
    expect(escapeTelegram("dal & chawal <2kg>")).toBe("dal &amp; chawal &lt;2kg&gt;");
  });

  it("leaves Hindi and ordinary text alone", () => {
    expect(escapeTelegram("आटा 5 किलो, चीनी 1 किलो")).toBe("आटा 5 किलो, चीनी 1 किलो");
  });
});
