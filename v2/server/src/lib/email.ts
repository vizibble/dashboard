import nodemailer from "nodemailer";

import { renderEmail, type EmailJob } from "@/lib/email-templates";
import { env } from "@/lib/env";
import { enqueueEmail } from "@/queues/email.queue";

// SMTP transport (any transactional provider's SMTP relay)
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
});

// Delivery (email worker only)
export async function deliverEmail(job: EmailJob): Promise<void> {
  const { subject, text, html } = renderEmail(job);
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: job.to,
    subject,
    text,
    html,
  });
}

// Frontend links
function frontendUrl(path: string): string {
  return new URL(path, env.FRONTEND_URL).toString();
}

// Better Auth callbacks
type AuthUser = { email: string; name: string };

export async function sendVerificationEmail({
  user,
  url,
}: {
  user: AuthUser;
  url: string;
}): Promise<void> {
  await enqueueEmail({
    type: "verify-email",
    to: user.email,
    name: user.name,
    url,
  });
}

export async function sendResetPasswordEmail({
  user,
  url,
}: {
  user: AuthUser;
  url: string;
}): Promise<void> {
  await enqueueEmail({
    type: "reset-password",
    to: user.email,
    name: user.name,
    url,
  });
}

export async function sendPasswordChangedEmail({
  user,
}: {
  user: AuthUser;
}): Promise<void> {
  await enqueueEmail({
    type: "password-changed",
    to: user.email,
    name: user.name,
    resetUrl: frontendUrl("/forgot-password"),
  });
}

export async function sendExistingAccountEmail({
  user,
}: {
  user: AuthUser;
}): Promise<void> {
  await enqueueEmail({
    type: "existing-account",
    to: user.email,
    name: user.name,
    loginUrl: frontendUrl("/login"),
    resetUrl: frontendUrl("/forgot-password"),
  });
}

export async function sendInvitationEmail({
  id,
  email,
  organization,
}: {
  id: string;
  email: string;
  organization: { name: string };
}): Promise<void> {
  const invitationUrl = new URL("/accept-invitation", env.FRONTEND_URL);
  invitationUrl.searchParams.set("id", id);

  await enqueueEmail({
    type: "invitation",
    to: email,
    organisationName: organization.name,
    url: invitationUrl.toString(),
  });
}
