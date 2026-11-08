import { profile } from "@/content/site";

export type ContactNote = { name: string; email: string; topic: string | null; message: string; receivedAt: string };

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
/** Header-safe: a visitor's name must not be able to break the subject line. */
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

/** The notification sent to the site owner for one contact-form note. */
export function contactEmail(note: ContactNote) {
  const name = oneLine(note.name);
  const topic = note.topic ? oneLine(note.topic) : null;
  const subject = `New note from ${name}${topic ? ` · ${topic}` : ""}`;
  const when = new Date(note.receivedAt).toLocaleString("en-GB", { timeZone: profile.timeZone, dateStyle: "medium", timeStyle: "short" });

  const text = [
    `${name} <${note.email}>`,
    topic ? `Topic: ${topic}` : null,
    `Received: ${when} ${profile.timeZoneLabel}`,
    "",
    note.message,
    "",
    "Reply to this email to answer them directly.",
  ]
    .filter((l) => l !== null)
    .join("\n");

  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 16px 4px 0;color:#8a8a88;font-size:12px;letter-spacing:.04em;text-transform:uppercase">${label}</td><td style="padding:4px 0;color:#111">${value}</td></tr>`;
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.55;color:#111;max-width:560px">
  <table style="border-collapse:collapse;margin-bottom:20px">
    ${row("From", `${escapeHtml(name)} &lt;<a href="mailto:${escapeHtml(note.email)}" style="color:#c8875a">${escapeHtml(note.email)}</a>&gt;`)}
    ${topic ? row("Topic", escapeHtml(topic)) : ""}
    ${row("Received", `${escapeHtml(when)} ${profile.timeZoneLabel}`)}
  </table>
  <div style="white-space:pre-wrap;border-left:2px solid #c8875a;padding-left:14px">${escapeHtml(note.message)}</div>
  <p style="margin-top:24px;color:#8a8a88;font-size:13px">Reply to this email to answer ${escapeHtml(name)} directly.</p>
</div>`;

  return { subject, text, html };
}
