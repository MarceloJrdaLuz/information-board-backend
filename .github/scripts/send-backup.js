const fs = require("fs");
const nodemailer = require("nodemailer");

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;
const to = process.env.EMAIL_TO;

async function main() {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: user,
    to,
    subject: "Database Backup",
    text: "Backup do banco em anexo.",
    attachments: [
      {
        filename: "backup.sql",
        content: fs.readFileSync("backup.sql"),
      },
    ],
  });

  console.log("✅ Email sent");
}

main().catch(err => {
  console.error("❌ Error sending email:", err);
  process.exit(1);
});
