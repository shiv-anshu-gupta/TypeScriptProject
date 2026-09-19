#!/usr/bin/env node
/**
 * build-reference.mjs — turn TypeDoc JSON into a Doxygen-style Markdown reference.
 *
 * Input  : docs/.typedoc/{server,mobile,admin}.json   (TypeDoc 0.28 `--json` output)
 * Output : docs/reference/index.md
 *          docs/reference/all-{files,functions,types,components}.md
 *          docs/reference/<group-slug>/index.md
 *          docs/reference/<group-slug>/<file-slug>.md      (one page per source file)
 *
 * Run it:
 *
 *   node docs/tools/build-reference.mjs
 *
 * There is no package.json at the repo root, so there is no `npm run
 * docs:reference` to type. Run the command above from the repo root. To rebuild
 * the TypeDoc JSON it reads first:
 *
 *   cd server && npx typedoc --json ../docs/.typedoc/server.json
 *   cd mobile && npx typedoc --json ../docs/.typedoc/mobile.json
 *   cd client && npx typedoc --json ../docs/.typedoc/admin.json
 *
 * Node's standard library only — no dependencies.
 *
 * Every word of prose on the generated pages comes from the TSDoc in the
 * source. Nothing is invented: a symbol with no comment gets an em dash and is
 * counted in the group's "described" statistic. The only sentences written here
 * are the structural ones (what a group is, how the pages are generated), which
 * live in GROUPS and in writeRootIndex() below.
 *
 * The output is deterministic: every list is sorted by name, never by the order
 * keys happen to sit in the JSON, so a rebuild with unchanged input produces
 * byte-identical files.
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..");
const TYPEDOC_DIR = join(REPO, "docs", ".typedoc");
const OUT_DIR = join(REPO, "docs", "reference");
const GITHUB = "https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main";
const GENERATOR_PATH = "docs/tools/build-reference.mjs";

/* ------------------------------------------------------------------ *
 * TypeDoc reflection kinds (ReflectionKind bit flags)
 * ------------------------------------------------------------------ */
const K = {
  Project: 1,
  Module: 2,
  Namespace: 4,
  Enum: 8,
  EnumMember: 16,
  Variable: 32,
  Function: 64,
  Class: 128,
  Interface: 256,
  Constructor: 512,
  Property: 1024,
  Method: 2048,
  CallSignature: 4096,
  IndexSignature: 8192,
  ConstructorSignature: 16384,
  Parameter: 32768,
  TypeLiteral: 65536,
  TypeParameter: 131072,
  Accessor: 262144,
  GetSignature: 524288,
  SetSignature: 1048576,
  TypeAlias: 2097152,
  Reference: 4194304,
};

/* ------------------------------------------------------------------ *
 * Projects and groups
 *
 * `dir` is the folder the project lives in, which is also the first segment
 * of the path used for the GitHub "View source" links. Note that the admin
 * panel's TypeDoc file is admin.json but its folder is client/.
 * ------------------------------------------------------------------ */
const PROJECTS = [
  { key: "server", json: "server.json", dir: "server", label: "Server" },
  { key: "mobile", json: "mobile.json", dir: "mobile", label: "Mobile app" },
  { key: "admin", json: "admin.json", dir: "client", label: "Admin panel" },
];

/**
 * Groups, in the order they appear on the index. The first group whose
 * `project` matches and whose `match()` returns true wins, so the catch-all
 * for each project must come last within that project.
 */
const GROUPS = [
  {
    slug: "server-models",
    project: "server",
    title: "Server — models",
    short: "Models",
    folder: "server/src/models/",
    purpose:
      "The Mongoose schemas and the TypeScript shape of every document the app stores in MongoDB.",
    match: (p) => p.startsWith("src/models/"),
  },
  {
    slug: "server-routes-admin",
    project: "server",
    title: "Server — routes: admin",
    short: "Routes: admin",
    folder: "server/src/routes/admin/",
    purpose:
      "The Express routers behind the admin panel: everything the shop side of the app can call.",
    match: (p) => p.startsWith("src/routes/admin/"),
  },
  {
    slug: "server-routes-customer",
    project: "server",
    title: "Server — routes: customer",
    short: "Routes: customer",
    folder: "server/src/routes/",
    purpose:
      "The Express routers the mobile app calls, plus the auth routes that sit in front of them.",
    match: (p) => p.startsWith("src/routes/"),
  },
  {
    slug: "server-services",
    project: "server",
    title: "Server — services",
    short: "Services",
    folder: "server/src/services/",
    purpose:
      "Work that is neither a route nor a model: talking to a third party and turning the answer into our own shapes.",
    match: (p) => p.startsWith("src/services/"),
  },
  {
    slug: "server-support",
    project: "server",
    title: "Server — utilities and middleware",
    short: "Utilities and middleware",
    folder: "server/src/",
    purpose:
      "The pieces every route leans on: the error type, the response envelope, the middleware chain, the database connection and the small helpers.",
    match: () => true,
  },

  {
    slug: "mobile-screens",
    project: "mobile",
    title: "Mobile app — screens",
    short: "Screens",
    folder: "mobile/src/screens/",
    purpose: "One page per screen the customer can be looking at.",
    match: (p) => p.startsWith("src/screens/"),
  },
  {
    slug: "mobile-components",
    project: "mobile",
    title: "Mobile app — components",
    short: "Components",
    folder: "mobile/src/components/",
    purpose:
      "The React Native components the screens are built from, from the button primitive up to the whole grocery-list sheet.",
    match: (p) => p.startsWith("src/components/"),
  },
  {
    slug: "mobile-features",
    project: "mobile",
    title: "Mobile app — features and state",
    short: "Features and state",
    folder: "mobile/src/features/",
    purpose:
      "Per-feature API calls, Zustand stores and hooks — where the app's client-side state actually lives.",
    match: (p) => p.startsWith("src/features/"),
  },
  {
    slug: "mobile-lib",
    project: "mobile",
    title: "Mobile app — library",
    short: "Library",
    folder: "mobile/src/lib/",
    purpose:
      "Cross-cutting helpers: the HTTP client, translations, push registration, toasts, formatting and the shared types.",
    match: (p) => p.startsWith("src/lib/"),
  },
  {
    slug: "mobile-navigation",
    project: "mobile",
    title: "Mobile app — navigation",
    short: "Navigation",
    folder: "mobile/src/navigation/",
    purpose:
      "The navigators, the route parameter types, and the App entry point that mounts them.",
    match: () => true,
  },

  {
    slug: "admin-pages",
    project: "admin",
    title: "Admin panel — pages",
    short: "Pages",
    folder: "client/src/pages/",
    purpose:
      "One page per route of the admin panel, plus the app shell and the router that chooses between them.",
    match: (p) =>
      p.startsWith("src/pages/") ||
      p === "src/App.tsx" ||
      p === "src/main.tsx" ||
      p === "src/router.tsx",
  },
  {
    slug: "admin-components",
    project: "admin",
    title: "Admin panel — components",
    short: "Components",
    folder: "client/src/components/",
    purpose:
      "The React components the admin pages are assembled from: dialogs, tables, toolbars, the sidebar and the auth layouts.",
    match: (p) => p.startsWith("src/components/"),
  },
  {
    slug: "admin-features",
    project: "admin",
    title: "Admin panel — features and hooks",
    short: "Features and hooks",
    folder: "client/src/features/",
    purpose:
      "Per-feature API calls, stores, request/response types and the hooks the pages call instead of fetching directly.",
    match: (p) => p.startsWith("src/features/"),
  },
  {
    slug: "admin-lib",
    project: "admin",
    title: "Admin panel — library",
    short: "Library",
    folder: "client/src/lib/",
    purpose:
      "Cross-cutting helpers: the HTTP client, Firebase messaging, image compression, translation and the shared types.",
    match: () => true,
  },
];

/* ------------------------------------------------------------------ *
 * Small utilities
 * ------------------------------------------------------------------ */

/** Case-insensitive, then case-sensitive — stable and locale-independent. */
function byName(a, b) {
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  if (la < lb) return -1;
  if (la > lb) return 1;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function slugify(text) {
  return String(text)
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** `src/components/ui/Badge.tsx` -> `components-ui-badge`. */
function fileSlug(packagePath) {
  return slugify(
    packagePath
      .replace(/^src\//, "")
      .replace(/\.d\.ts$/, "")
      .replace(/\.[cm]?[jt]sx?$/, ""),
  );
}

function baseName(packagePath) {
  const last = packagePath.split("/").pop() || packagePath;
  return last.replace(/\.d\.ts$/, "").replace(/\.[cm]?[jt]sx?$/, "");
}

function humanise(text) {
  const words = String(text)
    .replace(/[._-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function pascal(text) {
  return String(text)
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

/** Make a string safe to put in a Markdown table cell. */
function cell(text) {
  if (text === undefined || text === null || text === "") return "—";
  return String(text)
    .replace(/```[\s\S]*?```/g, "…")
    .replace(/\r?\n/g, " ")
    .replace(/\|/g, "\\|")
    .replace(/\s+/g, " ")
    .trim() || "—";
}

/** Indent a block so it sits inside a MkDocs admonition. */
function indent(text, pad = "    ") {
  return text
    .split("\n")
    .map((line) => (line.length ? pad + line : ""))
    .join("\n");
}

const ABBREVIATIONS = ["e.g.", "i.e.", "etc.", "vs.", "cf.", "approx.", "Dr.", "Mr.", "Ms."];

/** First sentence of a rendered comment, for the "Brief" columns. */
function firstSentence(markdown) {
  if (!markdown) return "";
  let text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== ".") continue;
    const head = text.slice(0, i + 1);
    if (ABBREVIATIONS.some((a) => head.endsWith(a))) continue;
    // A period inside `code` is not a sentence end.
    const ticks = (head.match(/`/g) || []).length;
    if (ticks % 2 === 1) continue;
    const next = text[i + 1];
    if (next === undefined) return head;
    if (/\s/.test(next)) return head;
  }
  return text;
}

function ensureUnique(taken, candidate) {
  let value = candidate || "x";
  let n = 2;
  while (taken.has(value)) {
    value = `${candidate}-${n}`;
    n += 1;
  }
  taken.add(value);
  return value;
}

function plural(n, one, many) {
  return n === 1 ? `${n} ${one}` : `${n} ${many}`;
}

/* ------------------------------------------------------------------ *
 * Reading the source, for the few things TypeDoc drops
 *
 * TypeDoc keeps a `@param` tag only when it can match it to a declared
 * parameter. A React component written as `function Badge({ a, b }: Props)`
 * therefore loses every `@param` after the first, and the props type itself is
 * usually local to the file so it never reaches the JSON at all. Both are real
 * TSDoc sitting in the source, so they are read back from the file rather than
 * left out. Nothing here invents text: it only relocates comments that are
 * already written.
 * ------------------------------------------------------------------ */

const sourceCache = new Map();

function readSource(relPath) {
  if (sourceCache.has(relPath)) return sourceCache.get(relPath);
  const full = join(REPO, relPath);
  let text = null;
  try {
    text = readFileSync(full, "utf8").replace(/\r\n/g, "\n");
  } catch {
    text = null;
  }
  sourceCache.set(relPath, text);
  return text;
}

/** Strip the leading ` * ` of a block comment body. */
function stripStars(block) {
  return block
    .replace(/^\/\*\*/, "")
    .replace(/\*\/$/, "")
    .split("\n")
    .map((line) => line.replace(/^\s*\*ic?\s?/, "").replace(/^\s*\*\s?/, ""))
    .join("\n")
    .trim();
}

/** The doc comment that sits immediately above 1-based `line`, or null. */
function docCommentAbove(src, line) {
  if (!src || !line) return null;
  const lines = src.split("\n");
  let i = Math.min(line - 2, lines.length - 1); // 0-based index of the line above
  while (i >= 0 && lines[i].trim() === "") i -= 1;
  // Skip decorators and `export` prefixes that sit on their own line.
  while (i >= 0 && /^\s*@[A-Za-z]/.test(lines[i])) i -= 1;
  if (i < 0 || !lines[i].trim().endsWith("*/")) return null;
  const end = i;
  while (i >= 0 && !lines[i].trim().startsWith("/**")) {
    if (lines[i].trim().startsWith("/*") && !lines[i].trim().startsWith("/**")) return null;
    i -= 1;
  }
  if (i < 0) return null;
  return stripStars(lines.slice(i, end + 1).join("\n"));
}

/** `@param name - text` pairs from a doc comment body. */
function paramDocsFrom(body) {
  const out = new Map();
  if (!body) return out;
  const lines = body.split("\n");
  let current = null;
  for (const line of lines) {
    const m = /^\s*@param\s+([A-Za-z_$][\w$]*)\s*(?:-\s*)?(.*)$/.exec(line);
    if (m) {
      current = m[1];
      out.set(current, m[2].trim());
      continue;
    }
    if (/^\s*@[a-zA-Z]/.test(line)) {
      current = null;
      continue;
    }
    if (current) {
      const extra = line.trim();
      out.set(current, `${out.get(current)}${extra ? ` ${extra}` : ""}`.trim());
    }
  }
  return out;
}

/** The `@param` docs written above the declaration on `line` of `relPath`. */
function sourceParamDocs(relPath, line) {
  return paramDocsFrom(docCommentAbove(readSource(relPath), line));
}

/**
 * Pull the members out of `type X = { … }` / `interface X { … }` in a source
 * file, with each member's own doc comment. Returns null when the declaration
 * cannot be found or parsed, so callers fall back to whatever TypeDoc has.
 */
function membersFromSource(relPath, typeName) {
  const src = readSource(relPath);
  if (!src) return null;
  const re = new RegExp(
    `(?:^|\\n)\\s*(?:export\\s+)?(?:type\\s+${typeName}\\s*=\\s*\\{|interface\\s+${typeName}\\b[^{]*\\{)`,
  );
  const m = re.exec(src);
  if (!m) return null;
  const open = src.indexOf("{", m.index + m[0].length - 1);
  if (open < 0) return null;

  // Walk to the matching close brace, ignoring braces in strings and comments.
  let depth = 0;
  let close = -1;
  for (let i = open; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      i += 1;
      while (i < src.length && src[i] !== quote) {
        if (src[i] === "\\") i += 1;
        i += 1;
      }
      continue;
    }
    if (ch === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") i += 1;
      continue;
    }
    if (ch === "/" && src[i + 1] === "*") {
      i = src.indexOf("*/", i + 2);
      if (i < 0) return null;
      i += 1;
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        close = i;
        break;
      }
    }
  }
  if (close < 0) return null;

  const body = src.slice(open + 1, close);
  const members = [];
  let buffer = "";
  let doc = null;
  let depth2 = 0;

  const flush = () => {
    const text = buffer.trim().replace(/,$/, "");
    buffer = "";
    if (!text) {
      doc = null;
      return;
    }
    const mm = /^(?:readonly\s+)?(\[[^\]]+\]|"[^"]+"|'[^']+'|[A-Za-z_$][\w$]*)(\?)?\s*:\s*([\s\S]+)$/.exec(
      text,
    );
    if (mm) {
      members.push({
        name: mm[1],
        optional: Boolean(mm[2]),
        type: mm[3].replace(/\s+/g, " ").trim(),
        doc: doc ? doc.split(/\n\s*@/)[0].replace(/\s+/g, " ").trim() : "",
      });
    }
    doc = null;
  };

  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (ch === "/" && body[i + 1] === "*") {
      const end = body.indexOf("*/", i + 2);
      if (end < 0) break;
      const block = body.slice(i, end + 2);
      if (block.startsWith("/**") && buffer.trim() === "") doc = stripStars(block);
      i = end + 1;
      continue;
    }
    if (ch === "/" && body[i + 1] === "/") {
      const end = body.indexOf("\n", i);
      i = end < 0 ? body.length : end;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      let text = ch;
      i += 1;
      while (i < body.length && body[i] !== quote) {
        if (body[i] === "\\") {
          text += body[i];
          i += 1;
        }
        text += body[i];
        i += 1;
      }
      buffer += `${text}${quote}`;
      continue;
    }
    if (ch === "{" || ch === "(" || ch === "[" || ch === "<") depth2 += 1;
    if (ch === "}" || ch === ")" || ch === "]" || ch === ">") depth2 -= 1;
    if ((ch === ";" || ch === ",") && depth2 <= 0) {
      flush();
      continue;
    }
    buffer += ch;
  }
  flush();
  return members.length ? members : null;
}

/** The real name behind `export default …`, or null. */
function defaultExportName(relPath) {
  const src = readSource(relPath);
  if (!src) return null;
  const patterns = [
    /export\s+default\s+function\s+([A-Za-z_$][\w$]*)/,
    /export\s+default\s+(?:React\.)?memo\(\s*([A-Za-z_$][\w$]*)/,
    /export\s+default\s+([A-Za-z_$][\w$]*)\s*;/,
  ];
  for (const re of patterns) {
    const m = re.exec(src);
    if (m) return m[1];
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * Rendering TypeScript types
 * ------------------------------------------------------------------ */

function needsParens(type) {
  return type && (type.type === "union" || type.type === "intersection" || type.type === "conditional");
}

function typeString(type, depth = 0, maxDepth = 3) {
  if (!type) return "unknown";
  switch (type.type) {
    case "intrinsic":
      return type.name;
    case "literal":
      if (type.value === null) return "null";
      if (typeof type.value === "object" && type.value && "value" in type.value) {
        return `${type.value.negative ? "-" : ""}${type.value.value}n`;
      }
      return JSON.stringify(type.value);
    case "reference": {
      const name = type.name || "unknown";
      const args = type.typeArguments || [];
      if (!args.length) return name;
      if (depth >= maxDepth) return `${name}<…>`;
      return `${name}<${args.map((a) => typeString(a, depth + 1, maxDepth)).join(", ")}>`;
    }
    case "array": {
      const inner = typeString(type.elementType, depth + 1, maxDepth);
      return needsParens(type.elementType) ? `(${inner})[]` : `${inner}[]`;
    }
    case "union": {
      const parts = (type.types || []).map((t) => typeString(t, depth + 1, maxDepth));
      if (parts.length > 8 && depth > 0) return `${parts.slice(0, 8).join(" | ")} | …`;
      return parts.join(" | ");
    }
    case "intersection":
      return (type.types || []).map((t) => typeString(t, depth + 1, maxDepth)).join(" & ");
    case "tuple":
      return `[${(type.elements || []).map((t) => typeString(t, depth + 1, maxDepth)).join(", ")}]`;
    case "namedTupleMember":
      return `${type.name}${type.isOptional ? "?" : ""}: ${typeString(type.element, depth + 1, maxDepth)}`;
    case "optional":
      return `${typeString(type.elementType, depth + 1, maxDepth)}?`;
    case "rest":
      return `...${typeString(type.elementType, depth + 1, maxDepth)}`;
    case "typeOperator":
      return `${type.operator} ${typeString(type.target, depth + 1, maxDepth)}`;
    case "query":
      return `typeof ${typeString(type.queryType, depth + 1, maxDepth)}`;
    case "indexedAccess":
      return `${typeString(type.objectType, depth + 1, maxDepth)}[${typeString(type.indexType, depth + 1, maxDepth)}]`;
    case "predicate":
      return type.targetType
        ? `${type.asserts ? "asserts " : ""}${type.name} is ${typeString(type.targetType, depth + 1, maxDepth)}`
        : `asserts ${type.name}`;
    case "templateLiteral":
      return "`…`";
    case "conditional":
      return `${typeString(type.checkType, depth + 1, maxDepth)} extends ${typeString(type.extendsType, depth + 1, maxDepth)} ? … : …`;
    case "mapped":
      return "{ [K in …]: … }";
    case "inferred":
      return `infer ${type.name}`;
    case "unknown":
      return type.name || "unknown";
    case "reflection":
      return reflectionTypeString(type.declaration, depth, maxDepth);
    default:
      return type.name || "unknown";
  }
}

function reflectionTypeString(decl, depth, maxDepth) {
  if (!decl) return "object";
  if (decl.signatures && decl.signatures.length) {
    const sig = decl.signatures[0];
    const params = (sig.parameters || [])
      .map((p) => `${p.flags?.isRest ? "..." : ""}${p.name}${p.flags?.isOptional ? "?" : ""}: ${typeString(p.type, depth + 1, maxDepth)}`)
      .join(", ");
    return `(${params}) => ${typeString(sig.type, depth + 1, maxDepth)}`;
  }
  if (decl.indexSignatures && decl.indexSignatures.length) {
    const is = decl.indexSignatures[0];
    const key = is.parameters?.[0];
    return `{ [${key ? key.name : "key"}: ${typeString(key?.type, depth + 1, maxDepth)}]: ${typeString(is.type, depth + 1, maxDepth)} }`;
  }
  if (decl.children && decl.children.length) {
    if (depth >= maxDepth - 1) return "{ … }";
    const fields = decl.children
      .map((c) => `${c.name}${c.flags?.isOptional ? "?" : ""}: ${typeString(propertyType(c), depth + 1, maxDepth)}`)
      .join("; ");
    return `{ ${fields} }`;
  }
  return "object";
}

/** A property reflection can be a plain type, or an accessor with a getter. */
function propertyType(decl) {
  if (!decl) return undefined;
  if (decl.type) return decl.type;
  if (decl.getSignature) return decl.getSignature.type;
  if (decl.signatures && decl.signatures.length) {
    return { type: "reflection", declaration: decl };
  }
  return undefined;
}

/** TypeDoc's name for a destructured parameter, made readable. */
function paramDisplayName(name, kindKey) {
  if (name === "__namedParameters" || name === "__object") {
    return kindKey === "component" ? "props" : "options";
  }
  return name;
}

function typeParamsString(list) {
  if (!list || !list.length) return "";
  return `<${list
    .map((tp) => {
      let text = tp.name;
      if (tp.type) text += ` extends ${typeString(tp.type)}`;
      if (tp.default) text += ` = ${typeString(tp.default)}`;
      return text;
    })
    .join(", ")}>`;
}

/* ------------------------------------------------------------------ *
 * Rendering TSDoc comments
 * ------------------------------------------------------------------ */

/**
 * `ctx` carries what is needed to turn an `{@link}` into a real link:
 * the id index for the project and the group slug the current page sits in.
 */
function renderParts(parts, ctx) {
  if (!parts || !parts.length) return "";
  let out = "";
  for (const part of parts) {
    if (part.kind === "text" || part.kind === "code") {
      out += part.text;
    } else if (part.kind === "inline-tag") {
      out += renderInlineTag(part, ctx);
    } else if (part.kind === "relative-link") {
      out += part.text || "";
    } else if (typeof part.text === "string") {
      out += part.text;
    }
  }
  return out.trim();
}

function renderInlineTag(part, ctx) {
  const label = (part.text || "").trim() || "link";
  if (part.tag === "@label" || part.tag === "@inheritDoc") return "";
  const target = part.target;
  if (ctx && typeof target === "number") {
    const hit = ctx.index.get(`${ctx.project}:${target}`);
    if (hit) {
      const samePage = ctx.slug === hit.slug && ctx.file === hit.file;
      if (samePage && !hit.anchor) return `\`${label}\``;
      const href = samePage ? `#${hit.anchor}` : linkTo(ctx.slug, hit);
      return `[\`${label}\`](${href})`;
    }
  }
  return `\`${label}\``;
}

function blockTags(comment, tag) {
  if (!comment || !comment.blockTags) return [];
  return comment.blockTags.filter((t) => t.tag === tag);
}

function summaryOf(comment, ctx) {
  return renderParts(comment?.summary, ctx);
}

/* ------------------------------------------------------------------ *
 * Links
 * ------------------------------------------------------------------ */

/**
 * @param fromSlug group slug of the page being written, or null for a page
 *   that sits directly in docs/reference/.
 * @param target `{ slug, file, anchor }`
 */
function linkTo(fromSlug, target) {
  if (!target) return "index.md";
  const path =
    fromSlug === null
      ? `${target.slug}/${target.file}.md`
      : fromSlug === target.slug
        ? `${target.file}.md`
        : `../${target.slug}/${target.file}.md`;
  return target.anchor ? `${path}#${target.anchor}` : path;
}

function groupLink(fromSlug, slug) {
  if (fromSlug === null) return `${slug}/index.md`;
  return fromSlug === slug ? "index.md" : `../${slug}/index.md`;
}

function rootLink(fromSlug, file) {
  return fromSlug === null ? file : `../${file}`;
}

function viewSource(path) {
  return `\n---\n\n[View source on GitHub](${GITHUB}/${path})\n`;
}

/* ------------------------------------------------------------------ *
 * Building the model
 * ------------------------------------------------------------------ */

const COMPONENT_TYPES = new Set([
  "MemoExoticComponent",
  "ForwardRefExoticComponent",
  "NamedExoticComponent",
  "ExoticComponent",
  "FunctionComponent",
  "ComponentType",
  "FC",
]);

function isElementType(type) {
  if (!type) return false;
  if (type.type === "union") return (type.types || []).some(isElementType);
  if (type.type !== "reference") return false;
  const q = type.qualifiedName || type.target?.qualifiedName || "";
  if (q.includes("JSX.Element")) return true;
  return ["Element", "ReactElement", "ReactNode"].includes(type.name) && type.package === "@types/react";
}

function unwrapComponentVariable(decl) {
  const t = decl.type;
  if (t?.type === "reference" && COMPONENT_TYPES.has(t.name)) {
    const arg = (t.typeArguments || [])[0];
    if (arg?.type === "reflection" && arg.declaration?.signatures?.length) {
      return arg.declaration.signatures;
    }
    return [];
  }
  return null;
}

function classifySymbol(decl, isTsx) {
  const name = decl.name;
  const signatures = decl.signatures || [];
  const wrapped = decl.kind === K.Variable ? unwrapComponentVariable(decl) : null;

  if (decl.kind === K.Reference) return "re-export";
  if (decl.kind === K.Class) return "class";
  if (decl.kind === K.Interface) return "interface";
  if (decl.kind === K.TypeAlias) return "type";
  if (decl.kind === K.Enum) return "enum";

  if (wrapped) return "component";

  if (decl.kind === K.Function) {
    if (/^use[A-Z]/.test(name)) return "hook";
    if (signatures.some((s) => isElementType(s.type))) return "component";
    if (isTsx && (/^[A-Z]/.test(name) || name === "default")) return "component";
    return "function";
  }

  if (decl.kind === K.Variable) {
    if (/^use[A-Z]/.test(name)) return "hook";
    if (decl.type?.type === "reflection" && decl.type.declaration?.signatures?.length) return "function";
    return decl.flags?.isConst ? "constant" : "variable";
  }

  return "value";
}

const KIND_LABEL = {
  component: "React component",
  hook: "Hook",
  function: "Function",
  class: "Class",
  interface: "Interface",
  type: "Type",
  enum: "Enum",
  constant: "Constant",
  variable: "Variable",
  "re-export": "Re-export",
  value: "Value",
};

const KIND_ORDER = {
  component: 0,
  hook: 1,
  function: 2,
  class: 3,
  interface: 4,
  type: 5,
  enum: 6,
  constant: 7,
  variable: 8,
  "re-export": 9,
  value: 10,
};

function groupFor(projectKey, packagePath) {
  return GROUPS.find((g) => g.project === projectKey && g.match(packagePath));
}

function moduleSourcePath(project, mod) {
  const src = (mod.sources || [])[0];
  const packagePath = src?.fileName || `${mod.name}.ts`;
  return { packagePath, line: src?.line || 1, repoPath: `${project.dir}/${packagePath}` };
}

const GENERIC_BASENAMES = new Set([
  "index",
  "types",
  "api",
  "store",
  "constants",
  "utils",
  "helpers",
  "shared",
  "routes",
]);

/** Folder names that are buckets rather than subjects. */
const CONTAINER_DIRS = new Set(["src", "lib", "utils", "helpers", "components", "features", "pages", "screens"]);

function fileTitle(packagePath, symbols) {
  const base = baseName(packagePath);
  const exported = symbols.filter((s) => s.kindKey !== "re-export");
  const match = exported.find(
    (s) => slugify(s.displayName) === slugify(base) || s.displayName === base,
  );
  if (match) return match.displayName;
  if (exported.length === 1) return exported[0].displayName;
  const bare = base.replace(/\.(routes|shared|d)$/, "");
  if (GENERIC_BASENAMES.has(bare.toLowerCase())) {
    const parent = packagePath.split("/").slice(-2, -1)[0];
    // A parent that is itself a bucket name says nothing, so leave it off.
    if (parent && !CONTAINER_DIRS.has(parent)) return humanise(`${parent} ${bare}`);
  }
  return humanise(base);
}

/** `node_modules/@types/react/index.d.ts` -> `@types/react`. */
function packageOf(fileName) {
  const parts = fileName.split("/");
  const at = parts.indexOf("node_modules");
  if (at < 0) return null;
  const first = parts[at + 1];
  if (!first) return null;
  return first.startsWith("@") ? `${first}/${parts[at + 2] || ""}` : first;
}

function collectSignatures(decl) {
  const wrapped = decl.kind === K.Variable ? unwrapComponentVariable(decl) : null;
  if (wrapped && wrapped.length) return wrapped;
  if (decl.signatures && decl.signatures.length) return decl.signatures;
  if (decl.type?.type === "reflection" && decl.type.declaration?.signatures?.length) {
    return decl.type.declaration.signatures;
  }
  return [];
}

function build() {
  const files = [];
  const skipped = [];
  const skippedSymbols = [];
  // "<project key>:<TypeDoc id>" -> { slug, file, anchor }. The key has to
  // carry the project: every TypeDoc run numbers its reflections from 1, so a
  // bare id would make `{@link}` in the mobile app resolve to a server page.
  const indexById = new Map();

  for (const project of PROJECTS) {
    const jsonPath = join(TYPEDOC_DIR, project.json);
    if (!existsSync(jsonPath)) {
      throw new Error(
        `Missing ${jsonPath}. Regenerate it with:\n  cd ${project.dir} && npx typedoc --json ../docs/.typedoc/${project.json}`,
      );
    }
    const projectJson = JSON.parse(readFileSync(jsonPath, "utf8"));
    const byId = new Map();
    (function walk(node) {
      if (!node || typeof node !== "object") return;
      if (typeof node.id === "number") byId.set(node.id, node);
      for (const key of ["children", "signatures", "parameters", "typeParameters", "indexSignatures"]) {
        for (const child of node[key] || []) walk(child);
      }
      for (const key of ["getSignature", "setSignature"]) {
        if (node[key]) walk(node[key]);
      }
    })(projectJson);

    const modules = (projectJson.children || []).filter((c) => c.kind === K.Module);
    const takenSlugs = new Map(); // group slug -> Set of file slugs

    for (const mod of modules) {
      const { packagePath, line, repoPath } = moduleSourcePath(project, mod);
      const group = groupFor(project.key, packagePath);
      const isTsx = /\.tsx$/.test(packagePath);
      const rawChildren = (mod.children || []).filter((c) => !c.flags?.isPrivate);

      if (!rawChildren.length && !mod.comment) {
        skipped.push({ repoPath, why: "no exported symbols and no module comment" });
        continue;
      }

      if (!takenSlugs.has(group.slug)) takenSlugs.set(group.slug, new Set());
      const slugSet = takenSlugs.get(group.slug);
      const slug = ensureUnique(slugSet, fileSlug(packagePath));

      const anchors = new Set();
      const symbols = [];

      for (const decl of rawChildren) {
        // Where the symbol is really declared. TypeScript merges a global
        // augmentation with the declaration it augments, and a re-export
        // carries the source of the package it came from, so "is this ours?"
        // has to be asked of the source list rather than assumed.
        const sources = decl.sources || [];
        const ownSource = sources.find((s) => s.fileName === packagePath);
        const firstSource = sources[0];
        const fromPackage =
          firstSource && /^node_modules\//.test(firstSource.fileName)
            ? packageOf(firstSource.fileName)
            : null;
        const origin = !fromPackage ? "own" : ownSource ? "augmentation" : "re-export";

        // Members this file actually declares, as opposed to everything the
        // merged or inherited declaration ends up carrying.
        const allMembers = (decl.children || []).filter((c) => !c.flags?.isPrivate);
        const ownMembers = allMembers.filter(
          (c) => !c.sources || c.sources.some((s) => s.fileName === packagePath),
        );
        const members = ownMembers.length ? ownMembers : origin === "own" ? allMembers : [];

        if (origin === "augmentation" && !members.length) {
          skippedSymbols.push({
            repoPath,
            name: decl.name,
            why: `declared in ${fromPackage}; this file adds nothing to it`,
          });
          continue;
        }

        const kindKey = origin === "re-export" ? "re-export" : classifySymbol(decl, isTsx);
        let displayName = decl.name;
        if (displayName === "default") {
          displayName = defaultExportName(repoPath) || pascal(baseName(packagePath));
        }
        const anchor = ensureUnique(anchors, `${kindKey}-${slugify(displayName)}`);
        const target = { slug: group.slug, file: slug, anchor };

        // Every id inside this symbol's subtree points at the symbol's anchor,
        // so `{@link}` to a signature or a property still lands somewhere real.
        (function mark(node) {
          if (!node || typeof node !== "object") return;
          const key = `${project.key}:${node.id}`;
          if (typeof node.id === "number" && !indexById.has(key)) indexById.set(key, target);
          for (const key of ["children", "signatures", "parameters", "typeParameters", "indexSignatures"]) {
            for (const child of node[key] || []) mark(child);
          }
          for (const key of ["getSignature", "setSignature"]) {
            if (node[key]) mark(node[key]);
          }
          if (node.type?.type === "reflection") mark(node.type.declaration);
          for (const arg of node.type?.typeArguments || []) {
            if (arg?.type === "reflection") mark(arg.declaration);
          }
        })(decl);

        const anchorSource = ownSource || (origin === "own" ? firstSource : null);
        symbols.push({
          decl,
          name: decl.name,
          displayName,
          kindKey,
          kindLabel: KIND_LABEL[kindKey],
          anchor,
          origin,
          fromPackage,
          members,
          hiddenMembers: allMembers.length - members.length,
          signatures: origin === "re-export" ? [] : collectSignatures(decl),
          sourceUrlPath: anchorSource ? `${repoPath}#L${anchorSource.line}` : repoPath,
          line: anchorSource?.line || 0,
        });
      }

      symbols.sort(
        (a, b) =>
          byName(a.displayName, b.displayName) ||
          KIND_ORDER[a.kindKey] - KIND_ORDER[b.kindKey] ||
          a.decl.id - b.decl.id,
      );

      const file = {
        project,
        group,
        mod,
        byId,
        packagePath,
        repoPath,
        line,
        slug,
        symbols,
        title: fileTitle(packagePath, symbols),
      };
      files.push(file);
      indexById.set(`${project.key}:${mod.id}`, { slug: group.slug, file: slug, anchor: "" });
    }
  }

  files.sort((a, b) => byName(a.packagePath, b.packagePath) || byName(a.project.key, b.project.key));
  return { files, skipped, skippedSymbols, indexById };
}

/* ------------------------------------------------------------------ *
 * Page rendering
 * ------------------------------------------------------------------ */

/**
 * The link index, shared by every page renderer. Filled in by main(); the
 * helpers below build the right context for a given file so that an
 * `{@link}` inside a brief resolves within that file's own project.
 */
let INDEX = new Map();
const ctxFor = (file, slug = null, pageFile = file.slug) => ({
  index: INDEX,
  slug,
  project: file.project.key,
  file: pageFile,
});
const fileBrief = (f, slug = null, pageFile) =>
  firstSentence(summaryOf(f.mod.comment, ctxFor(f, slug, pageFile)));
const symbolSummary = (s, f, slug = null, pageFile) =>
  summaryOf(s.signatures[0]?.comment || s.decl.comment, ctxFor(f, slug, pageFile));
const symbolBrief = (s, f, slug = null, pageFile) =>
  firstSentence(symbolSummary(s, f, slug, pageFile));

/** An object return type is easier to read set out one field per line. */
function returnTypeText(type) {
  const inline = typeString(type, 1, 4);
  if (inline.length <= 80) return inline;
  const decl = type?.type === "reflection" ? type.declaration : null;
  if (!decl || !decl.children?.length || decl.signatures?.length) return inline;
  const fields = decl.children.map(
    (c) => `  ${c.name}${c.flags?.isOptional ? "?" : ""}: ${typeString(propertyType(c), 2, 4)};`,
  );
  return ["{", ...fields, "}"].join("\n");
}

function signatureBlock(symbol, ctx) {
  const { decl, displayName, kindKey, signatures } = symbol;
  const members = symbol.members || [];

  if (kindKey === "re-export") {
    return symbol.fromPackage
      ? `export { ${displayName} }; // declared in ${symbol.fromPackage}`
      : `export { ${displayName} };`;
  }

  if (kindKey === "class") {
    const heritage = [];
    for (const t of decl.extendedTypes || []) heritage.push(`extends ${typeString(t)}`);
    for (const t of decl.implementedTypes || []) heritage.push(`implements ${typeString(t)}`);
    return `class ${displayName}${typeParamsString(decl.typeParameters)}${heritage.length ? ` ${heritage.join(" ")}` : ""}`;
  }

  if (kindKey === "interface" || (kindKey === "type" && members.length)) {
    const keyword = kindKey === "interface" ? "interface" : "type";
    const head =
      keyword === "interface"
        ? `interface ${displayName}${typeParamsString(decl.typeParameters)} {`
        : `type ${displayName}${typeParamsString(decl.typeParameters)} = {`;
    const lines = members.map(
      (c) => `  ${c.name}${c.flags?.isOptional ? "?" : ""}: ${typeString(propertyType(c), 1, 4)};`,
    );
    return [head, ...lines, keyword === "interface" ? "}" : "};"].join("\n");
  }

  if (kindKey === "type") {
    return `type ${displayName}${typeParamsString(decl.typeParameters)} = ${typeString(decl.type, 0, 4)};`;
  }

  if (signatures.length) {
    return signatures
      .map((sig) => {
        const isComponent = kindKey === "component";
        const params = (sig.parameters || [])
          .map((p, i) => {
            const rest = p.flags?.isRest ? "..." : "";
            const opt = p.flags?.isOptional ? "?" : "";
            const def = p.defaultValue && p.defaultValue !== "..." ? ` = ${p.defaultValue}` : "";
            // A component's single destructured parameter reads better as
            // `props`, whatever TypeDoc happened to call it.
            const name =
              isComponent && i === 0 && (sig.parameters || []).length === 1
                ? "props"
                : paramDisplayName(p.name, kindKey);
            return `${rest}${name}${opt}: ${typeString(p.type, 1, 4)}${def}`;
          })
          .join(", ");
        const head = `function ${displayName}${typeParamsString(sig.typeParameters)}`;
        const ret = returnTypeText(sig.type);
        const oneLine = `${head}(${params}): ${ret}`;
        if (oneLine.length <= 100 || !params) return oneLine;
        // Too long to read across: one parameter per line.
        const broken = (sig.parameters || [])
          .map((p, i) => {
            const rest = p.flags?.isRest ? "..." : "";
            const opt = p.flags?.isOptional ? "?" : "";
            const def = p.defaultValue && p.defaultValue !== "..." ? ` = ${p.defaultValue}` : "";
            const name =
              isComponent && i === 0 && (sig.parameters || []).length === 1
                ? "props"
                : paramDisplayName(p.name, kindKey);
            return `  ${rest}${name}${opt}: ${typeString(p.type, 1, 4)}${def},`;
          })
          .join("\n");
        return [`${head}(`, broken, `): ${ret}`].join("\n");
      })
      .join("\n");
  }

  const kw = decl.flags?.isLet ? "let" : "const";
  const typeText = typeString(decl.type, 0, 3);
  return `${kw} ${displayName}: ${typeText}`;
}

/** One-line version for summary tables. */
function shortSignature(symbol) {
  const block = signatureBlock(symbol, { index: new Map(), slug: null, project: "" });
  const lines = block.split("\n");
  if (lines.length === 1) return lines[0].trim();
  // An object type or interface: keep the head and stand the body in for itself.
  const head = lines[0].trim();
  const tail = lines[lines.length - 1].trim();
  return `${head} … ${tail}`;
}

/**
 * The rows of a props / parameters / fields table for one signature.
 * Returns `{ kind: "props" | "params", rows }`.
 */
function parameterRows(symbol, sig, file, ctx) {
  const docs = sourceParamDocs(file.repoPath, sig.sources?.[0]?.line || symbol.line);
  const params = sig.parameters || [];

  const resolveMembers = (type) => {
    if (!type) return null;
    if (type.type === "reflection" && type.declaration?.children?.length) {
      return type.declaration.children.map((c) => ({
        name: c.name,
        optional: Boolean(c.flags?.isOptional),
        type: typeString(propertyType(c), 1, 3),
        doc: summaryOf(c.comment, ctx),
      }));
    }
    if (type.type === "reference") {
      if (typeof type.target === "number") {
        const hit = file.byId.get(type.target);
        if (hit?.children?.length) {
          return hit.children.map((c) => ({
            name: c.name,
            optional: Boolean(c.flags?.isOptional),
            type: typeString(propertyType(c), 1, 3),
            doc: summaryOf(c.comment, ctx),
          }));
        }
      }
      const path = type.target?.packagePath;
      const pkg = type.target?.packageName;
      if (path && pkg) {
        const owner = PROJECTS.find((p) => p.key === pkg || p.dir === pkg);
        if (owner) {
          const fromSource = membersFromSource(`${owner.dir}/${path}`, type.name);
          if (fromSource) return fromSource;
        }
      }
    }
    return null;
  };

  const isComponent = symbol.kindKey === "component";
  if (isComponent && params.length <= 1) {
    const members = params.length ? resolveMembers(params[0].type) : null;
    if (members) {
      return {
        kind: "props",
        typeName: params[0].type?.name || null,
        rows: members
          .slice()
          .sort((a, b) => byName(a.name, b.name))
          .map((m) => ({
            name: `${m.name}${m.optional ? "?" : ""}`,
            type: m.type,
            meaning: docs.get(m.name) || m.doc || "",
          })),
      };
    }
    if (!params.length) return { kind: "props", typeName: null, rows: [] };
  }

  const rows = params.map((p) => ({
    name: `${p.flags?.isRest ? "..." : ""}${paramDisplayName(p.name, symbol.kindKey)}${p.flags?.isOptional || p.defaultValue ? "?" : ""}`,
    type: typeString(p.type, 1, 3),
    meaning: summaryOf(p.comment, ctx) || docs.get(p.name) || "",
    defaultValue: p.defaultValue && p.defaultValue !== "..." ? p.defaultValue : "",
  }));

  // A single destructured options object: show what is inside it too.
  let fields = null;
  if (params.length === 1) {
    const members = resolveMembers(params[0].type);
    if (members) {
      fields = {
        name: paramDisplayName(params[0].name, symbol.kindKey),
        typeName: params[0].type?.name || null,
        rows: members
          .slice()
          .sort((a, b) => byName(a.name, b.name))
          .map((m) => ({
            name: `${m.name}${m.optional ? "?" : ""}`,
            type: m.type,
            meaning: docs.get(m.name) || m.doc || "",
          })),
      };
    }
  }

  return { kind: "params", rows, fields };
}

function memberTables(symbol, ctx) {
  const decl = symbol.decl;
  const out = [];
  const children = symbol.members || [];
  if (!children.length) return out;

  const props = children
    .filter((c) => c.kind === K.Property || c.kind === K.Accessor || c.kind === K.EnumMember)
    .slice()
    .sort((a, b) => byName(a.name, b.name));
  const methods = children
    .filter((c) => c.kind === K.Method || c.kind === K.Constructor)
    .slice()
    .sort((a, b) => byName(a.name, b.name));

  if (props.length) {
    const label = decl.kind === K.Enum ? "Member" : "Property";
    out.push(
      table(
        [label, "Type", "Meaning"],
        props.map((c) => [
          `\`${c.name}${c.flags?.isOptional ? "?" : ""}\``,
          `\`${cell(typeString(propertyType(c), 1, 3))}\``,
          cell(summaryOf(c.comment, ctx)),
        ]),
      ),
    );
  }
  if (methods.length) {
    out.push(
      table(
        ["Method", "Signature", "Brief"],
        methods.map((c) => {
          const sig = (c.signatures || [])[0];
          const params = (sig?.parameters || [])
            .map((p) => `${p.name}${p.flags?.isOptional ? "?" : ""}: ${typeString(p.type, 2, 3)}`)
            .join(", ");
          const name = c.kind === K.Constructor ? "constructor" : c.name;
          return [
            `\`${name}\``,
            `\`${cell(`${name}(${params})${sig ? `: ${typeString(sig.type, 2, 3)}` : ""}`)}\``,
            cell(firstSentence(summaryOf(sig?.comment || c.comment, ctx))),
          ];
        }),
      ),
    );
  }
  return out;
}

function table(headers, rows) {
  if (!rows.length) return "";
  const head = `| ${headers.join(" | ")} |`;
  const rule = `|${headers.map(() => "---").join("|")}|`;
  const body = rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
  return `${head}\n${rule}\n${body}`;
}

function metaTable(rows) {
  return [
    "|  |  |",
    "|---|---|",
    ...rows.filter(Boolean).map(([k, v]) => `| ${k} | ${v} |`),
  ].join("\n");
}

function extraTagBlocks(comment, ctx) {
  const out = [];
  if (!comment?.blockTags) return out;
  const handled = new Set(["@remarks", "@returns", "@throws", "@param", "@typeParam", "@example", "@see", "@deprecated"]);

  for (const tag of blockTags(comment, "@deprecated")) {
    const text = renderParts(tag.content, ctx);
    out.push(`!!! warning "Deprecated"\n\n${indent(text || "No replacement given.")}`);
  }
  const sees = blockTags(comment, "@see");
  if (sees.length) {
    out.push(
      `**See also**\n\n${sees.map((t) => `- ${renderParts(t.content, ctx).replace(/\n+/g, " ")}`).join("\n")}`,
    );
  }
  for (const tag of blockTags(comment, "@example")) {
    const text = renderParts(tag.content, ctx);
    out.push(`**Example**\n\n${text}`);
  }
  for (const tag of comment.blockTags) {
    if (handled.has(tag.tag)) continue;
    const label = humanise(tag.tag.replace(/^@/, ""));
    out.push(`**${label}** ${renderParts(tag.content, ctx).replace(/\n+/g, " ")}`);
  }
  return out;
}

function symbolSection(symbol, file, ctx) {
  const parts = [];
  const decl = symbol.decl;
  const sig = symbol.signatures[0];
  const comment = sig?.comment || decl.comment;

  parts.push(`### \`${symbol.displayName}\` {#${symbol.anchor}}`);
  parts.push("");

  const kindNote = [symbol.kindLabel];
  if (decl.name === "default") kindNote.push("default export");
  if (decl.flags?.isAbstract) kindNote.push("abstract");
  if (symbol.origin === "re-export" && symbol.fromPackage) {
    kindNote.push(`re-exported from \`${symbol.fromPackage}\``);
  }
  if (symbol.origin === "augmentation" && symbol.fromPackage) {
    kindNote.push(`augments the declaration in \`${symbol.fromPackage}\``);
  }
  parts.push(`*${kindNote.join(" · ")}*`);
  parts.push("");

  const summary = summaryOf(comment, ctx);
  if (summary) {
    parts.push(summary);
    parts.push("");
  }

  parts.push("```ts");
  parts.push(signatureBlock(symbol, ctx));
  parts.push("```");
  parts.push("");

  if (sig) {
    const p = parameterRows(symbol, sig, file, ctx);
    if (p.kind === "props") {
      if (p.rows.length) {
        parts.push(
          table(
            ["Prop", "Type", "Meaning"],
            p.rows.map((r) => [`\`${r.name}\``, `\`${cell(r.type)}\``, cell(r.meaning)]),
          ),
        );
        parts.push("");
      } else {
        parts.push("Takes no props.");
        parts.push("");
      }
    } else if (p.rows.length) {
      parts.push(
        table(
          ["Parameter", "Type", "Meaning"],
          p.rows.map((r) => [
            `\`${r.name}\``,
            `\`${cell(r.type)}\``,
            cell(
              [r.meaning, r.defaultValue ? `Defaults to \`${r.defaultValue}\`.` : ""]
                .filter(Boolean)
                .join(" "),
            ),
          ]),
        ),
      );
      parts.push("");
      if (p.fields && p.fields.rows.length) {
        parts.push(
          `Fields of \`${p.fields.name}\`${p.fields.typeName ? ` (\`${p.fields.typeName}\`)` : ""}:`,
        );
        parts.push("");
        parts.push(
          table(
            ["Field", "Type", "Meaning"],
            p.fields.rows.map((r) => [`\`${r.name}\``, `\`${cell(r.type)}\``, cell(r.meaning)]),
          ),
        );
        parts.push("");
      }
    }

    const returnsTag = blockTags(comment, "@returns")[0];
    const returnText = returnsTag ? renderParts(returnsTag.content, ctx).replace(/\n+/g, " ") : "";
    let returnType = typeString(sig.type, 1, 3);
    // The whole of a long type is in the code block above; the line below only
    // needs to say what sort of thing comes back.
    if (returnType.length > 110) returnType = `${returnType.slice(0, 108).trimEnd()} …`;
    if (returnType && returnType !== "void") {
      parts.push(`**Returns** \`${cell(returnType)}\`${returnText ? ` &mdash; ${returnText}` : ""}`);
      parts.push("");
    } else if (returnText) {
      parts.push(`**Returns** ${returnText}`);
      parts.push("");
    }
  }

  const throwsTags = blockTags(comment, "@throws");
  if (throwsTags.length) {
    parts.push("**Throws**");
    parts.push("");
    for (const t of throwsTags) {
      parts.push(`- ${renderParts(t.content, ctx).replace(/\n+/g, " ")}`);
    }
    parts.push("");
  }

  const tables = memberTables(symbol, ctx);
  if (tables.length) {
    if (symbol.origin === "augmentation") {
      parts.push(`Only the members declared in this file are listed.`);
      parts.push("");
    }
    parts.push(...tables.flatMap((t) => [t, ""]));
  }

  const remarks = blockTags(comment, "@remarks");
  for (const r of remarks) {
    const text = renderParts(r.content, ctx);
    if (text) {
      parts.push(text);
      parts.push("");
    }
  }

  for (const block of extraTagBlocks(comment, ctx)) {
    parts.push(block);
    parts.push("");
  }

  if (!summary && !remarks.length) {
    parts.push("*No description in the source.*");
    parts.push("");
  }

  parts.push(`[Source](${GITHUB}/${symbol.sourceUrlPath})`);
  parts.push("");
  return parts.join("\n");
}

function filePage(file, ctx) {
  const parts = [];
  const moduleSummary = summaryOf(file.mod.comment, ctx);
  const brief = firstSentence(moduleSummary);

  const base = baseName(file.packagePath);
  parts.push(file.title === base ? `# ${file.title}` : `# ${file.title} \`${base}\``);
  parts.push("");
  parts.push(brief || "*No module description in the source.*");
  parts.push("");
  parts.push(
    metaTable([
      ["Kind", /\.tsx$/.test(file.packagePath) ? "TypeScript module (JSX)" : "TypeScript module"],
      ["Path", `\`${file.repoPath}\``],
      ["Group", `[${file.group.title}](${groupLink(file.group.slug, file.group.slug)})`],
      ["Exports", String(file.symbols.length)],
    ]),
  );
  parts.push("");

  const rest = moduleSummary.slice(brief.length).trim();
  const moduleRemarks = blockTags(file.mod.comment, "@remarks")
    .map((t) => renderParts(t.content, ctx))
    .filter(Boolean);
  if (rest || moduleRemarks.length) {
    parts.push("## Description");
    parts.push("");
    if (rest) {
      parts.push(rest);
      parts.push("");
    }
    for (const r of moduleRemarks) {
      parts.push(r);
      parts.push("");
    }
  }

  if (file.symbols.length) {
    parts.push("## Exports");
    parts.push("");
    parts.push(
      table(
        ["Symbol", "Kind", "Signature", "Brief"],
        file.symbols.map((s) => [
          `[\`${s.displayName}\`](#${s.anchor})`,
          s.kindLabel,
          `\`${cell(shortSignature(s))}\``,
          cell(firstSentence(summaryOf(s.signatures[0]?.comment || s.decl.comment, ctx))),
        ]),
      ),
    );
    parts.push("");
    parts.push("## Exports in detail");
    parts.push("");
    for (const s of file.symbols) {
      parts.push(symbolSection(s, file, ctx));
    }
  } else {
    parts.push("## Exports");
    parts.push("");
    parts.push("This module exports nothing; it runs for its side effects.");
    parts.push("");
  }

  parts.push(viewSource(file.repoPath));
  return parts.join("\n");
}

function groupPage(group, groupFiles) {
  const parts = [];
  const symbols = groupFiles.flatMap((f) => f.symbols.map((s) => ({ s, f })));
  const described = symbols.filter(({ s, f }) => Boolean(symbolSummary(s, f))).length;
  const describedFiles = groupFiles.filter((f) => Boolean(fileBrief(f))).length;

  parts.push(`# ${group.title}`);
  parts.push("");
  parts.push(group.purpose);
  parts.push("");
  parts.push(
    metaTable([
      ["Kind", "Reference group"],
      ["Source folder", `\`${group.folder}\``],
      ["Files", String(groupFiles.length)],
      ["Exported symbols", String(symbols.length)],
      [
        "Carrying a description",
        `${described} of ${symbols.length} symbols, ${describedFiles} of ${groupFiles.length} files`,
      ],
    ]),
  );
  parts.push("");

  parts.push("## Files");
  parts.push("");
  parts.push(
    table(
      ["File", "Title", "Purpose", "Exports"],
      groupFiles.map((f) => [
        `[\`${f.packagePath}\`](${f.slug}.md)`,
        cell(f.title),
        cell(fileBrief(f, group.slug, "index")),
        String(f.symbols.length),
      ]),
    ),
  );
  parts.push("");

  if (symbols.length) {
    const sorted = symbols
      .slice()
      .sort(
        (a, b) =>
          byName(a.s.displayName, b.s.displayName) ||
          byName(a.f.packagePath, b.f.packagePath),
      );
    parts.push("## Exported symbols");
    parts.push("");
    parts.push(`???+ info "All ${plural(sorted.length, "exported symbol", "exported symbols")}"`);
    parts.push("");
    parts.push(
      indent(
        table(
          ["Symbol", "Kind", "Defined in", "Brief"],
          sorted.map(({ s, f }) => [
            `[\`${s.displayName}\`](${f.slug}.md#${s.anchor})`,
            s.kindLabel,
            `[\`${baseName(f.packagePath)}\`](${f.slug}.md)`,
            cell(symbolBrief(s, f, group.slug, "index")),
          ]),
        ),
      ),
    );
    parts.push("");
  }

  parts.push(viewSource(GENERATOR_PATH));
  return parts.join("\n");
}

function azPage({ title, intro, headers, rows }) {
  const parts = [];
  parts.push(`# ${title}`);
  parts.push("");
  parts.push(intro);
  parts.push("");
  if (rows.length) {
    parts.push(table(headers, rows));
  } else {
    parts.push("Nothing to list.");
  }
  parts.push("");
  parts.push(viewSource(GENERATOR_PATH));
  return parts.join("\n");
}

function writeRootIndex(files, counts) {
  const parts = [];
  parts.push("# Code reference");
  parts.push("");
  parts.push(
    "Every exported symbol in the three TypeScript projects, one page per source file, with the descriptions taken from the TSDoc comments in the code itself.",
  );
  parts.push("");
  parts.push("## How this is generated");
  parts.push("");
  parts.push(
    "TypeDoc reads the source and writes a JSON model of it; `docs/tools/build-reference.mjs` turns that model into these pages. Nothing here is written by hand, and no description is invented: a symbol with no comment in the source is shown with an em dash and counted against its group's *carrying a description* figure.",
  );
  parts.push("");
  parts.push("```sh");
  parts.push("cd server && npx typedoc --json ../docs/.typedoc/server.json");
  parts.push("cd mobile && npx typedoc --json ../docs/.typedoc/mobile.json");
  parts.push("cd client && npx typedoc --json ../docs/.typedoc/admin.json");
  parts.push("node docs/tools/build-reference.mjs");
  parts.push("```");
  parts.push("");
  parts.push("## Groups");
  parts.push("");
  const rows = [];
  for (const project of PROJECTS) {
    for (const group of GROUPS.filter((g) => g.project === project.key)) {
      const gf = files.filter((f) => f.group.slug === group.slug);
      if (!gf.length) continue;
      const symbols = gf.flatMap((f) => f.symbols);
      const described = gf
        .flatMap((f) => f.symbols.map((s) => symbolSummary(s, f)))
        .filter(Boolean).length;
      rows.push([
        project.label,
        `[${group.short}](${group.slug}/index.md)`,
        `\`${group.folder}\``,
        String(gf.length),
        String(symbols.length),
        `${described}/${symbols.length}`,
      ]);
    }
  }
  parts.push(
    table(["Project", "Group", "Source folder", "Files", "Symbols", "Described"], rows),
  );
  parts.push("");
  parts.push(
    `In total: ${plural(rows.length, "group", "groups")}, ${plural(counts.files, "file page", "file pages")}, ${plural(counts.symbols, "exported symbol", "exported symbols")}.`,
  );
  parts.push("");
  parts.push("## Look a name up");
  parts.push("");
  parts.push("| Index | What is in it |");
  parts.push("|---|---|");
  parts.push(`| [All files](all-files.md) | Every source file with a page here. |`);
  parts.push(`| [All functions](all-functions.md) | Plain functions and hooks. |`);
  parts.push(`| [All components](all-components.md) | React components, mobile and web. |`);
  parts.push(`| [All types](all-types.md) | Type aliases, interfaces, classes and enums. |`);
  parts.push("");
  parts.push(viewSource(GENERATOR_PATH));
  return parts.join("\n");
}

/* ------------------------------------------------------------------ *
 * Writing
 * ------------------------------------------------------------------ */

const written = [];

function write(relPath, content) {
  const full = join(OUT_DIR, relPath);
  mkdirSync(dirname(full), { recursive: true });
  const body = content.replace(/\n{3,}/g, "\n\n").replace(/\s+$/, "") + "\n";
  writeFileSync(full, body, "utf8");
  written.push({ relPath, bytes: Buffer.byteLength(body, "utf8") });
}

function main() {
  const { files, skipped, skippedSymbols, indexById } = build();
  INDEX = indexById;

  // Clear only what this script owns. docs/reference/.gitignore, and the
  // TypeDoc HTML in docs/reference/{server,mobile,admin}/, are left alone.
  for (const group of GROUPS) {
    rmSync(join(OUT_DIR, group.slug), { recursive: true, force: true });
  }
  for (const name of ["index.md", "all-files.md", "all-functions.md", "all-types.md", "all-components.md"]) {
    rmSync(join(OUT_DIR, name), { force: true });
  }
  mkdirSync(OUT_DIR, { recursive: true });

  // File pages.
  for (const file of files) {
    const pageCtx = ctxFor(file, file.group.slug);
    write(`${file.group.slug}/${file.slug}.md`, filePage(file, pageCtx));
  }

  // Group index pages.
  const usedGroups = [];
  for (const group of GROUPS) {
    const gf = files
      .filter((f) => f.group.slug === group.slug)
      .sort((a, b) => byName(a.packagePath, b.packagePath));
    if (!gf.length) continue;
    usedGroups.push({ group, files: gf });
    write(`${group.slug}/index.md`, groupPage(group, gf));
  }

  // A-Z indexes.
  const allSymbols = files.flatMap((f) => f.symbols.map((s) => ({ s, f })));
  const briefOf = ({ s, f }) => symbolBrief(s, f);

  write(
    "all-files.md",
    azPage({
      title: "All files",
      intro: `Every source file with a page in this reference, ${plural(files.length, "file", "files")} in all.`,
      headers: ["File", "Title", "Group", "Path", "Brief"],
      rows: files
        .slice()
        .sort((a, b) => byName(baseName(a.packagePath), baseName(b.packagePath)) || byName(a.repoPath, b.repoPath))
        .map((f) => [
          `[\`${baseName(f.packagePath)}\`](${f.group.slug}/${f.slug}.md)`,
          cell(f.title),
          `[${f.group.short}](${f.group.slug}/index.md)`,
          `\`${f.repoPath}\``,
          cell(fileBrief(f)),
        ]),
    }),
  );

  const azRows = (predicate) =>
    allSymbols
      .filter(predicate)
      .sort((a, b) => byName(a.s.displayName, b.s.displayName) || byName(a.f.repoPath, b.f.repoPath))
      .map((entry) => [
        `[\`${entry.s.displayName}\`](${entry.f.group.slug}/${entry.f.slug}.md#${entry.s.anchor})`,
        entry.s.kindLabel,
        `[${entry.f.group.short}](${entry.f.group.slug}/index.md)`,
        `[\`${baseName(entry.f.packagePath)}\`](${entry.f.group.slug}/${entry.f.slug}.md)`,
        cell(briefOf(entry)),
      ]);

  const fnRows = azRows(({ s }) => s.kindKey === "function" || s.kindKey === "hook");
  const typeRows = azRows(({ s }) =>
    ["type", "interface", "class", "enum"].includes(s.kindKey),
  );
  const componentRows = azRows(({ s }) => s.kindKey === "component");

  const headers = ["Name", "Kind", "Group", "Defined in", "Brief"];
  write(
    "all-functions.md",
    azPage({
      title: "All functions",
      intro: `Every exported function and hook, ${plural(fnRows.length, "entry", "entries")} in all. React components have [their own index](all-components.md).`,
      headers,
      rows: fnRows,
    }),
  );
  write(
    "all-types.md",
    azPage({
      title: "All types",
      intro: `Every exported type alias, interface, class and enum, ${plural(typeRows.length, "entry", "entries")} in all.`,
      headers,
      rows: typeRows,
    }),
  );
  write(
    "all-components.md",
    azPage({
      title: "All components",
      intro: `Every exported React component in the mobile app and the admin panel, ${plural(componentRows.length, "entry", "entries")} in all.`,
      headers,
      rows: componentRows,
    }),
  );

  write(
    "index.md",
    writeRootIndex(files, { files: files.length, symbols: allSymbols.length }),
  );

  /* ---------------- verification ---------------- */
  const problems = [];
  const emitted = new Set(written.map((w) => w.relPath.replace(/\\/g, "/")));

  for (const w of written) {
    if (w.bytes < 120) problems.push(`nearly empty page: ${w.relPath} (${w.bytes} bytes)`);
  }

  const linkRe = /\]\(([^)\s]+)\)/g;
  for (const w of written) {
    const text = readFileSync(join(OUT_DIR, w.relPath), "utf8");
    const fromDir = dirname(w.relPath).replace(/\\/g, "/");
    let m;
    while ((m = linkRe.exec(text))) {
      const href = m[1];
      if (/^(https?:|mailto:|#)/.test(href)) continue;
      const [path] = href.split("#");
      if (!path) continue;
      const resolved = join(OUT_DIR, fromDir === "." ? "" : fromDir, path);
      if (!existsSync(resolved)) problems.push(`broken link in ${w.relPath}: ${href}`);
    }
  }

  // Anchors: every in-page and cross-page anchor must exist.
  const anchorsByPage = new Map();
  for (const w of written) {
    const text = readFileSync(join(OUT_DIR, w.relPath), "utf8");
    const set = new Set();
    for (const m of text.matchAll(/\{#([a-z0-9-]+)\}/g)) set.add(m[1]);
    anchorsByPage.set(w.relPath.replace(/\\/g, "/"), set);
  }
  for (const w of written) {
    const text = readFileSync(join(OUT_DIR, w.relPath), "utf8");
    const fromDir = dirname(w.relPath).replace(/\\/g, "/");
    for (const m of text.matchAll(/\]\(([^)\s]*)#([a-z0-9-]+)\)/g)) {
      const [, path, anchor] = m;
      const targetRel = path
        ? join(fromDir === "." ? "" : fromDir, path).replace(/\\/g, "/")
        : w.relPath.replace(/\\/g, "/");
      const set = anchorsByPage.get(targetRel);
      if (set && !set.has(anchor)) problems.push(`broken anchor in ${w.relPath}: ${m[0]}`);
    }
  }

  const groupPages = usedGroups.length;
  const filePages = files.length;
  if (emitted.size !== groupPages + filePages + 5) {
    problems.push(
      `page count mismatch: wrote ${emitted.size}, expected ${groupPages + filePages + 5}`,
    );
  }

  /* ---------------- report ---------------- */
  console.log(`groups           ${groupPages}`);
  console.log(`file pages       ${filePages}`);
  console.log(`symbols          ${allSymbols.length}`);
  console.log(`  components     ${componentRows.length}`);
  console.log(`  functions/hooks${String(fnRows.length).padStart(4)}`);
  console.log(`  types          ${typeRows.length}`);
  console.log(`pages written    ${emitted.size}`);
  if (skipped.length) {
    console.log(`skipped files    ${skipped.length}`);
    for (const s of skipped) console.log(`  - ${s.repoPath} (${s.why})`);
  }
  if (skippedSymbols.length) {
    console.log(`skipped symbols  ${skippedSymbols.length}`);
    for (const s of skippedSymbols) console.log(`  - ${s.name} in ${s.repoPath} (${s.why})`);
  }
  if (problems.length) {
    console.log(`\nPROBLEMS (${problems.length}):`);
    for (const p of problems.slice(0, 40)) console.log(`  - ${p}`);
    process.exitCode = 1;
  } else {
    console.log("\nverified: every link resolves, every anchor exists, no page is empty.");
  }
}

main();
