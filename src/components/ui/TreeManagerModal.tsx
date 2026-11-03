'use client';
// ============================================================
// TreeManagerModal.tsx — Family Trees Manager & Switcher Modal
// Retrieve, browse, switch, create, and delete multiple family trees
// ============================================================
import React, { useState, useEffect } from 'react';
import { useTreeStore } from '@/store/treeStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function TreeManagerModal({ isOpen, onClose }: Props) {
  const {
    trees,
    activeTreeId,
    fetchAllTrees,
    createNewTree,
    switchActiveTree,
    deleteActiveTree,
  } = useTreeStore();

  const [newTreeName, setNewTreeName] = useState('');
  const [newTreeDesc, setNewTreeDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAllTrees();
    }
  }, [isOpen, fetchAllTrees]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTreeName.trim()) return;
    setIsCreating(true);
    try {
      const created = await createNewTree(newTreeName.trim(), newTreeDesc.trim() || 'Family Tree Workspace');
      if (created) {
        if (typeof window !== 'undefined') {
          window.history.pushState(null, '', `/tree/${created._id}`);
        }
        setNewTreeName('');
        setNewTreeDesc('');
        onClose();
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleSwitch = async (treeId: string) => {
    await switchActiveTree(treeId);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `/tree/${treeId}`);
    }
    onClose();
  };

  const handleDelete = async (treeId: string, name: string) => {
    if (treeId === 'patel-vanshavali-default') {
      alert('The default demo family tree cannot be deleted.');
      return;
    }
    if (!confirm(`Delete family tree "${name}" and all its members?`)) return;
    setDeletingId(treeId);
    try {
      await deleteActiveTree(treeId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 select-none"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-[#111928] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              🌳
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Family Trees (પરિવાર વંશાવળી)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Create, switch between, and manage independent family trees
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Trees List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div className="text-[10px] uppercase font-bold text-slate-400 px-1 tracking-wider">
            Available Trees ({trees.length})
          </div>

          <div className="space-y-2">
            {trees.map(tree => {
              const isActive = tree._id === activeTreeId;
              const isDefault = tree._id === 'patel-vanshavali-default';
              return (
                <div
                  key={tree._id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-1 ring-blue-500/50 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {tree.name}
                      </span>
                      {isActive && (
                        <span className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                          Active
                        </span>
                      )}
                      {isDefault && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-medium">
                          Demo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{tree.nodeCount ?? 0} members</span>
                      {tree.description && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[200px]">{tree.description}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!isActive ? (
                      <button
                        onClick={() => handleSwitch(tree._id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        Open
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 px-2 py-1">
                        Currently Open
                      </span>
                    )}

                    {!isDefault && (
                      <button
                        onClick={() => handleDelete(tree._id, tree.name)}
                        disabled={deletingId === tree._id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-40"
                        title="Delete Tree"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Create New Tree Section */}
        <form onSubmit={handleCreate} className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">
            Create New Tree
          </div>

          <div className="space-y-2">
            <div>
              <input
                type="text"
                value={newTreeName}
                onChange={e => setNewTreeName(e.target.value)}
                placeholder="Tree Name (e.g., Shah Family Tree, મહેતા પરિવાર)"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <input
                type="text"
                value={newTreeDesc}
                onChange={e => setNewTreeDesc(e.target.value)}
                placeholder="Optional description (e.g. Ahmedabad & Mumbai branches)"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !newTreeName.trim()}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>{isCreating ? 'Creating…' : '+ Create & Open Tree'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
