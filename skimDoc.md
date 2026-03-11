# SKIM

## Newsletter Distillery

**Product Documentation v1.0**

*A personal tool to read newsletters, extract what matters, and let the rest disappear.*

- **Author:** Doga
- **Date:** February 2026
- **Status:** Pre-development

---

## Table of Contents

1. [Problem & Vision](#1-problem--vision)
2. [Product Overview](#2-product-overview)
3. [Core Features](#3-core-features)
4. [User Flows](#4-user-flows)
5. [Technical Architecture](#5-technical-architecture)
6. [Tech Stack & Rationale](#6-tech-stack--rationale)
7. [Data Model](#7-data-model)
8. [API & Integrations](#8-api--integrations)
9. [Build Plan (Weekend Sprints — UI First)](#9-build-plan-weekend-sprints--ui-first)
10. [Future Roadmap (v2)](#10-future-roadmap-v2)
11. [Open Source Considerations](#11-open-source-considerations)
12. [Case Study Log](#12-case-study-log)

---

## 1. Problem & Vision

### The Problem

You subscribe to 15–20 newsletters. They pile up in your inbox. At the end of the day, you mark them all as read without actually reading them. The valuable links inside—the articles, tools, and research that made you subscribe in the first place—disappear into the void.

Your main email becomes a mix of personal communication and newsletter noise. The guilt of unread emails compounds. The newsletters you genuinely want to read get buried.

### The Vision

Skim is a dedicated, distraction-free space for newsletter reading. Emails arrive, you read them, you extract what's valuable as bookmarks, and at midnight everything gets cleaned up automatically. No archive. No guilt. Just the good stuff, saved and organized.

Think of it as a distillery: raw newsletters go in, refined bookmarks come out, and the rest evaporates.

### Design Principles

- **Ephemeral by default** — Newsletters are temporary. Only bookmarks persist.
- **Zero maintenance** — No manual cleanup, no inbox management, no decisions about what to keep.
- **Extract, don't hoard** — The goal is to pull valuable links out, not to build another archive.
- **Calm interface** — Clean, minimal, focused. No notification counts, no urgency signals.

---

## 2. Product Overview

### What Skim Is

A personal web application that connects to a dedicated Gmail account, displays newsletters in a clean reading interface, lets you save links as bookmarks with one click, and automatically deletes all emails at midnight.

### What Skim Is Not

- **Not a general email client** — It only handles newsletters from a dedicated Gmail.
- **Not an archival tool** — Emails are intentionally ephemeral.
- **Not a read-later app** — It's for immediate reading with link extraction.
- **Not a collaboration tool** — It's personal-first (though open-sourceable).

### Core Screens

| Screen | Purpose | Key Elements |
|--------|---------|--------------|
| Today View | Daily newsletter inbox with mail list | Newsletter list, date, unread indicators, refresh |
| Email Detail | Read a newsletter and extract links | Full email body, inline link detection, bookmark buttons, unsubscribe |
| Bookmarks | Browse and organize saved links | Tag system, sort/filter, direct link-out, delete |

---

## 3. Core Features

### 3.1 Newsletter Inbox (Today View)

Displays all emails received today from the connected Gmail account. Each newsletter shows the sender name, subject/tagline, and arrival time. Once opened, a newsletter is marked as read. All emails are auto-deleted at midnight—no manual cleanup needed.

- Fetch emails via Gmail API on page load and via manual refresh button
- Show unread/read status with a subtle dot indicator
- Display email count badge in the section header
- Navigation between Today and Bookmarks tabs

### 3.2 Email Detail View

The heart of Skim. When you open a newsletter, the app renders its HTML content and intelligently detects links within it.

#### Smart Link Detection

The app parses the newsletter HTML and identifies content links—the actual articles, tools, and resources—while filtering out noise:

| Detected as Content Links | Filtered Out (Noise) |
|--------------------------|---------------------|
| Article URLs, blog posts, tool links, research papers, product pages | Unsubscribe links, social media profile links (Twitter, LinkedIn, etc.), mailto links, tracking pixels, footer navigation |

#### Inline Bookmark Action

Detected content links appear with a small "+" button next to them in the email body. Clicking "+" instantly saves that link as a bookmark and the button changes to a checkmark (✓), confirming the save. This is the core interaction—one click to extract value.

#### Fallback: Manual Link Bookmark

If the smart detection misses a link (or marks something as noise that you want), any link in the email is still clickable. A fallback mechanism lets you manually add any link as a bookmark through a secondary action.

#### Unsubscribe

Each email detail view includes a visible Unsubscribe button, making it easy to cut newsletters that aren't providing value. This leverages the List-Unsubscribe header that most newsletters include.

#### Navigation

Email pagination (e.g., "1 of 12") with previous/next arrows, a back button to return to the Today view, and a delete button to manually remove an email before midnight.

### 3.3 Bookmarks

The persistent layer of Skim. Bookmarks outlive the emails they came from and are the only data that accumulates over time.

#### Bookmark Properties

- **Title** — Auto-extracted from the link's anchor text or page title
- **URL** — The actual link destination
- **Source** — Which newsletter it came from
- **Tags** — User-assigned colored labels for organization
- **Date Added** — When the bookmark was saved

#### Tag System

Tags are colored labels that help organize bookmarks by topic. Users can create custom tags with names and colors from a predefined palette (grey, blue, purple, green, orange, yellow, pink, red). Multiple tags can be assigned to a single bookmark.

#### Sorting & Filtering

Bookmarks can be sorted by date (newest/oldest first), by name (A–Z / Z–A), or by site (A–Z / Z–A). The filter system lets you show only bookmarks with specific tags, or view all.

#### Actions

- Click a bookmark to open its URL in a new tab
- Add/remove tags via the "+" button or three-dot menu
- Delete bookmarks individually
- Bulk selection via checkboxes for batch operations

### 3.4 Automatic Midnight Cleanup

At midnight (server time), a scheduled cron job runs that deletes all emails from the connected Gmail account—both read and unread. This is the key design decision: newsletters are ephemeral. If you didn't read it today, it's gone. Half-read emails are treated the same as unread ones. Only bookmarks survive.

### 3.5 Authentication

Users authenticate via Google OAuth. This serves double duty: it gates access to the app (only authenticated users can enter) and it provides the Gmail API credentials needed to fetch and manage emails. For v1, this is a personal tool—one user, one connected Gmail account.

Access is restricted via an `ALLOWED_EMAILS` environment variable. After OAuth login, the app checks if the authenticated email is on the allowlist. If not, the login is rejected. This keeps your instance private while allowing open source users to configure their own allowlist.

---

## 4. User Flows

### 4.1 Daily Reading Flow

1. User opens Skim in browser (desktop, primarily during workday)
2. Google OAuth authenticates automatically (session persists)
3. Today View shows the day's newsletters with unread count
4. User clicks a newsletter to open the Email Detail view
5. User reads the newsletter; inline content links show "+" buttons
6. User clicks "+" on valuable links — they're saved as bookmarks instantly
7. User navigates to next newsletter or returns to Today View
8. At midnight, all emails are automatically deleted

### 4.2 Bookmark Management Flow

1. User switches to the Bookmarks tab
2. All saved bookmarks appear, sorted newest-first by default
3. User assigns tags to organize bookmarks by topic
4. User filters by tags to find specific categories
5. Clicking a bookmark opens the original article in a new tab

### 4.3 First-Time Setup Flow

1. User visits Skim URL for the first time
2. App shows Google OAuth login screen
3. User authenticates with their dedicated newsletter Gmail account
4. App checks email against `ALLOWED_EMAILS` — if matched, access is granted
5. App fetches existing emails and displays them in Today View
6. User begins reading and bookmarking

---

## 5. Technical Architecture

### High-Level Architecture

Skim follows a straightforward client-server model. The Next.js app handles both the frontend UI and the backend API routes. Supabase provides persistent storage for bookmarks and user data. Gmail API is accessed server-side to fetch and manage emails. A Vercel cron function handles the nightly cleanup.

### Architecture Flow

```
Browser → Next.js App (Vercel) → Gmail API (fetch/delete emails)
Browser → Next.js App (Vercel) → Supabase (read/write bookmarks)
Vercel Cron (midnight) → Gmail API (delete all emails)
```

### Key Architecture Decisions

**Why server-side email fetching?**
Gmail API calls happen in Next.js server components and API routes, never in the browser. This keeps OAuth tokens secure (they never touch the client) and avoids CORS issues with Google's APIs.

**Why Supabase and not local storage?**
Bookmarks need to persist across devices and browser sessions. Local storage (like Dexie/IndexedDB) would mean losing bookmarks if you clear your cache or use a different computer. Supabase gives a real Postgres database with a generous free tier.

**Why Vercel cron and not GitHub Actions?**
Keeping everything in one deployment (app + cron) is simpler to maintain. The cron function can share the same codebase, environment variables, and database connection as the main app. No split architecture to debug.

**Why a dedicated Gmail account?**
Connecting to someone's primary Gmail would require careful scoping to avoid touching personal emails. A dedicated newsletter Gmail means the app can safely delete everything at midnight without risk. It also simplifies the Gmail API permissions needed.

---

## 6. Tech Stack & Rationale

| Technology | What It Does | Why This One | Alternative Considered |
|-----------|-------------|-------------|----------------------|
| **Next.js (App Router)** | Full-stack React framework. Handles UI, API routes, and server-side logic. | Doga already knows it. App Router supports server components for secure API calls. | Plain React + Express — more setup, same result, less learning leverage. |
| **Supabase** | Postgres database + auth helpers. Stores bookmarks and user data. | Free tier is generous. Great dashboard for viewing data. Auth pairs with Google OAuth. | Firebase — also free but NoSQL is harder to query. PlanetScale — good but less beginner-friendly. |
| **Gmail API** | Fetches emails, reads content, deletes messages from the connected account. | Free for personal use. Native Google integration. Well-documented. | IMAP — lower-level and harder to work with. No real alternative for Gmail specifically. |
| **Google OAuth** | Handles login and provides Gmail API authorization in one step. | Two birds, one stone: auth + API access. Users already have Google accounts. | NextAuth with email/password — would still need separate Gmail API auth, doubling the work. |
| **Vercel** | Hosts the app and runs cron jobs for midnight cleanup. | Native Next.js support. Free tier is plenty. Built-in cron functions. | Railway or Render — also free tiers but more configuration. Vercel is zero-config for Next.js. |
| **Tailwind CSS** | Utility-first CSS framework for styling the UI. | Doga knows Tailwind. Fast to build responsive layouts. Matches the clean design aesthetic. | Plain CSS or CSS Modules — more verbose, slower iteration for prototyping. |

**Total Cost:** $0/month. All services used within their free tiers for personal use.

---

## 7. Data Model

Supabase (Postgres) stores only persistent data. Emails are fetched live from Gmail and never stored in the database—they're transient by design.

### 7.1 Users Table

| Column | Type | Description | Notes |
|--------|------|-------------|-------|
| **id** | UUID | Primary key | Auto-generated by Supabase Auth |
| **email** | TEXT | Google account email | From OAuth |
| **google_access_token** | TEXT | Gmail API access token | Encrypted, refreshed on expiry |
| **google_refresh_token** | TEXT | Gmail API refresh token | Encrypted, long-lived |
| **created_at** | TIMESTAMP | Account creation date | Auto-set |

### 7.2 Bookmarks Table

| Column | Type | Description | Notes |
|--------|------|-------------|-------|
| **id** | UUID | Primary key | Auto-generated |
| **user_id** | UUID | Foreign key to users | For multi-user support |
| **title** | TEXT | Link title | Auto-extracted from anchor or page |
| **url** | TEXT | Bookmark URL | The actual link destination |
| **source_newsletter** | TEXT | Which newsletter it came from | Sender name from email |
| **created_at** | TIMESTAMP | When bookmark was saved | Auto-set on creation |

### 7.3 Tags Table

| Column | Type | Description | Notes |
|--------|------|-------------|-------|
| **id** | UUID | Primary key | Auto-generated |
| **user_id** | UUID | Foreign key to users | Tags are per-user |
| **name** | TEXT | Tag label | e.g., "Sports", "Health" |
| **color** | TEXT | Color identifier | From predefined palette |

### 7.4 Bookmark_Tags Junction Table

| Column | Type | Description |
|--------|------|-------------|
| **bookmark_id** | UUID | Foreign key to bookmarks |
| **tag_id** | UUID | Foreign key to tags |

This junction table enables many-to-many relationships: one bookmark can have multiple tags, and one tag can apply to many bookmarks.

---

## 8. API & Integrations

### 8.1 Gmail API

All Gmail API interactions happen server-side through Next.js API routes. The app uses the following Gmail API endpoints:

| Endpoint | Purpose | When Used |
|----------|---------|-----------|
| **messages.list** | Get list of email IDs for today | Page load + refresh button |
| **messages.get** | Fetch full email content (HTML body, headers, metadata) | When opening an email |
| **messages.modify** | Mark email as read | When user opens an email |
| **messages.delete** | Permanently delete email | Midnight cron job + manual delete |

#### Required OAuth Scopes

- `gmail.readonly` — Read email content and metadata
- `gmail.modify` — Mark as read, delete emails
- `userinfo.email` — Get user's email for identification

### 8.2 Link Extraction Logic

When an email is opened, the HTML body is parsed to extract links. The extraction logic works in three steps:

1. **Parse HTML:** Extract all `<a>` tags with href attributes from the email body.
2. **Filter noise:** Remove links matching noise patterns—unsubscribe URLs, social media profiles (twitter.com, linkedin.com, facebook.com, instagram.com), mailto: links, the newsletter's own domain, tracking redirect URLs, and footer/navigation links.
3. **Classify remaining:** All surviving links are marked as content links and displayed with the inline "+" bookmark button.

The filtering uses a combination of URL pattern matching and link position analysis (links in email footers are more likely to be noise). This is a heuristic—not perfect—which is why the manual fallback exists.

### 8.3 Internal API Routes (Next.js)

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| **GET** | `/api/emails` | Fetch today's emails | Required |
| **GET** | `/api/emails/[id]` | Fetch single email content | Required |
| **DELETE** | `/api/emails/[id]` | Delete single email | Required |
| **POST** | `/api/bookmarks` | Create a bookmark | Required |
| **GET** | `/api/bookmarks` | List all bookmarks | Required |
| **DELETE** | `/api/bookmarks/[id]` | Delete a bookmark | Required |
| **POST** | `/api/bookmarks/[id]/tags` | Add tag to bookmark | Required |
| **POST** | `/api/tags` | Create a new tag | Required |
| **POST** | `/api/cron/cleanup` | Midnight email deletion | Cron secret |

---

## 9. Build Plan (Weekend Sprints — UI First)

Five weekends, UI-first. The first weekend focuses entirely on building and feeling the interface with mock data before touching any backend. Each subsequent weekend wires real functionality into the components you've already built and validated.

### Weekend 1: UI Components + Visual Prototype

**Goal:** Build every screen and component with mock data so you can feel how it works before writing a single line of backend code.

#### Tasks

1. Create Next.js project with App Router and Tailwind
2. Set up the design system: mint green accent color, typography, spacing tokens
3. Build the top navigation: Today tab, Bookmarks tab, user avatar placeholder
4. Build the Today View: newsletter list with mock emails (sender, tagline, time, unread dots, email count badge, refresh icon)
5. Build the Email Detail View: mock newsletter content, inline link detection UI with "+" and "✓" states, pagination (1 of 12), back/delete/unsubscribe buttons
6. Build the "Added Bookmarks" collapsible section inside email detail
7. Build the Bookmarks View: bookmark list with mock data, sort dropdown, filter controls
8. Build the tag system components: tag pills, add tag popover, create new tag input, color picker
9. Build the three-dot menu: tag assignment, delete bookmark
10. Build checkbox/bulk selection UI
11. Build empty states for both views
12. Test all interactions with mock data — click through the full flow

#### Deliverable

A fully interactive prototype you can click through. Every screen, every component, every interaction state — all working with hardcoded mock data. You can feel how it works before committing to the backend architecture.

#### Learning Focus

React components, state management for UI interactions, Tailwind styling, component composition.

#### Case Study Note

Document your design-to-code process. Screenshot the mock UI. Write about any design decisions that changed once you saw them in a real browser vs. your Figma mockups.

---

### Weekend 2: Foundation + Auth

**Goal:** Set up the real infrastructure and get Google OAuth working so you can log into your polished UI.

#### Tasks

1. Set up Supabase project (database + auth)
2. Configure Google Cloud project with OAuth credentials
3. Implement Google OAuth login flow via Supabase Auth
4. Build the login page UI
5. Connect auth state to the app shell (show avatar, handle logout)
6. Create the Supabase tables (users, bookmarks, tags, bookmark_tags)
7. Deploy to Vercel

#### Deliverable

You can visit a real URL, log in with Google, see your polished dashboard (still with mock data), and log out. Database tables exist and are ready.

#### Learning Focus

OAuth flow, environment variables, Supabase setup, database schema creation, deployment.

#### Case Study Note

Write about the OAuth setup experience — the Google Cloud Console steps, any confusion, what clicked. This is your first real API integration.

---

### Weekend 3: Email Integration

**Goal:** Replace mock email data with real newsletters from Gmail.

#### Tasks

1. Connect Gmail API using stored OAuth tokens
2. Build the `/api/emails` route to fetch today's messages
3. Build the `/api/emails/[id]` route to fetch full email content
4. Wire the Today View to display real emails instead of mock data
5. Wire the Email Detail View to render real newsletter HTML
6. Implement mark-as-read on open
7. Add the Unsubscribe button (leveraging List-Unsubscribe header)

#### Deliverable

Real newsletters from your dedicated Gmail appear in the UI you built in Weekend 1. You can read them in your clean interface and navigate between them.

#### Learning Focus

REST API consumption, server components, HTML rendering/sanitization, Gmail API specifics.

#### Case Study Note

Capture the moment mock data becomes real data. Document any UI adjustments needed when real newsletter HTML arrived (they're often messy).

---

### Weekend 4: Link Extraction + Bookmarks

**Goal:** The core magic — extract links from newsletters and wire up real bookmark persistence.

#### Tasks

1. Build the link extraction parser (HTML parsing + noise filtering)
2. Wire inline "+" buttons to real detected content links in the email view
3. Build the bookmark creation flow (click + → save to Supabase → show ✓)
4. Build the fallback manual bookmark action for missed links
5. Wire the Bookmarks View to read from Supabase instead of mock data
6. Build bookmark API routes (create, list, delete)
7. Wire tag creation, assignment, and filtering to Supabase
8. Implement sort and filter functionality with real data

#### Deliverable

Full reading-to-bookmarking flow works end-to-end. You can read newsletters, save links, organize with tags, and everything persists in the database.

#### Learning Focus

HTML parsing, database CRUD operations, many-to-many relationships, replacing mock data with real API calls.

#### Case Study Note

Write about the link extraction challenge — what heuristics worked, what didn't, how messy newsletter HTML really is. This is great technical content for the case study.

---

### Weekend 5: Automation + Polish

**Goal:** Midnight cleanup, responsive design, and production readiness.

#### Tasks

1. Build the `/api/cron/cleanup` endpoint
2. Configure Vercel cron to trigger at midnight
3. Add responsive design for mobile/tablet views
4. Polish transitions, loading states, and skeleton screens
5. Handle edge cases: empty states, error handling, token refresh
6. Write README with setup instructions for open source
7. Final testing and bug fixes

#### Deliverable

Complete, polished v1. Emails auto-delete nightly. App works on mobile. Ready to share and open source.

#### Learning Focus

Cron jobs, responsive design, error handling, production readiness, documentation.

#### Case Study Note

Wrap up the full case study. Reflect on the five-weekend journey, what you'd do differently, and the gap between design mockups and shipped product.

---

## 10. Future Roadmap (v2)

These features are intentionally deferred. They're noted here so the v1 architecture can accommodate them without major rewrites.

### Newsletter Analytics

Track reading behavior over time: which newsletters you open most, which ones generate the most bookmarks, which ones you consistently ignore. The goal is to surface data that helps you decide which subscriptions to keep and which to unsubscribe from.

- Emails opened per newsletter sender (over time)
- Bookmarks saved per newsletter sender
- Unread-to-delete ratio per sender
- Recommendation: "You haven't bookmarked anything from [Newsletter] in 30 days"

**v1 foundation needed:** The bookmarks table already stores source_newsletter. The cron job could log deletion counts per sender before deleting. Minimal schema additions required.

### Search

Full-text search across bookmarks—by title, URL, tag, or source newsletter. Useful once the bookmark collection grows beyond what manual browsing can handle.

### Keyboard Shortcuts

Power-user feature: navigate newsletters with arrow keys, bookmark with a hotkey, switch tabs with shortcuts. Aligns with the "no mouse needed" efficiency ethos.

### Multiple Gmail Accounts

Support connecting more than one Gmail account, for users who segment newsletters across different addresses.

### Export

Export bookmarks as JSON, CSV, or to other bookmark services. Ensures users aren't locked in.

---

## 11. Open Source Considerations

Skim is designed as a personal tool first, but structured so others can self-host it. Here's what makes it shareable:

### Self-Hosting Requirements

- A Google Cloud project with OAuth credentials configured
- A Supabase project (free tier)
- A Vercel account (free tier) or any Node.js hosting
- A dedicated Gmail account for newsletters

### Environment Variables

All configuration lives in environment variables, nothing is hardcoded. The README will include a `.env.example` with clear descriptions of each variable:

- `GOOGLE_CLIENT_ID` — From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — From Google Cloud Console
- `SUPABASE_URL` — From Supabase project settings
- `SUPABASE_ANON_KEY` — From Supabase project settings
- `SUPABASE_SERVICE_ROLE_KEY` — For server-side operations
- `ALLOWED_EMAILS` — Comma-separated list of emails allowed to log in
- `CRON_SECRET` — Protects the cleanup endpoint from unauthorized calls

### Repository Structure

Clean, documented folder structure following Next.js App Router conventions:

- `/app` — Pages and layouts (Today, Bookmarks, Email Detail)
- `/app/api` — API routes (emails, bookmarks, tags, cron)
- `/lib` — Shared utilities (Gmail client, link parser, Supabase client)
- `/components` — Reusable UI components
- `/styles` — Global styles and Tailwind configuration

### License

MIT license recommended—simple, permissive, and standard for open source tools. Allows anyone to use, modify, and distribute.

---
