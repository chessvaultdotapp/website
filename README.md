# Chessvault website

The Astro-based website for [Chessvault](https://github.com/chessvaultdotapp/chessvault),
a chess desktop application. It contains the landing page, download page, and
website documentation pages.

## Development

Requires Node.js **22.12 or newer** and **pnpm**. Run commands from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm changelogs:fetch
pnpm dev
```

The development server runs at `http://localhost:4321`.

| Command | Action |
| --- | --- |
| `pnpm build` | Build the static site into `dist/` |
| `pnpm preview` | Preview the production build locally |
| `pnpm astro check` | Run Astro and TypeScript diagnostics |

## Changelogs

Run `pnpm changelogs:fetch` after cloning or updating `changelogs.json`. Git is required.
The command uses a shallow, blob-filtered sparse checkout of the app repository's
`changelogs/` directory at the pinned release tag and verifies its full commit SHA.
Fetched files live in `.cache/chessvault/` and are not committed.
Development and builds then work offline; missing or stale snapshots fail with instructions.

`changelogs.json` is the integration contract for release automation: update `tag` and
`commit` together in a PR when publishing a stable release or prerelease. The release
snapshot must contain only versioned, published Markdown changelogs.
CI caches the checkout by commit and fetch-script version, then fetches and validates
it before checks and builds. No network fetch happens inside the Astro build.

## Project structure

- `src/pages/` — site routes, including documentation pages.
- `src/layouts/` — shared page layouts.
- `public/` — static assets copied into the build.
- `tests/` — Playwright smoke tests.
- `astro.config.mjs` — Astro configuration.
- `playwright.config.ts` — browser test configuration.

## Checks

```sh
pnpm exec oxfmt --check src astro.config.mjs playwright.config.ts tests
pnpm exec oxlint --deny-warnings src astro.config.mjs playwright.config.ts tests
pnpm astro check
```

### Browser tests

Install Chromium, then run the Playwright suite:

```sh
pnpm exec playwright install --with-deps chromium
pnpm test:e2e
```

The test configuration builds the production site with the `/chessvault/`
base path and starts a preview server at `127.0.0.1:4321`. Keep that port free;
the suite does not reuse an existing server.

Tests cover desktop and mobile Chromium viewports, page headings, navigation,
footer rendering, horizontal overflow, theme switching and persistence, keyboard
navigation, external-link destinations, and unexpected browser errors. They do
not visit external links.

To run with a visible browser:

```sh
pnpm test:e2e --headed
```

Failed runs retain traces in `test-results/`. Open a trace with:

```sh
pnpm exec playwright show-trace test-results/<test-directory>/trace.zip
```

## CI and deployment

GitHub Actions runs website checks and browser tests on pushes and pull requests.
A separate workflow lints Markdown files with rumdl.

Each push to `main` deploys after the website checks pass. The workflow builds
for `https://chessvaultdotapp.github.io` and publishes `dist/` to the `main` branch
of `chessvaultdotapp/chessvaultdotapp.github.io`.
The source repository needs a `GH_PAGES_DEPLOY_TOKEN` secret with contents-write
access to that destination. Configure GitHub Pages in the destination repository
to publish from the root of `main`.

## License

See [LICENSE](LICENSE).
