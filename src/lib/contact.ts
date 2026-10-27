import { contact } from "@/content/site";

export type ContactFields = { name: string; email: string; topic: string; msg: string };
export type ContactErrors = Partial<Record<"name" | "email" | "msg", string>>;

export const emptyContact: ContactFields = { name: "", email: "", topic: "", msg: "" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MIN_MESSAGE = 10;
export const MAX_LENGTH = { name: 120, email: 254, topic: 60, msg: 5000 } as const;

/** Shared by the form and the API route so both enforce the same rules. */
export function validateContact(f: ContactFields): ContactErrors {
  const e: ContactErrors = {};
  const E = contact.errors;
  if (!f.name.trim()) e.name = E.nameMissing;
  if (!f.email.trim()) e.email = E.emailMissing;
  else if (!EMAIL.test(f.email.trim())) e.email = E.emailInvalid;
  if (f.msg.trim().length < MIN_MESSAGE) e.msg = f.msg.trim() ? E.messageShort : E.messageMissing;
  return e;
}
