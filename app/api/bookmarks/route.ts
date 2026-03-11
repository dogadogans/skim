import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('bookmarks')
    .select('id, title, url, domain, source_newsletter, created_at, bookmark_tags(tag_id)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(
    data.map(row => ({
      id: row.id,
      title: row.title,
      url: row.url,
      domain: row.domain,
      source: row.source_newsletter,
      tagIds: (row.bookmark_tags as { tag_id: string }[]).map(bt => bt.tag_id),
      createdAt: row.created_at,
    }))
  )
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, url, domain, source_newsletter } = await req.json()
  if (!title || !url) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const { data, error } = await supabase
    .from('bookmarks')
    .insert({ user_id: user.id, title, url, domain: domain ?? '', source_newsletter: source_newsletter ?? '' })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ id: data.id })
}
