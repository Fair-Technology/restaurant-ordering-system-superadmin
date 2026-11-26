import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Minus, Plus, X } from 'lucide-react';
import { COVER_IMAGE_RULE as rule } from './imageRules';
import { renderCrop, safeAreaFraction } from './cropMath';
import type { PixelArea } from './cropMath';

interface Props {
  /** Object URL of the (already size-checked) source image. */
  imageUrl: string;
  /** The decoded source image, drawn onto the output canvas. */
  image: HTMLImageElement;
  /** Called with the cropped 1920x640 JPEG. May throw; the dialog shows a generic error. */
  onConfirm: (blob: Blob) => void | Promise<void>;
  onCancel: () => void;
  busy?: boolean;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.2;

function clampZoom(z: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));
}

export function CoverCropDialog({ imageUrl, image, onConfirm, onCancel, busy = false }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [pixels, setPixels] = useState<PixelArea | null>(null);
  const [frame, setFrame] = useState<{ width: number; height: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const safeFraction = safeAreaFraction(rule);
  const sideWidth = `${((1 - safeFraction) / 2) * 100}%`;

  useEffect(() => dialogRef.current?.focus(), []);

  const onCropAreaChange = useCallback((_percent: PixelArea, px: PixelArea) => setPixels(px), []);

  async function handleSave() {
    if (!pixels) return;
    setSaveFailed(false);
    setSaving(true);
    try {
      await onConfirm(await renderCrop(image, pixels, rule));
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  }

  const disabled = busy || saving;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={disabled ? undefined : onCancel} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Crop cover image"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !disabled) onCancel();
        }}
        className="relative flex max-h-full w-full max-w-2xl flex-col overflow-y-auto rounded-2xl bg-white shadow-xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h2 className="text-base font-semibold text-gray-900">Crop cover image</h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled}
            aria-label="Cancel"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <p className="text-sm text-gray-600">
            Drag to position and zoom to fit. The image is saved at {rule.outputWidth}×{rule.outputHeight}. Phones show
            only the centre part between the dashed lines.
          </p>
          <div className="relative h-64 overflow-hidden rounded-xl bg-gray-900 sm:h-80">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              aspect={rule.aspect}
              keyboardStep={10}
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={(z) => setZoom(clampZoom(z))}
              onCropAreaChange={onCropAreaChange}
              onCropComplete={onCropAreaChange}
              onCropSizeChange={setFrame}
              cropperProps={{ 'aria-label': 'Crop area. Use the arrow keys to move the image.' }}
            />
            {frame && (
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ width: frame.width, height: frame.height }}
                aria-hidden="true"
              >
                <div className="absolute inset-y-0 left-0 bg-black/55" style={{ width: sideWidth }} />
                <div className="absolute inset-y-0 right-0 bg-black/55" style={{ width: sideWidth }} />
                <div
                  className="absolute inset-y-0 border-x border-dashed border-white/80"
                  style={{ left: sideWidth, right: sideWidth }}
                />
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                  Visible on phones
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2" role="group" aria-label="Zoom">
            <button
              type="button"
              className="rounded-lg border border-gray-200 p-2 disabled:opacity-40"
              onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
              disabled={zoom <= MIN_ZOOM}
              aria-label="Zoom out"
            >
              <Minus size={14} />
            </button>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(clampZoom(Number(e.target.value)))}
              aria-label="Zoom"
              className="flex-1"
            />
            <button
              type="button"
              className="rounded-lg border border-gray-200 p-2 disabled:opacity-40"
              onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
              disabled={zoom >= MAX_ZOOM}
              aria-label="Zoom in"
            >
              <Plus size={14} />
            </button>
          </div>
          <p className="text-xs text-gray-400">Tip: click the image, then use the arrow keys to nudge it; + and − buttons zoom.</p>
          {saveFailed && <p role="alert" className="text-sm text-red-600">Could not process the image. Try again.</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button type="button" onClick={onCancel} disabled={disabled} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={disabled || !pixels}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {disabled ? 'Uploading…' : 'Crop & upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
