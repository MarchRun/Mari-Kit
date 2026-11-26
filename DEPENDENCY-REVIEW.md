# Dependency advisory review

Reviewed on November 26, 2026, after applying in-range patches and re-running a clean install. This is a scoped reachability review, not a clean security audit or a finding that the remaining advisories can be ignored.

## Summary

`npm audit --json` now reports **12 moderate advisories** and no high or critical findings, down from 17 advisories including one high before the update.

Patches applied without `--force`, downgrades, peer-relaxing flags, or major overrides:

| Package | Before | After |
| --- | --- | --- |
| `nuxt` | `4.6.2` | `4.6.4` (`~4.6.4` in `package.json`) |
| `node-forge` | `1.4.0` | `1.4.4` |
| Tailwind/postcss-nested `postcss-selector-parser` | `6.1.4` | `6.1.6` |
| Standalone `postcss-selector-parser` | `7.1.6` | `7.2.1` |

The `~4.6.4` range avoids the `4.7.0` line, which pulls `unstorage@2.0.0-beta.0` and `ofetch@2.0.0-alpha.3` into a production build. No new runtime dependency was added.

Remote tarball fetching is disabled by default in this environment. The update was possible only with the per-command flag `--allow-remote=all`; no global npm configuration was changed.

## Verified after the update

- `npm ci --allow-remote=all` succeeded.
- `npm test -- --run`: 199 tests passed.
- `npm run typecheck`: clean.
- `npm run build`: production build succeeded.

## Remaining advisories

### Nuxt chain (moderate)

- `nuxt@4.6.4` pulls `archiver@8.0.0`, which pulls `readdir-glob` in the affected `2.0.0`–`3.0.0` range. The advisory propagates through `nitropack`, `@nuxt/nitro-server`, `@nuxt/vite-builder`, and `@nuxt/vite-server`.
- npm's only suggested fix is downgrading Nuxt to `4.6.3`, which returns to other advisories. That downgrade is not accepted.
- These paths are build/server-tooling dependencies. The inspected standalone production output does not contain the affected build chain; this does not cover development, preview, or custom server presets.

### Test tooling chain (moderate)

- `@vue/test-utils@2.5.1` is affected through `js-beautify`, `glob`, and `minimatch`.
- npm's only suggested fix is a downgrade to `2.4.11`, marked semver-major. That downgrade is not accepted.
- These are development/test dependencies and are not part of the deployed application bundle.

## Reachability notes

- node-forge is used by listhen for local HTTPS certificate and PEM handling; no signature-verification calls were found in that implementation. node-forge and listhen are not in the inspected standalone production server output.
- CSS selector parsing happens at build time on project-owned styles. The parser is not in the inspected standalone production output. Do not add request-time CSS processing without reviewing this again.
- Do not expose the development server publicly. Do not use these dependencies to verify attacker-supplied signatures or certificates.

## Follow-up

- [ ] Recheck Nuxt 4.7.x or later for a release without prerelease runtime dependencies and with fixes for the remaining archiver/readdir-glob chain.
- [ ] Recheck `@vue/test-utils` for a forward compatible fix; do not accept the suggested major downgrade without review.
- [ ] Rerun `npm audit --json` and this review after any lockfile, hosting, server preset, or input-processing change.
- [ ] Verify the exact deployed artifact and production entry point before release.

Do not suppress these findings or interpret successful tests/builds as proof that every advisory is patched. Runtime Node.js security updates and hosting security remain separate from npm package auditing.
