#!/usr/bin/env node
/* ==========================================================================
   check-site.mjs — zero-dependency static checks for the WebTech Lab site.

   What it verifies (errors fail the build, warnings do not):
     * every local href/src resolves to a file that exists on disk
     * every <img> has a non-empty alt (decorative images use alt="")
     * every external new-tab link carries rel="noopener"
     * each page declares the required head metadata
       (charset, viewport, title, description, og:title/description/url/image)
     * each standalone page has exactly one <h1>
     * element ids are unique within a page
     * navigation fragment links point to existing pages
     * local paths fetched/required from JavaScript exist
     * images under img/ that no page references are reported as warnings

   Run from the repository root:   node tools/check-site.mjs
   Requires Node 18+; installs no dependencies.
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const SITE_ORIGIN = 'https://i-am-cie.github.io';
const SITE_PREFIX = '/my-site/';

const errors = [];
const warnings = [];

const walk = (dir, acc = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
};

const allFiles = walk(root);
const rel = (p) => path.relative(root, p).replace(/\\/g, '/');

const isRemote = (url) =>
  /^(https?:|mailto:|data:|blob:|tel:|\/\/)/i.test(url.trim());

/** Map an absolute site OG/preview URL back to a local file, if it belongs here. */
const localFromAbsolute = (url) => {
  try {
    const u = new URL(url);
    if (u.origin === SITE_ORIGIN && u.pathname.startsWith(SITE_PREFIX)) {
      const local = u.pathname.slice(SITE_PREFIX.length);
      return local || 'index.html';
    }
  } catch {
    /* not an absolute URL */
  }
  return null;
};

const resolveLocal = (pageDir, url) => {
  const cleaned = url.split('#')[0].split('?')[0].trim();
  if (!cleaned || isRemote(cleaned)) return null;
  const mapped = localFromAbsolute(cleaned);
  const target = mapped
    ? path.join(root, mapped)
    : path.join(pageDir, cleaned);
  return path.normalize(target);
};

const readHtml = (file) => fs.readFileSync(file, 'utf8');

const ATTR_RE = /([a-z-]+)\s*=\s*"([^"]*)"/gi;

const extractTags = (html, tag) => {
  const re = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
  const tags = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = {};
    let a;
    const are = new RegExp(ATTR_RE.source, 'gi');
    while ((a = are.exec(m[0])) !== null) {
      attrs[a[1].toLowerCase()] = a[2];
    }
    tags.push(attrs);
  }
  return tags;
};

const metaContent = (html, propertyOrName) => {
  const tags = extractTags(html, 'meta');
  for (const tag of tags) {
    const key = tag.property || tag.name;
    if (key && key.toLowerCase() === propertyOrName.toLowerCase()) {
      return tag.content || '';
    }
  }
  return null;
};

const REQUIRED_META = [
  ['charset', (h) => /<meta\s+charset=/i.test(h)],
  ['viewport', (h) => metaContent(h, 'viewport')],
  ['title', (h) => /<title>[^<]+<\/title>/i.test(h)],
  ['description', (h) => metaContent(h, 'description')],
  ['og:title', (h) => metaContent(h, 'og:title')],
  ['og:description', (h) => metaContent(h, 'og:description')],
  ['og:url', (h) => metaContent(h, 'og:url')],
  ['og:image', (h) => metaContent(h, 'og:image')],
];

/** html fragment (nav.html) has no head/own page — only its links are checked. */
const FRAGMENT_FILES = new Set(['nav.html']);

const htmlFiles = allFiles.filter((f) => f.endsWith('.html'));
const referencedLocal = new Set();

for (const file of htmlFiles) {
  const pageRel = rel(file);
  const pageDir = path.dirname(file);
  const html = readHtml(file);
  const isFragment = FRAGMENT_FILES.has(path.basename(file));

  const refs = [];
  for (const tag of extractTags(html, 'link')) refs.push(['link', tag.href, tag.rel]);
  for (const tag of extractTags(html, 'script')) refs.push(['script', tag.src, null]);
  for (const tag of extractTags(html, 'img')) refs.push(['img', tag.src, tag.alt]);
  for (const tag of extractTags(html, 'a')) refs.push(['a', tag.href, tag.target]);

  // href/src existence
  for (const [kind, url, extra] of refs) {
    if (!url) continue;
    const target = resolveLocal(pageDir, url);
    if (!target) continue;
    referencedLocal.add(rel(target));
    if (!fs.existsSync(target)) {
      errors.push(`${pageRel}: ${kind} resource not found — ${url}`);
    }
  }

  // OG / preview images declared in <meta> map back to local files
  for (const tag of extractTags(html, 'meta')) {
    const key = (tag.property || tag.name || '').toLowerCase();
    if (key === 'og:image' || key === 'twitter:image') {
      const local = localFromAbsolute(tag.content || '');
      if (local) referencedLocal.add(local);
    }
  }

  // img alt text
  for (const tag of extractTags(html, 'img')) {
    if (!tag.hasOwnProperty('alt')) {
      errors.push(`${pageRel}: <img src="${tag.src || '?'}" /> is missing an alt attribute`);
    } else if (tag.alt.trim() === '') {
      // empty alt is allowed only on a decorative image inside an aria-hidden block
      const decorative = /aria-hidden\s*=\s*"true"/i.test(html.slice(0, html.indexOf(tag.src || '') + 1));
      if (!decorative) {
        warnings.push(`${pageRel}: decorative image ${tag.src || '?'} uses empty alt`);
      }
    }
  }

  // external new-tab links must expose rel="noopener"
  for (const tag of extractTags(html, 'a')) {
    if (tag.target === '_blank') {
      const relAttr = (tag.rel || '').split(/\s+/);
      if (!relAttr.includes('noopener')) {
        errors.push(`${pageRel}: external link opens in a new tab without rel="noopener" — ${tag.href}`);
      }
    }
  }

  if (!isFragment) {
    // required metadata
    for (const [name, check] of REQUIRED_META) {
      if (!check(html)) {
        errors.push(`${pageRel}: missing required metadata — ${name}`);
      }
    }

    // exactly one h1
    const h1Count = (html.match(/<h1\b/gi) || []).length;
    if (h1Count === 0) {
      errors.push(`${pageRel}: page has no <h1>`);
    } else if (h1Count > 1) {
      errors.push(`${pageRel}: page has ${h1Count} <h1> elements (must be exactly one)`);
    }

    // unique ids
    const ids = [...html.matchAll(/\bid\s*=\s*"([^"]+)"/gi)].map((m) => m[1]);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length) {
      errors.push(`${pageRel}: duplicate id(s) — ${[...new Set(dupes)].join(', ')}`);
    }
  }
}

// JavaScript: local paths referenced via fetch/import/require must exist
const jsFiles = allFiles.filter((f) => f.endsWith('.js'));
const STRING_PATH_RE = /["'`]([^"'`]+\.(?:html|css|js|svg|png|jpg|jpeg|webp|ico))["'`]/gi;
for (const file of jsFiles) {
  const code = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = STRING_PATH_RE.exec(code)) !== null) {
    const url = m[1];
    if (isRemote(url)) continue;
    const target = path.normalize(path.join(path.dirname(file), url));
    referencedLocal.add(rel(target));
    if (!fs.existsSync(target)) {
      errors.push(`${rel(file)}: referenced asset not found — ${url}`);
    }
  }
}

// orphan images under img/
const imgDir = path.join(root, 'img');
if (fs.existsSync(imgDir)) {
  for (const f of walk(imgDir)) {
    const r = rel(f);
    if (!referencedLocal.has(r)) {
      warnings.push(`${r}: image is not referenced by any page or script`);
    }
  }
}

const fail = errors.length;
const warn = warnings.length;
for (const w of warnings) console.warn('warn  ' + w);
for (const e of errors) console.error('error ' + e);

console.log(
  `${htmlFiles.length} page(s), ${jsFiles.length} script(s) checked: ` +
    `${fail} error(s), ${warn} warning(s).`
);

process.exit(fail > 0 ? 1 : 0);
