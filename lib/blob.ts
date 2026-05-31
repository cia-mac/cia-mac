import { put } from '@vercel/blob';

/**
 * Uploads a food photo to Vercel Blob and returns its public URL.
 * Returns null if no file was provided or Blob isn't configured.
 */
export async function uploadImage(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // Blob not configured — skip rather than crash the whole post.
    return null;
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const blob = await put(`drops/${Date.now()}-${safeName}`, file, {
    access: 'public',
    addRandomSuffix: true,
  });
  return blob.url;
}
