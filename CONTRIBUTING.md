# Contributing

Small repo, one rule that actually bites: **commit author identity**.

## Commit as yourself, not as a bot

This project deploys previews on **Netlify**, and on the current plan a
**private repo allows only one recognized Git contributor**. Netlify decides who
that is from the **raw commit author/committer email** — so every commit must be
authored by the linked maintainer account:

```
erebrov-takeprofit <e.rebrov@takeprofit.com>
```

If a commit is authored by any other identity (e.g. the cloud Claude Code bot
`Claude <noreply@anthropic.com>`), Netlify sees a *second* contributor and the
deploy fails with:

> One or more deploys failed due to an unrecognized Git contributor.

### Committing from Claude Code on the web / cloud

The cloud environment defaults its git identity to the bot. Before committing,
set your identity in that environment:

```bash
git config user.name  "erebrov-takeprofit"
git config user.email "e.rebrov@takeprofit.com"
```

Local editors (VS Code, JetBrains, terminal) already use your own git config, so
this only matters for the web/cloud environment.

### Do not add bot co-authors

Avoid `Co-Authored-By: ... <noreply@anthropic.com>` trailers — Netlify can count
a co-author as an extra contributor too.

### If a bad-author commit already landed

Re-author it and force-push the branch:

```bash
GIT_COMMITTER_NAME="erebrov-takeprofit" \
GIT_COMMITTER_EMAIL="e.rebrov@takeprofit.com" \
git commit --amend --author="erebrov-takeprofit <e.rebrov@takeprofit.com>" --no-edit
git push --force-with-lease
```

If Netlify still shows the banner afterward, remove the stray contributor in
**Netlify → Team settings → Billing → Git contributors**, then retry the deploy —
the extra author is remembered for the billing period until you remove it.

## Editing email content

- HTML templates are hand-coded, email-client-safe HTML — see
  `takeprofit-email-system-guide.md` for the design system and conventions.
- **Subjects & preheaders** live in the Notion table *"TakeProfit-Emails"* (source
  of truth). Update Notion first, then sync the HTML preheaders and §12 of the
  guide to match.
- Push to `main` → Netlify auto-deploys the previews.

## Images

Assets live in the S3 bucket `takeprofit-static`. Upload them with:

```bash
python tools/upload-assets.py emails/<email-name> ./path/to/*.png
```

The bucket has **no bucket policy** — public read is a per-object `public-read`
ACL, so a plain `aws s3 cp` uploads a file that answers **403** and breaks the
image in the email. The script sets the ACL and cache headers and verifies every
URL before printing it. Details, retina rule and the full Figma → S3 →
Customer.io flow: §10–11 of `takeprofit-email-system-guide.md`.

Credentials are the `tp-static` profile in `~/.aws/credentials` — never commit
keys to this repo.
