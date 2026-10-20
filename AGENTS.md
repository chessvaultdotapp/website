# Repository guide

## Scope and structure

This repository contains the Chessvault static website, built with Astro and pnpm.
The desktop application is maintained separately at <https://github.com/chessvaultdotapp/chessvault>.
Run commands from this repository's root; there is no pnpm workspace or `website/` subdirectory.

- `src/pages/`: file-based routes, including Markdown documentation in `docs/`.
- `src/layouts/Layout.astro`: shared page shell, header, footer, and theme initialization.
- `src/layouts/Documentation.astro`: documentation layout and navigation.
- `src/components/`: reusable Astro components.
- `src/styles/global.css`: shared styles and theme tokens.
- `public/`: static assets copied into the build.
- `tests/smoke.spec.ts`: Playwright browser tests.

## Setup and development

Use Node.js 22.12 or newer and pnpm. Install dependencies with:

```sh
pnpm install --frozen-lockfile
```

Keep `package.json` and `pnpm-lock.yaml` synchronized when changing dependencies.
Do not regenerate the lockfile or upgrade unrelated dependencies as part of routine edits.

Start the development server with `pnpm dev` (normally `http://localhost:4321`).
If Astro starts a background server in an agent environment, manage it with
`pnpm astro dev status`, `pnpm astro dev logs`, and `pnpm astro dev stop`.
Stop servers you started when finished; do not stop unrelated processes.

## Verification

For source or configuration changes, run these checks, stopping on failure:

```sh
pnpm exec oxfmt --check src astro.config.mjs playwright.config.ts tests
pnpm exec oxlint --deny-warnings src astro.config.mjs playwright.config.ts tests
pnpm astro check
pnpm build
pnpm test:e2e
```

Run build and browser tests sequentially, not concurrently: both write to `dist/`,
and the browser tests build with a different base path.

Install the browser before the first test run if needed:

```sh
pnpm exec playwright install --with-deps chromium
```

- Playwright owns its preview server on `127.0.0.1:4321`; keep the port free.
  It deliberately does not reuse an existing server. Preserve its foreground server lifecycle.
- Tests build with `/chessvault/` as the base path and cover desktop and mobile Chromium.
  Preserve non-root-path coverage even when developing at `/`.
- Failed tests retain traces in `test-results/`; inspect them with
  `pnpm exec playwright show-trace test-results/<test-directory>/trace.zip`.
- For visible changes, inspect affected pages in a browser at desktop and mobile sizes,
  including light and dark themes. Update tests when intended behavior changes;
  do not weaken assertions merely to make a failure pass.
- For Markdown changes, run `rumdl check <changed-files>`; `.rumdl.toml` sets a 120-column limit.
- Report checks actually run and any checks blocked by missing tools or environment limitations.

## Implementation conventions

- Keep the site statically buildable. Prefer Astro components and scoped CSS; do not introduce
  a client-side framework or new dependencies without a concrete need.
- Build internal page and asset URLs using `import.meta.env.BASE_URL`, following existing components.
  Avoid hard-coded root-relative URLs that break under a deployment prefix.
- Use shared layouts and existing CSS tokens rather than duplicating the page shell or theme colors.
- Preserve the `light`, `dark`, and `system` theme preferences, `chessvault-theme` storage key,
  system-color-scheme handling, and operation when local storage is unavailable.
  Theme initialization runs in the document head to avoid a flash of the wrong theme.
- Keep navigation semantic and keyboard accessible, with visible focus indicators and accessible
  names for icon-only controls. Check for horizontal overflow on small screens.
- Browser tests reject unexpected console errors and uncaught exceptions. They check external-link
  destinations without visiting third-party sites.
- Keep download links and platform-support claims aligned with actual Chessvault releases;
  do not invent availability or product features.
- Do not edit generated output in `dist/`, `.astro/`, or test-artifact directories.

## Documentation and references

Update `README.md` when development commands or setup requirements change.
Consult the version-appropriate [Astro documentation](https://docs.astro.build) for unfamiliar APIs;
check the installed version in the lockfile rather than assuming older Astro examples apply.
Keep this guide specific to the repository and update it when conventions change.
