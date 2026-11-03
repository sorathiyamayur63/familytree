'use client';
// ============================================================
// NodeEditor — Slide-over panel to edit a person's attributes
// ============================================================
import { useState, useEffect } from 'react';
import { useTreeStore } from '@/store/treeStore';
import type { FamilyNode, Gender } from '@/types';

export default function NodeEditor() {
  const {
    nodes, selectedNodeId, showNodeEditor, toggleNodeEditor,
    upsertNode, removeNode, trees, activeTreeId,
  } = useTreeStore();

  const node = nodes.find(n => n._id === selectedNodeId);
  const [form, setForm] = useState<Partial<FamilyNode>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'relations' | 'style'>('basic');

  useEffect(() => {
    if (node) setForm({ ...node });
  }, [node?._id]);

  if (!showNodeEditor || !node) return null;

  const handleChange = (key: string, value: unknown) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleSave = async () => {
    if (!form._id) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/nodes/${form._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        upsertNode({ ...node, ...form } as FamilyNode);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this person? This cannot be undone.')) return;
    await fetch(`/api/nodes/${node._id}`, { method: 'DELETE' });
    removeNode(node._id);
    toggleNodeEditor();
  };

  const genderColors: Record<Gender, string> = {
    male: 'bg-blue-100 text-blue-700 border-blue-300',
    female: 'bg-pink-100 text-pink-700 border-pink-300',
    other: 'bg-gray-100 text-gray-700 border-gray-300',
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 z-30 w-80 bg-[var(--card)] border-l border-[var(--border)] shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Edit Person</h2>
        <button onClick={toggleNodeEditor} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-lg leading-none">✕</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)]">
        {(['basic', 'relations', 'style'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-indigo-600 border-b-2 border-indigo-500'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'basic' && (
          <>
            <Field label="Gujarati Name ગુ">
              <input
                value={form.nameGujarati ?? ''}
                onChange={e => handleChange('nameGujarati', e.target.value)}
                className="input"
                placeholder="ઉદ. રમેશભાઈ"
              />
            </Field>
            <Field label="English Name">
              <input
                value={form.nameEnglish ?? ''}
                onChange={e => handleChange('nameEnglish', e.target.value)}
                className="input"
                placeholder="e.g. Rameshbhai"
              />
            </Field>
            <Field label="Gender">
              <div className="flex gap-2">
                {(['male', 'female', 'other'] as Gender[]).map(g => (
                  <button
                    key={g}
                    onClick={() => handleChange('gender', g)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-medium capitalize transition-all ${
                      form.gender === g ? genderColors[g] : 'border-[var(--border)] text-[var(--muted-foreground)]'
                    }`}
                  >
                    {g === 'male' ? '♂' : g === 'female' ? '♀' : '⚧'} {g}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Birth Date">
              <input
                type="date"
                value={form.birthDate ?? ''}
                onChange={e => handleChange('birthDate', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Death Date (if applicable)">
              <input
                type="date"
                value={form.deathDate ?? ''}
                onChange={e => handleChange('deathDate', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Notes">
              <textarea
                value={form.metadata?.notes ?? ''}
                onChange={e => handleChange('metadata', { ...(form.metadata ?? {}), notes: e.target.value })}
                className="input h-20 resize-none"
                placeholder="Additional notes..."
              />
            </Field>
          </>
        )}

        {activeTab === 'relations' && (
          <RelationsTab node={node} nodes={nodes} form={form} onChange={handleChange} />
        )}

        {activeTab === 'style' && (
          <>
            <Field label="Node Shape">
              <select
                value={form.style?.shape ?? 'rounded-card'}
                onChange={e => handleChange('style', { ...(form.style ?? {}), shape: e.target.value })}
                className="input"
              >
                <option value="rounded-card">Rounded Card</option>
                <option value="circle">Circle</option>
                <option value="badge">Badge / Pill</option>
              </select>
            </Field>
            <Field label="Background Color">
              <input
                type="color"
                value={form.style?.bgColor ?? '#DBEAFE'}
                onChange={e => handleChange('style', { ...(form.style ?? {}), bgColor: e.target.value })}
                className="h-9 w-full rounded cursor-pointer"
              />
            </Field>
            <Field label="Border Color">
              <input
                type="color"
                value={form.style?.borderColor ?? '#93C5FD'}
                onChange={e => handleChange('style', { ...(form.style ?? {}), borderColor: e.target.value })}
                className="h-9 w-full rounded cursor-pointer"
              />
            </Field>
            <Field label="Photo Mask">
              <div className="flex gap-2">
                {(['circle', 'square'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => handleChange('style', { ...(form.style ?? {}), photoMask: m })}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-medium capitalize transition-all ${
                      (form.style?.photoMask ?? 'circle') === m
                        ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                        : 'border-[var(--border)] text-[var(--muted-foreground)]'
                    }`}
                  >
                    {m === 'circle' ? '⭕' : '⬜'} {m}
                  </button>
                ))}
              </div>
            </Field>
          </>
        )}
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-[var(--border)] flex gap-2">
        <button
          onClick={handleDelete}
          className="px-3 py-2 rounded-lg text-red-600 text-xs font-medium border border-red-200 hover:bg-red-50 transition-colors"
        >
          🗑 Delete
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-2 rounded-lg bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 disabled:opacity-60 transition-colors"
        >
          {isSaving ? 'Saving…' : '✓ Save Changes'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-[var(--muted-foreground)]">{label}</label>
      {children}
    </div>
  );
}

function RelationsTab({
  node, nodes, form, onChange,
}: {
  node: FamilyNode;
  nodes: FamilyNode[];
  form: Partial<FamilyNode>;
  onChange: (key: string, value: unknown) => void;
}) {
  const otherNodes = nodes.filter(n => n._id !== node._id);

  const toggleRelation = (
    key: 'parentIds' | 'childIds' | 'spouseIds',
    targetId: string
  ) => {
    const current = (form[key] as string[]) ?? [];
    const next = current.includes(targetId)
      ? current.filter(id => id !== targetId)
      : [...current, targetId];
    onChange(key, next);
  };

  const renderSection = (
    title: string,
    key: 'parentIds' | 'childIds' | 'spouseIds',
    emoji: string
  ) => (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
        {emoji} {title}
      </p>
      <div className="space-y-1 max-h-32 overflow-y-auto border border-[var(--border)] rounded-lg p-1">
        {otherNodes.length === 0 ? (
          <p className="text-xs text-center text-[var(--muted-foreground)] py-2">No other people</p>
        ) : otherNodes.map(n => {
          const selected = ((form[key] as string[]) ?? []).includes(n._id);
          return (
            <button
              key={n._id}
              onClick={() => toggleRelation(key, n._id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors ${
                selected ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-[var(--accent)] text-[var(--foreground)]'
              }`}
            >
              <span className="flex-1 truncate">{n.nameEnglish || n.nameGujarati}</span>
              {selected && <span className="text-indigo-500">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {renderSection('Parents', 'parentIds', '⬆️')}
      {renderSection('Children', 'childIds', '⬇️')}
      {renderSection('Spouses', 'spouseIds', '💍')}
    </div>
  );
}
