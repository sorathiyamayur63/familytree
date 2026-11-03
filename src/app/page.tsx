// ============================================================
// Root Page (/) — Direct-to-Canvas High-Performance Workspace
// Direct single-page experience styled like Figma / Drafts
// ============================================================
import React, { Suspense } from 'react';
import TreePageClient from './tree/[treeId]/TreePageClient';
import { DEFAULT_TREE_ID } from '@/lib/dataService';

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center w-screen h-screen bg-[#F8F9FB] dark:bg-[#0A0E17]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Loading Canvas Workspace…
            </span>
          </div>
        </div>
      }
    >
      <TreePageClient treeId={DEFAULT_TREE_ID} />
    </Suspense>
  );
}
