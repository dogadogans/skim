'use client';

import React, { forwardRef, useId, useLayoutEffect, useState, CSSProperties, InputHTMLAttributes, RefObject } from 'react';

// ─── Placement hook ───────────────────────────────────────────────────────────

/**
 * Returns 'top' or 'bottom' based on available space around the trigger container.
 * Use with a ref on the `relative`-positioned container that wraps the trigger button.
 *
 * @param containerRef - ref on the wrapper div (position:relative) containing the trigger
 * @param isOpen       - whether the dropdown is currently open
 * @param estimatedHeight - rough height of the dropdown in px (default 260)
 */
export function useDropdownPlacement(
  containerRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  estimatedHeight = 320,
): 'top' | 'bottom' {
  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom');

  useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    setPlacement(spaceBelow < estimatedHeight && spaceAbove >= spaceBelow ? 'top' : 'bottom');
  }, [isOpen, containerRef, estimatedHeight]);

  return placement;
}

/**
 * Maps a placement value to the Tailwind position classes for a dropdown.
 * Use in the `className` of the `<Dropdown>` element.
 *
 * @example
 * className={`absolute right-0 ${dropdownPlacementClass(placement)} w-48 z-20`}
 */
export function dropdownPlacementClass(placement: 'top' | 'bottom'): string {
  return placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1';
}

// ─── Shared ───────────────────────────────────────────────────────────────────

const SHADOW =
  'shadow-[0px_0px_0px_1px_rgba(219,219,219,0.50),0px_1px_2px_0px_rgba(44,41,41,0.08),0px_4px_8px_0px_rgba(0,0,0,0.08),0px_8px_16px_0px_rgba(0,0,0,0.04)]';

// ─── Container ────────────────────────────────────────────────────────────────

interface DropdownProps {
  children: React.ReactNode;
  className?: string;
  /**
   * When true (default) adds overflow-hidden to clip children to the rounded corners.
   * Set to false on dropdowns that contain absolutely-positioned submenus so they aren't clipped.
   */
  clip?: boolean;
  style?: CSSProperties;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  /** Called when Escape is pressed inside the dropdown — use to close it */
  onClose?: () => void;
}

/**
 * The dropdown panel shell. Position it absolutely/fixed yourself via className or style.
 * Implements keyboard navigation: ArrowDown/ArrowUp moves between items, Escape calls onClose.
 *
 * @example
 * <Dropdown className="absolute right-0 top-full mt-1 w-48" onClose={() => setOpen(false)}>
 *   <DropdownHeader variant="label" label="Sort" />
 *   <DropdownBody>
 *     <DropdownItemDefault label="Newest first" active onClick={…} />
 *   </DropdownBody>
 * </Dropdown>
 */
export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(function Dropdown(
  { children, className = '', clip = true, style, onMouseEnter, onMouseLeave, onClose },
  ref,
) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose?.();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = Array.from(
      e.currentTarget.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([disabled]), [role="menuitemcheckbox"]:not([disabled]), [role="menuitemradio"]:not([disabled]), input:not([disabled])',
      ),
    );
    const idx = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') {
      items[(idx + 1) % items.length]?.focus();
    } else {
      items[(idx - 1 + items.length) % items.length]?.focus();
    }
  }

  return (
    <div
      ref={ref}
      role="menu"
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onKeyDown={handleKeyDown}
      className={`bg-white rounded-lg ${clip ? 'overflow-hidden' : ''} ${SHADOW} ${className}`}
    >
      {children}
    </div>
  );
});

// ─── Header ───────────────────────────────────────────────────────────────────

type DropdownHeaderProps =
  | { variant: 'label'; label: string }
  | ({ variant: 'search'; trailing?: React.ReactNode } & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>);

/**
 * Optional header rendered at the top of the dropdown, separated by a border.
 *
 * variant="label"  → static muted title (e.g. "Filter", "Tag color")
 * variant="search" → focusable search input; passes all input props through
 *
 * @example
 * <DropdownHeader variant="label" label="Filter" />
 * <DropdownHeader variant="search" autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" />
 */
export function DropdownHeader(props: DropdownHeaderProps) {
  const inputId = useId();
  const base = 'p-2 border-b border-grey-1';

  if (props.variant === 'label') {
    return (
      <div className={base} role="presentation">
        <span className="text-grey-2 text-sm font-medium font-['Figtree'] leading-6">
          {props.label}
        </span>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { variant: _v, className = '', trailing, ...inputProps } = props;
  return (
    <div className={`${base} flex items-center gap-1`} role="presentation">
      <label htmlFor={inputId} className="sr-only">
        {inputProps.placeholder ?? 'Search'}
      </label>
      <input
        id={inputId}
        type="text"
        {...inputProps}
        className={`flex-1 text-sm font-medium text-grey-3 outline-none bg-transparent placeholder:text-grey-2 font-['Figtree'] ${className}`}
      />
      {trailing}
    </div>
  );
}

// ─── Body ─────────────────────────────────────────────────────────────────────

/**
 * Wraps the list of items with consistent padding.
 * Pass a custom className to override default padding (e.g. `"px-2 py-2"` for menus without a header).
 */
export function DropdownBody({
  children,
  className = 'px-2 py-1',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex flex-col max-h-64 overflow-y-auto dropdown-scroll ${className}`}>{children}</div>;
}

// ─── Footer ───────────────────────────────────────────────────────────────────

/**
 * Optional footer section (e.g. a "Clear filters" button).
 */
export function DropdownFooter({ children }: { children: React.ReactNode }) {
  return <div className="px-2 pb-2">{children}</div>;
}

// ─── Divider ──────────────────────────────────────────────────────────────────

/**
 * A thin horizontal rule to separate groups within a DropdownBody.
 */
export function DropdownDivider() {
  return <div className="h-px bg-grey-1 -mx-2 my-1" role="separator" />;
}

// ─── Internal: Checkbox visuals ───────────────────────────────────────────────

function CheckboxBox({ checked }: { checked: boolean }) {
  return (
    <div aria-hidden="true" className="w-5 h-5 flex items-center justify-center relative flex-shrink-0">
      {checked ? (
        <>
          <div className="w-4 h-4 bg-grey-4 rounded-sm absolute" />
          <svg className="relative" width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </>
      ) : (
        <div className="w-4 h-4 rounded-sm border-2 border-grey-2" />
      )}
    </div>
  );
}

function CheckboxIndeterminate({
  checked,
  indeterminate,
}: {
  checked: boolean;
  indeterminate: boolean;
}) {
  return (
    <div aria-hidden="true" className="w-5 h-5 flex items-center justify-center relative flex-shrink-0">
      {checked ? (
        <>
          <div className="w-4 h-4 bg-grey-4 rounded-sm absolute" />
          <svg className="relative" width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </>
      ) : indeterminate ? (
        <>
          <div className="w-4 h-4 bg-grey-4 rounded-sm absolute" />
          <svg className="relative" width="10" height="2" viewBox="0 0 10 2" fill="none">
            <path d="M1 1H9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </>
      ) : (
        <div className="w-4 h-4 rounded-sm border-2 border-grey-2" />
      )}
    </div>
  );
}

// ─── Row: Default ─────────────────────────────────────────────────────────────

interface DropdownItemDefaultProps {
  label: string;
  /** Optional leading icon or element */
  icon?: React.ReactNode;
  /** When true the label is bold and a blue trailing checkmark is shown (unless trailing is provided) */
  active?: boolean;
  /** Custom trailing element — overrides the default active checkmark */
  trailing?: React.ReactNode;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
}

/**
 * Plain row used for single-select menus (e.g. sort options) or action rows (e.g. "Delete").
 * - `active` → bolds the label and shows a blue trailing checkmark
 * - `trailing` → renders a custom trailing element instead (e.g. a chevron for submenu triggers)
 * - `icon` → optional leading element
 *
 * @example
 * <DropdownItemDefault label="Newest first" active={sort === 'newest'} onClick={() => setSort('newest')} />
 * <DropdownItemDefault label="Tags" icon={<TagIcon />} trailing={<ChevronRight />} onMouseEnter={openSubmenu} />
 */
export function DropdownItemDefault({
  label,
  icon,
  active,
  trailing,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className = '',
}: DropdownItemDefaultProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`p-2 rounded-lg text-sm flex items-center justify-between hover:bg-grey-05 w-full text-left font-['Figtree'] ${
        active ? 'text-grey-4 font-semibold' : 'text-grey-4 font-medium'
      } ${className}`}
    >
      <div className="flex items-center gap-2">
        {icon && (
          <span aria-hidden="true" className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-current">
            {icon}
          </span>
        )}
        <span>{label}</span>
      </div>
      {trailing
        ? trailing
        : active && (
            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6L4.5 8.5L10 3"
                stroke="rgba(14,165,233,1)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
    </button>
  );
}

// ─── Row: Checkbox ────────────────────────────────────────────────────────────

interface DropdownItemCheckboxProps {
  label: string;
  checked: boolean;
  /** Color of the leading dot (e.g. a tag's textColor) */
  dotColor?: string;
  /** Alternative leading slot when you don't want a dot */
  icon?: React.ReactNode;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
}

/**
 * Row with a checkbox on the right. Used for multi-select menus (e.g. filter by tag).
 * Provide either `dotColor` for a small colored dot or `icon` for an arbitrary leading element.
 *
 * @example
 * <DropdownItemCheckbox
 *   label={tag.name}
 *   checked={selected.includes(tag.id)}
 *   dotColor={tag.textColor}
 *   onClick={() => toggle(tag.id)}
 * />
 */
export function DropdownItemCheckbox({
  label,
  checked,
  dotColor,
  icon,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className = '',
}: DropdownItemCheckboxProps) {
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`p-2 rounded-lg flex justify-between items-center hover:bg-grey-05 w-full ${className}`}
    >
      <div className="flex items-center gap-2">
        {dotColor && (
          <span
            aria-hidden="true"
            className="w-[8px] h-[8px] rounded-full flex-shrink-0"
            style={{ backgroundColor: dotColor }}
          />
        )}
        {icon && (
          <span aria-hidden="true" className="w-4 h-4 flex items-center justify-center flex-shrink-0">{icon}</span>
        )}
        <span className="text-sm font-medium text-grey-4 font-['Figtree']">{label}</span>
      </div>
      <CheckboxBox checked={checked} />
    </button>
  );
}

// ─── Row: Check All ───────────────────────────────────────────────────────────

interface DropdownItemCheckAllProps {
  /** True when every item is selected */
  allChecked: boolean;
  /** True when at least one (but not all) items are selected — shows the indeterminate dash */
  someChecked: boolean;
  /** Toggle between all-checked and none */
  onToggle: () => void;
  label?: string;
  className?: string;
}

/**
 * "Select all" row with an indeterminate checkbox state.
 * - none selected  → empty checkbox
 * - some selected  → dash (indeterminate)
 * - all selected   → filled checkmark
 *
 * @example
 * <DropdownItemCheckAll
 *   allChecked={selected.length === items.length}
 *   someChecked={selected.length > 0}
 *   onToggle={() => selected.length === items.length ? clearAll() : selectAll()}
 * />
 */
export function DropdownItemCheckAll({
  allChecked,
  someChecked,
  onToggle,
  label = 'Select all',
  className = '',
}: DropdownItemCheckAllProps) {
  const ariaChecked: boolean | 'mixed' = allChecked ? true : someChecked ? 'mixed' : false;
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={ariaChecked}
      onClick={onToggle}
      className={`p-2 rounded-lg flex justify-between items-center hover:bg-grey-05 w-full ${className}`}
    >
      <span className="text-sm font-medium text-grey-4 font-['Figtree']">{label}</span>
      <CheckboxIndeterminate checked={allChecked} indeterminate={someChecked && !allChecked} />
    </button>
  );
}

// ─── Row: Color ───────────────────────────────────────────────────────────────

interface DropdownItemColorProps {
  label: string;
  /** The color shown as a filled dot (use the text/foreground color, not bg) */
  color: string;
  /** When true shows a blue trailing checkmark */
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Row used in color-picker style menus. Shows a larger colored dot on the left.
 * Matches the TAG_COLORS pattern on the bookmarks page.
 *
 * @example
 * {TAG_COLORS.map(c => (
 *   <DropdownItemColor key={c.name} label={c.name} color={c.text} onClick={() => pick(c)} />
 * ))}
 */
export function DropdownItemColor({
  label,
  color,
  active,
  onClick,
  className = '',
}: DropdownItemColorProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`p-2 rounded-lg flex items-center justify-between hover:bg-grey-05 w-full ${className}`}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="w-[8px] h-[8px] rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-medium text-grey-4 font-['Figtree']">{label}</span>
      </div>
      {active && (
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6L4.5 8.5L10 3"
            stroke="rgba(14,165,233,1)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
