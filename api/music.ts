import { GoogleGenAI, Modality } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseJsonBody, requireApiKey, sendError } from './lib/http.js';

/** Long Lyria runs need a high limit; Hobby plan caps this (often 10s)—use Pro for full tracks. */
export const config = {
  maxDuration: 300,
};

const MUSIC_MODELS = ['lyria-3-clip-preview', 'lyria-3-pro-preview'] as const;
type MusicModel = (typeof MUSIC_MODELS)[number];

/** Vercel serverless JSON responses are limited (~4.5 MB); base64 inflates size. */
const MAX_AUDIO_RESPONSE_BYTES = 4 * 1024 * 1024;

function isMusicModel(value: unknown): value is MusicModel {
  return typeof value === 'string' && MUSIC_MODELS.includes(value as MusicModel);
}

interface MusicRequestBody {
  prompt?: unknown;
  modelName?: unknown;
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
    if (approxDecodedBytes > MAX_AUDIO_RESPONSE_BYTES) {
      sendError(
        res,
        413,
        'Generated audio is too large for a single response on this host. Try Lyria clip preview, a shorter prompt, or a deployment with larger payloads / object storage.',
      );
      return;
    }

    res.status(200).json({ lyrics, mimeType, audioBase64 });
  } catch (error: unknown) {
    console.error('[api/music]', error);
    const message =
      error instanceof Error ? error.message : 'Music generation failed';
    sendError(res, 502, message);
  }
}
