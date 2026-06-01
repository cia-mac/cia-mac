import { sql } from './db';

/**
 * Email notifications for Starving Artist.
 *
 * Transport is Resend's REST API hit directly with fetch, so there is no extra
 * dependency to install. Everything here is built to be safe by default:
 *
 *   1. If RESEND_API_KEY is not set, sendEmail() is a no-op and returns false.
 *      The app then behaves exactly as it did before email existed.
 *   2. Nothing in this file ever throws. A mail failure must never break a
 *      signup, an approval, or a drop. Failures are logged and swallowed.
 *
 * To actually deliver mail you need, in Vercel env vars:
 *   RESEND_API_KEY   a key from https://resend.com (free up to 3k/mo)
 *   EMAIL_FROM       e.g. "Starving Artist <drops@eats.ciamac.com>"
 *                    Until a domain is verified in Resend, only
 *                    "onboarding@resend.dev" works, and Resend will only
 *                    deliver to the account owner's own address.
 *   APP_URL          optional, defaults to https://eats.ciamac.com
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/** True only when a Resend key is configured. Gates every code path below. */
function emailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY;
}

function appUrl(): string {
  const url = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://eats.ciamac.com';
  return url.replace(/\/+$/, '');
}

function fromAddress(): string {
  return process.env.EMAIL_FROM || 'Starving Artist <onboarding@resend.dev>';
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c
  );
}

function shell(heading: string, body: string, cta?: { label: string; href: string }): string {
  const button = cta
    ? `<p style="margin:24px 0;"><a href="${cta.href}" style="display:inline-block;background:#d9694a;color:#ffffff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600;">${escapeHtml(
        cta.label
      )}</a></p>`
    : '';
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:8px;color:#2a2622;">
    <h1 style="font-size:22px;margin:0 0 12px;">${escapeHtml(heading)}</h1>
    <div style="font-size:15px;line-height:1.55;color:#5a534c;">${body}</div>
    ${button}
    <p style="font-size:12px;color:#a59c92;margin-top:32px;">Starving Artist. Invite-only home-cooked food drops.</p>
  </div>`;
}

type Mail = { to: string | string[]; subject: string; html: string; text?: string };

/**
 * Low-level transport. Returns true only if Resend accepted the message.
 * No-ops (returns false) when RESEND_API_KEY is absent. Never throws.
 */
export async function sendEmail(mail: Mail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: Array.isArray(mail.to) ? mail.to : [mail.to],
        subject: mail.subject,
        html: mail.html,
        ...(mail.text ? { text: mail.text } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[email] Resend rejected message:', res.status, detail);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] send failed:', err);
    return false;
  }
}

async function adminEmails(): Promise<string[]> {
  try {
    const { rows } = await sql`SELECT email FROM users WHERE role = 'admin' AND status = 'approved'`;
    return rows.map((r) => r.email as string).filter(Boolean);
  } catch (err) {
    console.error('[email] could not load admin emails:', err);
    return [];
  }
}

async function approvedMemberEmails(): Promise<string[]> {
  try {
    const { rows } = await sql`SELECT email FROM users WHERE status = 'approved'`;
    return rows.map((r) => r.email as string).filter(Boolean);
  } catch (err) {
    console.error('[email] could not load member emails:', err);
    return [];
  }
}

/** Tell the kitchen owner that someone is waiting for approval. */
export async function notifyAdminNewSignup(name: string, email: string): Promise<void> {
  if (!emailEnabled()) return;
  try {
    const admins = await adminEmails();
    if (admins.length === 0) return;
    await sendEmail({
      to: admins,
      subject: `New access request from ${name}`,
      html: shell(
        'Someone wants in',
        `<p><strong>${escapeHtml(name)}</strong> (${escapeHtml(
          email
        )}) just requested access to Starving Artist.</p><p>Approve or decline them from the members page.</p>`,
        { label: 'Review members', href: `${appUrl()}/admin/members` }
      ),
    });
  } catch (err) {
    console.error('[email] notifyAdminNewSignup failed:', err);
  }
}

/** Tell a member they have been let in. */
export async function notifyMemberApproved(name: string, email: string): Promise<void> {
  if (!emailEnabled()) return;
  try {
    if (!email) return;
    await sendEmail({
      to: email,
      subject: "You're in. Welcome to Starving Artist",
      html: shell(
        `Welcome, ${escapeHtml(name || 'friend')}`,
        `<p>Your access was just approved. Log in any time, and order whenever a new drop goes up.</p>`,
        { label: 'Open Starving Artist', href: appUrl() }
      ),
    });
  } catch (err) {
    console.error('[email] notifyMemberApproved failed:', err);
  }
}

/** Tell every approved member that a fresh drop is live. */
export async function notifyNewDrop(title: string, dropId: number): Promise<void> {
  if (!emailEnabled()) return;
  try {
    const recipients = await approvedMemberEmails();
    if (recipients.length === 0) return;
    // Send one message per recipient so members never see each other's addresses.
    await Promise.allSettled(
      recipients.map((to) =>
        sendEmail({
          to,
          subject: `New drop: ${title}`,
          html: shell(
            'A new drop just landed',
            `<p><strong>${escapeHtml(
              title
            )}</strong> is up now. Get your order in before it closes.</p>`,
            { label: 'See the drop', href: `${appUrl()}/drops/${dropId}` }
          ),
        })
      )
    );
  } catch (err) {
    console.error('[email] notifyNewDrop failed:', err);
  }
}
