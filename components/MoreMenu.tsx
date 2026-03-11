'use client';

import { useRef, useState, useEffect } from 'react';
import { Ellipsis } from 'lucide-react';
import { IconButton } from './IconButton';
import { useDropdownPlacement, dropdownPlacementClass } from './Dropdown';

export interface MoreMenuItem {
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  onClick: () => void;
}

interface MoreMenuProps {
  items: MoreMenuItem[];
  /** Which side to align the dropdown relative to the trigger. Default: 'right' */
  align?: 'left' | 'right';
}

const SHADOW =
  '0px 0px 0px 1px rgba(219,219,219,0.50), 0px 1px 2px 0px rgba(44,41,41,0.08), 0px 4px 8px 0px rgba(0,0,0,0.08), 0px 8px 16px 0px rgba(0,0,0,0.04)';

/**
 * A self-contained three-dot menu: renders the trigger button and its popover.
 * Drop it anywhere — no external open/close state needed.
 *
 * @example
 * <MoreMenu
 *   items={[
 *     { label: 'Mark as unread', onClick: () => markUnread(id) },
 *     { label: 'Delete this email', destructive: true, onClick: () => deleteEmail(id) },
 *   ]}
 * />
 */
export function MoreMenu({ items, align = 'right' }: MoreMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const placement = useDropdownPlacement(containerRef, open);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    function onCloseAll() { setOpen(false); }
    document.addEventListener('skim:closeDropdowns', onCloseAll);
    return () => document.removeEventListener('skim:closeDropdowns', onCloseAll);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <IconButton
        onClick={() => setOpen((o) => !o)}
        title="More options"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Ellipsis size={14} color="#27272a" aria-hidden="true" />
      </IconButton>

      {open && (
        <div
          role="menu"
          aria-label="More options"
          style={{ boxShadow: SHADOW }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();
              const items = Array.from(
                e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'),
              );
              const idx = items.indexOf(document.activeElement as HTMLElement);
              if (e.key === 'ArrowDown') items[(idx + 1) % items.length]?.focus();
              else items[(idx - 1 + items.length) % items.length]?.focus();
            }
          }}
          className={`absolute ${dropdownPlacementClass(placement)} bg-white rounded-xl py-1 z-20 min-w-[160px] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); item.onClick(); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-grey-05 flex items-center gap-2 font-['Figtree'] font-medium ${
                item.destructive ? 'text-danger-600' : 'text-grey-4'
              }`}
            >
              {item.icon && (
                <span aria-hidden="true" className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-current">
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
