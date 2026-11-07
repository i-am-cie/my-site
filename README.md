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
- Published with GitHub Pages from the `main` branch
