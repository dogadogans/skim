import { Plus, Check } from 'lucide-react';
import { Tooltip } from '@/components/Tooltip';

function playSound(src: string) {
  const audio = new Audio(src);
  audio.play().catch(() => {});
}

export function LinkPill({
  text,
  url,
  saved,
  onToggle,
}: {
  text: string;
  url: string;
  saved: boolean;
  onToggle: () => void;
}) {
  const toggleLabel = saved ? 'Remove bookmark' : 'Save bookmark';
  const MAX_CHARS = 60;
  const displayText = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) + '…' : text;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    playSound('/sounds/ui-button-click.wav');
    onToggle();
  };

  return (
    <span className="pl-2 pr-0 py-0 bg-white rounded-lg shadow-[0px_0px_0px_1px_rgba(219,219,219,0.50),0px_1px_2px_0px_rgba(44,41,41,0.08)] inline-flex justify-start items-stretch gap-2 overflow-hidden">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-grey-3 text-sm font-semi-bold leading-6 py-1 hover:text-info-600 transition-colors"
      >
        {displayText}
      </a>
      <Tooltip label={toggleLabel}>
        <button
          type="button"
          aria-label={toggleLabel}
          onClick={handleToggle}
          className={`w-8 self-stretch flex items-center justify-center flex-shrink-0 transition-all hover:brightness-[0.93] active:brightness-[0.87] ${
            saved ? 'bg-success-100' : 'bg-info-100'
          }`}
        >
          {saved ? (
            <Check size={16} aria-hidden="true" className="text-success-400" strokeWidth={2.5} />
          ) : (
            <Plus size={16} aria-hidden="true" className="text-info-400" strokeWidth={2.5} />
          )}
        </button>
      </Tooltip>
    </span>
  );
}
