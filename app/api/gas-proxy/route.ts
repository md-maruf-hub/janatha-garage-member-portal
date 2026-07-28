import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gasUrl, action, payload, query, regNo, method } = body;

    if (!gasUrl || typeof gasUrl !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid Google Apps Script Web App URL.' },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(gasUrl.trim());
      const allowedHosts = ['script.google.com', 'script.googleusercontent.com'];
      if (!allowedHosts.some((h) => parsedUrl.hostname === h || parsedUrl.hostname.endsWith('.' + h))) {
        return NextResponse.json(
          { success: false, message: 'Google Apps Script proxy only allows script.google.com domains.' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json({
        success: false,
        message: 'Invalid Google Apps Script Web App URL format.',
      });
    }

    const isGetAction =
      ['getStats', 'searchMember', 'getMemberTypes', 'verifyMember', 'getApprovedMembers', 'getPendingMembers'].includes(action) ||
      method === 'GET';

    if (isGetAction) {
      if (action) parsedUrl.searchParams.append('action', action);
      if (query) parsedUrl.searchParams.append('query', query);
      if (regNo) parsedUrl.searchParams.append('regNo', regNo);

      const response = await fetch(parsedUrl.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        redirect: 'follow',
      });

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return NextResponse.json(data);
      } catch {
        return NextResponse.json({
          success: false,
          message: "Google Apps Script returned non-JSON output. Please ensure the Web App is published with 'Who has access' set to 'Anyone'.",
        });
      }
    } else {
      const bodyData = { action, payload: payload || body.payload };
      const response = await fetch(parsedUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
        redirect: 'follow',
      });

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return NextResponse.json(data);
      } catch {
        return NextResponse.json({
          success: false,
          message: "Google Apps Script returned non-JSON output. Please ensure the Web App is published with 'Who has access' set to 'Anyone'.",
        });
      }
    }
  } catch (err: any) {
    console.error('GAS Proxy connection error:', err?.message || err);
    return NextResponse.json({
      success: false,
      message: err?.message || 'Google Apps Script connection error.',
    });
  }
}
