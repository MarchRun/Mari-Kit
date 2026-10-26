# Dependency advisory review

Reviewed on October 26, 2026, against the installed lockfile and current production output. This is a scoped reachability review, not a clean security audit or a finding that the advisories can be ignored.

## Summary

`npm audit --json` reports 12 affected packages: 7 high and 5 moderate. These are propagated package findings rooted in two distinct advisories, not 12 independent vulnerabilities. No critical findings were reported in this run.

No dependency versions, overrides, or lockfile entries were changed during this review. There is no compatible automatic fix for the two remaining chains based on the versions inspected.

## Findings

### node-forge: RSA signature verification

- Advisory: [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv), CVE-2026-85393.
- Installed version: `node-forge@1.4.0`.
- Dependency path: Nuxt → Nitro → listhen → node-forge.
- Condition: malformed RSA PKCS#1 v1.5 signature structures can pass verification in affected consumers using low-exponent RSA keys.
- Registry check: 1.4.0 remains the latest published release. The advisory lists no first patched version.

The inspected listhen implementation imports forge for local HTTPS certificate creation, PEM/key handling, and certificate signing. No calls to signature verification or certificate-chain verification were found in that implementation. This does not establish that every possible use of the dependency is safe.

Neither node-forge nor listhen was found in the inspected `.output/server/package.json` or server JavaScript search. This limits the observed exposure of the current standalone production output; it does not apply automatically to development, preview, custom builds, or hosting that installs and executes the full project dependency tree.

Do not expose the development server publicly. Do not use this dependency to verify attacker-supplied signatures or certificates. Recheck the upstream release and advisory before deployment or changes to HTTPS handling. npm's suggested Nuxt downgrade is not an approved fix for this project.

### postcss-selector-parser: CPU exhaustion

- Advisory: [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf), CVE-2026-104844.
- Affected installed version: `postcss-selector-parser@6.1.4` through Tailwind 3.4.19 and postcss-nested 6.2.0.
- A separate installed copy, 7.1.6, is already patched but does not replace the affected 6.x copies.
- First patched version: 7.1.6.
- Condition: synchronously parsing specially crafted, untrusted CSS selectors can exhaust CPU. The advisory explicitly distinguishes this from ordinary build-time processing of trusted sources.

MariKit uses Tailwind/PostCSS to build project styles. No feature accepts user CSS selectors for this parser, and the parser was not found in the inspected standalone production server output. A contributor can still supply expensive build input; CI uses a job timeout and does not receive repository secrets for the configured test workflow.

Do not add a request-time CSS processing feature without reviewing this advisory again. Forcing parser 7 into dependencies declaring parser 6 would be a major-version override, not an ordinary patch. A Tailwind major-version migration requires separate compatibility and visual checks and was not performed here.

## Follow-up

- [ ] Recheck node-forge for a published patched release and update the dependency chain when supported.
- [ ] Recheck Tailwind/postcss-nested for a compatible parser fix or plan a separately verified major-version migration.
- [ ] Rerun dependency review after lockfile, hosting, server preset, or input-processing changes.
- [ ] Verify the exact deployed artifact and production entry point before release.

Do not suppress these findings or interpret successful tests/builds as proof that a vulnerable package has been patched. Runtime Node.js security updates and operating-system/hosting security are separate from npm package auditing.
