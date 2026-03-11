'use client';

import { Suspense } from 'react';
import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { ActionsPopover } from '@/components/ActionsPopover';
import { Tooltip } from '@/components/Tooltip';
import { TAG_COLORS, Tag } from '@/lib/mockData';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  domain: string;
  source: string;
  tagIds: string[];
  createdAt: string;
}
import { MiniHeader } from '@/components/MiniHeader';
import { BookmarkCard } from '@/components/BookmarkCard';
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

type SortOption = 'newest' | 'oldest' | 'name-az' | 'name-za' | 'site-az' | 'site-za';

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  'name-az': 'Name A–Z',
  'name-za': 'Name Z–A',
  'site-az': 'Site A–Z',
  'site-za': 'Site Z–A',
};


function BookmarksView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL-persisted state
  const sort = (searchParams.get('sort') as SortOption) || 'newest';
  const filterTagIds = searchParams.get('tags')?.split(',').filter(Boolean) ?? [];

  function setSort(option: SortOption) {
    const params = new URLSearchParams(searchParams.toString());
    if (option === 'newest') {
      params.delete('sort');
    } else {
      params.set('sort', option);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function setFilterTagIds(updater: string[] | ((prev: string[]) => string[])) {
    const next = typeof updater === 'function' ? updater(filterTagIds) : updater;
    const params = new URLSearchParams(searchParams.toString());
    if (next.length === 0) {
      params.delete('tags');
    } else {
      params.set('tags', next.join(','));
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    fetch('/api/bookmarks').then(r => r.json()).then(setBookmarks);
    fetch('/api/tags').then(r => r.json()).then(setTags);
  }, []);
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [tagMenuBookmarkId, setTagMenuBookmarkId] = useState<string | null>(null);
  const [tagSearch, setTagSearch] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [dotsMenuBookmarkId, setDotsMenuBookmarkId] = useState<string | null>(null);
  const [dotsTagOpenId, setDotsTagOpenId] = useState<string | null>(null);
  const [dotsTagSearch, setDotsTagSearch] = useState('');
  const [dotsShowColorPicker, setDotsShowColorPicker] = useState(false);
  const [mobileDotsView, setMobileDotsView] = useState<'menu' | 'tags' | 'color'>('menu');
  const [contextMenuBookmarkId, setContextMenuBookmarkId] = useState<string | null>(null);
  const [pendingDeleteBookmarkId, setPendingDeleteBookmarkId] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tagMenuRef = useRef<HTMLDivElement>(null);
  const dotsMenuRef = useRef<HTMLDivElement>(null);
  const dotsSubmenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const filterPlacement = useDropdownPlacement(headerRef, filterOpen);
  const sortPlacement = useDropdownPlacement(headerRef, sortOpen);
  const tagMenuPlacement = useDropdownPlacement(tagMenuRef, tagMenuBookmarkId !== null);
  const dotsPlacement = useDropdownPlacement(dotsMenuRef, dotsMenuBookmarkId !== null);

  // Close all menus on outside click (mousedown for desktop, touchstart for mobile)
  useEffect(() => {
    function handler(e: MouseEvent | TouchEvent) {
      const target = e instanceof TouchEvent ? e.touches[0]?.target : e.target;
      if (!target) return;
      if (sortRef.current && !sortRef.current.contains(target as Node)) setSortOpen(false);
      if (filterRef.current && !filterRef.current.contains(target as Node)) { setFilterOpen(false); setFilterSearch(''); }
      if (tagMenuRef.current && !tagMenuRef.current.contains(target as Node)) {
        setTagMenuBookmarkId(null);
        setTagSearch('');
        setShowColorPicker(false);
      }
      if (dotsMenuRef.current && !dotsMenuRef.current.contains(target as Node)) {
        setDotsMenuBookmarkId(null);
        setDotsTagOpenId(null);
        setDotsTagSearch('');
        setDotsShowColorPicker(false);
        setMobileDotsView('menu');
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(target as Node)) {
        setContextMenuBookmarkId(null);
        setContextMenuPos(null);
        setDotsTagOpenId(null);
        setDotsTagSearch('');
        setDotsShowColorPicker(false);
      }
    }
    document.addEventListener('mousedown', handler as EventListener);
    document.addEventListener('touchstart', handler as EventListener);
    return () => {
      document.removeEventListener('mousedown', handler as EventListener);
      document.removeEventListener('touchstart', handler as EventListener);
    };
  }, []);

  // Close all menus on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (contextMenuBookmarkId) { setContextMenuBookmarkId(null); setContextMenuPos(null); return; }
      if (dotsMenuBookmarkId) { setDotsMenuBookmarkId(null); setDotsTagOpenId(null); setDotsTagSearch(''); setDotsShowColorPicker(false); setMobileDotsView('menu'); return; }
      if (tagMenuBookmarkId) { setTagMenuBookmarkId(null); setTagSearch(''); setShowColorPicker(false); return; }
      if (filterOpen) { setFilterOpen(false); setFilterSearch(''); return; }
      if (sortOpen) { setSortOpen(false); }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [contextMenuBookmarkId, dotsMenuBookmarkId, tagMenuBookmarkId, filterOpen, sortOpen]);

  function getSorted(items: Bookmark[]): Bookmark[] {
    return [...items].sort((a, b) => {
      switch (sort) {
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name-az': return a.title.localeCompare(b.title);
        case 'name-za': return b.title.localeCompare(a.title);
        case 'site-az': return a.domain.localeCompare(b.domain);
        case 'site-za': return b.domain.localeCompare(a.domain);
        default: return 0;
      }
    });
  }

  const filtered = filterTagIds.length > 0
    ? bookmarks.filter((bm) => filterTagIds.some((tid) => bm.tagIds.includes(tid)))
    : bookmarks;

  const sorted = getSorted(filtered);

  function toggleFilterTag(tagId: string) {
    setFilterTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }

  function toggleTagOnBookmark(bookmarkId: string, tagId: string) {
    const bm = bookmarks.find(b => b.id === bookmarkId);
    const hasTag = bm?.tagIds.includes(tagId);
    if (hasTag) {
      fetch(`/api/bookmarks/${bookmarkId}/tags`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tagId }) });
    } else {
      fetch(`/api/bookmarks/${bookmarkId}/tags`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tagId }) });
    }
    setBookmarks((prev) =>
      prev.map((b) => {
        if (b.id !== bookmarkId) return b;
        if (hasTag) return { ...b, tagIds: b.tagIds.filter((t: string) => t !== tagId) };
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
    setTags((prev) => [...prev, newTag]);
    setBookmarks((prev) =>
      prev.map((bm) =>
        bm.id !== bookmarkId ? bm : { ...bm, tagIds: [...bm.tagIds, newTag.id] }
      )
    );
    setTagMenuBookmarkId(null);
    setTagSearch('');
    setShowColorPicker(false);
  }

  function openDotsSubmenu(id: string) {
    if (dotsSubmenuTimerRef.current) clearTimeout(dotsSubmenuTimerRef.current);
    setDotsTagOpenId(id);
  }
  function scheduleCloseDotsSubmenu() {
    dotsSubmenuTimerRef.current = setTimeout(() => setDotsTagOpenId(null), 150);
  }
  function cancelCloseDotsSubmenu() {
    if (dotsSubmenuTimerRef.current) clearTimeout(dotsSubmenuTimerRef.current);
  }

  function deleteBookmark(bookmarkId: string) {
    fetch(`/api/bookmarks/${bookmarkId}`, { method: 'DELETE' });
    setBookmarks((prev) => prev.filter((bm) => bm.id !== bookmarkId));
    setDotsMenuBookmarkId(null);
    setContextMenuBookmarkId(null);
    setContextMenuPos(null);
  }

  const trimmedSearch = tagSearch.trim().toLowerCase();
  const matchesExisting = tags.some((t) => t.name.toLowerCase() === trimmedSearch);
  const menuTags = tags.filter((t) => !tagSearch || t.name.toLowerCase().includes(trimmedSearch));

  const dotsTrimmed = dotsTagSearch.trim().toLowerCase();
  const dotsMatchesExisting = tags.some((t) => t.name.toLowerCase() === dotsTrimmed);
  const dotsMenuTags = tags.filter((t) => !dotsTagSearch || t.name.toLowerCase().includes(dotsTrimmed));

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="relative" ref={headerRef}>
        <MiniHeader
          variant="bookmark"
          count={bookmarks.length}
          sortLabel={SORT_LABELS[sort]}
          sortOpen={sortOpen}
          filterActive={filterTagIds.length > 0}
          onFilter={() => setFilterOpen((o) => !o)}
          onSortClick={() => setSortOpen((o) => !o)}
        />

        {/* Filter dropdown */}
        {filterOpen && (
          <Dropdown ref={filterRef} className={`absolute right-20 ${dropdownPlacementClass(filterPlacement)} w-64 z-20`} onClose={() => { setFilterOpen(false); setFilterSearch(''); }}>
            <DropdownHeader
              variant="search"
              autoFocus
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search tags…"
              trailing={
                filterTagIds.length > 0 && !filterSearch && (
                  <button
                    type="button"
                    onClick={() => setFilterTagIds([])}
                    className="px-2 py-1 bg-white rounded-md text-sm font-medium text-grey-3 flex-shrink-0 transition-colors hover:bg-grey-05 shadow-[0px_0px_0px_1px_rgba(219,219,219,0.50),0px_1px_2px_0px_rgba(44,41,41,0.08)]"
                  >
                    Reset
                  </button>
                )
              }
            />
            <DropdownBody className="px-2 py-1 max-h-52 overflow-y-auto dropdown-scroll">
              {(() => {
                const visibleTags = tags.filter((t) => !filterSearch || t.name.toLowerCase().includes(filterSearch.toLowerCase()));
                return visibleTags.length > 0
                  ? visibleTags.map((tag) => (
                      <DropdownItemCheckbox
                        key={tag.id}
                        label={tag.name}
                        checked={filterTagIds.includes(tag.id)}
                        dotColor={tag.textColor}
                        onClick={() => toggleFilterTag(tag.id)}
                      />
                    ))
                  : <p className="px-2 py-2 text-xs text-grey-2">No results</p>;
              })()}
            </DropdownBody>
          </Dropdown>
        )}

        {/* Sort dropdown */}
        {sortOpen && (
          <Dropdown ref={sortRef} className={`absolute right-0 ${dropdownPlacementClass(sortPlacement)} min-w-[160px] z-20`} onClose={() => setSortOpen(false)}>
            <DropdownBody>
              {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                <DropdownItemDefault
                  key={option}
                  label={SORT_LABELS[option]}
                  active={sort === option}
                  onClick={() => { setSort(option); setSortOpen(false); }}
                />
              ))}
            </DropdownBody>
          </Dropdown>
        )}
      </div>

      {/* Bookmark list */}
      {sorted.length === 0 ? (
        <div className="py-16 text-center text-grey-2 text-sm">
          No bookmarks{filterTagIds.length > 0 ? ' match your filters' : ' yet'}.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((bm) => {
            const bmTags = tags.filter((t) => bm.tagIds.includes(t.id));
            const visibleTags = bmTags.slice(0, 2);
            const extraCount = bmTags.length - 2;
            const isTagMenuOpen = tagMenuBookmarkId === bm.id;
            const isDotsOpen = dotsMenuBookmarkId === bm.id;
            const isCtxOpen = contextMenuBookmarkId === bm.id;

            return (
              <li key={bm.id}>
                <BookmarkCard
                  title={bm.title}
                  domain={bm.domain}
                  url={bm.url}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenuBookmarkId(bm.id);
                    setContextMenuPos({ x: e.clientX, y: e.clientY });
                    setDotsMenuBookmarkId(null);
                    setDotsTagOpenId(null);
                    setDotsTagSearch('');
                    setDotsShowColorPicker(false);
                  }}
                  actions={<>
                    {/* Tags */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {visibleTags.map((tag, i) => (
                        <button
                          key={tag.id}
                          type="button"
                          aria-label={`Tag: ${tag.name}. Click to manage tags.`}
                          onClick={() => { setTagMenuBookmarkId(isTagMenuOpen ? null : bm.id); setTagSearch(''); setShowColorPicker(false); }}
                          className={`h-6 px-2 rounded-full items-center gap-1 bg-white shadow-[0px_0px_0px_1px_rgba(241,241,241,1),0px_1px_1px_0px_rgba(0,0,0,0.12)] hover:shadow-[0px_0px_0px_1px_rgba(191,191,191,1)] ${i === 1 ? 'hidden sm:flex' : 'flex'}`}
                        >
                          <span aria-hidden="true" className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tag.textColor }} />
                          <span className="text-xs font-medium text-grey-4">{tag.name}</span>
                        </button>
                      ))}

                      {/* Mobile: overflow when >1 tag */}
                      {bmTags.length > 1 && (
                        <Tooltip label={bmTags.slice(1).map((t) => t.name).join(', ')}>
                          <button
                            type="button"
                            aria-label={`${bmTags.length - 1} more tags. Click to manage tags.`}
                            onClick={() => { setTagMenuBookmarkId(isTagMenuOpen ? null : bm.id); setTagSearch(''); setShowColorPicker(false); }}
                            className="sm:hidden h-6 px-2 rounded-full flex items-center text-xs font-medium bg-white text-grey-4 shadow-[0px_0px_0px_1px_rgba(241,241,241,1),0px_1px_1px_0px_rgba(0,0,0,0.12)] hover:shadow-[0px_0px_0px_1px_rgba(191,191,191,1)]"
                          >
                            +{bmTags.length - 1}
                          </button>
                        </Tooltip>
                      )}

                      {/* Desktop: overflow when >2 tags */}
                      {extraCount > 0 && (
                        <Tooltip label={bmTags.slice(2).map((t) => t.name).join(', ')}>
                          <button
                            type="button"
                            aria-label={`${extraCount} more tags. Click to manage tags.`}
                            onClick={() => { setTagMenuBookmarkId(isTagMenuOpen ? null : bm.id); setTagSearch(''); setShowColorPicker(false); }}
                            className="hidden sm:flex h-6 px-2 rounded-full items-center text-xs font-medium bg-white text-grey-4 shadow-[0px_0px_0px_1px_rgba(241,241,241,1),0px_1px_1px_0px_rgba(0,0,0,0.12)] hover:shadow-[0px_0px_0px_1px_rgba(191,191,191,1)]"
                          >
                            +{extraCount}
                          </button>
                        </Tooltip>
                      )}

                      {/* Add tag button — only when no tags */}
                      <div className="relative" ref={isTagMenuOpen ? tagMenuRef : undefined}>
                        {bmTags.length === 0 && (
                          <button
                            type="button"
                            aria-label="Add tag"
                            onClick={() => {
                              setTagMenuBookmarkId(isTagMenuOpen ? null : bm.id);
                              setTagSearch('');
                              setShowColorPicker(false);
                            }}
                            className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-grey-2 hover:text-grey-3 shadow-[0px_0px_0px_1px_rgba(241,241,241,1),0px_1px_1px_0px_rgba(0,0,0,0.12)] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                          >
                            <Plus size={14} aria-hidden="true" />
                          </button>
                        )}

                        {/* Tag search */}
                        {isTagMenuOpen && !showColorPicker && (
                          <Dropdown className={`absolute right-0 ${dropdownPlacementClass(tagMenuPlacement)} w-64 z-20`} onClose={() => { setTagMenuBookmarkId(null); setTagSearch(''); }}>
                            <DropdownHeader
                              variant="search"
                              autoFocus
                              value={tagSearch}
                              onChange={(e) => setTagSearch(e.target.value)}
                              placeholder="Add a new tag"
                            />
                            <DropdownBody>
                              {menuTags.map((tag) => (
                                <DropdownItemCheckbox
                                  key={tag.id}
                                  label={tag.name}
                                  checked={bm.tagIds.includes(tag.id)}
                                  dotColor={tag.textColor}
                                  onClick={() => toggleTagOnBookmark(bm.id, tag.id)}
                                />
                              ))}
                              {trimmedSearch && !matchesExisting && (
                                <DropdownItemDefault
                                  label="Create a new tag"
                                  icon={<PlusSmallIcon />}
                                  onClick={() => setShowColorPicker(true)}
                                />
                              )}
                              {menuTags.length === 0 && !trimmedSearch && (
                                <p className="px-2 py-2 text-xs text-grey-2">No tags available</p>
                              )}
                            </DropdownBody>
                          </Dropdown>
                        )}

                        {/* Tag color picker */}
                        {isTagMenuOpen && showColorPicker && (
                          <Dropdown className={`absolute right-0 ${dropdownPlacementClass(tagMenuPlacement)} w-64 z-20`} onClose={() => setShowColorPicker(false)}>
                            <DropdownHeader variant="label" label="Tag color" />
                            <DropdownBody>
                              {TAG_COLORS.map((c) => (
                                <DropdownItemColor
                                  key={c.name}
                                  label={c.name}
                                  color={c.text}
                                  onClick={() => createAndAddTag(bm.id, tagSearch, c)}
                                />
                              ))}
                            </DropdownBody>
                          </Dropdown>
                        )}
                      </div>
                    </div>

                    {/* Three-dot menu */}
                    <div className="relative flex-shrink-0" ref={isDotsOpen ? dotsMenuRef : undefined}>
                      <Tooltip label="More options">
                        <button
                          type="button"
                          aria-label="More options"
                          aria-haspopup="true"
                          aria-expanded={isDotsOpen}
                          onClick={() => { setDotsMenuBookmarkId(isDotsOpen ? null : bm.id); setDotsTagOpenId(null); setDotsTagSearch(''); setMobileDotsView('menu'); }}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-grey-2 hover:text-grey-3 hover:bg-grey-05 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <DotsHorizontalIcon />
                        </button>
                      </Tooltip>

                      {/* Dropdown */}
                      {isDotsOpen && (
                        <Dropdown
                          clip={false}
                          className={`absolute right-0 ${dropdownPlacementClass(dotsPlacement)} z-20 ${mobileDotsView !== 'menu' ? 'w-64 sm:w-44' : 'w-44'}`}
                          onClose={() => { setDotsMenuBookmarkId(null); setDotsTagOpenId(null); setDotsTagSearch(''); setDotsShowColorPicker(false); setMobileDotsView('menu'); }}
                        >
                          {/* Main menu — hidden on mobile when tag/color view is active */}
                          <div className={mobileDotsView !== 'menu' ? 'hidden sm:block' : ''}>
                            <DropdownBody className="px-2 py-2">
                              <DropdownItemDefault
                                label="Tags"
                                icon={<TagMenuIcon />}
                                trailing={<ChevronRightIcon />}
                                onMouseEnter={() => openDotsSubmenu(bm.id)}
                                onMouseLeave={scheduleCloseDotsSubmenu}
                                onClick={() => { cancelCloseDotsSubmenu(); setDotsTagOpenId(bm.id); setMobileDotsView('tags'); }}
                              />
                              <DropdownItemDefault
                                label="Delete Bookmark"
                                icon={<Trash2 size={16} />}
                                onMouseEnter={() => { cancelCloseDotsSubmenu(); setDotsTagOpenId(null); }}
                                onClick={() => { setDotsMenuBookmarkId(null); setPendingDeleteBookmarkId(bm.id); }}
                              />
                            </DropdownBody>
                          </div>

                          {/* Desktop fly-out: tag search */}
                          {dotsTagOpenId === bm.id && !dotsShowColorPicker && (
                            <Dropdown
                              className="absolute right-full top-0 mr-1 w-64 z-20 hidden sm:block"
                              onMouseEnter={cancelCloseDotsSubmenu}
                              onMouseLeave={scheduleCloseDotsSubmenu}
                              onClose={() => setDotsTagOpenId(null)}
                            >
                              <DropdownHeader
                                variant="search"
                                autoFocus
                                value={dotsTagSearch}
                                onChange={(e) => setDotsTagSearch(e.target.value)}
                                placeholder="Add a new tag"
                              />
                              <DropdownBody>
                                {dotsMenuTags.map((tag) => (
                                  <DropdownItemCheckbox
                                    key={tag.id}
                                    label={tag.name}
                                    checked={bm.tagIds.includes(tag.id)}
                                    dotColor={tag.textColor}
                                    onClick={() => toggleTagOnBookmark(bm.id, tag.id)}
                                  />
                                ))}
                                {dotsTrimmed && !dotsMatchesExisting && (
                                  <DropdownItemDefault
                                    label="Create a new tag"
                                    icon={<PlusSmallIcon />}
                                    onClick={() => setDotsShowColorPicker(true)}
                                  />
                                )}
                                {dotsMenuTags.length === 0 && !dotsTrimmed && (
                                  <p className="px-2 py-2 text-xs text-grey-2">No tags available</p>
                                )}
                              </DropdownBody>
                            </Dropdown>
                          )}

                          {/* Desktop fly-out: color picker */}
                          {dotsTagOpenId === bm.id && dotsShowColorPicker && (
                            <Dropdown
                              className="absolute right-full top-0 mr-1 w-64 z-20 hidden sm:block"
                              onMouseEnter={cancelCloseDotsSubmenu}
                              onMouseLeave={scheduleCloseDotsSubmenu}
                              onClose={() => setDotsShowColorPicker(false)}
                            >
                              <DropdownHeader variant="label" label="Tag color" />
                              <DropdownBody>
                                {TAG_COLORS.map((c) => (
                                  <DropdownItemColor
                                    key={c.name}
                                    label={c.name}
                                    color={c.text}
                                    onClick={() => {
                                      createAndAddTag(bm.id, dotsTagSearch, c);
                                      setDotsShowColorPicker(false);
                                      setDotsTagSearch('');
                                    }}
                                  />
                                ))}
                              </DropdownBody>
                            </Dropdown>
                          )}

                          {/* Mobile inline: tag list — completely independent of hover/timer state */}
                          {mobileDotsView === 'tags' && (
                            <div className="sm:hidden">
                              <DropdownHeader
                                variant="search"
                                value={dotsTagSearch}
                                onChange={(e) => setDotsTagSearch(e.target.value)}
                                placeholder="Add a new tag"
                              />
                              <DropdownBody>
                                {dotsMenuTags.map((tag) => (
                                  <DropdownItemCheckbox
                                    key={tag.id}
                                    label={tag.name}
                                    checked={bm.tagIds.includes(tag.id)}
                                    dotColor={tag.textColor}
                                    onClick={() => toggleTagOnBookmark(bm.id, tag.id)}
                                  />
                                ))}
                                {dotsTrimmed && !dotsMatchesExisting && (
                                  <DropdownItemDefault
                                    label="Create a new tag"
                                    icon={<PlusSmallIcon />}
                                    onClick={() => setMobileDotsView('color')}
                                  />
                                )}
                                {dotsMenuTags.length === 0 && !dotsTrimmed && (
                                  <p className="px-2 py-2 text-xs text-grey-2">No tags available</p>
                                )}
                              </DropdownBody>
                            </div>
                          )}

                          {/* Mobile inline: color picker */}
                          {mobileDotsView === 'color' && (
                            <div className="sm:hidden">
                              <DropdownHeader variant="label" label="Tag color" />
                              <DropdownBody>
                                {TAG_COLORS.map((c) => (
                                  <DropdownItemColor
                                    key={c.name}
                                    label={c.name}
                                    color={c.text}
                                    onClick={() => {
                                      createAndAddTag(bm.id, dotsTagSearch, c);
                                      setMobileDotsView('menu');
                                      setDotsTagSearch('');
                                    }}
                                  />
                                ))}
                              </DropdownBody>
                            </div>
                          )}
                        </Dropdown>
                      )}

                    </div>
                  </>}
                  overlay={
                    isCtxOpen && contextMenuPos ? (
                      <Dropdown
                        ref={contextMenuRef}
                        clip={false}
                        style={{ position: 'fixed', left: contextMenuPos.x, top: contextMenuPos.y }}
                        className="w-44 z-50"
                        onClose={() => { setContextMenuBookmarkId(null); setContextMenuPos(null); }}
                      >
                        <DropdownBody className="px-2 py-2">
                          <DropdownItemDefault
                            label="Tags"
                            icon={<TagMenuIcon />}
                            trailing={<ChevronRightIcon />}
                            onMouseEnter={() => openDotsSubmenu(bm.id)}
                            onMouseLeave={scheduleCloseDotsSubmenu}
                          />
                          <DropdownItemDefault
                            label="Delete Bookmark"
                            icon={<Trash2 size={16} />}
                            onMouseEnter={() => { cancelCloseDotsSubmenu(); setDotsTagOpenId(null); }}
                            onClick={() => { setContextMenuBookmarkId(null); setContextMenuPos(null); setPendingDeleteBookmarkId(bm.id); }}
                          />
                        </DropdownBody>

                        {/* Tags submenu — search */}
                        {dotsTagOpenId === bm.id && !dotsShowColorPicker && (
                          <Dropdown
                            className="absolute right-full top-0 mr-1 w-64 z-50"
                            onMouseEnter={cancelCloseDotsSubmenu}
                            onMouseLeave={scheduleCloseDotsSubmenu}
                            onClose={() => setDotsTagOpenId(null)}
                          >
                            <DropdownHeader
                              variant="search"
                              autoFocus
                              value={dotsTagSearch}
                              onChange={(e) => setDotsTagSearch(e.target.value)}
                              placeholder="Add a new tag"
                            />
                            <DropdownBody>
                              {dotsMenuTags.map((tag) => (
                                <DropdownItemCheckbox
                                  key={tag.id}
                                  label={tag.name}
                                  checked={bm.tagIds.includes(tag.id)}
                                  dotColor={tag.textColor}
                                  onClick={() => toggleTagOnBookmark(bm.id, tag.id)}
                                />
                              ))}
                              {dotsTrimmed && !dotsMatchesExisting && (
                                <DropdownItemDefault
                                  label="Create a new tag"
                                  icon={<PlusSmallIcon />}
                                  onClick={() => setDotsShowColorPicker(true)}
                                />
                              )}
                              {dotsMenuTags.length === 0 && !dotsTrimmed && (
                                <p className="px-2 py-2 text-xs text-grey-2">No tags available</p>
                              )}
                            </DropdownBody>
                          </Dropdown>
                        )}

                        {/* Tags submenu — color picker */}
                        {dotsTagOpenId === bm.id && dotsShowColorPicker && (
                          <Dropdown
                            className="absolute right-full top-0 mr-1 w-64 z-50"
                            onMouseEnter={cancelCloseDotsSubmenu}
                            onMouseLeave={scheduleCloseDotsSubmenu}
                            onClose={() => setDotsShowColorPicker(false)}
                          >
                            <DropdownHeader variant="label" label="Tag color" />
                            <DropdownBody>
                              {TAG_COLORS.map((c) => (
                                <DropdownItemColor
                                  key={c.name}
                                  label={c.name}
                                  color={c.text}
                                  onClick={() => {
                                    createAndAddTag(bm.id, dotsTagSearch, c);
                                    setDotsShowColorPicker(false);
                                    setDotsTagSearch('');
                                  }}
                                />
                              ))}
                            </DropdownBody>
                          </Dropdown>
                        )}
                      </Dropdown>
                    ) : null
                  }
                />
              </li>
            );
          })}
        </ul>
      )}

      {/* Delete confirmation — rendered outside all dropdowns so closing the dropdown doesn't unmount it */}
      <ActionsPopover
        open={pendingDeleteBookmarkId !== null}
        onClose={() => setPendingDeleteBookmarkId(null)}
        title="Delete this bookmark?"
        description="This cannot be undone."
        actions={[
          { label: 'Delete', destructive: true, onClick: () => { deleteBookmark(pendingDeleteBookmarkId!); setPendingDeleteBookmarkId(null); } },
        ]}
      />
    </div>
  );
}

export default function BookmarksPage() {
  return (
    <Suspense>
      <BookmarksView />
    </Suspense>
  );
}

function DotsHorizontalIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="3" cy="7" r="1.2" fill="currentColor" />
      <circle cx="7" cy="7" r="1.2" fill="currentColor" />
      <circle cx="11" cy="7" r="1.2" fill="currentColor" />
    </svg>
  );
}

function TagMenuIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2h5.172a1 1 0 0 1 .707.293l5.828 5.828a1 1 0 0 1 0 1.414l-4.172 4.172a1 1 0 0 1-1.414 0L2.293 7.879A1 1 0 0 1 2 7.172V2Z" stroke="currentColor" strokeWidth="1.33" strokeLinejoin="round" />
      <circle cx="4.5" cy="4.5" r="1" fill="currentColor" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusSmallIcon() {
  return (
    <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
