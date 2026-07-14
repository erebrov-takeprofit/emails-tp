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

Rules of thumb:
- **Changelog every update:** for each change, prepend a dated entry to the **Changelog** in `index.html` (newest first, listing what was added/fixed/updated, with links to the affected emails), then commit & push to `main` so Netlify redeploys. Omit any `Co-Authored-By` trailer (Netlify one-contributor rule).
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
- **Big Price** — `{amount}` at 96px SemiBold, centered (subscription/payout amount) + 14px centered 2-line caption (`<br>`) + CTA **View Dashboard** → `{dashboard_url}` (monetization dashboard). Paid-subscriber emails split **indicator vs content** (`{content}` = post/screener/etc.; for indicators show `{indicator} {indicator_name}`):
  - *First-time:* `@{subscriber_username} subscribed to your {indicator} {indicator_name}.` **/** `… subscribed to your {content}.` — line 2: `Recurring while the subscription is active.`
  - *Renewal:* `@{subscriber_username} renewed their subscription to your {indicator} {indicator_name}.` **/** `… to your {content}.` — line 2: `Recurring while the subscription is active.`
  - *Referral (single, no split):* `Your referral @{referral_username} renewed their subscription.` — line 2: `Earnings recur monthly while the subscription is active.`
- **CTA button** — black, radius 8, 12×24. Common labels: Open Now, Subscribe to Unlock, View Post, Open Chart, View Dashboard, Back to Community, Reset Password, Check it Out. Optional fallback line: "If you don't see the button, click here: {link}".
- **Bulleted list** — `•` (20px column) + 14px text rows.
- **Info card (two-column, clickable)** — `#F3F6FA` blocks **296px** wide, gap 8, two per row (wrap). Bold title + `➞` (`&#10142;`) + 12px description. **Whole block is a link** (anchor wraps content). Used in "Next steps" / "How it works".
- **Avatar + username row (community)** — 24px round avatar + SemiBold username + timestamp (12px `#828C99`); avatar & username clickable to profile (style unchanged, just `text-decoration:none`). **Default fallback (design logic):** if the author has no avatar, use the platform **default profile avatar** — the same default the app shows on a profile with no picture (not a broken/empty image).
  - **Timestamp format (design logic):** show **hours since publication** (`{N}h ago`, e.g. `2h ago`) **only for the same calendar day**. Once the post is no longer from today (i.e. after that day's 23:59 rolls over), show a **plain date** instead of an ever-growing hour count. Backend supplies the resolved string.
- **Comment / reply card** — `#F3F6FA` radius 12 pad 20: avatar + "{username} left a comment." + meta "{date} • Community {Posts}" + comment text + blue `...more`. **Whole card is one clickable anchor → the post** (`takeprofit.com/posts/{post-slug}`): single block `<a>` (padding on the anchor, `<td>` padding `0`), **no nested links** — avatar and `...more` are plain (not their own `<a>`).
- **Feed content card** — `#F3F6FA` radius 8 pad 20: avatar+user+time + optional top-right **type/status badge** + `{Content_title}` (SemiBold) + `{Content_Subtitle}` + cover image (560 wide, radius 8). One shared template serves **indicator / post / screener** (`new-content-indicator-or-post-or-screener.html`); paid variants share `new-content-post-or-indicator-*` (locked / not-subscribed-follower / with-pic-not-subscribed-follower / subscribed-follower).
  - **Top-right badge** (right side of the avatar row): **"For Subscribers"** (paid content) — IBM Plex Sans Regular **12px**, gold **`#8C6503`** (`lemon/900`), followed by a **coin icon 16×16** (`Coin_L.png`, 48×48 source, ~4px gap, right-aligned). The older orange `INDICATOR` badge (`#FF4F03`, Condensed uppercase) is deprecated for these paid emails.
  - **Character limits:** all texts **above the cover image** (title, subtitle) are clamped to the same character limits as production **desktop/mobile** — single line, truncated with `…` (the backend truncates before sending; don't let long copy wrap or push the image down).
  - **Whole grey card is one click target → the content** (`{content_url}`): a single block-level `<a style="display:block;padding:20px;…">` wraps the entire card (padding on the anchor, `<td>` padding `0`) — **not** per-element links on avatar/title/subtitle/image.
  - **Cover image** — fixed width (560 / `width:100%`), **height follows the content type's cover aspect ratio** (indicator / post / screener / stories each differ) — never hard-code a single height; let the correctly-sized cover asset drive it.
  - **CTA has 3 variants** by context: **Open** / **Subscribe** / **Comment**.
  - **Cover presence by content type:** **indicators** always have a cover (indicator screenshot from the backend); **screeners** always have a cover (backend supplies the user's cover *or* its default — no AWS fallback on our side); **posts** may have **no** cover → ship the **no-cover variant** (omit the cover image entirely; card = avatar + title + subtitle). We do **not** substitute a default cover from AWS — every cover (defaults included) arrives from the backend.
  - **Default fallback we DO handle:** no author avatar → default profile avatar `UserPic.png` (see avatar row above).
  - **Paid states** (all use the "For Subscribers" badge; whole card + CTA share one URL):
    - *Locked (post/indicator)* — pre-blurred cover `post-locked.png`, CTA **Subscribe to Unlock** → `{subscribe_url}`.
    - *Not-subscribed follower, no cover* — text-only card, CTA **Subscribe to Unlock** → `{subscribe_url}`.
    - *Not-subscribed follower, with pic* — blurred/locked cover `post-with-pic-locked.png`, CTA **Subscribe to Unlock** → `{subscribe_url}`.
    - *Subscribed follower* — full cover `new-content-post-for-subscribers.png`, CTA **View Post** → `{content_url}`.
    - Backend swaps the placeholder cover PNG for the real (pre-blurred) one; email can't blur.
- **Big image / GIF** — 600 wide, radius 8 (e.g. born-to-earn banner). Wrap in a link when it's a banner.
- **Ticker chip (alerts)** — small pill: bg `#F3F6FA`, border 0.5px `#D5DAE0`, radius 4. Inside: orange logo block (`#E7973D`, **fixed 41×20**, radius 3, "floats" with ~2px light margin) holding a square coin PNG (~18px centered) + ticker text `{ticker}` (Condensed 14, UPPERCASE, letter-spacing 1px). Ticker text width varies by symbol. Whole chip can be a link (e.g. → takeprofit.com/platform).
- **Criteria block (alerts)** — `#F3F6FA` radius 8 pad 8, 14px: "{Source} {Criteria} {Target}" (one or several joined with `&`).
- **Outro** — "— The TakeProfit Team" or "Until next time, The TakeProfit Team 🤘".

## 7. Email families (built)
- **Auth/account:** activate email, Reset password, Set a New Password (Exchange / Google linking).
- **Indicator lifecycle:** SentForReview, Approved (+ no-comment), Rejected (with "Submission Guidelines / Support" clickable blocks; Support = `mailto:support@takeprofit.com` with prefilled subject/body).
- **Community moderation:** YourReportHasBeenReceived, YourReportHasBeenReviewed, ContentViolationNotice.
- **Social:** SomeoneCommentedOnYourPost, SomeoneRepliedToYourComment, UserStartedFollowingYou (60px avatar + "{Username} just followed you").
- **Feed content notifications:** NewContentIndicator, NewContentPostLocked, NewContentPost-notSubscribedFollower, NewContentPost-SubscribedFollower (card + type badge + CTA Open/Subscribe/View).
- **Transactions:** PaidSubscriber — big price + caption + View Dashboard. **Five variants:** first-time (`-new-subscription` = indicator, `-new-subscription-content`), renewal (`-renewal` = content, `-renewal-indicator`), referral (`-referral-renewal`, single).
- **Alerts:** Alert-SingleCriteria, Alert-MultipleCriteria — ticker chip + criteria + Open Chart.
- **Onboarding/monetization:** First User Subscribed (Discord pill, banner, 4 "how it works" cards, View Dashboard). Copy is **repo-canonical** — the Figma community board (node `91-8663`) shows newer alternate copy (e.g. "Payout after $100", "Set Up Your Cash Machine") that we intentionally did **not** adopt; revisit only if the designer asks.

## 8. Mandatory conventions (checklist before "done")
1. **Preheader** — hidden `<div>` with meaningful inbox-preview text (specific to the email).
2. **Preview-text suppressor** — the hidden `&zwnj;&nbsp;` spacer block right after the preheader (stops random body text leaking into the preview). Both are required on every email.
3. **Clean direct links only** — never ship tracking wrappers (`awstrack.me`, customer.io `email.m.takeprofit.com`, `dev.test.tpinf.in`). Decode to the real `takeprofit.com/...` URL.
4. **Reply-To** for "reply to this email" copy is a sending-side (ESP) setting, not HTML.
5. **Outlook/Gmail caveats** — web fonts & full-padding click areas degrade gracefully; never rely on them being pixel-perfect everywhere.

## 9. Placeholder convention
Curly `{...}` tokens the backend fills: `{username}`, `{amount}`, `{ticker}`, `{N}`, `{Source}/{Criteria}/{Target}`, `{Content_title}/{Content_Subtitle}`, `{post/comment}`, `{unsubscribe_url}`, `{content_url}`, `{subscribe_url}`, `{chart_url}`, `{dashboard_url}`, etc. Keep them literal in the HTML.

## 10. Assets
- S3 base: `https://takeprofit-static.s3.eu-central-1.amazonaws.com/`
- Known: `logo-top.png` (header 32×40), `takeprofit.com-footer.png` (footer 150×19), `Ava.png` (24px sample avatar), `crypto_bitcoin.png` (ticker coin), `born-to-earn.png` (monetization banner).
- **Footer social icons — 16×16 square set** (order Discord→X→Facebook→Instagram→Reddit→LinkedIn, 16px gap): `Discord-Icon.png`, `x-icon.png`, `facebook-icon.png`, `Instagram-icon.png`, `Reddit-icon.png`, `LinkedIn-icon.png` (48×48 source, displayed 16×16). Old non-square `*%404x.png` icons are **deprecated** — don't reuse.
- **Default fallback asset:** **default profile avatar** = `UserPic.png` (675×675 square, shown at 24px round) when the author has no picture. **No default-cover asset** — covers always come from the backend (indicators: screenshot; screeners: user or backend default; posts: may have none → use the no-cover email variant).
- **"For Subscribers" coin** = `Coin_L.png` (48×48 source, shown 16×16 gold coin next to the badge) — **must be a hosted PNG** (email can't render a Figma vector; emoji is off-brand/inconsistent).
- **Locked-cover placeholders** (backend replaces with the real pre-blurred cover): `post-locked.png` (locked post/indicator), `post-with-pic-locked.png` (locked post that has a picture).
- Locked/blurred covers must be **pre-rendered** server-side (email can't blur or overlay reliably).

## 11. Working from Figma (design → email)
- Email HTML can't be auto-generated from Figma (Figma exports flex/div). Use Figma only to read exact **values** (text, colors, sizes, spacing) and a screenshot, then adapt into the table-based components above.
- Per content type pick: which header (with/without Discord pill), which footer (transactional vs unsubscribe), which blocks, which CTA label.
- When tokens aren't given, reuse the values in this guide; ask for real asset URLs and link targets.

---

## 12. Subjects & preheaders (per email)
Subject = inbox line; Preheader = hidden preview text right after it (also lives in the HTML, see §8). Keep `{...}` tokens — backend fills them. These values are synced from the **Notion table "TakeProfit-Emails"** (the source of truth) — if this snapshot disagrees with Notion, Notion wins.

### Auth / account
| Email | Subject | Preheader |
|---|---|---|
| activate email | Activate your TakeProfit account | Verify your email address to complete your registration. Click to activate. |
| Reset password | Reset your TakeProfit password | Use the secure link inside to reset your password. Click to proceed. |
| Set a New Password — Exchange linking | Set a new password to link your exchange account | Authorize your exchange login to complete account linking. Click to set up. |
| Set a New Password — Google linking | Set a new password to link your Google account | Authorize your Google login to complete account linking. Click to set up. |
| Set a New Password — link accounts (legacy) | Set a new password to link your accounts | Authorize your login to complete the account linking process. Click to set up. |

### Indicator lifecycle
| Email | Subject | Preheader |
|---|---|---|
| Sent for review | Your indicator is under review | The verification process takes 2–4 business days. Click to track your submission. |
| Approved (+ no-comment) | Your indicator has been approved | Click to view it in the platform. |
| Rejected | Your indicator needs a few refinements | A few adjustments are needed before we can publish your indicator. Click to review. |

### Community moderation
| Email | Subject | Preheader |
|---|---|---|
| Report received | We've received your report | Thank you for helping us keep the TakeProfit community safe. |
| Report reviewed | Update on your report | We reviewed the content you flagged in the community. Click to see the outcome. |
| Content violation notice | Content violation notice | Your recent post or comment was flagged for violating community guidelines. Click to review. |

### Social
| Email | Subject | Preheader |
|---|---|---|
| Someone commented on your post | {username} commented on your post | Click to view it now. |
| Someone replied to your comment | {username} replied to your comment | Click to read the response. |
| User started following you | You have a new follower | @{username} just started following your profile. |

### Feed content notifications
| Email | Subject | Preheader |
|---|---|---|
| New content — indicator | {creator} published a new {post/indicator/screener} | Check out {Content_title} on TakeProfit to stay ahead of the market. |
| New content — locked (subscribe) | New subscriber-only post from {creator}: {post/indicator/screener} | New premium content is live on your feed. Read your subscriber-only update. |
| New content — not-subscribed follower | New post from {creator}: {post/indicator/screener} | Access the latest analysis from {creator}. Check it out now. |
| New content — with-pic not-subscribed follower | New post from {creator}: {Content_title} | Access the latest analysis from {creator}. Check it out now. |
| New content — subscribed follower | New post from {creator}: {post/indicator/screener} | Access the latest analysis from {creator}. Check it out now. |

### Transactions (paid subscriber / referral)
| Email | Subject | Preheader |
|---|---|---|
| New subscription — indicator | New subscription reward received: +{amount} | @{subscriber_username} subscribed to your {indicator} {indicator_name}. Track your earnings in the Rewards Hub. |
| New subscription — content | New subscription reward received: +{amount} | @{subscriber_username} subscribed to your {content}. Track your earnings in the Rewards Hub. |
| Renewal — content | Subscription renewal reward received: +{amount} | @{subscriber_username} just renewed their subscription to your {content}. Track your earnings in the Rewards Hub. |
| Renewal — indicator | Subscription renewal reward received: +{amount} | @{subscriber_username} just renewed their subscription to your {indicator} {indicator_name}. Track your earnings in the Rewards Hub. |
| Referral renewal | Referral reward received: +{amount} | @{referral_username} just renewed their subscription. Track your earnings in the Rewards Hub. |

### Alerts
- **Subject pattern (from backend):** `{ticker} Alert Triggered: {condition} {value}` — e.g. `BTC/USD Alert Triggered: Crossing 83509.45`.
| Email | Subject | Preheader |
|---|---|---|
| Alert — single criterion | {ticker} Alert Triggered: {condition} {value} | {source} alert just matched your criteria. Check the chart now. |
| Alert — multiple criteria | {ticker} Alert Triggered: {condition} {value} | {source} matched your custom multi-criteria setup. Check the chart now. |

### Onboarding / monetization
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
