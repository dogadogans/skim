'use client';

interface BookmarkCardProps {
  title: string;
  domain: string;
  url?: string;
  variant?: 'default' | 'removable';
  onRemove?: () => void;
  /** Right-side actions slot (used in default variant — tags, three-dot menu, etc.) */
  actions?: React.ReactNode;
  /** Overlay slot for context menus that need to escape the card (rendered at end of relative container) */
  overlay?: React.ReactNode;
  className?: string;
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function BookmarkCard({
  title,
  domain,
  url,
  variant = 'default',
  onRemove,
  actions,
  overlay,
  className = '',
  onContextMenu,
}: BookmarkCardProps) {
  return (
    <div
      className={`flex items-center gap-2 p-2 bg-white rounded-lg shadow-[0px_0px_0px_1px_rgba(242,242,242,0.50),0px_0px_0px_1px_rgba(150,150,150,0.08)] hover:bg-grey-05 transition-colors group relative ${className}`}
      onContextMenu={onContextMenu}
    >
      {/* Status dot */}
      <div aria-hidden="true" className="w-7 flex justify-center items-center flex-shrink-0">
        <div className="w-3 h-3 bg-info-200 rounded-lg shadow-[inset_1px_1px_1px_1px_rgba(228,248,253,1),inset_0px_-1px_4px_0px_rgba(63,215,251,0.67)]" />
      </div>

      {/* Title + domain */}
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-0 flex items-baseline gap-2 group/link"
        >
          <span className="text-sm font-semibold text-grey-4 group-hover/link:text-info-600 transition-colors truncate">
            {title}
          </span>
          <span className="text-sm text-grey-2 truncate flex-shrink-0 hidden sm:block">
            {domain}
          </span>
        </a>
      ) : (
        <div className="flex-1 min-w-0 flex items-baseline gap-2">
          <span className="text-sm font-semibold text-grey-4 truncate">{title}</span>
          <span className="text-sm text-grey-2 truncate flex-shrink-0">{domain}</span>
        </div>
      )}

      {/* Right-side actions */}
      {variant === 'removable' ? (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            aria-label="Add to collection"
            className="w-6 h-6 bg-white rounded-full shadow-[0px_0px_0px_1px_rgba(241,241,241,1.00),0px_0px_0px_1px_rgba(150,150,150,0.08),0px_1px_1px_0px_rgba(0,0,0,0.16)] flex items-center justify-center text-grey-2 hover:text-grey-3 transition-colors"
          >
            <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove "${title}"`}
            className="w-5 h-5 flex items-center justify-center text-grey-2 hover:text-danger-500 transition-colors"
          >
            <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ) : (
        actions
      )}

      {overlay}
    </div>
  );
}
