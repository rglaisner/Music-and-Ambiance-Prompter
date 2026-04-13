import type { VercelRequest, VercelResponse } from '@vercel/node';

export function parseJsonBody(req: VercelRequest): unknown {
  const raw = req.body;
  if (raw === undefined || raw === null) {
    return undefined;
  }
  if (typeof raw === 'string') {
    if (!raw.trim()) {
      return undefined;
    }
    return JSON.parse(raw) as unknown;
  }
  if (typeof raw === 'object') {
    return raw;
  }
  return undefined;
}

export function requireApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !key.trim()) {
    throw new Error('Server configuration error: GEMINI_API_KEY is not set.');
  }
  return key;
}

export function sendError(
  res: VercelResponse,
  status: number,
  message: string,
): void {
  res.status(status).json({ error: message });
}
