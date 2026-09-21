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

    const { email, fullName, regNumber, memberType } = await req.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Valid email address is required.' },
        { status: 400 }
      );
    }

    const name = escapeHtml((fullName || 'Member').toString().trim());
    const regNo = escapeHtml((regNumber || '').toString().trim());
    const role = escapeHtml((memberType || 'Member').toString().trim());


    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
    const idCardUrl = `${baseUrl}/idcard?regNo=${encodeURIComponent(regNo)}`;

    const subject = `🎉 Janatha Garage Membership Approved - Reg No: ${regNo || 'Generated'}`;
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #0f172a; color: #ffffff; padding: 28px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">JANATHA GARAGE</h1>
          <p style="margin: 6px 0 0 0; font-size: 12px; color: #10b981; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">Official Membership Approval Notice</p>
        </div>
        
        <div style="padding: 32px 24px; background-color: #ffffff;">
          <h2 style="color: #059669; margin-top: 0; font-size: 22px; font-weight: 800;">Congratulations, ${name}!</h2>
          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-top: 12px;">
            We are pleased to inform you that your membership application for <strong>Janatha Garage</strong> has been officially reviewed and approved by the Executive Committee.
          </p>

          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 6px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 12px;">
            <p style="color: #047857; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin: 0;">Official Registration Number</p>
            <p style="color: #065f46; font-size: 30px; font-weight: 900; margin: 6px 0 0 0; letter-spacing: 1.5px;">${regNo || 'GENERATED'}</p>
            <p style="color: #047857; font-size: 14px; font-weight: 700; margin: 10px 0 0 0;">Assigned Role: <span style="color: #065f46;">${role}</span></p>
          </div>

          <p style="color: #334155; font-size: 15px; line-height: 1.6;">
            Your Digital Membership PVC Card is now ready! You can view, verify, or print your card directly on our portal using the link below:
          </p>

          <div style="text-align: center; margin: 28px 0 20px 0;">
            <a href="${idCardUrl}" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 15px; box-shadow: 0 4px 10px rgba(5, 150, 105, 0.3);">
              🪪 View & Download Digital ID Card
            </a>
          </div>

          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 10px;">
            Direct link: <a href="${idCardUrl}" style="color: #059669; word-break: break-all;">${idCardUrl}</a>
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
      return NextResponse.json({ success: true, message: `Approval email successfully sent to ${email}.` });
    } else {
      console.log(`[Approval Email Notice] Prepared approval email for ${email} (${name}) with Reg ${regNo}`);
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
    console.error('Error sending approval email:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to send approval email.' },
      { status: 500 }
    );
  }
}
