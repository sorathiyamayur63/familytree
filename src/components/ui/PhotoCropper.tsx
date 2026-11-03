'use client';
// ============================================================
// PhotoCropper — Client-side photo crop/mask, no server upload
// ============================================================
import { useRef, useEffect, useState, useCallback } from 'react';
import { useTreeStore } from '@/store/treeStore';

interface PhotoCropperProps {
  onComplete: (base64: string) => void;
  onClose: () => void;
}

export default function PhotoCropper({ onComplete, onClose }: PhotoCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [mask, setMask] = useState<'circle' | 'square'>('circle');
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 200 });
  const isDragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, cx: 0, cy: 0 });

  const CANVAS_SIZE = 280;

  // Load image
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    const img = new Image();
    img.onload = () => {
      setImgObj(img);
      // Center crop
      const minDim = Math.min(img.naturalWidth, img.naturalHeight);
      const displayScale = CANVAS_SIZE / Math.max(img.naturalWidth, img.naturalHeight);
      const size = minDim * displayScale * 0.8;
      setCrop({
        x: (CANVAS_SIZE - size) / 2,
        y: (CANVAS_SIZE - size) / 2,
        size,
      });
    };
    img.src = url;
  };

  // Render preview
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !imgObj) return;

    const W = CANVAS_SIZE;
    const H = CANVAS_SIZE;
    const scaleX = imgObj.naturalWidth / W;
    const scaleY = imgObj.naturalHeight / H;
    const scale = Math.max(scaleX, scaleY);

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(imgObj, 0, 0, W, H);

    // Darken outside crop
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);

    // Reveal crop area
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    if (mask === 'circle') {
      ctx.beginPath();
      ctx.arc(crop.x + crop.size / 2, crop.y + crop.size / 2, crop.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(crop.x, crop.y, crop.size, crop.size);
    }
    ctx.restore();

    // Redraw image in crop
    ctx.save();
    if (mask === 'circle') {
      ctx.beginPath();
      ctx.arc(crop.x + crop.size / 2, crop.y + crop.size / 2, crop.size / 2, 0, Math.PI * 2);
      ctx.clip();
    } else {
      ctx.beginPath();
      ctx.rect(crop.x, crop.y, crop.size, crop.size);
      ctx.clip();
    }
    ctx.drawImage(imgObj, 0, 0, W, H);
    ctx.restore();

    // Crop border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    if (mask === 'circle') {
      ctx.beginPath();
      ctx.arc(crop.x + crop.size / 2, crop.y + crop.size / 2, crop.size / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(crop.x, crop.y, crop.size, crop.size);
    }

    // Resize handle
    ctx.fillStyle = '#6366F1';
    ctx.beginPath();
    ctx.arc(crop.x + crop.size, crop.y + crop.size, 8, 0, Math.PI * 2);
    ctx.fill();
  }, [imgObj, crop, mask]);

  useEffect(() => { render(); }, [render]);

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    isDragging.current = true;
    dragStart.current = { mx, my, cx: crop.x, cy: crop.y };
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const dx = mx - dragStart.current.mx;
    const dy = my - dragStart.current.my;
    setCrop(c => ({
      ...c,
      x: Math.max(0, Math.min(CANVAS_SIZE - c.size, dragStart.current.cx + dx)),
      y: Math.max(0, Math.min(CANVAS_SIZE - c.size, dragStart.current.cy + dy)),
    }));
  };

  const onMouseUp = () => { isDragging.current = false; };

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setCrop(c => {
      const newSize = Math.max(40, Math.min(CANVAS_SIZE * 0.95, c.size - e.deltaY * 0.5));
      return { ...c, size: newSize };
    });
  };

  const handleCrop = () => {
    const out = document.createElement('canvas');
    const size = 200;
    out.width = size;
    out.height = size;
    const octx = out.getContext('2d')!;
    if (!imgObj) return;

    const scaleW = imgObj.naturalWidth / CANVAS_SIZE;
    const scaleH = imgObj.naturalHeight / CANVAS_SIZE;

    if (mask === 'circle') {
      octx.beginPath();
      octx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      octx.clip();
    }

    octx.drawImage(
      imgObj,
      crop.x * scaleW, crop.y * scaleH,
      crop.size * scaleW, crop.size * scaleH,
      0, 0, size, size
    );

    onComplete(out.toDataURL('image/png'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl w-80 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">📷 Photo Editor</h3>
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">✕</button>
        </div>

        <div className="p-4 space-y-3">
          {/* File picker */}
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-2 rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:border-indigo-400 hover:text-indigo-500 transition-colors"
          >
            {imgSrc ? '🔄 Change Photo' : '📁 Choose Photo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

          {/* Mask toggle */}
          <div className="flex gap-2">
            {(['circle', 'square'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMask(m)}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  mask === m ? 'bg-indigo-100 border-indigo-400 text-indigo-700' : 'border-[var(--border)] text-[var(--muted-foreground)]'
                }`}
              >
                {m === 'circle' ? '⭕ Circle' : '⬜ Square'}
              </button>
            ))}
          </div>

          {/* Canvas preview */}
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE} height={CANVAS_SIZE}
            className="rounded-xl border border-[var(--border)] w-full cursor-move"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
          />
          {imgObj && (
            <p className="text-xs text-center text-[var(--muted-foreground)]">
              Drag to reposition · Scroll to resize
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-[var(--border)] text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)]">
              Cancel
            </button>
            <button
              onClick={handleCrop}
              disabled={!imgObj}
              className="flex-1 py-2 rounded-lg bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 disabled:opacity-40 transition-colors"
            >
              ✓ Apply Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
