// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({
  canWrite: true,
  list: { data: { images: [] as unknown[] }, isLoading: false, isError: false, refetch: vi.fn() },
  remove: vi.fn(),
  imageSize: { w: 2000, h: 1000 },
}));

vi.mock('../auth/platformAccess', () => ({ useCanWrite: () => h.canWrite }));
vi.mock('../features/layout/usePageTitle', () => ({ usePageTitle: () => undefined }));
vi.mock('../features/coverImages/CoverCropDialog', () => ({
  CoverCropDialog: () => <div role="dialog">cropper</div>,
}));
vi.mock('../services/api', () => ({
  useExecuteListCoverImageLibraryForPlatformQuery: () => h.list,
  useExecuteGenerateCoverLibraryUploadUrlMutation: () => [vi.fn(), { isLoading: false }],
  useExecuteRegisterCoverLibraryImageMutation: () => [vi.fn(), { isLoading: false }],
  useExecuteRenameCoverLibraryImageMutation: () => [vi.fn(), { isLoading: false }],
  useExecuteDeleteCoverLibraryImageMutation: () => [h.remove, { isLoading: false }],
}));

import { CoverImagesPage } from './CoverImagesPage';

function img(i: number) {
  return {
    id: `id${i}`,
    name: `Cover ${i}`,
    imageUrl: `https://x/full${i}.jpg`,
    cardImageUrl: `https://x/card${i}.jpg`,
    createdAt: '2026-01-01T00:00:00Z',
    order: i,
  };
}

class FakeImage {
  naturalWidth = h.imageSize.w;
  naturalHeight = h.imageSize.h;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_v: string) {
    queueMicrotask(() => this.onload?.());
  }
}

beforeEach(() => {
  h.canWrite = true;
  h.list.data = { images: [] };
  h.list.isLoading = false;
  h.list.isError = false;
  h.imageSize = { w: 2000, h: 1000 };
  h.remove.mockReset().mockReturnValue({ unwrap: () => Promise.resolve({}) });
  vi.stubGlobal('Image', FakeImage);
  URL.createObjectURL = vi.fn(() => 'blob:x');
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function pickFile() {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Sunset' } });
  const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
  fireEvent.change(screen.getByTestId('cover-file-input'), { target: { files: [file] } });
}

describe('CoverImagesPage', () => {
  it('shows the empty state', () => {
    render(<CoverImagesPage />);
    expect(screen.getByText(/No cover images yet/)).toBeTruthy();
    expect(screen.getByTestId('library-count').textContent).toContain('0 / 50');
  });

  it('shows an error with retry', () => {
    h.list.isError = true;
    render(<CoverImagesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(h.list.refetch).toHaveBeenCalled();
  });

  it('renders the card thumbnail and name', () => {
    h.list.data = { images: [img(1), img(2)] };
    render(<CoverImagesPage />);
    const thumb = screen.getByAltText('Cover 1') as HTMLImageElement;
    expect(thumb.src).toBe('https://x/card1.jpg');
    expect(screen.getByText('Cover 2')).toBeTruthy();
    expect(screen.getByTestId('library-count').textContent).toContain('2 / 50');
  });

  it('asks for confirmation before deleting', async () => {
    h.list.data = { images: [img(1)] };
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<CoverImagesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Cover 1' }));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('keep their own copy'));
    expect(h.remove).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Cover 1' }));
    await waitFor(() => expect(h.remove).toHaveBeenCalledWith({ imageId: 'id1' }));
  });

  it('blocks upload at the 50-image cap', () => {
    h.list.data = { images: Array.from({ length: 50 }, (_, i) => img(i)) };
    render(<CoverImagesPage />);
    expect(screen.getByTestId('library-count').textContent).toContain('50 / 50');
    expect(screen.getByText(/The library is full/)).toBeTruthy();
    expect(screen.queryByTestId('cover-file-input')).toBeNull();
  });

  it('rejects a too-small source before opening the cropper', async () => {
    h.imageSize = { w: 1000, h: 300 };
    render(<CoverImagesPage />);
    pickFile();
    expect((await screen.findByRole('alert')).textContent).toContain('at least 1200×400');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens the cropper for a big enough image', async () => {
    render(<CoverImagesPage />);
    pickFile();
    expect(await screen.findByRole('dialog')).toBeTruthy();
  });

  it('hides upload and mutation controls for read-only operators', () => {
    h.canWrite = false;
    h.list.data = { images: [img(1)] };
    render(<CoverImagesPage />);
    expect(screen.queryByTestId('cover-file-input')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete Cover 1' })).toBeNull();
    expect(screen.getByText('Cover 1')).toBeTruthy();
  });
});
