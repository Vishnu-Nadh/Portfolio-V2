import { Resend } from "resend";
import { profile } from "@/content/site";
import { MAX_LENGTH, validateContact, type ContactFields } from "@/lib/contact";
import { contactEmail, type ContactNote } from "@/lib/contact-email";

/**
 * Receives contact-form notes and emails them to CONTACT_TO_EMAIL via Resend,
 * with reply-to set to the visitor so a reply goes straight to them.
 *
 * Env: RESEND_API_KEY, CONTACT_TO_EMAIL, optional CONTACT_FROM_EMAIL (must be
 * on a domain verified in Resend; defaults to Resend's test sender).
 * Without a key, development logs the note; production refuses it so the
 * visitor is told to email instead of the note being silently dropped.
 */
export async function POST(request: Request) {
  let body: Partial<ContactFields>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const f: ContactFields = {
    name: String(body.name ?? "").slice(0, MAX_LENGTH.name),
    email: String(body.email ?? "").slice(0, MAX_LENGTH.email),
    topic: String(body.topic ?? "").slice(0, MAX_LENGTH.topic),
    msg: String(body.msg ?? "").slice(0, MAX_LENGTH.msg),
  };
  const errors = validateContact(f);
  if (Object.keys(errors).length) return Response.json({ ok: false, errors }, { status: 422 });

  const note: ContactNote = {
    name: f.name.trim(),
    email: f.email.trim(),
    topic: f.topic.trim() || null,
    message: f.msg.trim(),
    receivedAt: new Date().toISOString(),
  };

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    if (process.env.NODE_ENV === "production") {
      console.error("[contact] RESEND_API_KEY / CONTACT_TO_EMAIL not set; note not delivered");
      return Response.json({ ok: false, error: "Contact delivery is not configured" }, { status: 503 });
    }
    console.info("[contact] note received (dev, email not configured)", note);
    return Response.json({ ok: true });
  }

  const { subject, text, html } = contactEmail(note);
  const { error } = await new Resend(apiKey).emails.send({
    from: process.env.CONTACT_FROM_EMAIL || `${profile.fullName} · Portfolio <onboarding@resend.dev>`,
    to,
    replyTo: note.email,
    subject,
    text,
    html,
    tags: [{ name: "source", value: "portfolio_contact" }],
  });
  if (error) {
    console.error("[contact] Resend rejected the note:", error.name, error.message);
    return Response.json({ ok: false, error: "Delivery failed" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
