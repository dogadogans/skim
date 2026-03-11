'use client';

import { useEffect, useState, ReactNode } from 'react';
import { Button } from './Button';
import { createPortal } from 'react-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PopoverAction {
  label: string;
  destructive?: boolean;
  onClick: () => void;
}

interface ActionsPopoverProps {
  /** When provided the popover is trigger-driven (uncontrolled). Omit for controlled mode. */
  trigger?: ReactNode;
  /** Controlled open state — used without a trigger */
  open?: boolean;
  /** Called when the modal requests to close (controlled mode) */
  onClose?: () => void;
  title: string;
  description?: string;
  actions: PopoverAction[];
}

// ─── Component ────────────────────────────────────────────────────────────────

const CARD_SHADOW =
  '0px 0px 0px 1px rgba(219,219,219,0.50), 0px 4px 8px 0px rgba(0,0,0,0.08), 0px 8px 32px 0px rgba(0,0,0,0.12)';

/**
 * Centered modal confirmation dialog triggered by any element.
 * Renders into a portal at the top of the DOM — not constrained by any parent.
 *
 * @example
 * <ActionsPopover
 *   trigger={<IconButton title="Delete"><Trash2 size={14} /></IconButton>}
 *   title="Delete this email?"
 *   description="This cannot be undone."
 *   actions={[{ label: 'Delete', destructive: true, onClick: handleDelete }]}
 * />
 */
export function ActionsPopover({ trigger, open: controlledOpen, onClose: controlledOnClose, title, description, actions }: ActionsPopoverProps) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Trigger enter animation one tick after the portal mounts
  useEffect(() => {
    if (!open) { setVisible(false); return; }
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  function openModal() {
    document.dispatchEvent(new CustomEvent('skim:closeDropdowns'));
    setVisible(false);
    setInternalOpen(true);
  }

  function closeModal() {
    setVisible(false);
    if (isControlled) {
      setTimeout(() => controlledOnClose?.(), 150);
    } else {
      setTimeout(() => setInternalOpen(false), 150);
    }
  }

  const modal = open && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-labelledby="actions-popover-title"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/20 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={closeModal}
      />

      {/* Card */}
      <div
        style={{ boxShadow: CARD_SHADOW }}
        className={`relative bg-white rounded-2xl p-4 w-64 flex flex-col gap-3 transition-all duration-200 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        {/* Text */}
        <div className="flex flex-col gap-0.5">
          <p id="actions-popover-title" className="text-grey-4 text-base font-semibold font-['Figtree'] leading-6">
            {title}
          </p>
          {description && (
            <p className="text-grey-3 text-sm font-medium font-['Figtree'] leading-5">
              {description}
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          {actions.map((action, i) => (
            <Button
              key={i}
              variant={action.destructive ? 'destructive' : 'default'}
              onClick={() => { closeModal(); action.onClick(); }}
              centered
              className="w-full"
            >
              {action.label}
            </Button>
          ))}
          <Button onClick={closeModal} centered className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );

  if (isControlled) {
    return <>{mounted && createPortal(modal, document.body)}</>;
  }

  return (
    <>
      <div onClick={openModal} className="contents">
        {trigger}
      </div>
      {mounted && createPortal(modal, document.body)}
    </>
  );
}
