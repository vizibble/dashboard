import { loadTemplate } from "../templateRepository.ts";
import { buildReportData } from "../report/buildReportData.ts";
import { sendEmail } from "./sendEmail.ts";
import { renderReportEmail } from "../../emails/renderReportEmails.tsx";
import fs from "fs";
import { collectAttachments } from "./collectAttachments.ts";

export async function sendReportEmail(
    userId: string,
    recipients: string[],
    subject: string,
) {
    const report = await loadTemplate(userId);

    const hydratedReport = await buildReportData(report);

    const attachments: any[] = [];

    for (const block of hydratedReport.blocks) {
        collectAttachments(block, attachments);
    }

    const html = await renderReportEmail(hydratedReport);
    fs.writeFileSync("email.html", html);

    await sendEmail(
        recipients,
        subject,
        html,
        attachments,
    );   


}