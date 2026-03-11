import { google, gmail_v1 } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import sanitizeHtml from 'sanitize-html'
import * as cheerio from 'cheerio'

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function getGmailClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { google_access_token, google_refresh_token } = user.user_metadata ?? {}
  if (!google_access_token) throw new Error('No Google access token stored')

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  auth.setCredentials({
    access_token: google_access_token,
    refresh_token: google_refresh_token,
  })

  // When the token is refreshed automatically, save the new one
  auth.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      const admin = createAdminClient()
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          google_access_token: tokens.access_token,
        },
      })
    }
  })

  return google.gmail({ version: 'v1', auth })
}

// ─── Email list ───────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#22c55e', '#3b82f6', '#a855f7', '#f59e0b',
  '#06b6d4', '#ef4444', '#ec4899', '#10b981',
  '#84cc16', '#f97316', '#8b5cf6', '#64748b',
]

function avatarColorFromEmail(email: string): string {
  let hash = 0
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function parseSender(from: string): { name: string; email: string } {
  const match = from.match(/^(.*?)\s*<(.+?)>$/)
  if (match) return { name: match[1].replace(/"/g, '').trim(), email: match[2].trim() }
  return { name: from, email: from }
}

function getHeader(headers: gmail_v1.Schema$MessagePartHeader[], name: string): string {
  return headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ''
}

export interface EmailListItem {
  id: string
  sender: string
  senderEmail: string
  subject: string
  tagline: string
  time: string
  isRead: boolean
  avatarColor: string
}

export async function listTodayEmails(): Promise<EmailListItem[]> {
  const gmail = await getGmailClient()

  // Build today's date filter in Gmail query format
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const today = `${y}/${m}/${d}`
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const ty = tomorrow.getFullYear()
  const tm = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const td = String(tomorrow.getDate()).padStart(2, '0')
  const tomorrowStr = `${ty}/${tm}/${td}`

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: `after:${today} before:${tomorrowStr} in:inbox`,
    maxResults: 50,
  })

  const messages = listRes.data.messages ?? []
  if (messages.length === 0) return []

  // Fetch metadata for each message in parallel
  const details = await Promise.all(
    messages.map(m =>
      gmail.users.messages.get({
        userId: 'me',
        id: m.id!,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      })
    )
  )

  return details.map(res => {
    const msg = res.data
    const headers = msg.payload?.headers ?? []
    const from = getHeader(headers, 'From')
    const { name, email } = parseSender(from)
    const subject = getHeader(headers, 'Subject')
    const dateStr = getHeader(headers, 'Date')
    const date = dateStr ? new Date(dateStr) : new Date()
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    const isRead = !(msg.labelIds ?? []).includes('UNREAD')

    return {
      id: msg.id!,
      sender: name || email,
      senderEmail: email,
      subject,
      tagline: msg.snippet ?? '',
      time,
      isRead,
      avatarColor: avatarColorFromEmail(email),
    }
  })
}

// ─── Email detail ─────────────────────────────────────────────────────────────

export interface ContentLink {
  id: string
  text: string
  url: string
}

export interface EmailDetail {
  id: string
  sender: string
  senderEmail: string
  subject: string
  htmlBody: string
  contentLinks: ContentLink[]
  listUnsubscribeUrl: string | null
  avatarColor: string
}

const NOISE_DOMAINS = [
  'twitter.com', 'x.com', 'linkedin.com', 'facebook.com', 'instagram.com', 'youtube.com', 't.co',
  'mailchimp.com', 'sendgrid.net', 'mandrillapp.com', 'klaviyo.com', 'convertkit.com',
]
const NOISE_PATTERNS = [
  'unsubscribe', 'optout', 'opt-out', 'remove', 'manage-preference', 'email-preference', 'list-manage',
  'utm_source=email', '/app-link/', 'substack.com/profile', 'substack.com/@',
]
// Redirect/tracker URL path patterns — only filtered when anchor text is itself a raw URL
const REDIRECT_PATTERNS = ['/redirect/', '/click/', '/track/', '/open/']
const NOISE_TEXT = [
  'unsubscribe', 'click here', 'view in browser', 'view online', 'read online',
  'privacy policy', 'terms of service', 'contact us',
  'subscribe here', 'subscribe', 'for more', 'sign up', 'follow', 'share', 'forward',
  'read more', 'learn more', 'see more', 'view more', 'get started',
]

function isNoiseUrl(url: string, text: string): boolean {
  const lower = url.toLowerCase()
  const textLower = text.toLowerCase().trim()
  if (lower.startsWith('mailto:') || lower.startsWith('#')) return true
  if (NOISE_PATTERNS.some(p => lower.includes(p))) return true
  if (NOISE_TEXT.some(t => textLower === t)) return true
  // ALL CAPS short text = newsletter template label (e.g. "BEN SPRINGWATER", "READ MORE")
  if (text.length < 50 && text === text.toUpperCase() && /[A-Z]{2}/.test(text)) return true
  // Redirect/tracker URLs: only filter when anchor text is itself a raw URL (no human title)
  const textIsUrl = text.startsWith('http') || text.startsWith('www.')
  if (REDIRECT_PATTERNS.some(p => lower.includes(p)) && textIsUrl) return true
  try {
    const hostname = new URL(url).hostname.replace('www.', '')
    if (NOISE_DOMAINS.includes(hostname)) return true
  } catch { return true }
  return false
}

function decodeBase64(str: string): string {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
}

function extractHtmlBody(payload: gmail_v1.Schema$MessagePart): string {
  if (payload.mimeType === 'text/html' && payload.body?.data) {
    return decodeBase64(payload.body.data)
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const html = extractHtmlBody(part)
      if (html) return html
    }
  }
  return ''
}

function extractTextBody(payload: gmail_v1.Schema$MessagePart): string {
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64(payload.body.data)
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const txt = extractTextBody(part)
      if (txt) return txt
    }
  }
  return ''
}

export async function getEmailDetail(id: string): Promise<EmailDetail> {
  const gmail = await getGmailClient()

  const res = await gmail.users.messages.get({
    userId: 'me',
    id,
    format: 'full',
  })

  const msg = res.data
  const headers = msg.payload?.headers ?? []
  const from = getHeader(headers, 'From')
  const { name, email } = parseSender(from)
  const subject = getHeader(headers, 'Subject')
  const listUnsubscribeHeader = getHeader(headers, 'List-Unsubscribe')

  // Extract unsubscribe URL from header like <https://...>, <mailto:...>
  let listUnsubscribeUrl: string | null = null
  const httpMatch = listUnsubscribeHeader.match(/<(https?:\/\/[^>]+)>/)
  const mailtoMatch = listUnsubscribeHeader.match(/<(mailto:[^>]+)>/)
  if (httpMatch) listUnsubscribeUrl = httpMatch[1]
  else if (mailtoMatch) listUnsubscribeUrl = mailtoMatch[1]

  // Get HTML body (fall back to plain text)
  let rawHtml = extractHtmlBody(msg.payload ?? {})
  if (!rawHtml) {
    const text = extractTextBody(msg.payload ?? {})
    rawHtml = `<pre style="white-space:pre-wrap;font-family:inherit">${text}</pre>`
  }

  // Sanitize HTML, then strip inline font-size/font-family so newsletter
  // headings don't override the app's controlled type scale.
  const htmlBody = sanitizeHtml(rawHtml, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
      'b', 'i', 'strong', 'em', 'u', 's', 'strike',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'center', 'font',
      'a', 'img',
    ],
    allowedAttributes: {
      '*': ['style', 'class', 'align', 'valign', 'bgcolor', 'color', 'width', 'height', 'cellpadding', 'cellspacing', 'border'],
      'a': ['href', 'target', 'rel', 'name'],
      'img': ['src', 'alt', 'width', 'height'],
      'td': ['colspan', 'rowspan'],
      'th': ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      'a': (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer' },
      }),
    },
  }).replace(/font-size\s*:[^;}"']+/gi, '').replace(/font-family\s*:[^;}"']+/gi, '')

  // Extract content links using cheerio
  const $ = cheerio.load(rawHtml)
  const contentLinks: ContentLink[] = []
  const seen = new Set<string>()

  $('a[href]').each((i, el) => {
    const url = $(el).attr('href') ?? ''
    const text = $(el).text().trim()
    if (!url || seen.has(url)) return
    if (!url.startsWith('http')) return
    if (isNoiseUrl(url, text)) return
    seen.add(url)
    contentLinks.push({ id: `link-${i}`, text: text.slice(0, 120) || url, url })
  })

  return {
    id: msg.id!,
    sender: name || email,
    senderEmail: email,
    subject,
    htmlBody,
    contentLinks,
    listUnsubscribeUrl,
    avatarColor: avatarColorFromEmail(email),
  }
}

// ─── Midnight cleanup ─────────────────────────────────────────────────────────

export async function deleteAllInboxEmails(userId: string, accessToken: string, refreshToken: string): Promise<number> {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken })

  // When the token auto-refreshes, persist the new access token to Supabase
  // so the next cron run doesn't start with a stale token either
  auth.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      const admin = createAdminClient()
      await admin.auth.admin.updateUserById(userId, {
        user_metadata: {
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token ?? refreshToken,
        },
      })
    }
  })

  const gmail = google.gmail({ version: 'v1', auth })

  let deleted = 0
  let pageToken: string | undefined

  do {
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: 'in:inbox',
      maxResults: 1000,
      ...(pageToken ? { pageToken } : {}),
    })

    const messages = listRes.data.messages ?? []
    if (messages.length === 0) break

    // batchModify moves to Trash using only gmail.modify scope.
    // batchDelete would require the full https://mail.google.com/ scope.
    await gmail.users.messages.batchModify({
      userId: 'me',
      requestBody: {
        ids: messages.map(m => m.id!),
        addLabelIds: ['TRASH'],
        removeLabelIds: ['INBOX'],
      },
    })

    deleted += messages.length
    pageToken = listRes.data.nextPageToken ?? undefined
  } while (pageToken)

  return deleted
}

// ─── Auth error detection ─────────────────────────────────────────────────────

export function isGmailAuthError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'response' in err) {
    const status = (err as { response?: { status?: number } }).response?.status
    return status === 401 || status === 403
  }
  return false
}
