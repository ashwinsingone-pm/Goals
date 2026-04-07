"use client";

import { useState } from "react";

export function WeekTooltip({ weekNumber, note, children }: {
  weekNumber: number; note?: string | null; children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  if (!note) return <>{children}</>;
  return (
    <div className="relative inline-flex justify-center w-full h-full"
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-52 bg-gray-900 text-white text-xs rounded-lg p-3 z-50 shadow-xl pointer-events-none">
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
          <p className="font-semibold text-gray-200 mb-1.5 text-[11px]">Week {weekNumber} · Note</p>
          <p className="text-gray-300 text-[11px] leading-relaxed whitespace-pre-wrap">{note}</p>
        </div>
      )}
    </div>
  );
}
