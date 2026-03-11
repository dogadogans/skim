'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import parse, { Element, domToReact, type HTMLReactParserOptions, type DOMNode } from 'html-react-parser';
import { Plus, Trash2 } from 'lucide-react';
import { LinkPill } from '@/components/LinkPill';
import { Tooltip } from '@/components/Tooltip';
import { useParams, useRouter } from 'next/navigation';
import { MiniHeader } from '@/components/MiniHeader';
import { ActionsPopover } from '@/components/ActionsPopover';
import { IconButton } from '@/components/IconButton';
import { Button } from '@/components/Button';
import { BookmarkCard } from '@/components/BookmarkCard';
import { TAG_COLORS, Tag } from '@/lib/mockData';
import {
  Dropdown,
  DropdownHeader,
  DropdownBody,
  DropdownItemDefault,
  DropdownItemCheckbox,
  DropdownItemColor,
  useDropdownPlacement,
  dropdownPlacementClass,
} from '@/components/Dropdown';
import type { EmailDetail, ContentLink } from '@/lib/gmail';

interface AddedBookmark {
  id: string;       // Supabase UUID
  linkId: string;   // original content link ID (for bookmarkedLinks set)
  title: string;
  domain: string;
  url: string;
  tagIds: string[];
}

export default function EmailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const emailId = params.id as string;

  const [email, setEmail] = useState<EmailDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailIds, setEmailIds] = useState<string[]>([]);

  const [bookmarkedLinks, setBookmarkedLinks] = useState<Set<string>>(new Set());
  const [addedBookmarks, setAddedBookmarks] = useState<AddedBookmark[]>([]);
  const [showUnsubscribeConfirm, setShowUnsubscribeConfirm] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    fetch('/api/tags').then(r => r.json()).then(setTags);
  }, []);
  const [tagMenuId, setTagMenuId] = useState<string | null>(null);
  const [tagSearch, setTagSearch] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(true);
  const [bookmarksAnimating, setBookmarksAnimating] = useState(false);
  const tagMenuRef = useRef<HTMLDivElement>(null);
  const tagMenuPlacement = useDropdownPlacement(tagMenuRef, tagMenuId !== null);

  useEffect(() => {
    const stored = sessionStorage.getItem('emailIds');
    if (stored) setEmailIds(JSON.parse(stored));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/emails/${emailId}`)
      .then(async r => {
        if (r.status === 401) { router.push('/login'); return; }
        if (!r.ok) throw new Error('Failed');
        return r.json();
      })
      .then((data: EmailDetail | undefined) => {
        if (!data) return;
        setEmail(data);
        // Mark as read
        fetch(`/api/emails/${emailId}`, { method: 'PATCH' });
      })
      .finally(() => setLoading(false));
  }, [emailId, router]);

  // Close tag menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (tagMenuRef.current && !tagMenuRef.current.contains(e.target as Node)) {
        setTagMenuId(null);
        setTagSearch('');
        setShowColorPicker(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close tag menu on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (tagMenuId) { setTagMenuId(null); setTagSearch(''); setShowColorPicker(false); }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [tagMenuId]);

  const emailIndex = emailIds.indexOf(emailId);
  const total = emailIds.length;
  const prevId = emailIndex > 0 ? emailIds[emailIndex - 1] : null;
  const nextId = emailIndex < total - 1 ? emailIds[emailIndex + 1] : null;

  async function toggleBookmark(linkId: string, linkText: string, linkUrl: string) {
    if (bookmarkedLinks.has(linkId)) {
      const bm = addedBookmarks.find(b => b.linkId === linkId);
      if (bm) fetch(`/api/bookmarks/${bm.id}`, { method: 'DELETE' });
      setBookmarkedLinks(prev => { const n = new Set(prev); n.delete(linkId); return n; });
      setAddedBookmarks(prev => prev.filter(b => b.linkId !== linkId));
    } else {
      const domain = (() => {
        try { return new URL(linkUrl).hostname.replace('www.', ''); }
        catch { return linkUrl; }
      })();
      setBookmarkedLinks(prev => new Set(prev).add(linkId)); // optimistic checkmark
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: linkText, url: linkUrl, domain, source_newsletter: email?.sender ?? '' }),
      });
      if (res.ok) {
        const { id } = await res.json();
        setAddedBookmarks(prev => [...prev, { id, linkId, title: linkText, domain, url: linkUrl, tagIds: [] }]);
      }
    }
  }

  function toggleTagOnBookmark(bookmarkId: string, tagId: string) {
    const bm = addedBookmarks.find(b => b.id === bookmarkId);
    const hasTag = bm?.tagIds.includes(tagId);
    if (hasTag) {
      fetch(`/api/bookmarks/${bookmarkId}/tags`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tagId }) });
    } else {
      fetch(`/api/bookmarks/${bookmarkId}/tags`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tagId }) });
    }
    setAddedBookmarks(prev =>
      prev.map(b => {
        if (b.id !== bookmarkId) return b;
        if (hasTag) return { ...b, tagIds: b.tagIds.filter(t => t !== tagId) };
        return { ...b, tagIds: [...b.tagIds, tagId] };
      })
    );
  }

  async function createAndAddTag(bookmarkId: string, name: string, colorOption: typeof TAG_COLORS[0]) {
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), color: colorOption.bg, textColor: colorOption.text }),
    });
    const newTag: Tag = await res.json();
    await fetch(`/api/bookmarks/${bookmarkId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId: newTag.id }),
    });
    setTags(prev => [...prev, newTag]);
    setAddedBookmarks(prev =>
      prev.map(bm => bm.id !== bookmarkId ? bm : { ...bm, tagIds: [...bm.tagIds, newTag.id] })
    );
    setTagMenuId(null);
    setTagSearch('');
    setShowColorPicker(false);
  }

  function removeBookmark(bookmarkId: string, linkId: string) {
    fetch(`/api/bookmarks/${bookmarkId}`, { method: 'DELETE' });
    setAddedBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    setBookmarkedLinks(prev => { const n = new Set(prev); n.delete(linkId); return n; });
  }

  async function handleDelete() {
    await fetch(`/api/emails/${emailId}`, { method: 'DELETE' });
    router.push('/');
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-grey-2 text-sm">Loading…</div>
    );
  }

  if (!email) {
    return (
      <div className="py-20 text-center text-grey-2 text-sm">
        Email not found. <button onClick={() => router.push('/')} className="underline">Go back</button>
      </div>
    );
  }

  // html-react-parser options: inject LinkPill for detected content links
  const contentLinkMap = new Map<string, ContentLink>(
    (email.contentLinks ?? []).map(l => [l.url, l])
  );

  const parserOptions: HTMLReactParserOptions = {
    replace(domNode: DOMNode) {
      if (domNode instanceof Element && domNode.name === 'a') {
        const href = domNode.attribs.href ?? '';
        const contentLink = contentLinkMap.get(href);
        if (contentLink) {
          const saved = bookmarkedLinks.has(contentLink.id);
          return (
            <LinkPill
              text={contentLink.text}
              url={href}
              saved={saved}
              onToggle={() => toggleBookmark(contentLink.id, contentLink.text, href)}
            />
          );
        }
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-info-500 underline">
            {domToReact(domNode.children as DOMNode[], parserOptions)}
          </a>
        );
      }
    },
  };

  return (
    <div className="space-y-3">
      {/* Top nav bar */}
      <MiniHeader
        variant="email-detail"
        current={emailIndex >= 0 ? emailIndex + 1 : 1}
        total={total || 1}
        onBack={() => router.push('/')}
        actions={
          <ActionsPopover
            trigger={
              <IconButton title="Delete">
                <Trash2 size={14} color="#27272a" aria-hidden="true" />
              </IconButton>
            }
            title="Delete this email?"
            description="This cannot be undone."
            actions={[{ label: 'Delete', destructive: true, onClick: handleDelete }]}
          />
        }
        onPrev={prevId ? () => router.push(`/email/${prevId}`) : undefined}
        onNext={nextId ? () => router.push(`/email/${nextId}`) : undefined}
        prevDisabled={!prevId}
        nextDisabled={!nextId}
      />

      {/* Email card */}
      <div className="flex flex-col">
        {/* Sender header */}
        <div className="px-3 py-2 bg-white rounded-tl-lg rounded-tr-lg shadow-[0px_0px_0px_1px_rgba(242,242,242,1.00)] shadow-[0px_0px_0px_1px_rgba(150,150,150,0.08)] flex justify-between items-center gap-1 overflow-hidden">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              aria-hidden="true"
              className="w-8 h-8 rounded-md flex-shrink-0 flex items-center justify-center shadow-[inset_1px_1px_2px_0px_rgba(208,253,228,1.00)] shadow-[inset_0px_-1px_1px_0px_rgba(9,199,133,0.50)]"
              style={{ backgroundColor: email.avatarColor }}
            >
              <span className="text-white text-base font-semibold leading-6">
                {email.sender.charAt(0)}
              </span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-grey-4 text-sm font-semibold leading-6 whitespace-nowrap">{email.sender}</span>
              <span className="text-grey-2 text-sm font-medium leading-6 truncate">{email.senderEmail}</span>
            </div>
          </div>
          {email.listUnsubscribeUrl && !unsubscribed && (
            <>
              <Button onClick={() => setShowUnsubscribeConfirm(true)}>Unsubscribe…</Button>
              <ActionsPopover
                open={showUnsubscribeConfirm}
                onClose={() => setShowUnsubscribeConfirm(false)}
                title="Unsubscribe"
                description={`Stop getting messages from ${email.sender}?`}
                actions={[{
                  label: 'Unsubscribe',
                  destructive: true,
                  onClick: () => {
                    setUnsubscribed(true);
                    if (email.listUnsubscribeUrl!.startsWith('mailto:')) {
                      window.open(email.listUnsubscribeUrl!);
                    } else {
                      fetch(email.listUnsubscribeUrl!, { method: 'POST' }).catch(() => {});
                    }
                  },
                }]}
              />
            </>
          )}
        </div>

        {/* Email body */}
        <div className="p-3 bg-white rounded-bl-lg rounded-br-lg shadow-[0px_0px_0px_1px_rgba(242,242,242,1.00)] shadow-[0px_0px_0px_1px_rgba(150,150,150,0.08)] overflow-x-auto">
          <div className="text-sm text-grey-3 leading-relaxed email-body">
            {parse(email.htmlBody, parserOptions)}
          </div>
        </div>
      </div>

      {/* Added Bookmarks */}
      {addedBookmarks.length > 0 && (
        <div className="p-3 bg-grey-05 rounded-lg shadow-[0px_0px_0px_1px_rgba(242,242,242,0.50)] shadow-[0px_0px_0px_1px_rgba(150,150,150,0.08)] shadow-[inset_2px_2px_8px_0px_rgba(255,255,255,1.00)] flex flex-col gap-3">
          <button
            type="button"
            aria-expanded={bookmarksOpen}
            aria-controls="added-bookmarks-list"
            className="w-full flex items-center gap-3 text-left"
            onClick={() => setBookmarksOpen(o => !o)}
          >
            <div className="w-8 h-8 bg-info-200 rounded-md shadow-[inset_1px_1px_2px_0px_rgba(255,255,255,1.00)] shadow-[inset_0px_-1px_1px_0px_rgba(93,222,253,1.00)] flex items-center justify-center flex-shrink-0">
              <span className="text-info-600 text-base font-semibold leading-6">{addedBookmarks.length}</span>
            </div>
            <span className="flex-1 text-grey-4 text-base font-semibold leading-6">Added Bookmarks</span>
            <ChevronDownIcon open={bookmarksOpen} />
          </button>

          <AnimatePresence initial={false}>
            {bookmarksOpen && (
              <motion.div
                id="added-bookmarks-list"
                className={`flex flex-col gap-2 ${bookmarksAnimating ? 'overflow-hidden' : 'overflow-visible'}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                onAnimationStart={() => setBookmarksAnimating(true)}
                onAnimationComplete={() => setBookmarksAnimating(false)}
              >
                {addedBookmarks.map(bm => {
                  const bmTags = tags.filter(t => bm.tagIds.includes(t.id));
                  const visibleTags = bmTags.slice(0, 2);
                  const extraCount = bmTags.length - 2;
                  const isTagMenuOpen = tagMenuId === bm.id;
                  return (
                    <BookmarkCard
                      key={bm.id}
                      title={bm.title}
                      domain={bm.domain}
                      url={bm.url}
                      actions={
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {visibleTags.map(tag => (
                            <button
                              key={tag.id}
                              type="button"
                              aria-label={`Tag: ${tag.name}. Click to manage tags.`}
                              onClick={() => { setTagMenuId(isTagMenuOpen ? null : bm.id); setTagSearch(''); setShowColorPicker(false); }}
                              className="h-6 px-2 rounded-full flex items-center gap-1 bg-white shadow-[0px_0px_0px_1px_rgba(241,241,241,1),0px_1px_1px_0px_rgba(0,0,0,0.12)] hover:shadow-[0px_0px_0px_1px_rgba(191,191,191,1)]"
                            >
                              <span aria-hidden="true" className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tag.textColor }} />
                              <span className="text-xs font-medium text-grey-4">{tag.name}</span>
                            </button>
                          ))}

                          {extraCount > 0 && (
                            <Tooltip label={bmTags.slice(2).map(t => t.name).join(', ')}>
                              <button
                                type="button"
                                aria-label={`${extraCount} more tags. Click to manage tags.`}
                                onClick={() => { setTagMenuId(isTagMenuOpen ? null : bm.id); setTagSearch(''); setShowColorPicker(false); }}
                                className="h-6 px-2 rounded-full flex items-center text-xs font-medium bg-white text-grey-4 shadow-[0px_0px_0px_1px_rgba(241,241,241,1),0px_1px_1px_0px_rgba(0,0,0,0.12)] hover:shadow-[0px_0px_0px_1px_rgba(191,191,191,1)]"
                              >
                                +{extraCount}
                              </button>
                            </Tooltip>
                          )}

                          <div className="relative" ref={isTagMenuOpen ? tagMenuRef : undefined}>
                            {bmTags.length === 0 && (
                              <button
                                type="button"
                                aria-label="Add tag"
                                onClick={() => { setTagMenuId(isTagMenuOpen ? null : bm.id); setTagSearch(''); setShowColorPicker(false); }}
                                className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-grey-2 hover:text-grey-3 shadow-[0px_0px_0px_1px_rgba(241,241,241,1),0px_1px_1px_0px_rgba(0,0,0,0.12)]"
                              >
                                <Plus size={14} aria-hidden="true" />
                              </button>
                            )}

                            {isTagMenuOpen && !showColorPicker && (() => {
                              const trimmed = tagSearch.trim().toLowerCase();
                              const menuTags = tags.filter(t => !tagSearch || t.name.toLowerCase().includes(trimmed));
                              const matchesExisting = tags.some(t => t.name.toLowerCase() === trimmed);
                              return (
                                <Dropdown className={`absolute right-0 ${dropdownPlacementClass(tagMenuPlacement)} w-64 z-20`} onClose={() => { setTagMenuId(null); setTagSearch(''); }}>
                                  <DropdownHeader variant="search" autoFocus value={tagSearch} onChange={e => setTagSearch(e.target.value)} placeholder="Add a new tag" />
                                  <DropdownBody>
                                    {menuTags.map(tag => (
                                      <DropdownItemCheckbox key={tag.id} label={tag.name} checked={bm.tagIds.includes(tag.id)} dotColor={tag.textColor} onClick={() => toggleTagOnBookmark(bm.id, tag.id)} />
                                    ))}
                                    {trimmed && !matchesExisting && (
                                      <DropdownItemDefault label="Create a new tag" icon={<PlusSmallIcon />} onClick={() => setShowColorPicker(true)} />
                                    )}
                                    {menuTags.length === 0 && !trimmed && (
                                      <p className="px-2 py-2 text-xs text-grey-2">No tags available</p>
                                    )}
                                  </DropdownBody>
                                </Dropdown>
                              );
                            })()}

                            {isTagMenuOpen && showColorPicker && (
                              <Dropdown className={`absolute right-0 ${dropdownPlacementClass(tagMenuPlacement)} w-64 z-20`} onClose={() => setShowColorPicker(false)}>
                                <DropdownHeader variant="label" label="Tag color" />
                                <DropdownBody>
                                  {TAG_COLORS.map(c => (
                                    <DropdownItemColor key={c.name} label={c.name} color={c.text} onClick={() => createAndAddTag(bm.id, tagSearch, c)} />
                                  ))}
                                </DropdownBody>
                              </Dropdown>
                            )}
                          </div>

                          <button
                            type="button"
                            aria-label={`Remove "${bm.title}" from bookmarks`}
                            onClick={() => removeBookmark(bm.id, bm.linkId)}
                            className="w-5 h-5 flex items-center justify-center text-grey-2 hover:text-danger-500 transition-colors"
                          >
                            <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                      }
                    />
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function PlusSmallIcon() {
  return (
    <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={`transition-transform text-grey-2 ${open ? 'rotate-180' : ''}`}
    >
      <path d="M2 5L7 10L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
