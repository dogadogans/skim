import { NextResponse } from 'next/server'
import { getEmailDetail, getGmailClient, isGmailAuthError } from '@/lib/gmail'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const detail = await getEmailDetail(id)
    return NextResponse.json(detail)
  } catch (err) {
    if (isGmailAuthError(err)) {
      return NextResponse.json({ error: 'gmail_auth' }, { status: 401 })
    }
    console.error('GET /api/emails/[id] error:', err)
    return NextResponse.json({ error: 'Failed to fetch email' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const gmail = await getGmailClient()
    await gmail.users.messages.modify({
      userId: 'me',
      id,
      requestBody: body.markUnread
        ? { addLabelIds: ['UNREAD'] }
        : { removeLabelIds: ['UNREAD'] },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('PATCH /api/emails/[id] error:', err)
    return NextResponse.json({ error: 'Failed to update email' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const gmail = await getGmailClient()
    await gmail.users.messages.trash({ userId: 'me', id })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/emails/[id] error:', err)
    return NextResponse.json({ error: 'Failed to delete email' }, { status: 500 })
  }
}
