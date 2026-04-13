/** Prefix for all music uploads (FIFO eviction lists by this prefix). */
export const MUSIC_BLOB_PREFIX = 'music/';

/** Max objects under `music/` before oldest are deleted after each new upload. */
export const MAX_MUSIC_BLOBS = 5;

/**
 * Validates pathname for our UUID-based MP3 keys. Used by upload and delete routes.
 */
export function isValidMusicBlobPathname(pathname: string): boolean {
  return /^music\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.mp3$/i.test(
    pathname,
  );
}
