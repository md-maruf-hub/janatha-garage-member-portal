import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return null;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(req: NextRequest) {
  try {
    // Admin Authorization Guard
    const sessionCookie = req.cookies.get('jg_admin_session')?.value;
    const authHeader = req.headers.get('authorization');
    const secretKey = process.env.API_SECRET_KEY;
    const isAuthorized =
      sessionCookie === 'authenticated' ||
      (secretKey && authHeader === `Bearer ${secretKey}`) ||
      process.env.NODE_ENV !== 'production';

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin authentication required.' },
        { status: 401 }
      );
    }

    const { email, fullName, reason } = await req.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Valid email address is required.' },
        { status: 400 }
      );
    }

    const name = escapeHtml((fullName || 'Applicant').toString().trim());
    const sanitizedReason = reason ? escapeHtml(reason.toString().trim()) : '';

    const subject = 'Janatha Garage Membership Application Status Update';
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #0f172a; color: #ffffff; padding: 28px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">JANATHA GARAGE</h1>
          <p style="margin: 6px 0 0 0; font-size: 12px; color: #f87171; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">Membership Application Status Update</p>
        </div>
        
        <div style="padding: 32px 24px; background-color: #ffffff;">
          <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; font-weight: 800;">Dear ${name},</h2>
          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-top: 12px;">
            Thank you for your interest in joining <strong>Janatha Garage</strong>. After carefully reviewing your membership registration, we regret to inform you that your application could not be approved at this time.
          </p>

          ${sanitizedReason ? `
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-left: 6px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 10px;">
            <p style="color: #991b1b; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin: 0;">Review Decision Note</p>
            <p style="color: #7f1d1d; font-size: 14px; margin: 4px 0 0 0; line-height: 1.5;">${sanitizedReason}</p>
          </div>
          ` : ''}


          <p style="color: #334155; font-size: 15px; line-height: 1.6;">
            If you believe this decision was made in error or if you wish to apply again with updated details, please feel free to submit a new application on our website or reach out to our administration team.
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;" />
          <p style="color: #64748b; font-size: 13px; margin-bottom: 0; line-height: 1.5;">
            Warm regards,<br />
            <strong>Janatha Garage Executive Administration Team</strong><br />
            <span style="font-size: 11px; color: #94a3b8;">Jamuna Para Jame Masjid, Paterbhita, Chandanbaisha, Shariakandi, Bogura, Bangladesh</span>
          </p>
        </div>
      </div>
    `;

    const transporter = createTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Janatha Garage" <${process.env.SMTP_USER}>`,
        to: email,
        subject,
        html: htmlContent,
      });
      return NextResponse.json({ success: true, message: `Rejection email successfully sent to ${email}.` });
    } else {
      console.log(`[Rejection Email Notice] Prepared rejection email for ${email} (${name})`);
      return NextResponse.json(
        {
          success: false,
          smtpConfigured: false,
          message: `SMTP credentials (SMTP_USER & SMTP_PASS) are not configured in environment. Real email could not be delivered to ${email}.`,
        },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error('Error sending rejection email:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to send rejection email.' },
      { status: 500 }
    );
  }
}
