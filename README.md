<a id="top"></a>

<div align="center">

# MariKit

**Eight browser tools. Files stay in your browser.**

[![Nuxt][nuxt-badge]][nuxt] [![Vue][vue-badge]][vue] [![TypeScript][ts-badge]][ts] [![Tailwind][tw-badge]][tw]

[Tools](#tools) · [Start](#start) · [Configure](#configure) · [Privacy](#privacy) · [Deploy](#deploy)

</div>

<details>
<summary>Contents</summary>

- [Tools](#tools)
- [Start](#start)
- [Configure](#configure)
- [Privacy](#privacy)
- [Deploy](#deploy)
- [License](#license)

</details>

<a id="tools"></a>

## Tools

| Area | What you can do |
| --- | --- |
| Documents | Merge PDFs, split by page range, reorder / rotate / remove pages |
| Files | Remove metadata from JPEG, PNG, WebP, SVG, and PDF |
| QR | Generate a PNG, scan an image or a camera frame |
| Security | Generate passwords, hash text with SHA-256 / 384 / 512 |

<a id="start"></a>

## Start

Requires Node.js.

```bash
git clone https://github.com/<owner>/<repository>.git
cd MariKit
npm install
npm run dev
```

Open `http://localhost:3000`.

| Command | Use |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production server build |
| `npm run preview` | Preview that build |
| `npm run generate` | Static output |
| `npm run typecheck` | Type check |

<a id="configure"></a>

## Configure

Copy `.env.example` to `.env` and fill in what you need. All keys are optional — tools work without them.

| Variable | Sets |
| --- | --- |
| `NUXT_PUBLIC_OPERATOR_NAME` | Operator name on the privacy page |
| `NUXT_PUBLIC_CONTACT_EMAIL` | Contact address and email handoff |
| `NUXT_PUBLIC_GITHUB_URL` | Repository and license links |

With no address configured, the contact form says so and opens no mail client.

<a id="privacy"></a>

## Privacy

- Tool input, filenames, camera frames, and results are not uploaded.
- No analytics, error tracking, or application cookies.
- The service worker caches pages and assets only — never tool data.
- Hosting and retention details are on the in-app privacy page.
- Dependency advisories and their reachability are in [DEPENDENCY-REVIEW.md](DEPENDENCY-REVIEW.md).

Install from the **Install app** control on the homepage when the browser supports it. Visited pages reopen offline; unvisited pages show an offline notice. Clearing site data removes the cache.

<a id="deploy"></a>

## Deploy

`npm run build` produces a Nitro server that runs anywhere Node.js is available. `npm run generate` produces static files for any static host. Set the three variables above in your host before building if you want contact and repository links to appear.

[CI](.github/workflows/ci.yml) installs locked dependencies, checks types, and builds on every push and pull request. It does not deploy.

<a id="license"></a>

## License

[MIT](LICENSE).

<p align="right"><a href="#top">back to top ↑</a></p>

[nuxt-badge]: https://img.shields.io/badge/Nuxt-4-020420?logo=nuxt&logoColor=white
[nuxt]: https://nuxt.com/docs
[vue-badge]: https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs&logoColor=white
[vue]: https://vuejs.org/guide/introduction.html
[ts-badge]: https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white
[ts]: https://www.typescriptlang.org/docs/
[tw-badge]: https://img.shields.io/badge/Tailwind-38B2AC?logo=tailwindcss&logoColor=white
[tw]: https://tailwindcss.com/docs
