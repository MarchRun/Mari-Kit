# MariKit

Browser-based tools for PDFs, QR codes, file metadata, passwords, and hashes. Files and text you enter are processed in your browser — there is no application server for tool data.

## What you can do

| Category | Tools |
| --- | --- |
| Documents | **PDF Merger**, **PDF Splitter**, **PDF Organizer** — combine files, split by page range, and reorder, rotate, or remove pages |
| Files | **File Metadata Remover** — strip metadata from JPEG, PNG, WebP, SVG, and PDF |
| QR codes | **QR Generator**, **QR Scanner** — create a PNG, or scan from an image or camera |
| Security | **Password Generator**, **Hash Generator** — generate passwords and SHA-256/384/512 digests |

## Privacy

- Tool input, filenames, camera frames, and results are not uploaded.
- The application does not set analytics, error tracking, or cookies.
- The service worker caches pages and static assets only; tool data is never cached.
- Hosting, contact, and retention details are disclosed on the privacy page.
- Known dependency advisories and their assessed exposure are recorded in [DEPENDENCY-REVIEW.md](DEPENDENCY-REVIEW.md).

## Run it locally

Requires Node.js.

```bash
git clone https://github.com/<owner>/<repository>.git
cd MariKit
npm install
npm run dev
```

Open `http://localhost:3000`.

### Optional configuration

Copy `.env.example` to `.env` and fill in the values you want:

| Variable | Used for |
| --- | --- |
| `NUXT_PUBLIC_OPERATOR_NAME` | Operator name on the privacy page |
| `NUXT_PUBLIC_CONTACT_EMAIL` | Contact address and email handoff |
| `NUXT_PUBLIC_GITHUB_URL` | Repository and license links |

All three are optional. Without them the tools still work; contact and repository links are hidden and the privacy page says contact is not configured.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build the production server output |
| `npm run preview` | Preview the production build locally |
| `npm run generate` | Generate a static site |
| `npm run typecheck` | Check TypeScript types |

## Install and offline use

MariKit can be installed from a browser that supports installation using the **Install app** control on the homepage. Other browsers show an unavailable message; there is no separate application download.

After a page has been opened online, the service worker keeps that page and its static assets so it can reopen without a network connection. Pages that have never been opened show an offline notice. Two online visits may be needed before every lazily loaded script for a page is cached.

The cache holds pages, scripts, styles, fonts, icons, and the manifest only. Clearing site data removes the cache, and the tools keep working online.

## Project layout

```text
logic/    Reusable processing logic
pages/    Application routes
public/   Manifest, icons, service worker, offline page
ui/       Interface components
utils/    Shared helpers
```

## Continuous integration

The [CI workflow](.github/workflows/ci.yml) runs on pushes, pull requests, and manual dispatch. It installs locked dependencies, checks types, and builds the production output. It does not deploy the application or require repository secrets. Action references are pinned to commit SHAs.

Requiring CI before merging is a repository ruleset setting; the workflow does not enable it automatically.

## Contributing

Bug reports and suggestions are welcome through GitHub Issues. For larger code changes, open an issue first so the approach can be discussed.

## License

MariKit is available under the [MIT License](LICENSE).
