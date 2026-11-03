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
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;
      setImgSrc(dataUrl);
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
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-84 overflow-hidden text-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">📷 Photo Editor</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md">✕</button>
        </div>

        <div className="p-4 space-y-3">
          {/* File picker */}
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-slate-50 dark:bg-slate-800/50"
          >
            {imgSrc ? '🔄 Change Selected Photo' : '📁 Choose Image File'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

          {/* Mask toggle */}
          <div className="flex gap-2">
            {(['circle', 'square'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMask(m)}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  mask === m
                    ? 'bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {m === 'circle' ? '⭕ Circle Mask' : '⬜ Square Mask'}
              </button>
            ))}
          </div>

          {/* Canvas preview */}
          <div className="flex justify-center bg-slate-100 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE} height={CANVAS_SIZE}
              className="rounded-lg w-[260px] h-[260px] cursor-move bg-slate-200 dark:bg-slate-900"
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onWheel={onWheel}
            />
          </div>
          {imgObj ? (
            <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
              Drag to reposition · Scroll wheel to scale
            </p>
          ) : (
            <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
              Select a photo above to preview and adjust
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCrop}
              disabled={!imgObj}
              className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors shadow-xs"
            >
              ✓ Apply & Save Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
