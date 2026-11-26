import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Pencil, Trash2 } from 'lucide-react';
import { usePageTitle } from '../features/layout/usePageTitle';
import {
  useExecuteDeleteCoverLibraryImageMutation,
  useExecuteGenerateCoverLibraryUploadUrlMutation,
  useExecuteListCoverImageLibraryForPlatformQuery,
  useExecuteRegisterCoverLibraryImageMutation,
  useExecuteRenameCoverLibraryImageMutation,
} from '../services/api';
import type { CoverLibraryImage } from '../services/api';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { WriteOnly, WriteFieldset } from '../auth/WriteOnly';
import { CoverCropDialog } from '../features/coverImages/CoverCropDialog';
import {
  COVER_IMAGE_RULE,
  COVER_NAME_MAX_LENGTH,
  IMAGE_MAX_BYTES,
  IMAGE_TYPES,
  MAX_COVER_LIBRARY_IMAGES,
  isLimitReachedError,
  isWrongSizeError,
  meetsMinimumSize,
  validCoverName,
} from '../features/coverImages/imageRules';

const inputClass =
  'w-full rounded-lg border border-white/50 bg-white/60 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400';
const btnClass =
  'inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed';

const DELETE_CONFIRM =
  'Delete this cover image from the library?\n\nShops that have already picked this image keep their own copy — deleting it here does not affect them. It will no longer be offered to other shops.';

function apiMessage(err: unknown, fallback: string): string {
  const data = (err as { data?: { error?: string } } | undefined)?.data;
  return data?.error ?? fallback;
}

interface Picked {
  url: string;
  image: HTMLImageElement;
}

export function CoverImagesPage() {
  usePageTitle('Cover images');
  const { data, isLoading, isError, refetch } = useExecuteListCoverImageLibraryForPlatformQuery();
  const [getUploadUrl, { isLoading: isGettingUrl }] = useExecuteGenerateCoverLibraryUploadUrlMutation();
  const [register, { isLoading: isRegistering }] = useExecuteRegisterCoverLibraryImageMutation();
  const [rename, { isLoading: isRenaming }] = useExecuteRenameCoverLibraryImageMutation();
  const [remove, { isLoading: isDeleting }] = useExecuteDeleteCoverLibraryImageMutation();

  const [name, setName] = useState('');
  const [picked, setPicked] = useState<Picked | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const pickedUrl = useRef<string | null>(null);

  useEffect(() => () => {
    if (pickedUrl.current) URL.revokeObjectURL(pickedUrl.current);
  }, []);

  function closeCropper() {
    if (pickedUrl.current) URL.revokeObjectURL(pickedUrl.current);
    pickedUrl.current = null;
    setPicked(null);
  }

  if (isLoading) {
    return <LoadingScreen title="Loading cover images" subtitle="Fetching the cover image library." />;
  }
  if (isError || !data) {
    return (
      <div className="glass-card p-12 text-center text-sm text-red-500">
        <p>Failed to load the cover image library.</p>
        <button type="button" className={`${btnClass} mt-4`} onClick={() => void refetch()}>
          Retry
        </button>
      </div>
    );
  }

  const images = data.images;
  const full = images.length >= MAX_COVER_LIBRARY_IMAGES;
  const busy = uploading || isGettingUrl || isRegistering || isRenaming || isDeleting;
  const cleanName = validCoverName(name);

  function handleFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setError('Choose a JPEG, PNG or WebP image.');
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      setError('That file is too large. The limit is 10 MB.');
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (!meetsMinimumSize(img.naturalWidth, img.naturalHeight, COVER_IMAGE_RULE)) {
        URL.revokeObjectURL(url);
        setError(
          `That image is ${img.naturalWidth}×${img.naturalHeight}. Cover images must be at least ${COVER_IMAGE_RULE.minWidth}×${COVER_IMAGE_RULE.minHeight} pixels.`,
        );
        return;
      }
      pickedUrl.current = url;
      setPicked({ url, image: img });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError('That file could not be read as an image.');
    };
    img.src = url;
  }

  async function handleCropped(blob: Blob) {
    if (!cleanName) return;
    setError(null);
    setUploading(true);
    try {
      const slot = await getUploadUrl({ generateCoverLibraryUploadUrlRequestDto: { contentType: 'image/jpeg' } }).unwrap();
      const put = await fetch(slot.uploadUrl, {
        method: 'PUT',
        headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': 'image/jpeg' },
        body: blob,
      });
      if (!put.ok) throw new Error('blob upload failed');
      await register({
        registerCoverLibraryImageRequestDto: { imageId: slot.imageId, url: slot.blobUrl, name: cleanName },
      }).unwrap();
      closeCropper();
      setName('');
    } catch (err) {
      closeCropper();
      if (isWrongSizeError(err)) {
        setError('The server rejected the image size. Cover images must be exactly 1920×640 — try cropping again.');
      } else if (isLimitReachedError(err)) {
        setError(apiMessage(err, `The library is full (${MAX_COVER_LIBRARY_IMAGES} images). Delete one to add another.`));
      } else {
        setError(apiMessage(err, 'Failed to upload the cover image.'));
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleRename(image: CoverLibraryImage) {
    const next = validCoverName(editName);
    if (!next) return;
    setError(null);
    try {
      await rename({ imageId: image.id, body: { name: next } }).unwrap();
      setEditingId(null);
    } catch (err) {
      setError(apiMessage(err, 'Failed to rename the cover image.'));
    }
  }

  async function handleDelete(image: CoverLibraryImage) {
    if (!window.confirm(DELETE_CONFIRM)) return;
    setError(null);
    try {
      await remove({ imageId: image.id }).unwrap();
    } catch (err) {
      setError(apiMessage(err, 'Failed to delete the cover image.'));
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-indigo-900">Cover images</h1>
        <p className="text-sm text-gray-500 mt-1">
          A library of ready-made cover images that restaurant admins can pick from. Images are cropped to 3:1 and saved at{' '}
          {COVER_IMAGE_RULE.outputWidth}×{COVER_IMAGE_RULE.outputHeight}.
        </p>
      </div>

      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Add an image</h2>
          <span className="text-sm text-gray-500" data-testid="library-count">
            {images.length} / {MAX_COVER_LIBRARY_IMAGES} images
          </span>
        </div>
        <WriteOnly>
          {full ? (
            <p className="text-sm text-amber-700" role="status">
              The library is full ({MAX_COVER_LIBRARY_IMAGES} images). Delete one to add another.
            </p>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="coverName" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Name
                </label>
                <input
                  id="coverName"
                  className={inputClass}
                  value={name}
                  maxLength={COVER_NAME_MAX_LENGTH}
                  disabled={busy}
                  placeholder="e.g. Sunset terrace"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <input
                ref={fileRef}
                type="file"
                accept={IMAGE_TYPES.join(',')}
                aria-label="Cover image file"
                data-testid="cover-file-input"
                className="hidden"
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <button type="button" className={btnClass} disabled={busy || !cleanName} onClick={() => fileRef.current?.click()}>
                <ImagePlus className="w-4 h-4" />
                Choose image…
              </button>
            </div>
          )}
          {!full && !cleanName && <p className="text-xs text-gray-400 mt-2">Enter a name first, then choose an image (at least {COVER_IMAGE_RULE.minWidth}×{COVER_IMAGE_RULE.minHeight} pixels).</p>}
        </WriteOnly>
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      {images.length === 0 ? (
        <div className="glass-card p-12 text-center text-sm text-gray-500">
          No cover images yet. Upload the first one above and restaurant admins will be able to pick it for their shop.
        </div>
      ) : (
        <WriteFieldset>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <li key={image.id} className="glass-card overflow-hidden">
                <img
                  src={image.cardImageUrl}
                  alt={image.name}
                  loading="lazy"
                  className="w-full aspect-[3/1] object-cover bg-gray-100"
                />
                <div className="p-3">
                  {editingId === image.id ? (
                    <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void handleRename(image);
                      }}
                    >
                      <input
                        className={inputClass}
                        aria-label="Image name"
                        value={editName}
                        maxLength={COVER_NAME_MAX_LENGTH}
                        disabled={busy}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                      <button type="submit" className={btnClass} disabled={busy || !validCoverName(editName)}>
                        Save
                      </button>
                      <button type="button" className="text-sm text-gray-500 px-2" onClick={() => setEditingId(null)} disabled={busy}>
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-gray-800">{image.name}</p>
                      <WriteOnly>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            type="button"
                            aria-label={`Rename ${image.name}`}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-white/60 disabled:opacity-40"
                            disabled={busy}
                            onClick={() => {
                              setEditingId(image.id);
                              setEditName(image.name);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${image.name}`}
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-40"
                            disabled={busy}
                            onClick={() => void handleDelete(image)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </WriteOnly>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </WriteFieldset>
      )}

      {picked && (
        <CoverCropDialog
          imageUrl={picked.url}
          image={picked.image}
          busy={busy}
          onConfirm={handleCropped}
          onCancel={closeCropper}
        />
      )}
    </div>
  );
}
