import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteAllInboxEmails } from '@/lib/gmail'

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allowedEmails = process.env.ALLOWED_EMAILS?.split(',').map(e => e.trim()) ?? []
  if (allowedEmails.length === 0) {
    return NextResponse.json({ error: 'No allowed emails configured' }, { status: 500 })
  }

  const admin = createAdminClient()

  // Find the user by their allowed email to get stored Google tokens
  const { data: { users }, error } = await admin.auth.admin.listUsers({ perPage: 100 })
  if (error) {
    console.error('Cron cleanup: failed to list users', error)
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 })
  }

  const user = users.find(u => u.email && allowedEmails.includes(u.email))
  if (!user) {
    return NextResponse.json({ error: 'No matching user found' }, { status: 404 })
  }

  const { google_access_token, google_refresh_token } = user.user_metadata ?? {}
  if (!google_access_token) {
    return NextResponse.json({ error: 'No Google token stored for user' }, { status: 500 })
  }

  try {
    const deleted = await deleteAllInboxEmails(user.id, google_access_token, google_refresh_token)
    console.log(`Cron cleanup: deleted ${deleted} emails for ${user.email}`)
    return NextResponse.json({ ok: true, deleted })
  } catch (err) {
    console.error('Cron cleanup: Gmail delete failed', err)
    return NextResponse.json({ error: 'Gmail delete failed' }, { status: 500 })
  }
}
