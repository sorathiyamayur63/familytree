// ============================================================
// Tree Page — Server Wrapper
// ============================================================
import { Suspense } from 'react';
import TreePageClient from './TreePageClient';

interface PageProps {
  params: Promise<{ treeId: string }>;
}

export default function TreePage({ params }: PageProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center w-screen h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-600 font-medium">Loading family tree…</p>
        </div>
      </div>
    }>
      {params.then(({ treeId }) => (
        <TreePageClient treeId={treeId} />
      ))}
    </Suspense>
  );
}
