import "server-only";
import { render } from "@react-email/render";
import { createTranslator } from "next-intl";
import nodemailer, { type Transporter } from "nodemailer";
import { ActionEmail } from "@/emails/action-email";
import type { Role } from "@/lib/db/schema/auth";
import type { Locale } from "@/lib/i18n/routing";
import ar from "@/messages/ar.json";
import en from "@/messages/en.json";

const MESSAGES = { en, ar } as const;

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export function asLocale(value: string | null | undefined): Locale {
  return value === "ar" ? "ar" : "en";
}

/** Keeps Latin values (emails, names) from scrambling inside Arabic text. */
const isolate = (value: string, locale: Locale) => (locale === "ar" ? `⁨${value}⁩` : value);

type Outgoing = { to: string | string[]; subject: string; html: string; text: string; replyTo?: string };

/** Last outgoing email per recipient — read by integration tests only. */
export const sentEmails: (Outgoing & { url?: string })[] = [];

/**
 * SMTP with an app password (Gmail by default: smtp.gmail.com:465). The sender
 * defaults to "RADIX <SMTP_USER>", so no custom domain is needed.
 */
let transporter: Transporter | null = null;
function smtp() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD?.replace(/\s+/g, ""); // Google shows app passwords in groups of four
  if (!user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 465);
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return { transporter, from: process.env.EMAIL_FROM || `RADIX <${user}>` };
}

/** Header values never carry line breaks (header injection). */
const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

async function deliver(message: Outgoing, url?: string) {
  const mailer = smtp();
  if (!mailer) {
    // EMAIL_TRANSPORT=console lets a local production build log links too; never set it on Vercel.
    if (process.env.NODE_ENV === "production" && process.env.EMAIL_TRANSPORT !== "console") {
      throw new Error("SMTP_USER / SMTP_PASSWORD are not set — cannot send email in production.");
    }
    const to = [message.to].flat().join(", ");
    sentEmails.push({ ...message, to, url });
    // End-to-end tests read emailed links from this file (never set in production).
    if (process.env.EMAIL_LOG_FILE) {
      const { appendFile } = await import("node:fs/promises");
      await appendFile(process.env.EMAIL_LOG_FILE, JSON.stringify({ to, subject: message.subject, url }) + "\n");
    }
    console.info(`\n[email] to=${to}\n[email] subject=${message.subject}\n[email] link=${url ?? "-"}\n`);
    return;
  }
  await mailer.transporter.sendMail({
    from: mailer.from,
    to: message.to,
    subject: oneLine(message.subject),
    html: message.html,
    text: message.text,
    ...(message.replyTo ? { replyTo: oneLine(message.replyTo) } : {}),
  });
}

async function sendActionEmail(params: {
  to: string;
  locale: Locale;
  kind: "invite" | "reset";
  url: string;
  values: Record<string, string>;
}) {
  const { to, locale, kind, url, values } = params;
  const t = createTranslator({ locale, messages: MESSAGES[locale], namespace: "emails" });
  const element = ActionEmail({
    locale,
    siteUrl: siteUrl(),
    preview: t(`${kind}.preview`),
    heading: t(`${kind}.heading`),
    body: t(`${kind}.body`, values),
    cta: t(`${kind}.cta`),
    url,
    linkFallback: t("linkFallback"),
    ignore: t("ignore"),
    footer: t("footer"),
  });
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  await deliver({ to, subject: t(`${kind}.subject`), html, text }, url);
}

export function resetPasswordUrl(token: string, invite = false) {
  const url = new URL("/admin/reset-password", siteUrl());
  url.searchParams.set("token", token);
  if (invite) url.searchParams.set("invite", "1");
  return url.toString();
}

export async function sendResetPasswordEmail(params: { to: string; locale: Locale; token: string }) {
  await sendActionEmail({
    to: params.to,
    locale: params.locale,
    kind: "reset",
    url: resetPasswordUrl(params.token),
    values: { email: isolate(params.to, params.locale) },
  });
}

export async function sendInviteEmail(params: {
  to: string;
  locale: Locale;
  token: string;
  inviterName: string;
  role: Role;
}) {
  const t = createTranslator({ locale: params.locale, messages: MESSAGES[params.locale], namespace: "emails.roles" });
  await sendActionEmail({
    to: params.to,
    locale: params.locale,
    kind: "invite",
    url: resetPasswordUrl(params.token, true),
    values: { inviter: isolate(params.inviterName, params.locale), role: t(params.role) },
  });
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Internal notification to the team for a new contact form message (Reply-To: the sender). */
export async function sendContactNotification(params: {
  to: string[];
  submission: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    message: string;
    locale: string;
    interests: string[];
  };
}) {
  const { submission: s } = params;
  const rows = (
    [
      ["Name", s.name],
      ["Email", s.email],
      ["Company", s.company ?? ""],
      ["Phone", s.phone ?? ""],
      ["Interested in", s.interests.join(", ")],
      ["Language", s.locale === "ar" ? "Arabic" : "English"],
    ] as [string, string][]
  ).filter(([, v]) => v);
  const inbox = `${siteUrl()}/admin/messages`;
  const text = [...rows.map(([k, v]) => `${k}: ${v}`), "", s.message, "", `Open the inbox: ${inbox}`].join("\n");
  const table = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#5B5263">${k}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
  const html = `<div style="font-family:Arial,sans-serif;color:#1B1028;line-height:1.5">
<p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#5B5263">New message · RADIX website</p>
<table style="border-collapse:collapse">${table}</table>
<p style="white-space:pre-wrap;border-left:2px solid #1B1028;padding-left:12px" dir="auto">${escapeHtml(s.message)}</p>
<p><a href="${inbox}" style="color:#1B1028">Open the inbox</a></p></div>`;
  await deliver({ to: params.to, subject: `New message from ${s.name}`, html, text, replyTo: s.email });
}
