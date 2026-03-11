'use client';

import { Suspense } from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Mail, MailOpen, Trash2 } from 'lucide-react';
import { MiniHeader } from '@/components/MiniHeader';
import { EmailCard } from '@/components/EmailCard';
import { ActionsPopover } from '@/components/ActionsPopover';
import { createClient } from '@/lib/supabase/client';
import type { EmailListItem } from '@/lib/gmail';

interface ContextMenu {
  emailId: string;
  x: number;
  y: number;
}

function TodayView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filterUnread = searchParams.get('unread') === '1';

  const [emails, setEmails] = useState<EmailListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<'gmail_auth' | 'unknown' | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [pendingDeleteEmailId, setPendingDeleteEmailId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);
  const refreshAudioRef = useRef<HTMLAudioElement | null>(null);

  async function fetchEmails() {
    try {
      const res = await fetch('/api/emails')
      if (res.status === 401) {
        const body = await res.json()
        setError(body.error === 'gmail_auth' ? 'gmail_auth' : 'unknown')
        return
      }
      if (!res.ok) throw new Error('Failed')
      setError(null)
      const data: EmailListItem[] = await res.json()
      setEmails(data)
      setLastFetched(new Date())
      // Store email IDs in sessionStorage for prev/next navigation in detail view
      sessionStorage.setItem('emailIds', JSON.stringify(data.map(e => e.id)))
    } catch {
      setError('unknown')
    } finally {
      setLoading(false)
    }
  }

  async function handleReconnect() {
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  useEffect(() => { fetchEmails() }, [])

  function handleRefresh() {
    const audio = new Audio('/sounds/349698__mikes-multimedia__light-slow-swoosh.mp3');
    audio.loop = true;
    audio.play().catch(() => {});
    refreshAudioRef.current = audio;
    setRefreshing(true);
    fetchEmails().then(() => {
      audio.loop = false;
      audio.addEventListener('ended', () => { audio.pause(); audio.currentTime = 0; }, { once: true });
      setRefreshing(false);
    });
  }

  function handleFilter() {
    const params = new URLSearchParams(searchParams.toString());
    if (filterUnread) {
      params.delete('unread');
    } else {
      params.set('unread', '1');
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleContextMenu(e: React.MouseEvent, emailId: string) {
    e.preventDefault();
    prevFocusRef.current = document.activeElement as HTMLElement;
    setContextMenu({ emailId, x: e.clientX, y: e.clientY });
  }

  function closeContextMenu() {
    setContextMenu(null);
    prevFocusRef.current?.focus();
    prevFocusRef.current = null;
  }

  async function handleToggleRead(emailId: string) {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;
    // Optimistic update
    setEmails(prev => prev.map(em => em.id === emailId ? { ...em, isRead: !em.isRead } : em));
    closeContextMenu();
    if (email.isRead) {
      // Mark as unread: add UNREAD label
      await fetch(`/api/emails/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markUnread: true }),
      });
    } else {
      // Mark as read: remove UNREAD label
      await fetch(`/api/emails/${emailId}`, { method: 'PATCH' });
    }
  }

  async function handleDelete(emailId: string) {
    setEmails(prev => prev.filter(em => em.id !== emailId));
    closeContextMenu();
    await fetch(`/api/emails/${emailId}`, { method: 'DELETE' });
  }

  // Close context menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    }
    if (contextMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextMenu]);

  // Close context menu on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeContextMenu();
    }
    if (contextMenu) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextMenu]);

  // Move focus into context menu when it opens
  useEffect(() => {
    if (contextMenu && menuRef.current) {
      const first = menuRef.current.querySelector<HTMLElement>('[role="menuitem"]');
      first?.focus();
    }
  }, [contextMenu]);

  const activeEmail = contextMenu ? emails.find(em => em.id === contextMenu.emailId) : null;
  const displayedEmails = filterUnread ? emails.filter(em => !em.isRead) : emails;

  const datetimeLabel = lastFetched
    ? lastFetched.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + lastFetched.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div className="flex flex-col gap-3">
      <MiniHeader
        variant="mail"
        count={displayedEmails.length}
        datetime={datetimeLabel}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        filterUnread={filterUnread}
        onFilter={handleFilter}
      />

      {loading ? (
        <div className="py-16 text-center text-grey-2 text-sm">Loading emails…</div>
      ) : error === 'gmail_auth' ? (
        <div className="py-16 text-center flex flex-col items-center gap-3">
          <p className="text-grey-3 text-sm">Your Google connection has expired.</p>
          <button
            onClick={handleReconnect}
            className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-grey-4 shadow-[0px_0px_0px_1px_rgba(219,219,219,0.50),0px_1px_2px_0px_rgba(44,41,41,0.08)] hover:bg-grey-05 transition-colors"
          >
            Reconnect Google
          </button>
        </div>
      ) : error === 'unknown' ? (
        <div className="py-16 text-center text-grey-2 text-sm">
          Failed to load emails.{' '}
          <button onClick={handleRefresh} className="underline">Try again</button>
        </div>
      ) : displayedEmails.length === 0 ? (
        <div className="py-16 text-center text-grey-2 text-sm">
          {filterUnread ? "No unread emails — you're all caught up." : 'No emails today.'}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {displayedEmails.map((email) => (
            <EmailCard
              key={email.id}
              email={{
                id: email.id,
                sender: email.sender,
                tagline: email.tagline,
                time: email.time,
                read: email.isRead,
                avatarColor: email.avatarColor,
              }}
              onContextMenu={handleContextMenu}
            />
          ))}
        </div>
      )}

      {contextMenu && activeEmail && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Email options"
          className="fixed z-50 w-44 py-2 bg-white rounded-lg inline-flex flex-col justify-start items-center overflow-hidden"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            boxShadow:
              '0px 0px 0px 1px rgba(219,219,219,0.50), 0px 1px 2px 0px rgba(44,41,41,0.08), 0px 4px 8px 0px rgba(0,0,0,0.08), 0px 8px 16px 0px rgba(0,0,0,0.04)',
          }}
        >
          <div className="self-stretch px-2 flex flex-col justify-start items-start">
            <button
              type="button"
              role="menuitem"
              onClick={() => handleToggleRead(activeEmail.id)}
              className="self-stretch p-2 rounded-lg inline-flex justify-between items-center hover:bg-grey-05 transition-colors w-full"
            >
              <div className="flex-1 flex justify-start items-center gap-2">
                {activeEmail.isRead
                  ? <Mail size={16} aria-hidden="true" />
                  : <MailOpen size={16} aria-hidden="true" />}
                <span className="text-grey-4 text-sm font-medium font-['Figtree'] leading-6">
                  {activeEmail.isRead ? 'Mark as unread' : 'Mark as read'}
                </span>
              </div>
            </button>
            <button
              type="button"
              role="menuitem"
              className="self-stretch p-2 rounded-lg inline-flex justify-start items-center gap-2 hover:bg-grey-05 transition-colors w-full"
              onClick={() => { closeContextMenu(); setPendingDeleteEmailId(activeEmail.id); }}
            >
              <Trash2 size={16} aria-hidden="true" />
              <span className="text-grey-4 text-sm font-medium font-['Figtree'] leading-6">Delete</span>
            </button>
          </div>
        </div>
      )}

      <ActionsPopover
        open={pendingDeleteEmailId !== null}
        onClose={() => setPendingDeleteEmailId(null)}
        title="Delete this email?"
        description="This cannot be undone."
        actions={[
          {
            label: 'Delete',
            destructive: true,
            onClick: () => {
              handleDelete(pendingDeleteEmailId!);
              setPendingDeleteEmailId(null);
            },
          },
        ]}
      />
    </div>
  );
}

export default function TodayPage() {
  return (
    <Suspense>
      <TodayView />
    </Suspense>
  );
}
