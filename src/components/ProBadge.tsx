import React from 'react';

interface ProBadgeProps {
  size?: 'sm' | 'md';
}

export default function ProBadge({ size = 'sm' }: ProBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 bg-[#00E87A]/10
        border border-[#00E87A]/30 text-[#00E87A] font-inter
        font-bold rounded-full
        ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'}`}
    >
      ⚡ PRO
    </span>
  );
}
