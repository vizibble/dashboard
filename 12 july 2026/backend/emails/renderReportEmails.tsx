import { render } from "@react-email/render";
import { ReportEmail } from "./reportEmail.tsx";

export async function renderReportEmail(template:any) {
    const html = await render(
        <ReportEmail
            template={template}
        />
    );

    return html;
}