import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      const { user, session } = data
      const allowedEmails = process.env.ALLOWED_EMAILS?.split(',').map(e => e.trim()) ?? []

      if (!user?.email || !allowedEmails.includes(user.email)) {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?error=unauthorized`)
      }

      // Store Google tokens in user metadata so we can use them server-side
      if (session.provider_token) {
        console.log('provider_token prefix:', session.provider_token.substring(0, 10))
        console.log('provider_refresh_token prefix:', session.provider_refresh_token?.substring(0, 10))
        const admin = createAdminClient()
        await admin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            google_access_token: session.provider_token,
            google_refresh_token: session.provider_refresh_token,
          },
        })
        // Refresh the session so the updated metadata is reflected in the JWT
        await supabase.auth.refreshSession()
      }

      return NextResponse.redirect(`${origin}/`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=unauthorized`)
}
