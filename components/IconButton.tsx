import { Tooltip } from './Tooltip';

function playClick() {
  const audio = new Audio('/sounds/ui-button-click.wav');
  audio.volume = 0.4;
  audio.play().catch(() => {});
}

interface IconButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  noClickSound?: boolean;
  /** Used as both the tooltip label and the button's accessible name */
  title?: string;
  /** Override the aria-label independently (e.g. for dynamic states like "Refreshing…") */
  'aria-label'?: string;
  'aria-pressed'?: boolean;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
}

export function IconButton({
  children,
  onClick,
  disabled,
  noClickSound,
  title,
  'aria-label': ariaLabel,
  'aria-pressed': ariaPressed,
  'aria-expanded': ariaExpanded,
  'aria-haspopup': ariaHasPopup,
}: IconButtonProps) {
  const btn = (
    <button
      type="button"
      onClick={() => { if (!noClickSound) playClick(); onClick?.(); }}
      disabled={disabled}
      aria-label={ariaLabel ?? title}
      aria-pressed={ariaPressed}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
      className={`w-8 h-8 p-1 bg-white rounded-md inline-flex justify-center items-center gap-2 overflow-hidden
        shadow-[0px_0px_0px_1px_rgba(219,219,219,0.50),0px_1px_2px_0px_rgba(44,41,41,0.08)]
        hover:bg-grey-05 hover:shadow-[0px_0px_0px_1px_rgba(219,219,219,1.00),0px_1px_2px_0px_rgba(44,41,41,0.08)]
        transition-colors
        ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
    >
      {children}
    </button>
  );
  return title ? <Tooltip label={ariaLabel ?? title}>{btn}</Tooltip> : btn;
}
