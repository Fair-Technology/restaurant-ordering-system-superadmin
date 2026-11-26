import { describe, expect, it, vi } from 'vitest';
import {
  COVER_IMAGE_RULE,
  isLimitReachedError,
  isWrongSizeError,
  meetsMinimumSize,
  validCoverName,
} from './imageRules';
import { planDraw, previewArea, renderCrop, safeAreaFraction } from './cropMath';
import type { CropCanvas } from './cropMath';

describe('meetsMinimumSize', () => {
  it('accepts exactly 1200x400 and larger', () => {
    expect(meetsMinimumSize(1200, 400, COVER_IMAGE_RULE)).toBe(true);
    expect(meetsMinimumSize(4000, 3000, COVER_IMAGE_RULE)).toBe(true);
  });
  it('rejects either side too small', () => {
    expect(meetsMinimumSize(1199, 400, COVER_IMAGE_RULE)).toBe(false);
    expect(meetsMinimumSize(1200, 399, COVER_IMAGE_RULE)).toBe(false);
  });
});

describe('validCoverName', () => {
  it('trims and requires 1-100 chars', () => {
    expect(validCoverName('  Sunset ')).toBe('Sunset');
    expect(validCoverName('   ')).toBeNull();
    expect(validCoverName('a'.repeat(100))).not.toBeNull();
    expect(validCoverName('a'.repeat(101))).toBeNull();
  });
});

describe('error helpers', () => {
  it('detects the wrong-size code', () => {
    expect(isWrongSizeError({ data: { code: 'COVER_IMAGE_WRONG_SIZE' } })).toBe(true);
    expect(isWrongSizeError({ data: { code: 'OTHER' } })).toBe(false);
    expect(isWrongSizeError(null)).toBe(false);
  });
  it('detects a full library', () => {
    expect(isLimitReachedError({ status: 409, data: {} })).toBe(true);
    expect(isLimitReachedError({ status: 400, data: { code: 'LIMIT_REACHED' } })).toBe(true);
    expect(isLimitReachedError({ status: 500 })).toBe(false);
  });
});

describe('safeAreaFraction / previewArea', () => {
  it('phones see the centre two thirds of the 3:1 cover', () => {
    expect(safeAreaFraction(COVER_IMAGE_RULE)).toBeCloseTo(2 / 3);
    expect(safeAreaFraction(COVER_IMAGE_RULE) * COVER_IMAGE_RULE.outputWidth).toBeCloseTo(1280);
  });
  const area = { x: 10, y: 20, width: 60, height: 30 };
  it('same ratio shows the whole crop; narrower is centred; never widens', () => {
    expect(previewArea(area, 3, 3)).toEqual(area);
    const p = previewArea(area, 3, 2);
    expect(p.width).toBeCloseTo(40);
    expect(p.x).toBeCloseTo(20);
    expect(previewArea(area, 1, 3).width).toBe(60);
  });
});

describe('planDraw / renderCrop', () => {
  it('maps a crop to the exact 1920x640 output', () => {
    expect(planDraw({ x: 100.4, y: 50.6, width: 2400.2, height: 799.7 }, COVER_IMAGE_RULE)).toEqual({
      sx: 100, sy: 51, sw: 2400, sh: 800, dw: 1920, dh: 640,
    });
    expect(planDraw({ x: 0, y: 0, width: 0, height: 0 }, COVER_IMAGE_RULE).sw).toBe(1);
  });

  it('renders a JPEG at quality 0.85', async () => {
    const drawImage = vi.fn();
    const toBlob = vi.fn<CropCanvas['toBlob']>((cb, type) => cb(new Blob(['x'], { type })));
    const canvas: CropCanvas = { width: 0, height: 0, getContext: () => ({ drawImage }), toBlob };
    const image = {} as CanvasImageSource;
    const blob = await renderCrop(image, { x: 10, y: 20, width: 1800, height: 600 }, COVER_IMAGE_RULE, () => canvas);
    expect([canvas.width, canvas.height]).toEqual([1920, 640]);
    expect(drawImage).toHaveBeenCalledWith(image, 10, 20, 1800, 600, 0, 0, 1920, 640);
    expect(toBlob.mock.calls[0][1]).toBe('image/jpeg');
    expect(toBlob.mock.calls[0][2]).toBe(0.85);
    expect(blob.type).toBe('image/jpeg');
  });

  it('rejects when export fails or there is no context', async () => {
    const bad: CropCanvas = { width: 0, height: 0, getContext: () => ({ drawImage: vi.fn() }), toBlob: (cb) => cb(null) };
    await expect(renderCrop({} as CanvasImageSource, { x: 0, y: 0, width: 8, height: 6 }, COVER_IMAGE_RULE, () => bad)).rejects.toThrow();
    const none: CropCanvas = { width: 0, height: 0, getContext: () => null, toBlob: vi.fn() };
    await expect(renderCrop({} as CanvasImageSource, { x: 0, y: 0, width: 8, height: 6 }, COVER_IMAGE_RULE, () => none)).rejects.toThrow();
  });
});
