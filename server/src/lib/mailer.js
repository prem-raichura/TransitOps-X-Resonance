// SMTP email service using Nodemailer.
// Configure via .env:
//   SMTP_HOST     e.g. smtp.gmail.com
//   SMTP_PORT     e.g. 587
//   SMTP_USER     sender email address
//   SMTP_PASS     app password / SMTP password
//   SMTP_FROM     display name + address, e.g. "TransitOps <noreply@transitops.in>"
//
// Gmail setup:
//   1. Enable 2-Step Verification on the Gmail account
//   2. Go to Google Account → Security → App Passwords → create one for "Mail"
//   3. Use that 16-char App Password as SMTP_PASS (NOT your Gmail login password)

const nodemailer = require('nodemailer')

let _transporter = null

function getTransporter() {
  if (_transporter) return _transporter
  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })
  return _transporter
}

/**
 * Send welcome email to a newly created staff member with their login credentials.
 * @param {{ name: string, email: string, password: string, role: string }} staff
 */
async function sendWelcomeEmail({ name, email, password, role }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[mailer] SMTP not configured — skipping welcome email for', email)
    return
  }

  const roleLabel = {
    DISPATCHER: 'Dispatcher',
    SAFETY_OFFICER: 'Safety Officer',
    FINANCIAL_ANALYST: 'Financial Analyst',
  }[role] || role

  const appUrl = process.env.CLIENT_URL || 'http://localhost:5173'
  const from = process.env.SMTP_FROM || `TransitOps <${process.env.SMTP_USER}>`

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Welcome to TransitOps</title>
    </head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="540" cellpadding="0" cellspacing="0"
              style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">

              <!-- Header -->
              <tr>
                <td style="background:#21313f;padding:28px 36px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <div style="display:inline-block;width:32px;height:32px;background:#f5b301;border-radius:6px;"></div>
                      </td>
                      <td style="padding-left:12px;">
                        <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:.3px;">TransitOps</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:36px 36px 28px;">
                  <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1e293b;">
                    Welcome, ${name}! 👋
                  </p>
                  <p style="margin:0 0 24px;font-size:14px;color:#64748b;">
                    Your <strong>${roleLabel}</strong> account on the TransitOps dashboard has been created by your Fleet Manager.
                  </p>

                  <!-- Credentials card -->
                  <table width="100%" cellpadding="0" cellspacing="0"
                    style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
                    <tr>
                      <td style="padding:20px 24px;">
                        <p style="margin:0 0 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;">
                          Your Login Credentials
                        </p>

                        <table cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                              <span style="font-size:12px;color:#94a3b8;display:block;">Login Email</span>
                              <span style="font-size:15px;font-weight:600;color:#1e293b;">${email}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:10px 0 0;">
                              <span style="font-size:12px;color:#94a3b8;display:block;">Password</span>
                              <span style="font-size:18px;font-weight:700;letter-spacing:3px;color:#1e293b;
                                background:#fff;border:1.5px dashed #f5b301;border-radius:6px;
                                padding:6px 14px;display:inline-block;margin-top:4px;font-family:monospace;">
                                ${password}
                              </span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:0 0 24px;font-size:13px;color:#64748b;">
                    ⚠️ Please <strong>change your password</strong> after your first login for security.
                  </p>

                  <!-- CTA Button -->
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background:#f5b301;border-radius:8px;">
                        <a href="${appUrl}/login"
                          style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;
                            color:#21313f;text-decoration:none;border-radius:8px;">
                          Sign In to TransitOps →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 36px;">
                  <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                    TransitOps Smart Transport Operations Platform · This is an automated message, do not reply.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  const text = `
Welcome to TransitOps, ${name}!

Your ${roleLabel} account has been created.

Login Email: ${email}
Password:    ${password}

Sign in at: ${appUrl}/login

Please change your password after first login.
  `.trim()

  await getTransporter().sendMail({
    from,
    to: email,
    subject: `Welcome to TransitOps — Your ${roleLabel} account is ready`,
    text,
    html,
  })

  console.log(`[mailer] Welcome email sent to ${email}`)
}

module.exports = { sendWelcomeEmail }
