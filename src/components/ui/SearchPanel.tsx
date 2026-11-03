'use client';
// ============================================================
// SearchPanel.tsx — Spotlight / Command-K Gujarati Phonetic Search
// 100% English UI Chrome with authentic Gujarati phonetic matching
// ============================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTreeStore } from '@/store/treeStore';
import { searchNodes, englishToGujaratiPhonetic } from '@/lib/gujarati';

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchPanel({ isOpen, onClose }: SearchPanelProps) {
  const {
    nodes,
    setSelectedNodeId,
    setViewport,
    viewport,
  } = useTreeStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [focusIdx, setFocusIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const doSearch = useCallback((q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const found = searchNodes(nodes, q);
    setResults(found.map(r => r.nodeId));
    setFocusIdx(0);
  }, [nodes]);

  const focusNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n._id === nodeId);
    if (!node) return;
    setSelectedNodeId(nodeId);
    setViewport({
      x: -node.position.x * viewport.scale,
      y: -node.position.y * viewport.scale,
    });
    onClose();
  }, [nodes, setSelectedNodeId, setViewport, viewport.scale, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      focusNode(results[focusIdx]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const phoneticSuggestion = query.trim() ? englishToGujaratiPhonetic(query) : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#111928] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            ref={inputRef}
            value={query}
            onChange={e => doSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by name (e.g., Ramesh, Bhulabhai, રમેશ)..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
          />

          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); }}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1.5 py-0.5 rounded"
            >
              Clear
            </button>
          )}

          <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Phonetic Transliteration Hint */}
        {phoneticSuggestion && phoneticSuggestion !== query && (
          <div className="px-4 py-2 bg-blue-50/60 dark:bg-blue-950/30 border-b border-blue-100/60 dark:border-blue-900/40 flex items-center justify-between text-xs text-blue-800 dark:text-blue-300">
            <span>
              Phonetic Suggestion: <strong className="font-semibold text-blue-900 dark:text-blue-200">{phoneticSuggestion}</strong>
            </span>
            <button
              onClick={() => doSearch(phoneticSuggestion)}
              className="text-[11px] underline hover:opacity-80 font-medium"
            >
              Search this ↵
            </button>
          </div>
        )}

        {/* Search Results List */}
        <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
          {results.length > 0 ? (
            results.slice(0, 15).map((nodeId, idx) => {
              const node = nodes.find(n => n._id === nodeId);
              if (!node) return null;
              const isSelected = idx === focusIdx;
              const isFemale = node.gender === 'female';
              const isInLaw = node.branchType === 'in-law';

              return (
                <div
                  key={nodeId}
                  onClick={() => focusNode(nodeId)}
                  onMouseEnter={() => setFocusIdx(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-blue-100'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isInLaw
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          : isFemale
                          ? 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {node.nameEnglish.charAt(0) || 'P'}
                    </div>

                    <div className="truncate">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {node.nameGujarati}
                        <span className="text-slate-400 font-normal ml-1.5 text-[11px]">
                          ({node.nameEnglish})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {node.kinshipTitle ? node.kinshipTitle : isInLaw ? 'In-Law Branch' : 'Main Branch'}
                        {node.birthDate && ` · b. ${node.birthDate.split('-')[0]}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      G{node.generation ?? 1}
                    </span>
                    <span className="text-xs text-slate-400">↵</span>
                  </div>
                </div>
              );
            })
          ) : query ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No matching members found
            </div>
          ) : (
            nodes.slice(0, 8).map((node, idx) => {
              const isSelected = idx === focusIdx;
              const isFemale = node.gender === 'female';
              const isInLaw = node.branchType === 'in-law';

              return (
                <div
                  key={node._id}
                  onClick={() => focusNode(node._id)}
                  onMouseEnter={() => setFocusIdx(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-blue-100'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isInLaw
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          : isFemale
                          ? 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {node.nameEnglish.charAt(0) || 'P'}
                    </div>

                    <div className="truncate">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {node.nameGujarati}
                        <span className="text-slate-400 font-normal ml-1.5 text-[11px]">
                          ({node.nameEnglish})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {node.kinshipTitle ? node.kinshipTitle : isInLaw ? 'In-Law Branch' : 'Main Branch'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      G{node.generation ?? 1}
                    </span>
                    <span className="text-xs text-slate-400">↵</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
