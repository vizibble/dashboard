// Vizibble transactional email templates

export type EmailJob =
  | { type: "verify-email"; to: string; name: string; url: string }
  | { type: "reset-password"; to: string; name: string; url: string }
  | { type: "password-changed"; to: string; name: string; resetUrl: string }
  | {
      type: "existing-account";
      to: string;
      name: string;
      loginUrl: string;
      resetUrl: string;
    }
  | { type: "invitation"; to: string; organisationName: string; url: string };

export type RenderedEmail = {
  subject: string;
  text: string;
  html: string;
};

const brand = {
  primary: "#3fafd5",
  primaryForeground: "#082f3b",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  background: "#f4f7f9",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function greeting(name: string): string {
  const first = name.trim().split(/\s+/)[0];
  return first ? `Hi ${first},` : "Hello,";
}

function link(url: string, label: string): string {
  return `<a href="${escapeHtml(url)}" style="color:${brand.primaryForeground};">${escapeHtml(label)}</a>`;
}

type LayoutInput = {
  preheader: string;
  heading: string;
  // Paragraphs are trusted HTML; escape user values before passing them in
  paragraphs: string[];
  action?: { label: string; url: string };
  footnote?: string;
};

function layout({
  preheader,
  heading,
  paragraphs,
  action,
  footnote,
}: LayoutInput): string {
  const body = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:${brand.text};">${p}</p>`,
    )
    .join("");

  const button = action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
        <tr><td style="border-radius:8px;background:${brand.primary};">
          <a href="${escapeHtml(action.url)}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:${brand.primaryForeground};text-decoration:none;border-radius:8px;">${escapeHtml(action.label)}</a>
        </td></tr>
      </table>
      <p style="margin:0 0 16px;font-size:13px;line-height:20px;color:${brand.muted};">If the button doesn't work, copy this link into your browser:<br><a href="${escapeHtml(action.url)}" style="color:${brand.primaryForeground};word-break:break-all;">${escapeHtml(action.url)}</a></p>`
    : "";

  const note = footnote
    ? `<p style="margin:16px 0 0;font-size:13px;line-height:20px;color:${brand.muted};">${escapeHtml(footnote)}</p>`
    : "";

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:${brand.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${brand.background};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="padding:0 4px 16px;">
          <span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:8px;background:${brand.primary};color:${brand.primaryForeground};font-weight:700;font-size:15px;vertical-align:middle;">V</span>
          <span style="font-size:19px;font-weight:700;color:${brand.text};vertical-align:middle;margin-left:8px;">Vizibble</span>
        </td></tr>
        <tr><td style="background:#ffffff;border:1px solid ${brand.border};border-radius:12px;padding:32px 28px;">
          <h1 style="margin:0 0 20px;font-size:20px;line-height:28px;font-weight:600;color:${brand.text};">${escapeHtml(heading)}</h1>
          ${body}${button}${note}
        </td></tr>
        <tr><td style="padding:16px 4px 0;font-size:12px;line-height:18px;color:${brand.muted};">
          You're receiving this email because of activity on your Vizibble account.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function plainText(lines: string[]): string {
  return [...lines, "", "The Vizibble Team"].join("\n");
}

export function renderEmail(job: EmailJob): RenderedEmail {
  switch (job.type) {
    case "verify-email": {
      const footnote =
        "This link expires in 1 hour. If you didn't create a Vizibble account, you can ignore this email.";
      return {
        subject: "Verify your email for Vizibble",
        text: plainText([
          greeting(job.name),
          "",
          "Confirm your email address to finish setting up your Vizibble account:",
          job.url,
          "",
          footnote,
        ]),
        html: layout({
          preheader: "Confirm your email to finish setting up your account.",
          heading: "Verify your email",
          paragraphs: [
            escapeHtml(greeting(job.name)),
            "Confirm your email address to finish setting up your Vizibble account.",
          ],
          action: { label: "Verify email", url: job.url },
          footnote,
        }),
      };
    }

    case "reset-password": {
      const footnote =
        "This link expires in 1 hour and works once. If you didn't ask to reset your password, ignore this email and your password will stay the same.";
      return {
        subject: "Reset your Vizibble password",
        text: plainText([
          greeting(job.name),
          "",
          "We received a request to reset your password. Open the link below to choose a new one:",
          job.url,
          "",
          footnote,
        ]),
        html: layout({
          preheader: "Use this link to choose a new password.",
          heading: "Reset your password",
          paragraphs: [
            escapeHtml(greeting(job.name)),
            "We received a request to reset your password. Use the button below to choose a new one.",
          ],
          action: { label: "Reset password", url: job.url },
          footnote,
        }),
      };
    }

    case "password-changed":
      return {
        subject: "Your Vizibble password was changed",
        text: plainText([
          greeting(job.name),
          "",
          "Your password was just changed, and you've been signed out on all devices.",
          "",
          `If you didn't make this change, reset your password now: ${job.resetUrl}`,
        ]),
        html: layout({
          preheader: "You've been signed out on all devices.",
          heading: "Your password was changed",
          paragraphs: [
            escapeHtml(greeting(job.name)),
            "Your password was just changed, and you've been signed out on all devices.",
            `If you didn't make this change, ${link(job.resetUrl, "reset your password now")}.`,
          ],
        }),
      };

    case "existing-account":
      return {
        subject: "Sign-up attempt with your email",
        text: plainText([
          greeting(job.name),
          "",
          "Someone tried to create a Vizibble account with this email address, but you already have one.",
          `Log in: ${job.loginUrl}`,
          `Forgot your password? ${job.resetUrl}`,
          "",
          "If this wasn't you, you don't need to do anything.",
        ]),
        html: layout({
          preheader: "You already have an account with this email.",
          heading: "You already have an account",
          paragraphs: [
            escapeHtml(greeting(job.name)),
            "Someone tried to create a Vizibble account with this email address, but you already have one.",
            `Forgot your password? ${link(job.resetUrl, "Reset it")}.`,
          ],
          action: { label: "Log in", url: job.loginUrl },
          footnote: "If this wasn't you, you don't need to do anything.",
        }),
      };

    case "invitation":
      return {
        subject: `You're invited to join ${job.organisationName} on Vizibble`,
        text: plainText([
          "Hello,",
          "",
          `You have been invited to join ${job.organisationName} on Vizibble.`,
          "",
          "To accept, open the link below and sign in or create an account using this email address:",
          job.url,
          "",
          "If you were not expecting this invitation, you can safely ignore this email.",
        ]),
        html: layout({
          preheader: `Join ${job.organisationName} on Vizibble.`,
          heading: `Join ${job.organisationName}`,
          paragraphs: [
            "Hello,",
            `You have been invited to join <strong>${escapeHtml(job.organisationName)}</strong> on Vizibble.`,
            `Sign in or create an account using this email address (${escapeHtml(job.to)}) to accept.`,
          ],
          action: { label: "Accept invitation", url: job.url },
          footnote:
            "If you were not expecting this invitation, you can safely ignore this email.",
        }),
      };
  }
}
