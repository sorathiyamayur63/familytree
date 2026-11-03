'use client';
// ============================================================
// InspectorPanel.tsx — Figma / Drafts Multi-Tab Right Inspector
// 100% English UI Chrome with authentic Gujarati kinship & names
// ============================================================
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTreeStore } from '@/store/treeStore';
import { calculateGujaratiKinship } from '@/lib/kinship';
import { englishToGujaratiPhonetic } from '@/lib/gujarati';
import type { FamilyNode, Gender, NodeShape } from '@/types';

export default function InspectorPanel() {
  const {
    nodes,
    selectedNodeId,
    setSelectedNodeId,
    showInspector,
    setShowInspector,
    inspectorTab,
    setInspectorTab,
    upsertNode,
    removeNode,
    toggleInLawsBranch,
    addInLawRelative,
    isEditMode,
    togglePhotoEditor,
    autoSaveNode,
    updateNodePhoto,
  } = useTreeStore();

  const selectedNode = nodes.find(n => n._id === selectedNodeId);
  const [form, setForm] = useState<Partial<FamilyNode>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [kinshipCompareId, setKinshipCompareId] = useState<string | null>(null);
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form when selected node changes or photo updates
  useEffect(() => {
    if (selectedNode) {
      setForm(prev => ({
        ...selectedNode,
        photo: selectedNode.photo ?? prev.photo,
      }));
      if (!kinshipCompareId && nodes.length > 1) {
        const other = nodes.find(n => n._id !== selectedNode._id);
        if (other) setKinshipCompareId(other._id);
      }
    }
  }, [selectedNode?._id, selectedNode?.photo]);

  const handleDirectPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedNode) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const minDim = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - minDim) / 2;
        const sy = (img.naturalHeight - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 200, 200);
        const base64 = canvas.toDataURL('image/png');
        updateNodePhoto(selectedNode._id, base64);
        setForm(prev => ({ ...prev, photo: base64 }));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    if (!selectedNode) return;
    updateNodePhoto(selectedNode._id, '');
    setForm(prev => ({ ...prev, photo: '' }));
  };

  // Compute live Gujarati kinship relation
  const kinship = useMemo(() => {
    if (!selectedNode || !kinshipCompareId) return null;
    return calculateGujaratiKinship(kinshipCompareId, selectedNode._id, nodes);
  }, [selectedNode, kinshipCompareId, nodes]);

  if (!showInspector || !selectedNode) return null;

  const handleFieldChange = (key: keyof FamilyNode, value: unknown) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      // Auto-suggest Gujarati transliteration if typing English name
      if (key === 'nameEnglish' && typeof value === 'string' && !prev.nameGujarati) {
        next.nameGujarati = englishToGujaratiPhonetic(value);
      }

      const mergedNode = { ...selectedNode, ...next } as FamilyNode;
      // Instantly update canvas
      upsertNode(mergedNode);

      // Auto-save debounced to backend & local storage
      if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
      autoSaveTimeout.current = setTimeout(() => {
        autoSaveNode(mergedNode);
      }, 350);

      return next;
    });
  };

  const saveChanges = async () => {
    if (!selectedNode._id) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/nodes/${selectedNode._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        upsertNode({ ...selectedNode, ...form } as FamilyNode);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const deletePerson = async () => {
    const name = selectedNode.nameGujarati || selectedNode.nameEnglish || 'this member';
    if (!confirm(`Delete "${name}" from tree?`)) return;
    await fetch(`/api/nodes/${selectedNode._id}`, { method: 'DELETE' });
    removeNode(selectedNode._id);
  };

  const inLawCount = selectedNode.inLawNodeIds?.length || 0;
  const inLawsCollapsed = selectedNode.inLawsHidden ?? true;

  return (
    <aside className="absolute right-4 top-16 z-25 w-84 max-h-[calc(100vh-6rem)] flex flex-col bg-white/95 dark:bg-[#111928]/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl overflow-hidden select-none animate-in fade-in slide-in-from-right-2 duration-150">
      {/* ─── Top Alignment Bar (Figma Style) ─── */}
      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-1.5">
          <button className="p-1 hover:text-slate-700 dark:hover:text-slate-200 rounded" title="Align Left">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="3"/><rect x="4" y="7" width="12" height="4" rx="1"/><rect x="4" y="13" width="8" height="4" rx="1"/></svg>
          </button>
          <button className="p-1 hover:text-slate-700 dark:hover:text-slate-200 rounded" title="Align Center">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="21" x2="12" y2="3"/><rect x="6" y="7" width="12" height="4" rx="1"/><rect x="8" y="13" width="8" height="4" rx="1"/></svg>
          </button>
          <button className="p-1 hover:text-slate-700 dark:hover:text-slate-200 rounded" title="Align Right">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="20" y1="21" x2="20" y2="3"/><rect x="8" y="7" width="12" height="4" rx="1"/><rect x="12" y="13" width="8" height="4" rx="1"/></svg>
          </button>
          <div className="h-3 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />
          <button className="p-1 hover:text-slate-700 dark:hover:text-slate-200 rounded" title="Align Top">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="4" x2="21" y2="4"/><rect x="7" y="4" width="4" height="12" rx="1"/><rect x="13" y="4" width="4" height="8" rx="1"/></svg>
          </button>
        </div>

        <button
          onClick={() => setShowInspector(false)}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded transition-colors"
          title="Close Inspector"
        >
          ✕
        </button>
      </div>

      {/* ─── Inspector Tabs (Canvas / Properties | Kinship | In-Laws | Style) ─── */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 px-1 bg-slate-50/70 dark:bg-slate-900/70 text-xs">
        {[
          { id: 'properties', label: 'Properties' },
          { id: 'kinship', label: 'Kinship' },
          { id: 'inlaws', label: `In-Laws${inLawCount > 0 ? ` (${inLawCount})` : ''}` },
          { id: 'style', label: 'Style' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setInspectorTab(tab.id as typeof inspectorTab)}
            className={`flex-1 py-2 text-center font-medium transition-all ${
              inspectorTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ─── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* ─── TAB 1: PROPERTIES ────────────────────────────── */}
        {inspectorTab === 'properties' && (
          <>
            {/* Gujarati Primary Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Primary Name (Gujarati)
                </label>
                <span className="text-[10px] text-slate-400">Default Display</span>
              </div>
              <input
                value={form.nameGujarati ?? ''}
                onChange={e => handleFieldChange('nameGujarati', e.target.value)}
                disabled={!isEditMode}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors disabled:opacity-60 text-sm font-medium"
                placeholder="e.g. રમેશભાઈ પટેલ"
              />
            </div>

            {/* English Secondary Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  English Name
                </label>
                {isEditMode && form.nameEnglish && (
                  <button
                    onClick={() => {
                      const gu = englishToGujaratiPhonetic(form.nameEnglish || '');
                      handleFieldChange('nameGujarati', gu);
                    }}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                    title="Auto-convert English phonetic typing to Gujarati script"
                  >
                    Auto-Convert to ગુ ↵
                  </button>
                )}
              </div>
              <input
                value={form.nameEnglish ?? ''}
                onChange={e => handleFieldChange('nameEnglish', e.target.value)}
                disabled={!isEditMode}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors disabled:opacity-60"
                placeholder="e.g. Rameshbhai Patel"
              />
            </div>

            {/* Kinship Title / Custom Tag */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Kinship Title / Role (સંબંધ પદ)
                </label>
                <span className="text-[10px] text-slate-400">Gujarati Title</span>
              </div>
              <input
                value={form.kinshipTitle ?? ''}
                onChange={e => handleFieldChange('kinshipTitle', e.target.value)}
                disabled={!isEditMode}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors disabled:opacity-60"
                placeholder="e.g. કાકા, મોટાબાપા, સાસુ, પાટલા સાસુ"
              />

              {/* 1-Click Kinship Title Suggestions */}
              {isEditMode && (
                <div className="mt-2 space-y-1">
                  <div className="text-[10px] text-slate-400 font-medium">Quick Suggestions:</div>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                    {[
                      'દાદા', 'દાદી', 'પિતા', 'માતા', 'મોટાબાપા', 'મોટીબા',
                      'કાકા', 'કાકી', 'ફઈ', 'ફુવા', 'મામા', 'મામી', 'માસી', 'માસા',
                      'સાસુ', 'સસરા', 'જેઠ', 'જેઠાણી', 'પાટલા સાસુ', 'દેર', 'દેરાણી',
                      'નણંદ', 'નણદોઈ', 'પુત્ર', 'પુત્રી', 'જમાઈ', 'પૌત્ર', 'પૌત્રી'
                    ].map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleFieldChange('kinshipTitle', role)}
                        className={`px-1.5 py-0.5 rounded text-[10px] border transition-all ${
                          form.kinshipTitle === role
                            ? 'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 font-semibold'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Gender Segmented Control */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Gender
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
                {(['male', 'female', 'other'] as Gender[]).map(g => (
                  <button
                    key={g}
                    disabled={!isEditMode}
                    onClick={() => handleFieldChange('gender', g)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                      form.gender === g
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {g === 'male' ? 'Male (પુરુષ)' : g === 'female' ? 'Female (સ્ત્રી)' : 'Other'}
                  </button>
                ))}
              </div>
            </div>

            {/* Dates: Birth & Death */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Birth Date</label>
                <input
                  type="date"
                  value={form.birthDate ?? ''}
                  onChange={e => handleFieldChange('birthDate', e.target.value)}
                  disabled={!isEditMode}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-slate-800 dark:text-slate-200 outline-none text-[11px]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Deceased Date</label>
                <input
                  type="date"
                  value={form.deathDate ?? ''}
                  onChange={e => handleFieldChange('deathDate', e.target.value)}
                  disabled={!isEditMode}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-slate-800 dark:text-slate-200 outline-none text-[11px]"
                />
              </div>
            </div>

            {/* Photo & Cropping Trigger */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Profile Photo
                </label>
                {(selectedNode.photo || form.photo) && isEditMode && (
                  <button
                    onClick={handleRemovePhoto}
                    className="text-[10px] text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div
                  onClick={() => isEditMode && fileInputRef.current?.click()}
                  className={`w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0 ${
                    isEditMode ? 'cursor-pointer hover:border-blue-500' : ''
                  }`}
                  title={isEditMode ? 'Click to change photo' : undefined}
                >
                  {selectedNode.photo || form.photo ? (
                    <img src={selectedNode.photo || form.photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">👤</span>
                  )}
                </div>
                {isEditMode && (
                  <div className="flex-1 flex gap-1.5">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                      title="Upload image directly"
                    >
                      📁 Upload
                    </button>
                    <button
                      onClick={togglePhotoEditor}
                      className="flex-1 py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                      title="Open photo editor to crop"
                    >
                      ✂️ Crop
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleDirectPhotoUpload}
                />
              </div>
            </div>

            {/* Branch Category */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Branch Category
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'main', label: 'Main Tree' },
                  { id: 'in-law', label: 'In-Laws' },
                  { id: 'mosal', label: 'Maternal (Mosal)' },
                ].map(b => (
                  <button
                    key={b.id}
                    disabled={!isEditMode}
                    onClick={() => handleFieldChange('branchType', b.id)}
                    className={`flex-1 py-1 rounded-lg border text-xs font-medium transition-all ${
                      (form.branchType || 'main') === b.id
                        ? 'bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── TAB 2: KINSHIP ENGINE ────────────────────────── */}
        {inspectorTab === 'kinship' && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200/60 dark:border-blue-900/60">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider block mb-1">
                Kinship Calculation
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Calculates precise authentic Gujarati relationship (કાકા, મામા, માસી, ફઈ, સાસુ, સસરા, પાટલા સાસુ) relative to another person.
              </p>
            </div>

            {/* Target Person Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Relative to:
              </label>
              <select
                value={kinshipCompareId ?? ''}
                onChange={e => setKinshipCompareId(e.target.value || null)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-slate-800 dark:text-slate-200 text-xs outline-none"
              >
                {nodes
                  .filter(n => n._id !== selectedNode._id)
                  .map(n => (
                    <option key={n._id} value={n._id}>
                      {n.nameGujarati} ({n.nameEnglish || 'Member'})
                    </option>
                  ))}
              </select>
            </div>

            {/* Kinship Output Card */}
            {kinship && (
              <div className="p-4 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-slate-900 dark:to-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                    Relationship
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                    {kinship.category}
                  </span>
                </div>

                <div className="pt-1">
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {kinship.termGujarati}
                  </div>
                  <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {kinship.termPhonetic} ({kinship.termEnglish})
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-400 border-t border-indigo-100 dark:border-slate-800 pt-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Genealogical Path:</span>{' '}
                  {kinship.pathExplanation || kinship.descriptionGujarati}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: IN-LAWS BRANCH MANAGER ────────────────── */}
        {inspectorTab === 'inlaws' && (
          <div className="space-y-4">
            <div className="p-3 bg-purple-50/80 dark:bg-purple-950/40 rounded-xl border border-purple-200/80 dark:border-purple-900/60">
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block mb-1">
                In-Law Branch (સાસરી પક્ષ)
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                In-law subtrees (સાસુ, સસરા, જેઠ, પાટલા સાસુ, દેર, નણંદ) are <strong>hidden by default</strong> to prevent canvas clutter.
              </p>
            </div>

            {/* Visibility Master Toggle */}
            <button
              onClick={() => toggleInLawsBranch(selectedNode._id)}
              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                !inLawsCollapsed
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/50'
              }`}
            >
              <span className="text-sm">⚯</span>
              <span>
                {!inLawsCollapsed ? 'Hide In-Laws on Canvas' : `Show In-Laws (${inLawCount})`}
              </span>
            </button>

            {/* Linked In-Law Relatives List */}
            <div>
              <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Connected In-Law Members ({inLawCount})
              </div>

              {inLawCount === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  No in-law relatives linked yet.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedNode.inLawNodeIds?.map(inLawId => {
                    const inLawNode = nodes.find(n => n._id === inLawId);
                    if (!inLawNode) return null;
                    return (
                      <div
                        key={inLawId}
                        onClick={() => setSelectedNodeId(inLawId)}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200 dark:border-slate-800 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                            {inLawNode.nameGujarati}
                          </span>
                        </div>
                        {inLawNode.kinshipTitle && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded-full font-semibold">
                            {inLawNode.kinshipTitle}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Add In-Law Relative Buttons */}
            {isEditMode && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Quick Add Relative
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: '+ Mother-in-law (સાસુ)', role: 'sasu' as const },
                    { label: '+ Father-in-law (સસરા)', role: 'sasara' as const },
                    { label: '+ Brother-in-law (દેર)', role: 'der' as const },
                    { label: '+ Elder Bro-in-law (જેઠ)', role: 'jeth' as const },
                    { label: '+ Sister-in-law (પાટલા સાસુ)', role: 'patala-sasu' as const },
                    { label: '+ Sister-in-law (નણંદ)', role: 'nanand' as const },
                  ].map(btn => (
                    <button
                      key={btn.role}
                      onClick={() => addInLawRelative(selectedNode._id, btn.role)}
                      className="text-left px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 bg-slate-50 dark:bg-slate-900 text-[11px] text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 4: STYLE & CANVAS GEOMETRY ───────────────── */}
        {inspectorTab === 'style' && (
          <div className="space-y-4">
            {/* Node Shape */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                Node Shape
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'rounded-card' as const, label: 'Card' },
                  { id: 'minimal-pill' as const, label: 'Pill' },
                  { id: 'badge' as const, label: 'Badge' },
                ].map(s => (
                  <button
                    key={s.id}
                    disabled={!isEditMode}
                    onClick={() =>
                      handleFieldChange('style', {
                        ...form.style,
                        shape: s.id,
                      })
                    }
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium text-center transition-all ${
                      (form.style?.shape || 'rounded-card') === s.id
                        ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Palette Presets */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                Color Palette & Contrast
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: 'Default', accent: undefined, bg: undefined, border: undefined, color: '#3B82F6' },
                  { label: 'Ocean', accent: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD', color: '#0284C7' },
                  { label: 'Emerald', accent: '#059669', bg: '#ECFDF5', border: '#A7F3D0', color: '#059669' },
                  { label: 'Rose', accent: '#E11D48', bg: '#FFF1F2', border: '#FECDD3', color: '#E11D48' },
                  { label: 'Amber', accent: '#D97706', bg: '#FFFBEB', border: '#FDE68A', color: '#D97706' },
                  { label: 'Violet', accent: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', color: '#7C3AED' },
                  { label: 'Slate', accent: '#475569', bg: '#F8FAFC', border: '#CBD5E1', color: '#475569' },
                ].map(palette => {
                  const isCurrent =
                    form.style?.accentColor === palette.accent &&
                    form.style?.bgColor === palette.bg;
                  return (
                    <button
                      key={palette.label}
                      disabled={!isEditMode}
                      onClick={() =>
                        handleFieldChange('style', {
                          ...form.style,
                          accentColor: palette.accent,
                          bgColor: palette.bg,
                          borderColor: palette.border,
                        })
                      }
                      className={`flex flex-col items-center p-1.5 rounded-lg border transition-all ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-black/10 shadow-xs mb-1"
                        style={{ backgroundColor: palette.color }}
                      />
                      <span className="text-[10px] text-slate-700 dark:text-slate-300 font-medium">
                        {palette.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Accent Color Picker */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Custom Accent
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {form.style?.accentColor || 'Auto'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5">
                <input
                  type="color"
                  value={form.style?.accentColor || '#3B82F6'}
                  disabled={!isEditMode}
                  onChange={e =>
                    handleFieldChange('style', {
                      ...form.style,
                      accentColor: e.target.value,
                    })
                  }
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Pick custom node header & line accent
                </span>
              </div>
            </div>

            {/* Position X / Y */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Canvas Coordinates
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5">
                  <span className="text-slate-400 font-mono text-[11px]">X</span>
                  <input
                    type="number"
                    value={Math.round(form.position?.x ?? 0)}
                    onChange={e =>
                      handleFieldChange('position', {
                        x: Number(e.target.value),
                        y: form.position?.y ?? 0,
                      })
                    }
                    disabled={!isEditMode}
                    className="w-full bg-transparent text-slate-800 dark:text-slate-200 outline-none text-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5">
                  <span className="text-slate-400 font-mono text-[11px]">Y</span>
                  <input
                    type="number"
                    value={Math.round(form.position?.y ?? 0)}
                    onChange={e =>
                      handleFieldChange('position', {
                        x: form.position?.x ?? 0,
                        y: Number(e.target.value),
                      })
                    }
                    disabled={!isEditMode}
                    className="w-full bg-transparent text-slate-800 dark:text-slate-200 outline-none text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Photo Mask Style */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Avatar Mask
              </span>
              <div className="flex gap-2">
                {(['circle', 'square'] as const).map(m => (
                  <button
                    key={m}
                    disabled={!isEditMode}
                    onClick={() =>
                      handleFieldChange('style', {
                        ...form.style,
                        photoMask: m,
                      })
                    }
                    className={`flex-1 py-1.5 rounded-lg border text-xs capitalize transition-all ${
                      (form.style?.photoMask || 'circle') === m
                        ? 'bg-blue-50 border-blue-400 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Footer: Save Changes & Delete ─── */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/50">
        {isEditMode && (
          <button
            onClick={deletePerson}
            className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded transition-colors"
          >
            Delete
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={saveChanges}
          disabled={!isEditMode || isSaving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-xs px-4 py-1.5 rounded-lg shadow-xs shadow-blue-500/20 transition-all flex items-center gap-1.5"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </aside>
  );
}
