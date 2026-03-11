'use client';

import { Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from './IconButton';

// ─── Shared container ─────────────────────────────────────────────────────────

function HeaderShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full p-2 bg-grey-05 rounded-lg inline-flex justify-start items-center gap-2"
      style={{
        boxShadow:
          '0px 0px 0px 1px rgba(242,242,242,0.50), 0px 0px 0px 1px rgba(150,150,150,0.08), inset 2px 2px 8px 0px rgba(255,255,255,1.00)',
      }}
    >
      {children}
    </div>
  );
}

// ─── Mail header ──────────────────────────────────────────────────────────────

interface MailHeaderProps {
  variant: 'mail';
  count: number;
  datetime: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  filterUnread?: boolean;
  onFilter?: () => void;
}

function MailHeader({ count, datetime, onRefresh, refreshing, filterUnread, onFilter }: Omit<MailHeaderProps, 'variant'>) {
  return (
    <HeaderShell>
      {/* Green badge */}
      <div className="w-8 h-8 p-2.5 bg-success-400 rounded-md shadow-[inset_1px_1px_2px_0px_rgba(208,253,228,1.00),inset_0px_-1px_1px_0px_rgba(9,199,133,0.50)] inline-flex justify-center items-center overflow-hidden flex-shrink-0">
        <span className="text-white text-base font-semibold font-['Figtree'] leading-6">
          {count}
        </span>
      </div>

      {/* Title + right actions */}
      <div className="flex-1 flex justify-between items-center min-w-0">
        <span className="text-grey-4 text-base font-semibold font-['Figtree'] leading-6 truncate">
          Mail
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-grey-3 text-[12px] font-medium font-['Figtree'] whitespace-nowrap tabular-nums">
            {datetime}
          </span>
          <IconButton
            onClick={onRefresh}
            title={refreshing ? 'Refreshing…' : 'Refresh'}
            aria-label={refreshing ? 'Refreshing…' : 'Refresh'}
          >
            <RefreshIcon spinning={!!refreshing} />
          </IconButton>
          <IconButton
            onClick={onFilter}
            title={filterUnread ? 'Show all' : 'Show unread only'}
            aria-label={filterUnread ? 'Show all' : 'Show unread only'}
            aria-pressed={filterUnread}
          >
            <Mail size={14} color={filterUnread ? 'rgb(42, 231, 127)' : '#27272a'} aria-hidden="true" />
          </IconButton>
        </div>
      </div>
    </HeaderShell>
  );
}

// ─── Bookmark header ──────────────────────────────────────────────────────────

interface BookmarkHeaderProps {
  variant: 'bookmark';
  count: number;
  sortLabel: string;
  sortOpen?: boolean;
  filterActive?: boolean;
  onFilter?: () => void;
  onSortClick?: () => void;
}

function BookmarkHeader({
  count,
  sortLabel,
  sortOpen,
  filterActive,
  onFilter,
  onSortClick,
}: Omit<BookmarkHeaderProps, 'variant'>) {
  return (
    <HeaderShell>
      {/* Blue badge */}
      <div
        className="w-8 h-8 bg-[rgba(186,230,253,1)] rounded-md flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{
          boxShadow:
            'inset 1px 1px 2px 0px rgba(255,255,255,1.00), inset 0px -1px 1px 0px rgba(93,222,253,1.00)',
        }}
      >
        <span className="text-[rgba(14,165,233,1)] text-base font-semibold font-['Figtree'] leading-6">
          {count}
        </span>
      </div>

      {/* Title + right actions */}
      <div className="flex-1 flex justify-between items-center min-w-0">
        <span className="text-grey-4 text-base font-semibold font-['Figtree'] leading-6 truncate">
          Bookmarks
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Filter button */}
          <IconButton
            onClick={onFilter}
            title={filterActive ? 'Clear filters' : 'Filter by tag'}
            aria-label={filterActive ? 'Clear filters' : 'Filter by tag'}
            aria-pressed={filterActive}
          >
            <FilterIcon active={!!filterActive} />
          </IconButton>

          {/* Sort dropdown trigger */}
          <button
            type="button"
            onClick={onSortClick}
            aria-haspopup="true"
            aria-expanded={sortOpen}
            className="px-2 py-1 bg-white rounded-md flex items-center gap-2 overflow-hidden
              shadow-[0px_0px_0px_1px_rgba(219,219,219,0.50),0px_1px_2px_0px_rgba(44,41,41,0.08)]
              hover:bg-grey-05 transition-colors"
          >
            <span className="text-grey-3 text-sm font-medium font-['Figtree'] leading-6 whitespace-nowrap">
              {sortLabel}
            </span>
            <ChevronDownSmallIcon />
          </button>
        </div>
      </div>
    </HeaderShell>
  );
}

// ─── Email-detail header ──────────────────────────────────────────────────────

interface EmailDetailHeaderProps {
  variant: 'email-detail';
  current: number;
  total: number;
  onBack?: () => void;
  /** Slot for actions after the back button (e.g. ActionsPopover for delete) */
  actions?: React.ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
}

function EmailDetailHeader({
  current,
  total,
  onBack,
  actions,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
}: Omit<EmailDetailHeaderProps, 'variant'>) {
  return (
    <HeaderShell>
      {/* Left actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <IconButton onClick={onBack} title="Back">
          <ChevronLeft size={14} color="#27272a" aria-hidden="true" />
        </IconButton>
        {actions}
      </div>

      {/* Right: counter + prev/next */}
      <div className="flex-1 flex justify-end items-center gap-2">
        <span className="text-grey-2 text-sm font-medium font-['Figtree'] leading-6">
          {current} of {total}
        </span>
        <IconButton onClick={onPrev} disabled={prevDisabled} title="Previous email">
          <ChevronLeft size={14} color="#27272a" aria-hidden="true" />
        </IconButton>
        <IconButton onClick={onNext} disabled={nextDisabled} title="Next email">
          <ChevronRight size={14} color="#27272a" aria-hidden="true" />
        </IconButton>
      </div>
    </HeaderShell>
  );
}

// ─── Union export ─────────────────────────────────────────────────────────────

export type MiniHeaderProps = MailHeaderProps | BookmarkHeaderProps | EmailDetailHeaderProps;

export function MiniHeader(props: MiniHeaderProps) {
  if (props.variant === 'mail') {
    const { variant: _, ...rest } = props;
    return <MailHeader {...rest} />;
  }
  if (props.variant === 'bookmark') {
    const { variant: _, ...rest } = props;
    return <BookmarkHeader {...rest} />;
  }
  const { variant: _, ...rest } = props;
  return <EmailDetailHeader {...rest} />;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={spinning ? 'animate-spin' : ''}
    >
      <path
        d="M13 7.5C13 10.5376 10.5376 13 7.5 13C4.46243 13 2 10.5376 2 7.5C2 4.46243 4.46243 2 7.5 2C9.12 2 10.58 2.69 11.6 3.8"
        stroke="#27272a"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M11 1.5L11.6 3.8L9.3 4.4"
        stroke="#27272a"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path
        d="M2 4H13"
        stroke={active ? 'rgba(14,165,233,1)' : '#27272a'}
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M4 7.5H11"
        stroke={active ? 'rgba(14,165,233,1)' : '#27272a'}
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M6 11H9"
        stroke={active ? 'rgba(14,165,233,1)' : '#27272a'}
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronDownSmallIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2 4L6 8L10 4"
        stroke="#525252"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
