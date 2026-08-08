# CLAUDE.md

Routing file — the real documentation is in the two files below. Read the
relevant section before starting work; don't re-derive conventions from the
HTML.

- **[takeprofit-email-system-guide.md](takeprofit-email-system-guide.md)** — the design system: tokens, blocks,
  footer variants, asset rules, per-email subjects/senders.
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — commit identity (Netlify allows exactly one Git
  contributor — never add a `Co-Authored-By` trailer), S3 credentials.

## Pick the right flow

| Task | Read first |
|---|---|
| Edit or add a transactional / notification email (HTML lives in this repo) | §1–12, plus §11.1 for the Figma → S3 → Customer.io pipeline |
| Build the monthly **"What's New" digest** | **§14** — it does *not* live in this repo; it is built in Customer.io by copying last month's one-time send |
| Send yourself a test | §13 |
| Upload images | §10.2, and `tools/upload-assets.py` |

## Always

- **Changelog on every repo change:** prepend a dated entry to the Changelog in
  [index.html](index.html) (newest first, with links to the affected emails), then commit
  and push to `main` so Netlify redeploys. See §0.
- Subjects and preheaders are owned by the Notion table "TakeProfit-Emails" —
  edit there first, then sync §12 and the HTML. Notion wins on conflict.
- Never put an asset URL into a template before it has actually answered 200 —
  the S3 bucket grants public read per object, so a missing ACL yields a 403
  that looks identical to a working template in the source.
