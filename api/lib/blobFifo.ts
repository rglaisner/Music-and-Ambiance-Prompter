import { del, list } from '@vercel/blob';
import { MAX_MUSIC_BLOBS, MUSIC_BLOB_PREFIX } from './blobPaths.js';

/**
 * After a new blob is stored, delete oldest `music/*` objects until at most
 * {@link MAX_MUSIC_BLOBS} remain.
 */
export async function evictOldestMusicBlobsIfNeeded(): Promise<void> {
  let page = await list({
    prefix: MUSIC_BLOB_PREFIX,
    limit: 1000,
  });
  const all = [...page.blobs];

  while (page.hasMore && page.cursor) {
    page = await list({
      prefix: MUSIC_BLOB_PREFIX,
      limit: 1000,
      cursor: page.cursor,
    });
    all.push(...page.blobs);
  }

  if (all.length <= MAX_MUSIC_BLOBS) {
    return;
  }

  all.sort((a, b) => a.uploadedAt.getTime() - b.uploadedAt.getTime());
  const excess = all.length - MAX_MUSIC_BLOBS;
  const toDelete = all.slice(0, excess);

  for (const item of toDelete) {
    try {
      await del(item.url);
    } catch (error: unknown) {
      console.error('[blobFifo] failed to delete', item.pathname, error);
    }
  }
}
