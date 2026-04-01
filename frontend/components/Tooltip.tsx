'use client';
import { useState, ReactNode } from 'react';

export function Tooltip({ children, content }: { children: ReactNode; content: string }) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 text-[11px] text-pp-text bg-pp-raised border border-pp-border rounded-lg whitespace-nowrap z-50 shadow-lg border-t-white/[0.04] pointer-events-none">
          {content}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-pp-raised border-r border-b border-pp-border rotate-45" />
        </span>
      )}
    </span>
  );
}
