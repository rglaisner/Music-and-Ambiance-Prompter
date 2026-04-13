import { randomUUID } from 'node:crypto';
import { GoogleGenAI, Modality } from '@google/genai';
import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { evictOldestMusicBlobsIfNeeded } from './lib/blobFifo.js';
import { MUSIC_BLOB_PREFIX } from './lib/blobPaths.js';
import { parseJsonBody, requireApiKey, sendError } from './lib/http.js';

/** Long Lyria runs need a high limit; Hobby plan caps this (often 10s)—use Pro for full tracks. */
export const config = {
  maxDuration: 300,
};

const MUSIC_MODELS = ['lyria-3-clip-preview', 'lyria-3-pro-preview'] as const;
type MusicModel = (typeof MUSIC_MODELS)[number];

/** Inline JSON fallback (no BLOB_READ_WRITE_TOKEN): keep under Vercel response limits. */
const MAX_INLINE_AUDIO_BYTES = 4 * 1024 * 1024;

/** With Blob storage, cap decoded size before upload (abuse / memory). */
const MAX_BLOB_AUDIO_BYTES = 50 * 1024 * 1024;

const MULTIPART_PUT_THRESHOLD_BYTES = 4_500_000;

function isMusicModel(value: unknown): value is MusicModel {
  return typeof value === 'string' && MUSIC_MODELS.includes(value as MusicModel);
}

interface MusicRequestBody {
  prompt?: unknown;
  modelName?: unknown;
}

function hasBlobToken(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    sendError(res, 405, 'Method not allowed');
    return;
  }

  let body: MusicRequestBody;
  try {
    const parsed = parseJsonBody(req) as MusicRequestBody | undefined;
    body = parsed ?? {};
  } catch {
    sendError(res, 400, 'Invalid JSON body');
    return;
  }

  const prompt =
    typeof body.prompt === 'string' && body.prompt.trim() ? body.prompt.trim() : '';
  if (!prompt) {
    sendError(res, 400, 'Missing or empty "prompt"');
    return;
  }

  let modelName: MusicModel = 'lyria-3-pro-preview';
  if (body.modelName !== undefined && body.modelName !== null) {
    if (!isMusicModel(body.modelName)) {
      sendError(res, 400, 'Invalid modelName');
      return;
    }
    modelName = body.modelName;
  }

  let apiKey: string;
  try {
    apiKey = requireApiKey();
  } catch (configError) {
    const message =
      configError instanceof Error ? configError.message : 'Server misconfiguration';
    sendError(res, 500, message);
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContentStream({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
      },
    });

    let audioBase64 = '';
    let lyrics = '';
    let mimeType = 'audio/mpeg';

    for await (const chunk of response) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
        if (part.text && !lyrics) {
          lyrics = part.text;
        }
      }
    }

    if (!audioBase64) {
      sendError(res, 502, 'No audio data received from the model.');
      return;
    }

    const approxDecodedBytes = Math.floor((audioBase64.length * 3) / 4);

    if (hasBlobToken()) {
      if (approxDecodedBytes > MAX_BLOB_AUDIO_BYTES) {
        sendError(res, 413, 'Generated audio exceeds maximum allowed size.');
        return;
      }

      const buffer = Buffer.from(audioBase64, 'base64');
      const pathname = `${MUSIC_BLOB_PREFIX}${randomUUID()}.mp3`;

      const uploaded = await put(pathname, buffer, {
        access: 'public',
        contentType: mimeType,
        multipart: buffer.length >= MULTIPART_PUT_THRESHOLD_BYTES,
      });

      await evictOldestMusicBlobsIfNeeded();

      res.status(200).json({
        lyrics,
        mimeType,
        audioUrl: uploaded.url,
        blobPathname: uploaded.pathname,
        storage: 'blob' as const,
      });
      return;
    }

    if (approxDecodedBytes > MAX_INLINE_AUDIO_BYTES) {
      sendError(
        res,
        413,
        'Generated audio is too large for inline delivery. Set BLOB_READ_WRITE_TOKEN (Vercel Blob) for full-length tracks.',
      );
      return;
    }

    res.status(200).json({
      lyrics,
      mimeType,
      audioBase64,
      storage: 'inline' as const,
    });
  } catch (error: unknown) {
    console.error('[api/music]', error);
    const message =
      error instanceof Error ? error.message : 'Music generation failed';
    sendError(res, 502, message);
  }
}
