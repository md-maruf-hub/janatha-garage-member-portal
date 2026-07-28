import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Janatha Garage Member Management API',
    timestamp: new Date().toISOString(),
  });
}
