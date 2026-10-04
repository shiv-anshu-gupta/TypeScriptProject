/**
 * The policy text is complete, has no placeholders, and English and Hindi
 * line up section for section.
 *
 * @packageDocumentation
 */
import { GRIEVANCE_OFFICER, SELLER_NAME, SELLER_PHONE } from "@/lib/shop";

import { LEGAL } from "./content";
import { LEGAL_DOC_IDS, type LegalDoc, type LegalLang } from "./types";

const LANGS: LegalLang[] = ["en", "hi"];

/** Every piece of text in a document, joined. */
function allText(doc: LegalDoc): string {
  return [
    doc.title,
    doc.updated,
    doc.intro ?? "",
    ...doc.sections.flatMap((s) => [s.heading, ...s.body]),
  ].join("\n");
}

describe.each(LEGAL_DOC_IDS)("%s", (id) => {
  it.each(LANGS)("%s is complete", (lang) => {
    const doc = LEGAL[id][lang];
    expect(doc.title.trim()).not.toBe("");
    expect(doc.updated.trim()).not.toBe("");
    expect(doc.sections.length).toBeGreaterThanOrEqual(3);
    for (const section of doc.sections) {
      expect(section.heading.trim()).not.toBe("");
      expect(section.body.some((p) => p.trim() !== "")).toBe(true);
    }
  });

  it.each(LANGS)("%s has no placeholders", (lang) => {
    const doc = LEGAL[id][lang];
    const paragraphs = [doc.intro ?? "", ...doc.sections.flatMap((s) => s.body)];
    for (const p of paragraphs) {
      for (const bad of ["[", "TBD", "…", "₹X"]) {
        expect(p).not.toContain(bad);
      }
    }
  });

  it("has the same number of sections in English and Hindi", () => {
    expect(LEGAL[id].hi.sections.length).toBe(LEGAL[id].en.sections.length);
  });
});

describe.each(["terms", "privacy"] as const)("%s names the seller", (id) => {
  it.each(LANGS)("%s", (lang) => {
    const text = allText(LEGAL[id][lang]);
    expect(text).toContain(SELLER_NAME);
    expect(text).toContain(SELLER_PHONE);
    expect(text).toContain(GRIEVANCE_OFFICER);
  });
});

describe("refund", () => {
  it.each(LANGS)("%s states the 48-hour and 3-working-day windows", (lang) => {
    const text = allText(LEGAL.refund[lang]);
    expect(text).toContain("48");
    expect(text).toContain("3");
  });
});
