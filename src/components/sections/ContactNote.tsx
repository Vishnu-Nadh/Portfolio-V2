"use client";

import { useRef, useState, type FormEvent } from "react";
import { contact } from "@/content/site";
import { Mask, SectionTag, primitives, type, underlineClass } from "@/design-system/primitives";
import { color } from "@/design-system/tokens";
import { emptyContact, validateContact, type ContactFields } from "@/lib/contact";
import { cx } from "@/lib/cx";
import { useMotion } from "@/lib/motion/MotionProvider";
import { SignalObject } from "../three/SignalObject";
import s from "./Contact.module.css";

type Status = "idle" | "sending" | "sent";
type Key = "name" | "email" | "msg";

const SEND_MIN_MS = 1200;

export function ContactNote() {
  const { engine } = useMotion();
  const [f, setFields] = useState<ContactFields>(emptyContact);
  const [touched, setTouched] = useState<Partial<Record<Key, boolean>>>({});
  const [tried, setTried] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [formH, setFormH] = useState(0);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const msgRef = useRef<HTMLTextAreaElement>(null);
  const signalRef = useRef<HTMLDivElement>(null);
  const formRow = useRef<HTMLDivElement>(null);

  const F = contact.form;
  const e = validateContact(f);
  const show = (k: Key) => ((tried || touched[k]) && e[k] ? e[k]! : "");
  const filled = [!!f.name.trim() && !e.name, !!f.email.trim() && !e.email, !!f.msg.trim() && !e.msg];
  const sending = status === "sending";
  const n = f.msg.trim().length;

  const set = (k: keyof ContactFields, v: string) => setFields((p) => ({ ...p, [k]: v }));
  const touch = (k: Key) => setTouched((t) => ({ ...t, [k]: true }));

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (sending) return;
    if (Object.keys(e).length) {
      setTried(true);
      const first = (["name", "email", "msg"] as Key[]).find((k) => e[k]);
      ({ name: nameRef, email: emailRef, msg: msgRef })[first!].current?.focus();
      return;
    }
    setStatus("sending");
    const sg = signalRef.current;
    const wide = innerWidth > 820;
    setFormH(wide && sg ? sg.offsetHeight : 0);
    if (sg && engine) {
      if (wide) {
        const row = formRow.current;
        if (row) engine.scrollToY(row.getBoundingClientRect().top + scrollY - Math.max(120, innerHeight * 0.15), 1.1);
      } else {
        const r = sg.getBoundingClientRect();
        engine.scrollToY(r.top + scrollY - Math.max(80, (innerHeight - r.height) / 2), 1.1);
      }
    }

    const [ok] = await Promise.all([
      fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) })
        .then((r) => r.ok)
        .catch(() => false),
      new Promise((r) => setTimeout(r, SEND_MIN_MS)),
    ]);
    if (!ok) {
      setStatus("idle");
      engine?.toast(contact.errors.sendFailed);
      return;
    }
    setStatus("sent");
    engine?.riseSent();
  }

  function reset() {
    setFormH(0);
    setStatus("idle");
    setTried(false);
    setTouched({});
    setFields(emptyContact);
  }

  const signalLabel =
    status === "sent" ? contact.signal.sent : sending ? contact.signal.sending : `${filled.filter(Boolean).length} / 3 ${contact.signal.complete}`;

  return (
    <div ref={formRow} data-r="g3" className={cx(primitives.grid3, s.note)}>
      <SectionTag data-reveal="" title={contact.noteTag.title} index={contact.noteTag.index} className={s.noteTag} />

      {status !== "sent" && (
        <form onSubmit={submit} noValidate aria-label="Contact form" className={s.form}>
          <div data-reveal="" data-d="100" className={s.pair}>
            <label className={s.field}>
              <span className={cx(type.label, s.fieldLabel)}>{F.name.label}</span>
              <input
                ref={nameRef}
                name="name"
                autoComplete="name"
                value={f.name}
                onChange={(ev) => set("name", ev.target.value)}
                onBlur={() => touch("name")}
                aria-invalid={show("name") ? "true" : "false"}
                aria-describedby="err-name"
                placeholder={F.name.placeholder}
                className={s.input}
              />
              <span id="err-name" role="alert" className={s.error}>
                {show("name")}
              </span>
            </label>
            <label className={s.field}>
              <span className={cx(type.label, s.fieldLabel)}>{F.email.label}</span>
              <input
                ref={emailRef}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={f.email}
                onChange={(ev) => set("email", ev.target.value)}
                onBlur={() => touch("email")}
                aria-invalid={show("email") ? "true" : "false"}
                aria-describedby="err-email"
                placeholder={F.email.placeholder}
                className={s.input}
              />
              <span id="err-email" role="alert" className={s.error}>
                {show("email")}
              </span>
            </label>
          </div>

          <div data-reveal="" data-d="180" role="group" aria-label="What is it about" className={s.topics}>
            <span className={cx(type.label, s.fieldLabel)}>
              {F.topic.label} <span className={s.optional}>{F.topic.optional}</span>
            </span>
            <div className={s.chips}>
              {F.topic.options.map((t) => {
                const on = f.topic === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set("topic", on ? "" : t)}
                    aria-pressed={on}
                    data-cursor={on ? F.deselect : F.select}
                    className={s.chip}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <label data-reveal="" data-d="260" className={s.field}>
            <span className={cx(type.label, s.fieldLabel)}>{F.message.label}</span>
            <textarea
              ref={msgRef}
              name="message"
              rows={3}
              value={f.msg}
              onChange={(ev) => set("msg", ev.target.value)}
              onBlur={() => touch("msg")}
              aria-invalid={show("msg") ? "true" : "false"}
              aria-describedby="err-msg"
              placeholder={F.message.placeholder}
              className={s.input}
            />
            <span id="err-msg" role="alert" className={s.errorRow}>
              <span className={s.errorText}>{show("msg")}</span>
              <span className={s.count}>{n ? n + " characters" : ""}</span>
            </span>
          </label>

          <div data-reveal="" data-d="320" className={s.submitRow}>
            <button type="submit" data-cursor={sending ? F.sending : F.send} data-magnet="" aria-busy={sending} className={cx(type.label, s.send)}>
              {sending ? F.sending : F.send}
              <span className={s.sendArrow}>→</span>
            </button>
            <span className={s.privacy}>{F.privacy}</span>
            <span data-r="sigmobile" aria-hidden="true" className={cx(type.label, s.sigMobile)}>
              <span className={s.sigDot} />
              {signalLabel}
            </span>
          </div>
        </form>
      )}

      {status === "sent" && (
        <div role="status" className={s.sent} style={{ minHeight: formH ? formH + "px" : "0px" }}>
          <Mask pad="display" className={s.thanksMask}>
            <div data-sentrise="" className={cx(type.display, s.thanks)}>
              {contact.sent.heading} <span className={type.accent}>{(f.name.trim().split(/\s+/)[0] || "").toLowerCase()}</span>
            </div>
          </Mask>
          <p className={s.sentBody}>{contact.sent.body(f.email.trim())}</p>
          <button type="button" onClick={reset} data-cursor={contact.sent.againCursor} className={cx(type.label, underlineClass, s.again)}>
            {contact.sent.again}
          </button>
        </div>
      )}

      <div ref={signalRef} data-r="signal" className={s.signal}>
        <div aria-hidden="true" className={s.signalGlow} />
        <SignalObject filled={filled} sent={status === "sent" || sending} rim={color.accent} />
        <div data-r="siglabel" className={cx(type.label, s.signalLabel)}>{signalLabel}</div>
      </div>
    </div>
  );
}
