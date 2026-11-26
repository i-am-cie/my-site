# WebTech Lab — my-site

The learning website for the Web Technologies course. It started as one
`index.html` and grew week by week: structure, external CSS, links and paths,
images, a shared JavaScript navigation, and finally two small interactions.

Live site: <https://i-am-cie.github.io/my-site/>

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Hero image and an overview of the whole site |
| `quotes.html` | Eighteen quotes, with a random one in the header |
| `project.html` | Six project ideas I could build next |
| `machine.html` | A useless machine and a twenty-second target game |

## How the navigation works

The menu exists **once**, as an HTML fragment in `nav.html`. Every page contains
only an empty `<div id="site-nav"></div>` and `nav.js`. On load, `nav.js`
fetches the fragment, injects it and marks the current page with
`aria-current="page"`.

Adding a page therefore means editing `nav.html` only — no page-by-page edits,
no copy-paste drift.

## Files

```
my-site/
├── index.html
├── quotes.html
├── project.html
├── machine.html
├── nav.html          the navigation fragment, written once
├── nav.js            injects nav.html into every page
├── machine.js        the useless machine and the game
├── tools/
│   └── check-site.mjs zero-dependency static checks (Node 22)
├── style.css         one stylesheet for the whole site
├── favicon.svg
├── favicon-32.png
├── apple-touch-icon.png
└── img/
    ├── hero.jpg
    └── og-image.jpg
```

## Built with

- Semantic HTML (`header`, `nav`, `main`, `section`, `figure`, `ol`)
- One external stylesheet, custom properties, a breakpoint at 780 px
- Plain JavaScript: `fetch`, DOM injection, a timer, `localStorage`
- No framework, no build step
- Zero-dependency static checks in `tools/check-site.mjs` (Node 22, no install step)
- Published with GitHub Pages from the `main` branch

## Checks

`tools/check-site.mjs` verifies that every local link and asset resolves, every
image has an `alt`, external new-tab links carry `rel="noopener"`, each page has
the required Open Graph metadata, element ids are unique and each page has a
single `h1`. Run it locally:

```
node tools/check-site.mjs
```

GitHub Actions runs the same check on every push and pull request to `main`
(see `.github/workflows/ci.yml`). Warnings do not fail the build; errors do.
