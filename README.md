# Chessvault website

The Astro-based website for [Chessvault](https://github.com/chessvaultdotapp/chessvault),
a chess desktop application. It contains the landing page, download page, and
website documentation pages.

## Development

Requires Node.js **22.12 or newer** and **pnpm**. Run commands from the repository root:

```sh
pnpm install
pnpm dev
```

The development server runs at `http://localhost:4321`.

| Command | Action |
| --- | --- |
| `pnpm build` | Build the static site into `dist/` |
| `pnpm preview` | Preview the production build locally |
| `pnpm astro check` | Run Astro and TypeScript diagnostics |

Once a lockfile is committed, use `pnpm install --frozen-lockfile` for reproducible installs.

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

## License

See [LICENSE](LICENSE).
