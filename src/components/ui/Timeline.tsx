'use client';
// ============================================================
// Timeline.tsx — Generational & Birth-Year Histogram Slider
// ============================================================
import React, { useMemo, useState } from 'react';
import { useTreeStore } from '@/store/treeStore';

export default function Timeline() {
  const { nodes, showTimeline, toggleTimeline, setViewport, viewport } = useTreeStore();
  const [hoveredDecade, setHoveredDecade] = useState<number | null>(null);

  const yearData = useMemo(() => {
    const withYear = nodes
      .filter(n => !n.hidden && n.birthDate)
      .map(n => ({
        node: n,
        year: parseInt((n.birthDate ?? '').split('-')[0] ?? ''),
      }))
      .filter(d => !isNaN(d.year));

    if (!withYear.length) return null;

    const minYear = Math.min(...withYear.map(d => d.year));
    const maxYear = Math.max(...withYear.map(d => d.year));

    const byDecade = new Map<number, typeof withYear>();
    for (const d of withYear) {
      const decade = Math.floor(d.year / 10) * 10;
      if (!byDecade.has(decade)) byDecade.set(decade, []);
      byDecade.get(decade)!.push(d);
    }

    const decades = Array.from(byDecade.entries()).sort((a, b) => a[0] - b[0]);
    const maxCount = Math.max(...decades.map(([, arr]) => arr.length));

    return { withYear, minYear, maxYear, decades, maxCount };
  }, [nodes]);

  const focusDecade = (decade: number) => {
    const people = yearData?.withYear.filter(d => Math.floor(d.year / 10) * 10 === decade) ?? [];
    if (!people.length) return;
    const avgX = people.reduce((sum, d) => sum + d.node.position.x, 0) / people.length;
    const avgY = people.reduce((sum, d) => sum + d.node.position.y, 0) / people.length;
    setViewport({ x: -avgX * viewport.scale, y: -avgY * viewport.scale });
  };

  if (!showTimeline) return null;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-[460px] max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-[#111928]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            જન્મ વર્ષ સમયરેખા (Birth Timeline)
          </span>
        </div>
        <button
          onClick={toggleTimeline}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs p-1"
        >
          ✕
        </button>
      </div>

      <div className="p-4">
        {!yearData ? (
          <div className="py-6 text-center text-xs text-slate-400">
            હજુ સુધી કોઈ જન્મ તારીખ નોંધાયેલ નથી
          </div>
        ) : (
          <div>
            <div className="flex items-end gap-1.5 h-20 overflow-x-auto pb-1 px-2">
              {yearData.decades.map(([decade, people]) => {
                const height = Math.max(6, (people.length / yearData.maxCount) * 60);
                const isHovered = hoveredDecade === decade;

                return (
                  <div key={decade} className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div
                      className="relative cursor-pointer group"
                      onMouseEnter={() => setHoveredDecade(decade)}
                      onMouseLeave={() => setHoveredDecade(null)}
                      onClick={() => focusDecade(decade)}
                    >
                      {isHovered && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-semibold px-2 py-0.5 rounded shadow whitespace-nowrap z-20">
                          {decade}s: {people.length} સભ્યો
                        </div>
                      )}
                      <div
                        style={{ height: `${height}px`, width: '30px' }}
                        className={`rounded-t-md transition-all ${
                          isHovered
                            ? 'bg-blue-600 dark:bg-blue-500'
                            : 'bg-blue-200 hover:bg-blue-400 dark:bg-blue-950 dark:hover:bg-blue-800'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {decade.toString().slice(2)}s
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-center text-slate-400 mt-2">
              દશક પર ક્લિક કરીને તે પેઢી પર કેનવાસ કેન્દ્રિત કરો
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
