import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Add a tag to a bookmark
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: bookmarkId } = await params
  const { tagId } = await req.json()

  const { error } = await supabase
    .from('bookmark_tags')
    .insert({ bookmark_id: bookmarkId, tag_id: tagId })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// Remove a tag from a bookmark
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: bookmarkId } = await params
  const { tagId } = await req.json()

  const { error } = await supabase
    .from('bookmark_tags')
    .delete()
    .eq('bookmark_id', bookmarkId)
    .eq('tag_id', tagId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
