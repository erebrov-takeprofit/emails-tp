# TakeProfit — System & Notification Email Design System (Build Guide)

> Portable reference for building TakeProfit transactional / notification emails (HTML for email clients).
> Source of truth: this git repo (HTML + this guide) for design & code; the Notion table for email metadata; Figma file "Email Templates" for visual reference. Connect the repo to your Claude Desktop **Project** (as a GitHub source) rather than pasting a static copy, so the system stays in sync — see §0.

---

## 0. Maintenance & source of truth
Each fact lives in exactly one place — edit it there, never in a copy.

| Artifact | Canonical home | Notes |
|---|---|---|
| Email HTML + this guide | **git repo** (`emails-tp`, branch `main`) | Edit here only. Push → Netlify auto-deploys the previews. |
| Email metadata — subject, preheader, status, owner, trigger, preview URL | **Notion table** "TakeProfit-Emails" | Edit here only. §12 below is a convenience snapshot; if it disagrees with Notion, **Notion wins**. |
| Wording / prompting workspace | **Claude Desktop project** "Email \| Design, texts and coding rules" | Reads *from* the repo — it is not a store. Connect the repo via the GitHub source instead of uploading a static `guide.md`, so it never goes stale. |
| Images & other assets | **S3 bucket** `takeprofit-static` (`eu-central-1`) | Upload via `tools/upload-assets.py` — public read comes from a per-object ACL, so a plain `aws s3 cp` yields a 403 image. See §10.2. |
| Monthly "What's New" digest | **Customer.io** (workspace 129567), one-time sends named `TakeProfit Update <Month> <Year>` | Not in this repo and not in Notion. Each issue is a copy of the previous one — flow in §14. |

Rules of thumb:
- **Changelog every update:** for each change, prepend a dated entry to the **Changelog** in `index.html` (newest first, listing what was added/fixed/updated, with links to the affected emails), then commit & push to `main` so Netlify redeploys. Omit any `Co-Authored-By` trailer (Netlify one-contributor rule).
- **Rollout badge on every changelog entry:** merging here only redeploys the *previews* — what users receive changes when the backend picks the template up. So each entry carries `<span class="rollout live|wip|hold">`: **Live on prod** (someone has actually seen the email arrive), **Rolling out** (backend ticket open, or the change spans families and only some shipped), **Repo only / Customer.io** (docs, previews, digest work — nothing for the backend to ship). Rollout state per family lives in Linear [MB-3583](https://linear.app/takeprofit/issue/MB-3583) and its children; flip `wip → live` only on a confirmed prod send, never on a merge.
- Filenames are kebab-case and equal the email's name (same value as the Notion "Email name"). Renaming a file ⇒ update that row's **Preview URL** and **Email name** in Notion to match.
- Never keep a second hand-edited copy of this guide (e.g. uploaded into Claude files) — that fork is where drift starts.
- Stable links: index → https://emails-tp.netlify.app/ · this guide → https://emails-tp.netlify.app/takeprofit-email-system-guide.md

---

## 1. What these emails are
Hand-coded, email-client-safe HTML (tables + inline styles + Outlook `mso` hacks). Max content width **600px** (outer wrapper up to 640). They are NOT web pages — no flexbox/grid, no external CSS, no JS. Every email reuses a shared header, footer, and a small set of content "blocks".

## 2. Hard technical constraints
- Layout with `<table>` + `align` + spacer rows (`<td height="N">`), never flex/grid.
- All styling **inline** (`style="..."`). `<div>`/`<span>` ok inside cells.
- Outlook needs `mso` conditionals and `bgcolor` attributes (not just CSS background).
- `border-radius`, `letter-spacing`, web fonts work in modern clients (Apple Mail, iOS) but are **ignored by Outlook desktop & Gmail** → always have a graceful fallback.
- Whole-area links: wrap content in `<a style="display:block; text-decoration:none; ...">`; put the background + padding INSIDE the `<a>` so the padded area is clickable (works everywhere except the very padding edge in old Outlook desktop).

## 3. Design tokens
- **Font:** `'IBM Plex Sans','Arial', sans-serif`. Body 14px / line-height 140%. Small/footer 12px. Headline 24px SemiBold. Giant price 96px SemiBold.
  - Condensed labels (ticker, type badge): `'IBM Plex Sans Condensed','Arial Narrow','Arial'`. Load IBM Plex Sans **and** IBM Plex Sans Condensed via Google Fonts in `<head>` (helps Apple Mail/iOS; Gmail/Outlook fall back).
- **Colors:**
  - **Core palette — Light Mode (Figma "Colors / Palette", node `91-4018`):** main text `#000000` (`total/black`) · links `#2E7FFF` (`blueberry/400`) · footer divider `#BAC1CC` (`neutral/200`) · footer text & icons `#828C99` (`neutral/400`).
  - **Block / card / callout bg = `#F3F6FA`** (our standard). The Figma palette shows `#F0F3F7` (`neutral/50`) here, but we keep **`#F3F6FA`** across all emails for consistency — revisit only if the designer asks. Don't mix the two within one email.
  - **Beyond the core palette** (spot accents / component-specific, not in the light-mode palette above): paid "For Subscribers" gold `#8C6503` (`lemon/900`); purples `#916BFF` / `#7F3AFF` (match the design per spot); type badge orange `#FF4F03`; ticker logo swatch `#E7973D`; ticker chip border `#D5DAE0`.
- **Buttons (CTA):** black `#000000`, white text, radius **8px**, padding **12×24**, 14px.
- **Cards/callouts:** bg `#F3F6FA`, radius **8px**, padding 8 (small) or 20 (content card).
- **Spacing vocabulary:** stacked spacer rows of **12 / 24** px. Typical: `pt-24` after header, `pt-12` between body blocks, `pt-24` before CTA & outro, `12/12` divider before footer.

## 4. Global structure
`Header → (Headline?) → (Greeting "Hi/Hey {username}"?) → content blocks → CTA (+ optional fallback link) → (Outro) → Footer`.
- Outer: white bg, frame top/bottom padding 30.
- **Header:** logo top-left (32×40, links to takeprofit.com). Optional **"Join Our Discord"** pill on the right (border 1px `#000`, rounded-full, h36, padding 8×24, 14px, → discord.gg/WVk8TjwU7p).

## 5. Footer — TWO variants (pick by email type)
Both: divider 12/12 (`border-bottom:1px solid #BAC1CC`) → `© TakeProfit Inc.` (left) + social icons (right) → `takeprofit.com` logo (center) → 2-line disclaimer. Spacing: social→logo `24`, logo→disclaimer `12`.
- **Transactional** (activation, password, one-off): `This is a one-time service notification.` + `See our Privacy Policy.` — **no unsubscribe**.
- **Notification** (feed, community, alerts, payouts, marketing-ish): `View our Privacy Policy.` + `Click here to unsubscribe.` (unsubscribe link `{unsubscribe_url}`).
- Social links: x.com/TakeProfitHQ, discord.gg/WVk8TjwU7p, facebook.com/TakeProfit, instagram.com/takeprofit, reddit.com/r/TakeProfit, linkedin.com/company/takeprofit.

## 6. Component / block catalog
- **Headline** — 24px SemiBold black.
- **Greeting** — `Hi {username}` / `Hey {username}` (14px), optional second line.
- **Body paragraph** — 14px regular, `<br>` for line breaks.
- **Username mention (link to profile)** — whenever a mail names **another** user, that name links to `https://takeprofit.com/@{username}`. **The link must not change how the name looks:** SemiBold (`font-weight:600`), black `#000000`, `text-decoration:none` — never a link colour. Rationale: these mentions usually sit directly above the black CTA, and a coloured name competes with the button for the click.
  - **Never linked — the recipient:** `Hi/Hey {username}` in the greeting (we don't link someone to their own profile). The purple `#7F3AFF` on that greeting in `welcome` / `set-a-new-password-and-link-your-accounts` is decoration, not a link.
  - **Never linked — inside an already-clickable card:** comment / reply card and feed content card are each a single anchor, so the name there stays plain SemiBold (no nested links). See those blocks below.
- **Big Price** — `{amount}` at 96px SemiBold, centered (subscription/payout amount) + 14px centered 2-line caption (`<br>`) + CTA **View Dashboard** → `{dashboard_url}` (monetization dashboard). Paid-subscriber emails split **indicator vs content** (`{content}` = post/screener/etc.; for indicators show `{indicator} {indicator_name}`):
  - *New subscription:* `@{subscriber_username} subscribed to your {indicator} {indicator_name}.` **/** `… subscribed to your {content}.` — line 2: `Recurring while the subscription is active.`
  - *Renewal:* `@{subscriber_username} renewed their subscription to your {indicator} {indicator_name}.` **/** `… to your {content}.` — line 2: `Recurring while the subscription is active.`
  - *Referral (no indicator/content split — one pair):* first payment `Your referral @{referral_username} subscribed.` **/** renewal `Your referral @{referral_username} renewed their subscription.` — line 2 on both: `Earnings recur monthly while the subscription is active.`
  - **New subscription vs renewal (MB-3588):** *renewal* = the recurring charge on a **still-active** subscription. Anything that creates a **new** subscription — including a lapsed subscriber coming back months later — uses the *new subscription* copy; `subscribed to your …` is accurate there, it never claims to be their first ever. The boundary is whether the subscription actually lapsed: cancel-then-return **before** the paid period ends leaves the subscription alive, so its next charge is still a renewal.
  - **Referral rewards accrue from the first payment too**, not only from renewals — hence the pair. `-referral-renewal` alone would tell the seller "your referral renewed" at the moment that person subscribed for the first time.
  - **Filename trap:** in the *new subscription* pair the unsuffixed file is the **indicator** one (`-new-subscription` vs `-new-subscription-content`); in the *renewal* pair the unsuffixed file is the **content** one (`-renewal` vs `-renewal-indicator`). Exactly opposite — check the table in §12 before wiring.
- **CTA button** — black, radius 8, 12×24. Common labels: Open Now, Subscribe to Unlock, View Post, Open Chart, View Dashboard, Back to Community, Reset Password, Check it Out. Optional fallback line: "If you don't see the button, click here: {link}".
- **Bulleted list** — `•` (20px column) + 14px text rows.
- **Info card (two-column, clickable)** — `#F3F6FA` blocks **296px** wide, gap 8, two per row (wrap). Bold title + `➞` (`&#10142;`) + 12px description. **Whole block is a link** (anchor wraps content). Used in "Next steps" / "How it works".
- **Avatar + username row (community)** — 24px round avatar + SemiBold username + timestamp (12px `#828C99`); avatar & username clickable to profile (style unchanged, just `text-decoration:none`). **Default fallback (design logic):** if the author has no avatar, use the platform **default profile avatar** — the same default the app shows on a profile with no picture (not a broken/empty image).
  - **Timestamp format (design logic):** show **hours since publication** (`{N}h ago`, e.g. `2h ago`) **only for the same calendar day**. Once the post is no longer from today (i.e. after that day's 23:59 rolls over), show a **plain date** instead of an ever-growing hour count. Backend supplies the resolved string.
- **Comment / reply card** — `#F3F6FA` radius 12 pad 20: avatar + "{username} left a comment." + meta "{date} • Community {Posts}" + comment text + blue `...more`. **Whole card is one clickable anchor → the post** (`takeprofit.com/posts/{post-slug}`): single block `<a>` (padding on the anchor, `<td>` padding `0`), **no nested links** — avatar and `...more` are plain (not their own `<a>`).
- **Feed content card** — `#F3F6FA` radius 8 pad 20: avatar+user+time + optional top-right **type/status badge** + `{Content_title}` (SemiBold) + `{Content_Subtitle}` + optional cover image (560 wide, radius 8). **Four templates cover the whole family** — see the selection matrix below; the card body is identical in all four, only badge / cover / URL / CTA label change.
  - **Top-right badge** (right side of the avatar row): **"For Subscribers"** (paid content) — IBM Plex Sans Regular **12px**, gold **`#8C6503`** (`lemon/900`), followed by a **coin icon 16×16** (`Coin_L.png`, 48×48 source, ~4px gap, right-aligned). The older orange `INDICATOR` badge (`#FF4F03`, Condensed uppercase) is deprecated for these paid emails.
  - **Character limits:** all texts **above the cover image** (title, subtitle) are clamped to the same character limits as production **desktop/mobile** — single line, truncated with `…` (the backend truncates before sending; don't let long copy wrap or push the image down).
  - **Whole grey card is one click target** — `{content_url}`, or `{subscribe_url}` on the two no-access variants (card and CTA always share the same URL): a single block-level `<a style="display:block;padding:20px;…">` wraps the entire card (padding on the anchor, `<td>` padding `0`) — **not** per-element links on avatar/title/subtitle/image.
  - **Cover image** — fixed width (560 / `width:100%`), **height follows the content type's cover aspect ratio** (indicator / post / screener / stories each differ) — never hard-code a single height; let the correctly-sized cover asset drive it.
  - **CTA labels** by case: **Open Now** (free) / **View Post** (paid, access granted) / **Subscribe to Unlock** (both no-access variants).
  - **Cover presence by content type:** **indicators** always have a cover (indicator screenshot from the backend); **screeners** always have a cover (backend supplies the user's cover *or* its default — no AWS fallback on our side); **posts** may have **no** cover. A missing cover is **not** a separate template: the cover block is wrapped in `{{#if cover_url}} … {{/if}}` markers and the renderer drops it. We do **not** substitute a default cover from AWS — every cover (defaults included) arrives from the backend.
  - **Sample PNG vs `{cover_url}`:** the `src` in these files keeps a real S3 sample so the Netlify previews render; the backend substitutes `{cover_url}`. Same convention as every other placeholder image in the repo.
  - **Default fallback we DO handle:** no author avatar → default profile avatar `UserPic.png` (see avatar row above).
  - **Template selection matrix** — three backend inputs (`content_type`, `is_paid`, `has_access`) pick exactly one file:

    | Case | File | Badge | Cover | Card + CTA URL | CTA |
    |---|---|---|---|---|---|
    | Free content, any type | `new-content-indicator-or-post-or-screener.html` | — | real, if any | `{content_url}` | Open Now |
    | Paid, access granted (bought) | `new-content-post-or-indicator-subscribed-follower.html` | For Subscribers | real, if any | `{content_url}` | View Post |
    | Paid **indicator / screener**, no access | `new-content-post-or-indicator-not-subscribed-follower.html` | For Subscribers | **real, unblurred** | `{subscribe_url}` | Subscribe to Unlock |
    | Paid **post**, no access | `new-content-post-or-indicator-locked.html` | For Subscribers | pre-blurred `post-locked.png`, if any | `{subscribe_url}` | Subscribe to Unlock |

  - **Blur rule** — blur applies **only** to `is_paid && content_type == post && !has_access`. Indicator screenshots and screener covers are public on the platform even without a purchase, so the email must not hide them; hiding them would make the email stricter than the product. Email can't blur — the locked cover arrives pre-rendered from the backend.
  - **`{subscribe_url}` fallback** — if the backend has no subscribe URL for the creator, fall back to `{content_url}` (the platform then shows its own paywall).
- **Big image / GIF** — 600 wide, radius 8 (e.g. born-to-earn banner). Wrap in a link when it's a banner.
- **Ticker chip (alerts)** — small pill: bg `#F3F6FA`, border 0.5px `#D5DAE0`, radius 4. Inside: orange logo block (`#E7973D`, **fixed 41×20**, radius 3, "floats" with ~2px light margin) holding a square coin PNG (~18px centered) + ticker text `{ticker}` (Condensed 14, UPPERCASE, letter-spacing 1px). Ticker text width varies by symbol. Whole chip can be a link (e.g. → takeprofit.com/platform).
- **Criteria block (alerts)** — `#F3F6FA` radius 8 pad 8, 14px: "{Source} {Criteria} {Target}" (one or several joined with `&`).
- **Outro** — "— The TakeProfit Team" or "Until next time, The TakeProfit Team 🤘".

## 7. Email families (built)
- **Auth/account:** activate email, Reset password, Set a New Password (Exchange / Google linking).
- **Indicator lifecycle:** SentForReview, Approved (+ no-comment), Rejected (with "Submission Guidelines / Support" clickable blocks; Support = `mailto:support@takeprofit.com` with prefilled subject/body).
  - **The approval comment is real and live** (verified on prod 21.08.2026). The moderator's *resolution comment* from the Retool review flow lands in the grey `#F3F6FA` box as `{text}`; when there is none the backend sends the `-no-comment` variant instead. Keep both files — the pair is what makes an empty comment render cleanly rather than as an empty grey box. (Linear [MB-1068](https://linear.app/takeprofit/issue/MB-1068) still describes this as unbuilt; it is stale.)
- **Community moderation:** YourReportHasBeenReceived, YourReportHasBeenReviewed, ContentViolationNotice.
- **Social:** SomeoneCommentedOnYourPost, SomeoneRepliedToYourComment, UserStartedFollowingYou (60px avatar + "{Username} just followed you").
- **Feed content notifications:** four templates driven by one matrix (`content_type` × `is_paid` × `has_access`) — free / paid-with-access / paid indicator-or-screener without access / paid post without access. Same card everywhere; badge, cover, URL and CTA label are the only variables. See §6 for the matrix.
  - **Recipients:** followers of the creator. A paid subscriber is expected to be a follower too (subscribing auto-follows) — **backend to confirm**; if that ever stops holding, subscribers must be added to the audience explicitly or they'd miss the content they paid for.
  - **Notification settings group:** `FeedUpdates` — "content appeared in the feed of someone you follow". Not `Followers` (that group is "someone followed *you*" → `user-started-following-you`) and not `Subscribers` (that's the money family, `paid-subscriber-*`). No new group is needed; the existing frontend toggle covers all four.
- **Transactions:** PaidSubscriber — big price + caption + View Dashboard. **Six variants:** new subscription (`-new-subscription` = indicator, `-new-subscription-content`), renewal (`-renewal` = content, `-renewal-indicator`), referral (`-referral-new-subscription`, `-referral-renewal`). "New subscription" means *a new subscription starts* — not *the subscriber's first ever*; see §6 for the renewal boundary and the filename trap.
- **Alerts:** Alert-SingleCriteria, Alert-MultipleCriteria — ticker chip + criteria + Open Chart.
- **Onboarding/monetization:** First User Subscribed (Discord pill, banner, 4 "how it works" cards, View Dashboard). Copy is **repo-canonical** — the Figma community board (node `91-8663`) shows newer alternate copy (e.g. "Payout after $100", "Set Up Your Cash Machine") that we intentionally did **not** adopt; revisit only if the designer asks.

## 8. Mandatory conventions (checklist before "done")
1. **Preheader** — hidden `<div>` with meaningful inbox-preview text (specific to the email).
2. **Preview-text suppressor** — the hidden `&zwnj;&nbsp;` spacer block right after the preheader (stops random body text leaking into the preview). Both are required on every email.
3. **Clean direct links only** — never ship tracking wrappers (`awstrack.me`, customer.io `email.m.takeprofit.com`, `dev.test.tpinf.in`). Decode to the real `takeprofit.com/...` URL.
4. **Reply-To** is a sending-side (ESP) setting, not HTML. Set it to **`support@takeprofit.com`** on every email where the stack allows it (see the sender table in §12). **From** (sender name + address) is also send-side and is set **per family** — see §12.
5. **Outlook/Gmail caveats** — web fonts & full-padding click areas degrade gracefully; never rely on them being pixel-perfect everywhere.

## 9. Placeholder convention
Curly `{...}` tokens the backend fills: `{username}`, `{amount}`, `{ticker}`, `{N}`, `{Source}/{Criteria}/{Target}`, `{Content_title}/{Content_Subtitle}`, `{post/comment}`, `{unsubscribe_url}`, `{content_url}`, `{subscribe_url}`, `{chart_url}`, `{dashboard_url}`, etc. Keep them literal in the HTML.

## 10. Assets
- S3 base: `https://takeprofit-static.s3.eu-central-1.amazonaws.com/`
- Known: `logo-top.png` (header 32×40), `takeprofit.com-footer.png` (footer 150×19), `Ava.png` (24px sample avatar), `crypto_bitcoin.png` (ticker coin), `born-to-earn.png` (monetization banner).
- **Footer social icons — 16×16 square set** (order Discord→X→Facebook→Instagram→Reddit→LinkedIn, 16px gap): `Discord-Icon.png`, `x-icon.png`, `facebook-icon.png`, `Instagram-icon.png`, `Reddit-icon.png`, `LinkedIn-icon.png` (48×48 source, displayed 16×16). Old non-square `*%404x.png` icons are **deprecated** — don't reuse.
- **Default fallback asset:** **default profile avatar** = `UserPic.png` (675×675 square, shown at 24px round) when the author has no picture. **No default-cover asset** — covers always come from the backend (indicators: screenshot; screeners: user or backend default; posts: may have none → use the no-cover email variant).
- **"For Subscribers" coin** = `Coin_L.png` (48×48 source, shown 16×16 gold coin next to the badge) — **must be a hosted PNG** (email can't render a Figma vector; emoji is off-brand/inconsistent).
- **Locked-cover placeholder** (backend replaces with the real pre-blurred cover): `post-locked.png` — used only by the locked **post** variant. `post-with-pic-locked.png` is retired (it was a second sample of the same state).
- Locked/blurred covers must be **pre-rendered** server-side (email can't blur or overlay reliably).

### 10.1 Retina rule
Every raster asset is uploaded at **3× its rendered size** (that's what the bucket already holds: `Ava.png` 96px shown at 24, icons 48px shown at 16, covers 1680px shown at 560). In the HTML always state the **logical** size — `width="16" height="16"` plus `style="width:16px;height:16px;display:block"` — never the source size. 2× is the floor; don't go below it.

### 10.2 Uploading to S3 (the one gotcha)
The bucket **has no bucket policy** — public read is granted **per object** via the `public-read` ACL. An upload without that ACL succeeds, but the URL then answers **403** and the image silently breaks in the email. Verified behaviour, not a guess.

- Credentials: IAM user `takeprofit-static-uploader`, profile **`tp-static`** in `~/.aws/credentials` (region `eu-central-1`). Never commit keys to this repo.
- Granted: `ListBucket`, `GetObject`, `PutObject`, `PutObjectAcl`, `DeleteObject`. Not granted: anything that changes the bucket itself.
- **Preferred path — `python tools/upload-assets.py <prefix> <files…>`**: sets the ACL, the `Content-Type` and `Cache-Control: public, max-age=31536000, immutable`, then verifies every URL with a real HTTPS GET and prints the ready-to-paste links.
- By hand the ACL flag is mandatory:
  ```
  aws s3 cp file.png s3://takeprofit-static/emails/<email-name>/ \
      --acl public-read --profile tp-static
  ```
- **Key layout:** new assets go under `emails/<email-name>/…` (kebab-case, matching the HTML filename). The bucket root is legacy — shared assets already there (logo, footer icons, `UserPic.png`) stay where they are and keep their current URLs.
- Assets are cached for a year, so **filenames are immutable**: a changed image ships under a new name (e.g. `cover-v2.png`), never as an overwrite.

## 11. Working from Figma (design → email)
- Email HTML can't be auto-generated from Figma (Figma exports flex/div). Use Figma only to read exact **values** (text, colors, sizes, spacing) and a screenshot, then adapt into the table-based components above.
- Per content type pick: which header (with/without Discord pill), which footer (transactional vs unsubscribe), which blocks, which CTA label.
- When tokens aren't given, reuse the values in this guide; ask for real asset URLs and link targets.

### 11.1 Figma → S3 → Customer.io pipeline
Standing flow for a new marketing/notification email, run end to end from Claude Code (the Figma MCP connector reads the file directly):

1. **Input:** a link to the specific Figma **frame** (not the whole file).
2. **Export** the frame's images as PNG at **3×** (§10.1).
3. **Upload** with `tools/upload-assets.py` under `emails/<email-name>/` — ACL, headers and the HTTPS 200 check happen there (§10.2).
4. **Build the HTML** in this repo from the blocks in §6 — reading Figma for values only, never for markup — with the real S3 URLs substituted in.
5. **Changelog + push** (§0) → Netlify redeploys the preview.
6. **Paste the HTML into Customer.io**, then update the Notion row (subject, preheader, preview URL).

Rule of thumb: nothing goes into a template until its URL has actually answered 200 — a `403` here looks identical to a working template in the source.

---

## 12. Subjects, preheaders & senders (per email)
Subject = inbox line; Preheader = hidden preview text right after it (also lives in the HTML, see §8). Keep `{...}` tokens — backend fills them. These values are synced from the **Notion table "TakeProfit-Emails"** (the source of truth) — if this snapshot disagrees with Notion, Notion wins.

**From (sender name + address)** is set per **family** — one sender per family, listed under each heading below. **Reply-To = `support@takeprofit.com`** on every email where the sending stack technically allows it (it's an ESP/send-side setting, not HTML — see §8.4). Sender summary:

| Family | From |
|---|---|
| Auth / account · Onboarding / monetization · Transactions | `TakeProfit <hi@acc.takeprofit.com>` |
| Alerts | `TakeProfit Alerts <alerts@acc.takeprofit.com>` |
| Indicator lifecycle | `TakeProfit Marketplace <marketplace@takeprofit.com>` (note: `takeprofit.com`, not `acc.`) |
| Social · Feed content | `TakeProfit Community <community@acc.takeprofit.com>` |
| Community moderation | `TakeProfit Support Squad <support@acc.takeprofit.com>` |

### Auth / account
**From:** `TakeProfit <hi@acc.takeprofit.com>` · **Reply-To:** `support@takeprofit.com`
| Email | Subject | Preheader |
|---|---|---|
| activate email | Activate your TakeProfit account | Verify your email address to complete your registration. Click to activate. |
| Reset password | Reset your TakeProfit password | Use the secure link inside to reset your password. Click to proceed. |
| Set a New Password — Exchange linking | Set a new password to link your exchange account | Authorize your exchange login to complete account linking. Click to set up. |
| Set a New Password — Google linking | Set a new password to link your Google account | Authorize your Google login to complete account linking. Click to set up. |
| Set a New Password — link accounts (legacy) | Set a new password to link your accounts | Authorize your login to complete the account linking process. Click to set up. |

### Indicator lifecycle
**From:** `TakeProfit Marketplace <marketplace@takeprofit.com>` · **Reply-To:** `support@takeprofit.com`
| Email | Subject | Preheader |
|---|---|---|
| Sent for review | Your indicator is under review | The verification process takes 2–4 business days. Click to track your submission. |
| Approved (+ no-comment) | Your indicator has been approved | Click to view it in the platform. |
| Rejected | Your indicator needs a few refinements | A few adjustments are needed before we can publish your indicator. Click to review. |

### Community moderation
**From:** `TakeProfit Support Squad <support@acc.takeprofit.com>` · **Reply-To:** `support@takeprofit.com`
| Email | Subject | Preheader |
|---|---|---|
| Report received | We've received your report | Thank you for helping us keep the TakeProfit community safe. |
| Report reviewed | Update on your report | We reviewed the content you flagged in the community. Click to see the outcome. |
| Content violation notice | Content violation notice | Your recent post or comment was flagged for violating community guidelines. Click to review. |

### Social
**From:** `TakeProfit Community <community@acc.takeprofit.com>` · **Reply-To:** `support@takeprofit.com`
| Email | Subject | Preheader |
|---|---|---|
| Someone commented on your post | {username} commented on your post | Click to view it now. |
| Someone replied to your comment | {username} replied to your comment | Click to read the response. |
| User started following you | You have a new follower | @{username} just started following your profile. |

### Feed content notifications
**From:** `TakeProfit Community <community@acc.takeprofit.com>` · **Reply-To:** `support@takeprofit.com`
| Email (case) | Subject | Preheader |
|---|---|---|
| Free content, any type | {creator} published a new {post/indicator/screener} | Check out {Content_title} on TakeProfit to stay ahead of the market. |
| Paid, access granted | New post from {creator}: {post/indicator/screener} | Access the latest analysis from {creator}. Check it out now. |
| Paid indicator / screener, no access | New post from {creator}: {post/indicator/screener} | Access the latest analysis from {creator}. Check it out now. |
| Paid post, no access (blurred) | New subscriber-only post from {creator}: {post/indicator/screener} | New premium content is live on your feed. Read your subscriber-only update. |

> **Notion follow-up (MB-3587):** the *with-pic not-subscribed follower* row is retired — delete it from the Notion table. The remaining four rows keep their current subjects; if the wording should follow the new case names, change it in Notion first, then re-sync here and in `emails.json`.

### Transactions (paid subscriber / referral)
**From:** `TakeProfit <hi@acc.takeprofit.com>` · **Reply-To:** `support@takeprofit.com`
| Email | Subject | Preheader |
|---|---|---|
| New subscription — indicator | New subscription reward received: +{amount} | @{subscriber_username} subscribed to your {indicator} {indicator_name}. Track your earnings in the Rewards Hub. |
| New subscription — content | New subscription reward received: +{amount} | @{subscriber_username} subscribed to your {content}. Track your earnings in the Rewards Hub. |
| Renewal — content | Subscription renewal reward received: +{amount} | @{subscriber_username} just renewed their subscription to your {content}. Track your earnings in the Rewards Hub. |
| Renewal — indicator | Subscription renewal reward received: +{amount} | @{subscriber_username} just renewed their subscription to your {indicator} {indicator_name}. Track your earnings in the Rewards Hub. |
| Referral — first payment | Referral reward received: +{amount} | @{referral_username} just subscribed. Track your earnings in the Rewards Hub. |
| Referral — renewal | Referral reward received: +{amount} | @{referral_username} just renewed their subscription. Track your earnings in the Rewards Hub. |

> **Copy sign-off pending (MB-3588):** the *Referral — first payment* subject reuses the neutral referral subject; its body (`Your referral @{referral_username} subscribed.`) and preheader were written to mirror the renewal variant. Confirm the wording, then make Notion the source of truth for it.

### Alerts
**From:** `TakeProfit Alerts <alerts@acc.takeprofit.com>` · **Reply-To:** `support@takeprofit.com`
- **Subject pattern (from backend):** `{ticker} Alert Triggered: {condition} {value}` — e.g. `BTC/USD Alert Triggered: Crossing 83509.45`.
| Email | Subject | Preheader |
|---|---|---|
| Alert — single criterion | {ticker} Alert Triggered: {condition} {value} | {source} alert just matched your criteria. Check the chart now. |
| Alert — multiple criteria | {ticker} Alert Triggered: {condition} {value} | {source} matched your custom multi-criteria setup. Check the chart now. |

### Onboarding / monetization
**From:** `TakeProfit <hi@acc.takeprofit.com>` · **Reply-To:** `support@takeprofit.com`
| Email | Subject | Preheader |
|---|---|---|
| First subscriber | Your first paid subscriber is in! | Your trading knowledge is turning into revenue. Track your balance in the Rewards Hub. |
| Welcome | Your Trade & Earn Journey starts here | Welcome to TakeProfit. Set up your workspace and unlock your cash rewards. |

---

## 13. Test sends (index page → Netlify → AWS SES)
Each email on the [index page](https://emails-tp.netlify.app/) has a **Test** button: enter an address → it sends that exact template to your inbox, with the **subject & preheader from the Notion snapshot** (`emails.json`) and `{placeholders}` replaced by **sample values** (`sample-data.json`). The subject is prefixed `[TEST]`.
- **How:** static button → `POST /.netlify/functions/send-test { file, recipient }` → the function ([`netlify/functions/send-test.mjs`](netlify/functions/send-test.mjs)) fetches the template from the same deploy, renders it, and sends via **AWS SES**.
- **Recipients are restricted** to `@takeprofit.com` (env `TEST_ALLOWED_DOMAINS`) — it's an internal tool, not an open relay.
- **Netlify env vars** (Site settings → Environment variables): `SES_REGION` (e.g. `eu-central-1`), `SES_FROM` (verified sender, e.g. `TakeProfit <no-reply@takeprofit.com>`), `SES_AWS_ACCESS_KEY_ID`, `SES_AWS_SECRET_ACCESS_KEY` (IAM key with `ses:SendEmail`; custom names avoid Netlify's reserved `AWS_*`). In SES **sandbox**, recipients must also be verified until production access is granted.
- **`emails.json` is a build-time snapshot of Notion** — refresh it whenever subjects/preheaders change (part of the sync flow). The same endpoint can later be wired to a **Notion button** (automation → webhook) to trigger tests from the table and stamp the "Live test" column.

---

## 14. Monthly digest "What's New" (lives in Customer.io, **not** in this repo)

The monthly recap is a different animal from everything above: it is a **one-time send** (Customer.io calls the resource `newsletters`), its HTML is **not** kept in this repo, and each issue is built by **copying last month's issue** rather than authoring from scratch. Sections 1–12 still describe the markup; this section describes the flow.

Why not in the repo: each issue is disposable content, not a reusable template — the reusable part is the previous issue already sitting in Customer.io. Don't add digest HTML files here; don't add digest rows to Notion/`emails.json` (those cover transactional emails).

### 14.1 Where things live

| Thing | Where |
|---|---|
| Issue HTML | Customer.io template attached to the one-time send. Nowhere else. |
| Header / footer / unsubscribe | Customer.io **layout `9`** — "header footer for broadcasts". The template body is only the middle; it starts with a bare `<tr>` and is injected into the layout's table. |
| Copy (subject, preheader, body text) | A Google Doc per month, section **"Email"** (the same doc also holds "Platform" and "Mintlify" sections — those are not for the email). |
| Design | A Figma frame per month, e.g. "July 26". |
| Images | S3 `takeprofit-static`, **bucket root** — see 14.4. |

Workspace / environment id: **129567** (the only one the token can reach). Sender identities: `1` = `TakeProfit <hi@m.takeprofit.com>` (From), `5` = `TakeProfit Support Squad <support@takeprofit.com>` (Reply-To).

### 14.2 Build flow

Run from Claude Code with the Customer.io, Figma and Google Drive MCP connectors.

1. **Find last month's issue** — `GET /v1/environments/129567/newsletters`, look for `TakeProfit Update <Month> <Year>`. Note its id and `template_id`. (The recap ships in the *following* month: the June issue was created and sent in early July.)
2. **Check the template's `editor` before planning any body write.** The digest templates are `editor: "html"`, which is the only value that permits writing `body` through the API — `bee` is rejected with a 422 and `parcel` (Design Studio) silently clobbers the compiled output. Verify, don't assume.
3. **Copy it:** `POST /v1/environments/129567/newsletters/{id}/copy` with `{"copy_to_env": 129567}`. You get a new newsletter in `draft` plus its own template.
4. **Read the copy in Figma and the Doc** — block order and which words are links come from the frame; the wording comes from the Doc's "Email" section. Figma marks links as purple underlined spans but **does not expose the href**, so every target has to be resolved separately (14.5).
5. **Export and upload the images** (14.4).
6. **Write the content** with `PUT /v1/environments/129567/templates/{template_id}`:
   `name`, `subject`, `preheader_text`, `from_identity_id`, `reply_to_identity_id`, `body`. Keep `layout_id` as copied.
   Everything goes **inside a `template` object** — `{"template": {"body": …}}`. A flat body is rejected with `400 json: unknown field "body"`, and the fields are dropped whole, not partially applied.
7. **Repair what `copy` drops** (14.3).
8. **Leave it as a draft.** Do not call `POST .../forward` and do not `PUT` with `update_type: "send"` — the latter sends *immediately* and overwrites any pending schedule, with no confirmation step.

### 14.3 `copy` silently drops three things

The API copy is not the UI duplicate. After copying, restore each of these from last month's issue and verify by reading them back:

- **Audience** — `filters` comes back `null`. `PUT` with `update_type: "recipients"` and **all four** of `send_percentage`, `send_to_unsubscribed`, `deduped`, `use_message_limits` (omitting any returns `"<field> cannot be nil"`), plus the base64 `filters` string copied verbatim from the previous issue. The standing digest audience is *"Email verified" (segment 14) AND NOT ("competitotrs" (20) OR "tradingview employees" (27))*.
- **Conversion goal** — `PUT` with `update_type: "tracking"`: event `user_trial_started`, `conversion_action: "receiving"`, `conversion_window: 604800`, `conversion_type: "perform_event"`.
- **Tag** — `POST .../newsletters/{id}/tags` with `{"tags": [{"id": 11, "name": "updates"}]}`. Note the body shape: a `tags` array of objects; `{"tag_ids": [...]}` is rejected with a 400.

Also rename it: `PUT` with `update_type: "main"` and the new `name` — the copy arrives as `[Copy] <old name>`.

`update_type` is a discriminator: fields sent under the wrong one are ignored without an error, so one `PUT` per concern.

### 14.4 Digest images deviate from §10 — on purpose

Two deliberate differences from the transactional-email rules:

- **4×, not 3×** (§10.1). Cover is 600×170 logical → `2400×680`; body images 600×340 → `2400×1360`. That is what the existing June assets are; match them.
- **Bucket root, not `emails/<name>/`** (§10.2). June's live under `CoverJune.png`, `DateRange.png`, `Pane.png`; keep new ones there so the set stays together. Cover carries the month (`CoverJuly.png`); body images are named for the feature (`TPOCharts.png`, `AIAssistant.png`). Filenames are immutable (year-long cache) — **check for a name collision with `curl -o /dev/null -w '%{http_code}'` before uploading**, because an overwrite would break a past issue.

Export from the **email frame's own image nodes**, not from a separate "assets" section — those prepared frames are often stale or still empty placeholders, while the frame nodes are the exact crop the designer laid out. An export that comes back fully transparent means the slot is an unfilled placeholder: say so, don't ship an empty image.

**Check the alpha channel before uploading — Figma flattens the rounded corners onto white.** The image nodes carry an 8px corner radius, so the corners must be *transparent*; the MCP export composites them against the white canvas instead, and the resulting opaque white wedges are invisible in light mode but show up as bright notches in **Gmail's dark mode**, which inverts the email background but never the images. (Re-exporting a different node doesn't help — the bytes come back identical.) June's assets are the good reference: exactly **984 non-opaque pixels** on a 2400×1360 body image, **1068** on the 2400×680 cover, all of it inside the four corners.

```bash
py -c "from PIL import Image; a=Image.open('X.png').convert('RGBA').getchannel('A'); print(a.load()[0,0], sum(a.histogram()[:255]))"
# want: 0 <non-zero>   —  a corner alpha of 255 with 0 non-opaque pixels is the bug
```

The repair is to copy the alpha mask off the matching June asset and un-composite the antialiased edge (`S = (C - (255-a)) * 255 / a`, since the blend was against pure white) — restoring transparency alone leaves a light fringe. Then re-verify, and remember the fixed files need **new names** (`…-v2.png`) because the originals are already cached for a year.

Upload with `python tools/upload-assets.py "" <dir>` — the empty prefix puts files at the root, and the script still sets the ACL and verifies each URL.

### 14.5 Links are the part that actually takes time

The Doc has no URLs and Figma carries none, so every link target must be resolved and **verified with a real request** before it goes in. The stable ones:

| Target | URL |
|---|---|
| Changelog | `https://takeprofit.com/docs/guide/changelog` |
| Discord | `https://discord.com/invite/WVk8TjwU7p` |
| CTA "Go to Platform" | `https://takeprofit.com/platform` |
| Cover image | that month's recap post, `https://takeprofit.com/posts/<slug>` |

Feature links point into the docs. Resolve them with the **TakeProfit docs MCP** (`TakeProfit_SearchPlatformDocs` / `TakeProfit_SearchIndieDocs` / the two TOC tools) — the doc `file` maps to a URL: `guide/…​.mdx` → `https://takeprofit.com/docs/guide/…`, Indie pages → `https://takeprofit.com/docs/indie/…`.

**Expect the newest features to be undocumented.** The docs pages usually land after the digest is drafted. When there is no page, **leave the phrase as plain text with an HTML comment above it** —

```html
<!-- TODO: link "CSV file" — no docs page published yet -->
```

— and list every TODO when handing the draft over. A link into a page that doesn't mention the feature is worse than no link; guessing a URL that 404s is worse still.

### 14.6 Handover

The draft is finished when: `sent_at`, `scheduled_at`, `draft_scheduled_at` are all null and `sending` is false; every image URL answers 200; every `href` answers 200; From/Reply-To are `1`/`5`; audience, goal and tag are restored; and the remaining TODOs are listed explicitly. Scheduling and sending are the user's call — and both also require *Settings → AI & MCP → "Allow agent to edit live data"* in the workspace.
