import { renderReportEmail } from "../emails/renderReportEmails.tsx";
import dotenv from "dotenv"
import { Router } from "express";
import { buildReportData } from "../services/report/buildReportData.ts";
import { loadTemplate } from "../services/templateRepository.ts";
import { sendReportEmail } from "../services/email/sendreportEmail.ts";
dotenv.config();
const emailRouter = Router();
const DEV_USER_ID = String(process.env.DEV_USER_ID);

emailRouter.get("/email-preview", async (req, res) => {
    const report = await loadTemplate(DEV_USER_ID);
    if (!report) {
        return res.status(404).send("No report template found.");
    }
    
    const hydratedReport = await buildReportData(report);
    //res.json(hydratedReport)
    const html = await renderReportEmail(hydratedReport);

    res.send(html);
});


emailRouter.post("/test-email", async (req, res) => {

    await sendReportEmail(
        DEV_USER_ID,
        [
            "slutcutter2@gmail.com",
        ],

        "Testing"
    );

    res.json({
        success: true,
    });

});

export default emailRouter;