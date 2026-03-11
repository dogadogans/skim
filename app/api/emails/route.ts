import { NextResponse } from 'next/server'
import { listTodayEmails, isGmailAuthError } from '@/lib/gmail'

export async function GET() {
  try {
    const emails = await listTodayEmails()
    return NextResponse.json(emails)
  } catch (err) {
    if (isGmailAuthError(err)) {
      return NextResponse.json({ error: 'gmail_auth' }, { status: 401 })
    }
    console.error('GET /api/emails error:', err)
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 })
  }
}
