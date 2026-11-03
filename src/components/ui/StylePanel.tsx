'use client';
// ============================================================
// StylePanel — Canvas Style Engine
// ============================================================
import { useTreeStore } from '@/store/treeStore';
import type { GridType, EdgeStyle } from '@/types';

export default function StylePanel() {
  const {
    showStylePanel, toggleStylePanel,
    canvasConfig, setGridType, setEdgeStyle, toggleSnapToGrid,
    isDarkMode,
  } = useTreeStore();

  if (!showStylePanel) return null;

  const gridOptions: { value: GridType; label: string; icon: string }[] = [
    { value: 'none', label: 'Blank', icon: '⬜' },
    { value: 'dots', label: 'Dots', icon: '⋯' },
    { value: 'lines', label: 'Grid', icon: '⊞' },
    { value: 'cross', label: 'Cross', icon: '✛' },
  ];

  const edgeOptions: { value: EdgeStyle; label: string; icon: string }[] = [
    { value: 'curved', label: 'Curved', icon: '〜' },
    { value: 'straight', label: 'Straight', icon: '—' },
    { value: 'step', label: 'Step', icon: '⌐' },
    { value: 'zigzag', label: 'Zigzag', icon: '⚡' },
  ];

  return (
    <div className="absolute right-4 top-14 z-30 w-64 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">🎨 Canvas Styles</h3>
        <button onClick={toggleStylePanel} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">✕</button>
      </div>

      <div className="p-4 space-y-4">
        {/* Grid Type */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Background Grid</p>
          <div className="grid grid-cols-4 gap-1.5">
            {gridOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setGridType(opt.value)}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-center transition-all ${
                  canvasConfig.gridType === opt.value
                    ? 'bg-indigo-100 border-indigo-400 text-indigo-700'
                    : 'border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]'
                }`}
              >
                <span className="text-base">{opt.icon}</span>
                <span className="text-[11px] font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Snap to grid */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--foreground)]">Snap to Grid</span>
          <button
            onClick={toggleSnapToGrid}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              canvasConfig.snapToGrid ? 'bg-indigo-500' : 'bg-[var(--border)]'
            }`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              canvasConfig.snapToGrid ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {/* Grid size */}
        {canvasConfig.snapToGrid && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Grid Size: {canvasConfig.gridSize}px</p>
            <input
              type="range" min="20" max="100" step="10"
              value={canvasConfig.gridSize}
              onChange={e => useTreeStore.getState().setCanvasConfig({ gridSize: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>
        )}

        {/* Edge style */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Connection Style</p>
          <div className="grid grid-cols-2 gap-1.5">
            {edgeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setEdgeStyle(opt.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  canvasConfig.edgeStyle === opt.value
                    ? 'bg-indigo-100 border-indigo-400 text-indigo-700'
                    : 'border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]'
                }`}
              >
                <span className="text-base">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Color legend */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Node Color Legend</p>
          <div className="space-y-1">
            {[
              { label: 'Male', color: '#DBEAFE', border: '#93C5FD' },
              { label: 'Female', color: '#FCE7F3', border: '#F9A8D4' },
              { label: 'Other / Unknown', color: '#F3F4F6', border: '#D1D5DB' },
              { label: 'Circular Reference', color: '#FEE2E2', border: '#EF4444' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded border"
                  style={{ backgroundColor: item.color, borderColor: item.border }}
                />
                <span className="text-xs text-[var(--foreground)]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-2">
          <p className="text-xs text-[var(--muted-foreground)]">
            💡 Spouse connections shown as pink dashed lines
          </p>
        </div>
      </div>
    </div>
  );
}
