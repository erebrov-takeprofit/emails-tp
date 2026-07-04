// Netlify Function: send a TEST copy of one email template via AWS SES.
// POST { file, recipient } -> renders the template with sample data, subject +
// preheader from the Notion snapshot (emails.json), and sends it via SES.
//
// Required env vars (see netlify.toml): SES_REGION, SES_FROM,
// SES_AWS_ACCESS_KEY_ID, SES_AWS_SECRET_ACCESS_KEY. Optional: TEST_ALLOWED_DOMAINS.

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import emails from "../../emails.json";
import sample from "../../sample-data.json";

const SAMPLE_KEYS = Object.keys(sample)
  .filter((k) => k !== "_comment")
  .sort((a, b) => b.length - a.length); // longest first so no token is a prefix of another

function substitute(str) {
  for (const k of SAMPLE_KEYS) str = str.split(k).join(sample[k]);
  return str;
}

function injectPreheader(html, text) {
  // replace the content of the hidden preheader div so the preview text matches Notion
  const re = /(<!--\s*Preheader\s*-->\s*<div[^>]*>)([\s\S]*?)(<\/div>)/i;
  return re.test(html) ? html.replace(re, (m, a, b, c) => a + text + c) : html;
}

const json = (statusCode, body) => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let file, recipient;
  try {
    ({ file, recipient } = JSON.parse(event.body || "{}"));
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  // validate file against the known template whitelist
  const meta = file && file !== "_comment" ? emails[file] : null;
  if (!meta) return json(400, { error: `Unknown template: ${file || "(none)"}` });

  // validate recipient
  recipient = (recipient || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient))
    return json(400, { error: "Enter a valid email address" });

  const allowed = (process.env.TEST_ALLOWED_DOMAINS || "takeprofit.com")
    .split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
  const domain = recipient.split("@")[1].toLowerCase();
  if (allowed.length && !allowed.includes(domain))
    return json(403, { error: `Test sends are restricted to: ${allowed.join(", ")}` });

  // config check
  const { SES_REGION, SES_FROM, SES_AWS_ACCESS_KEY_ID, SES_AWS_SECRET_ACCESS_KEY } = process.env;
  if (!SES_REGION || !SES_FROM || !SES_AWS_ACCESS_KEY_ID || !SES_AWS_SECRET_ACCESS_KEY)
    return json(500, { error: "SES is not configured (missing env vars). See netlify.toml." });

  // fetch the template HTML from this same deploy
  const host = event.headers["x-forwarded-host"] || event.headers.host;
  const base = process.env.URL || `https://${host}`;
  let html;
  try {
    const res = await fetch(`${base}/${file}`);
    if (!res.ok) throw new Error(`fetch ${file} -> ${res.status}`);
    html = await res.text();
  } catch (e) {
    return json(502, { error: `Could not load template: ${e.message}` });
  }

  // render: sample values + Notion subject/preheader
  const subject = substitute(meta.subject);
  const preheader = substitute(meta.preheader);
  html = injectPreheader(substitute(html), preheader);

  const client = new SESClient({
    region: SES_REGION,
    credentials: { accessKeyId: SES_AWS_ACCESS_KEY_ID, secretAccessKey: SES_AWS_SECRET_ACCESS_KEY },
  });

  try {
    const out = await client.send(
      new SendEmailCommand({
        Source: SES_FROM,
        Destination: { ToAddresses: [recipient] },
        Message: {
          Subject: { Data: `[TEST] ${subject}`, Charset: "UTF-8" },
          Body: { Html: { Data: html, Charset: "UTF-8" } },
        },
      })
    );
    return json(200, { ok: true, messageId: out.MessageId, subject, to: recipient });
  } catch (e) {
    return json(502, { error: `SES send failed: ${e.name}: ${e.message}` });
  }
};
