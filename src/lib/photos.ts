import { supabase } from './supabase';

const MAX_FULL = 2048;
const MAX_THUMB = 400;
const QUALITY = 0.85;

export type UploadedPhoto = {
  fullPath: string;
  thumbPath: string;
};

/**
 * Resize + compress + upload one photo. Returns the storage paths.
 * Signed URLs are generated on read.
 */
export async function uploadPhoto(
  babyId: string,
  memoryId: string,
  file: File
): Promise<UploadedPhoto> {
  const img = await fileToImage(file);
  const full = await canvasBlob(img, MAX_FULL);
  const thumb = await canvasBlob(img, MAX_THUMB);
  const uuid = crypto.randomUUID();
  const fullPath = `${babyId}/${memoryId}/${uuid}_full.jpg`;
  const thumbPath = `${babyId}/${memoryId}/${uuid}_thumb.jpg`;

  const up1 = await supabase.storage.from('memories').upload(fullPath, full, {
    contentType: 'image/jpeg',
    cacheControl: '31536000',
    upsert: false,
  });
  if (up1.error) throw up1.error;

  const up2 = await supabase.storage.from('memories').upload(thumbPath, thumb, {
    contentType: 'image/jpeg',
    cacheControl: '31536000',
    upsert: false,
  });
  if (up2.error) throw up2.error;

  return { fullPath, thumbPath };
}

export async function signPaths(paths: string[], expiresSec = 3600): Promise<string[]> {
  if (paths.length === 0) return [];
  const { data, error } = await supabase.storage
    .from('memories')
    .createSignedUrls(paths, expiresSec);
  if (error) throw error;
  return (data ?? [])
    .map((d) => d.signedUrl)
    .filter((u): u is string => typeof u === 'string');
}

// ------------------------------------------------------------------

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image.'));
    };
    img.src = url;
  });
}

function canvasBlob(img: HTMLImageElement, maxDim: number): Promise<Blob> {
  const { width, height } = fit(img.width, img.height, maxDim);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable.');
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not compress image.'))),
      'image/jpeg',
      QUALITY
    );
  });
}

function fit(w: number, h: number, max: number): { width: number; height: number } {
  const longest = Math.max(w, h);
  if (longest <= max) return { width: w, height: h };
  const ratio = max / longest;
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}
