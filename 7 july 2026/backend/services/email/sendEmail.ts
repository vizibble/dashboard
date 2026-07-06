import nodemailer from "nodemailer";


export async function sendEmail(
    recipients: string[],
    subject: string,
    html: string,
    attachments: any[]
)  {

    const transporter = nodemailer.createTransport({
        service: "gmail",

        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    transporter.verify((error, success) => {

        if (error) {
            console.error("SMTP connection failed:", error);
        } else {
            console.log("SMTP server is ready.");
        }

    });

    for (const recipient of recipients) {

        await transporter.sendMail({

            from: process.env.EMAIL_USER,

            to: recipient,

            subject,

            html,

            attachments,

        });

    }

}