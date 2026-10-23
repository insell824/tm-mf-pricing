# AGENTS.md

Tampermonkey userscript that shows Money Forward Cloud pricing plans on each service page.

## Commands

- `pnpm run build`: build `release/tm-mf-pricing.latest.user.js` and `release/tm-mf-pricing.{version}.user.js`
- `pnpm run dev`: watch `src/` and write `release/tm-mf-pricing.debug.user.js` (git-ignored)
- `pnpm run typecheck`: type check `src/` and `scripts/`

## Rules

- The release version is `version` in `package.json`.
- The userscript header lives in `header.user.js`; `{{version}}` is replaced at build time.
- Code comments, log messages and commit messages are in English. UI text is in Japanese.
- Pricing data lives in `src/pricing.ts` and follows https://biz.moneyforward.com/price/.
- Debug-only logs go through `debugLog` in `src/logger.ts`.
