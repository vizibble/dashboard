import { renderReportEmail } from "../emails/renderReportEmails.tsx";
import dotenv from "dotenv"
import { Router } from "express";
import { buildReportData } from "../services/report/buildReportData.ts";
import { loadTemplate } from "../services/templateRepository.ts";
import { sendReportEmail } from "../services/email/sendreportEmail.ts";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../types/index.js";
import { getUserSettings } from "../models/user.js";

dotenv.config();
const emailRouter = Router();
// const DEV_USER_ID = String(process.env.DEV_USER_ID);

emailRouter.get("/email-preview", requireAuth,async (req, res) => {
    const userId = (req as AuthenticatedRequest).user.user_id;
    const report = await loadTemplate(userId);
    if (!report) {
        return res.status(404).send("No report template found.");
    }
    
    const hydratedReport = await buildReportData(report);
    //res.json(hydratedReport)
    const html = await renderReportEmail(hydratedReport);

    res.send(html);
});


emailRouter.post("/test-email", requireAuth, async (req, res) => {
    const userId = (req as AuthenticatedRequest).user.user_id;
    const settings = await getUserSettings(userId);
    const recipients = settings.alert_emails; // returns array of saved alert emails
    if (!recipients || recipients.length === 0) {
        return res.status(400).json({ error: "No alert emails configured in settings." });
    }
    await sendReportEmail(userId, recipients, "Testing");
    res.json({ success: true });
});

export default emailRouter;