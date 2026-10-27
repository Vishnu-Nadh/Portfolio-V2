import { MAX_LENGTH, validateContact, type ContactFields } from "@/lib/contact";

/**
 * Receives contact-form notes and forwards them as JSON to CONTACT_WEBHOOK_URL
 * (Slack/Discord/Zapier/etc.). Without a webhook, development logs the note;
 * production refuses it so the visitor is told to email instead of the note
 * being silently dropped.
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

  const note = {
    name: f.name.trim(),
    email: f.email.trim(),
    topic: f.topic.trim() || null,
    message: f.msg.trim(),
    receivedAt: new Date().toISOString(),
  };

  const hook = process.env.CONTACT_WEBHOOK_URL;
  if (hook) {
    const res = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...note,
        text: `New note from ${note.name} <${note.email}>${note.topic ? ` · ${note.topic}` : ""}\n\n${note.message}`,
      }),
    }).catch(() => null);
    if (!res || !res.ok) return Response.json({ ok: false, error: "Delivery failed" }, { status: 502 });
  } else if (process.env.NODE_ENV === "production") {
    console.error("[contact] CONTACT_WEBHOOK_URL is not set; note not delivered");
    return Response.json({ ok: false, error: "Contact delivery is not configured" }, { status: 503 });
  } else {
    console.info("[contact] note received (dev, no webhook)", note);
  }

  return Response.json({ ok: true });
}
