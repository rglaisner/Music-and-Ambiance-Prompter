import { del } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isValidMusicBlobPathname } from './lib/blobPaths.js';
import { parseJsonBody, sendError } from './lib/http.js';

interface DeleteBody {
  pathname?: unknown;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    sendError(res, 405, 'Method not allowed');
    return;
  }

  let body: DeleteBody;
  try {
    const parsed = parseJsonBody(req) as DeleteBody | undefined;
    body = parsed ?? {};
  } catch {
    sendError(res, 400, 'Invalid JSON body');
    return;
  }

  const pathname =
    typeof body.pathname === 'string' ? body.pathname.trim() : '';
  if (!pathname || !isValidMusicBlobPathname(pathname)) {
    sendError(res, 400, 'Invalid pathname');
    return;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    sendError(res, 503, 'Blob storage is not configured.');
    return;
  }

  try {
    await del(pathname);
    res.status(204).end();
  } catch (error: unknown) {
    console.error('[api/blob-delete]', error);
    const message =
      error instanceof Error ? error.message : 'Failed to delete blob';
    sendError(res, 502, message);
  }
}
