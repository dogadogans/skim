'use client';

import { useState } from 'react';

export function Tooltip({ label, children }: { label: string; children: React.ReactElement }) {
  const [suppressed, setSuppressed] = useState(false);
  return (
    <span
      className="relative inline-flex group/tt"
      onClickCapture={() => setSuppressed(true)}
      onMouseLeave={() => setSuppressed(false)}
    >
      {children}
      <span
        className={`pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1.5 z-50 transition-opacity delay-500 ${
          suppressed ? 'opacity-0' : 'opacity-0 group-hover/tt:opacity-100'
        }`}
      >
        <span className="px-2 py-1 bg-white rounded-lg shadow-[0px_0px_0px_1px_rgba(219,219,219,0.50),0px_1px_2px_0px_rgba(44,41,41,0.08)] inline-flex justify-center items-center whitespace-nowrap">
          <span className="text-grey-3 text-[12px] font-medium font-['Figtree'] leading-4">{label}</span>
        </span>
      </span>
    </span>
  );
}
