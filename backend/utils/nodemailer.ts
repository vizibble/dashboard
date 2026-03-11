import nodemailer from 'nodemailer';

/** Shared nodemailer transporter — configured from SMTP_* env vars. */
const transporter = nodemailer.createTransport({
  host: process.env["SMTP_HOST"],
  port: Number(process.env["SMTP_PORT"] ?? 587),
  secure: process.env["SMTP_SECURE"] === "true",
  auth: {
    user: process.env["SMTP_USER"],
    pass: process.env["SMTP_PASS"],
  },
});

export default transporter;
