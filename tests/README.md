# Functional regression tests

Run all tests once:

```sh
npm test -- --run
```

Run a particular suite:

```sh
npm test -- --run tests/pdfTools.test.ts
```

## Automated functional catalogue

| Area | Suites | Checks |
| --- | --- | --- |
| Password Generator | `securityTools.test.ts` | Length bounds, all nonempty character-category combinations, validation, generation, copy success/failure and retry, settings invalidation, reset, unavailable randomness |
| Hash Generator | `securityTools.test.ts` | Full SHA-256/384/512 reference digests, Unicode and whitespace, generation/loading, copy, clear, settings invalidation, stale completion, unavailable Web Crypto |
| PDF Merger | `pdfTools.test.ts`, `asyncOperations.test.ts` | Minimum files, real merged page count and order, duplicate entries, pointer/keyboard reorder, removal, Clear, stale output invalidation, names, mixed batches, encryption/errors/retry, URL cleanup |
| PDF Splitter | `pdfTools.test.ts`, `asyncOperations.test.ts` | Real extracted page count/order, deduplication, invalid ranges, separate per-page output, names, range/method/source invalidation, Clear, encrypted/malformed input, retry, partial-result cleanup, stale operations |
| PDF Organizer | `pdfOrganizer.test.ts`, `asyncOperations.test.ts` | Initial/next/final preview batches, selection, select/unselect all, preventing removal of every page, pointer/keyboard reorder, removal, rotation relative to original orientation, real combined PDF export, names, preview and cleanup failures, retry, cancellation |
| QR Generator | `qrTools.test.ts`, `qrCodec.test.ts`, `asyncOperations.test.ts` | Generate, output invalidation, reset, input constraints, failure/retry, cancelled completion, timestamped download, actual PNG encoding and QR payload round-trips |
| QR Scanner | `qrTools.test.ts`, `qrCodec.test.ts`, `asyncOperations.test.ts` | Image/paste replacement, actual pixel decoding, no-code image, worker failures, stale results, copy success/failure, HTTP(S)-only links, camera start/stop/decode/restart/denial/revocation, ended tracks, listener cleanup and unmount |
| Shared file input | `sharedComponents.test.ts`, `asyncOperations.test.ts` | Picker reset, repeated selection, single/multiple input, MIME/extension/wildcard matching, drop/paste, clipboard item fallback, mixed batches, 100 MB boundaries and accumulated totals, retry, disabled input, preserving text editing, listener removal |
| Shared controls | `sharedComponents.test.ts` | Button type/loading/disabled/click behavior, input labels, model updates, constraints, hints and errors |
| Tool discovery | `landing.test.ts` | Desktop/smaller-screen batch sizes, Load more, seven tool links, category/search combinations, normalization, empty state, clearing filters |
| Navigation and Contact | `landing.test.ts` | Menu click/Escape/resize/route changes, active section observer cleanup, contact input constraints and honest unavailable submission state without network transmission |
| Download names and PDF errors | `utils/*.test.ts`, `utils/pdf/*.test.ts` | Source/action names, unsafe characters, Unicode, long/empty names, QR timestamp, encrypted-error classification |

## What these results mean

The component suites mount the real Vue single-file components with their actual templates and shared controls. Nuxt's surrounding layout/link behavior is stubbed. The older `asyncOperations.test.ts` suite executes component scripts in an isolated harness for targeted failure regressions; it is not a UI integration suite.

PDF export assertions use real `pdf-lib` documents. Distinct page dimensions identify source pages so an incorrect order cannot pass merely because the page count matches. The Organizer's PDF.js renderer and canvas output are mocked: these tests prove UI orchestration and export behavior, not browser rendering fidelity.

QR codec tests run the installed encoder and the installed scanner worker's decoder against synthetic pixel data. The worker code executes in an isolated VM with an in-memory message interface. These tests do not launch a browser worker or test camera hardware.

Clipboard, camera, permission events, pointer coordinates, download initiation, object URLs, and selected API failures are simulated. Tests do not prove operating-system permission behavior, physical clipboard access, actual files saved by browsers, real camera selection, network privacy, device sleep recovery, or mobile compatibility. Native browser constraint enforcement is represented by input attributes, not a browser conformance test.

Real-browser/device checks remain separate in `ROADMAP.md`. Non-functional checks deferred by the user remain deferred. This catalogue covers the currently specified functional behavior and known regressions; passing tests is not a guarantee that every possible input or future behavior is covered.
