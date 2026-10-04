/**
 * The public Terms, Privacy and Refund pages, in English or Hindi.
 *
 * @remarks
 * One component, mounted three times in `router.tsx`: `/terms`, `/privacy`
 * and `/refund`. Like `/delete-account`, these routes are declared outside
 * every layout guard, so they need no sign-in. `/privacy` is the public URL
 * the Google Play Console requires for the mobile app's listing.
 *
 * The page holds no prose of its own. It renders `LEGAL[doc][lang]` from
 * `lib/legal/content.ts`, which is identical word for word to the mobile
 * app's copy, so the website and the app can never disagree. Change the text
 * there, not here.
 *
 * The language defaults to English. `?lang=hi` opens the Hindi version, and
 * the switch at the top rewrites that query in place (no new history entry),
 * so whatever the reader is looking at can be shared as a link.
 *
 * It is still served through the SPA: `client/vercel.json` rewrites unmatched
 * paths to `/app.html`, so React boots before the text renders.
 *
 * @packageDocumentation
 */
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LEGAL } from "@/lib/legal/content";
import {
  LEGAL_DOC_IDS,
  type LegalDocId,
  type LegalLang,
} from "@/lib/legal/types";

/** Where each document lives on the site. */
const DOC_PATH: Record<LegalDocId, string> = {
  terms: "/terms",
  privacy: "/privacy",
  refund: "/refund",
};

/** Footer link text for the delete-account page, per language. */
const DELETE_ACCOUNT_LABEL: Record<LegalLang, string> = {
  en: "Delete your account",
  hi: "अपना खाता हटाएँ",
};

/** The prefix that marks a body paragraph as a bullet. */
const BULLET = "• ";

/**
 * Reads the language from the `lang` query parameter.
 *
 * @remarks
 * Only `hi` selects Hindi; anything else, including a missing or misspelt
 * value, falls back to English rather than showing an empty page.
 */
function langFrom(params: URLSearchParams): LegalLang {
  return params.get("lang") === "hi" ? "hi" : "en";
}

/**
 * Renders a section body, turning runs of "• " paragraphs into one list.
 *
 * @remarks
 * Consecutive bullet paragraphs are grouped into a single `<ul>` so that a
 * screen reader announces one list of n items, not n lists of one.
 *
 * @param body - The section's paragraphs, as written in `content.ts`.
 */
function Body({ body }: { body: string[] }) {
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];

  const flush = () => {
    if (bullets.length === 0) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc space-y-1 pl-5">
        {bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  body.forEach((para) => {
    if (para.startsWith(BULLET)) {
      bullets.push(para.slice(BULLET.length));
    } else {
      flush();
      blocks.push(<p key={`p-${blocks.length}`}>{para}</p>);
    }
  });
  flush();

  return <>{blocks}</>;
}

/**
 * Renders one policy document with a language switch and links to the rest.
 *
 * @remarks
 * While mounted it sets `<html lang>` to the chosen language and
 * `document.title` to the document's title, and puts both back on unmount,
 * so the admin pages that share this SPA are left as they were.
 *
 * @param doc - Which document to show.
 */
export default function LegalPage({ doc }: { doc: LegalDocId }) {
  const [params, setParams] = useSearchParams();
  const lang = langFrom(params);
  const content = LEGAL[doc][lang];

  useEffect(() => {
    const prevLang = document.documentElement.lang;
    const prevTitle = document.title;
    document.documentElement.lang = lang;
    document.title = `${content.title} · sKirana`;
    return () => {
      document.documentElement.lang = prevLang;
      document.title = prevTitle;
    };
  }, [lang, content.title]);

  const switchTo = (next: LegalLang) => {
    const updated = new URLSearchParams(params);
    if (next === "en") updated.delete("lang");
    else updated.set("lang", next);
    setParams(updated, { replace: true });
  };

  // Links to the other documents keep the reader's language.
  const withLang = (path: string) => (lang === "hi" ? `${path}?lang=hi` : path);

  const langButton = (value: LegalLang, label: string) => (
    <button
      type="button"
      onClick={() => switchTo(value)}
      aria-pressed={lang === value}
      lang={value}
      className={
        lang === value
          ? "font-semibold text-neutral-900"
          : "text-neutral-500 underline hover:text-neutral-800"
      }
    >
      {label}
    </button>
  );

  return (
    <main className="mx-auto max-w-2xl px-5 py-10 text-neutral-800">
      <div className="mb-6 flex justify-end gap-2 text-sm">
        {langButton("en", "English")}
        <span className="text-neutral-300" aria-hidden="true">
          |
        </span>
        {langButton("hi", "हिंदी")}
      </div>

      <h1 className="text-2xl font-bold text-neutral-900">{content.title}</h1>
      {content.updated && (
        <p className="mt-1 text-xs text-neutral-500">
          sKirana · {content.updated}
        </p>
      )}

      {content.intro && (
        <p className="mt-4 text-sm leading-6 text-neutral-600">
          {content.intro}
        </p>
      )}

      {content.sections.map((section, i) => (
        <section key={i} className="mt-6">
          {section.heading && (
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              {section.heading}
            </h2>
          )}
          <div className="space-y-2 text-sm leading-6 text-neutral-600">
            <Body body={section.body} />
          </div>
        </section>
      ))}

      <nav className="mt-10 flex flex-wrap gap-x-4 gap-y-1 border-t border-neutral-200 pt-4 text-sm">
        {LEGAL_DOC_IDS.filter((id) => id !== doc).map((id) => (
          <Link
            key={id}
            to={withLang(DOC_PATH[id])}
            className="text-neutral-600 underline hover:text-neutral-900"
          >
            {LEGAL[id][lang].title}
          </Link>
        ))}
        <Link
          to="/delete-account"
          className="text-neutral-600 underline hover:text-neutral-900"
        >
          {DELETE_ACCOUNT_LABEL[lang]}
        </Link>
      </nav>

      <p className="mt-6 text-xs text-neutral-400">
        © sKirana. All rights reserved.
      </p>
    </main>
  );
}
