import { GoogleGenAI } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseJsonBody, requireApiKey, sendError } from './_lib/http';

interface AmbianceRequestBody {
  prompt?: unknown;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    sendError(res, 405, 'Method not allowed');
    return;
  }

  let body: AmbianceRequestBody;
  try {
    const parsed = parseJsonBody(req) as AmbianceRequestBody | undefined;
    body = parsed ?? {};
  } catch {
    sendError(res, 400, 'Invalid JSON body');
    return;
  }

  const musicDescription =
    typeof body.prompt === 'string' && body.prompt.trim()
      ? body.prompt.trim()
      : '';
  if (!musicDescription) {
    sendError(res, 400, 'Missing or empty "prompt"');
    return;
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

  const imagePrompt = `Create a high-quality, immersive, and WOW-inducing visual ambiance image for a music room that perfectly matches this music description: "${musicDescription}". The image should be abstract, atmospheric, and visually stunning, with vibrant colors and dynamic lighting that suggests movement and rhythm. No text in the image.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [{ text: imagePrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: '16:9',
          imageSize: '1K',
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        const imageDataUrl = `data:image/png;base64,${part.inlineData.data}`;
        res.status(200).json({ imageDataUrl });
        return;
      }
    }

    sendError(res, 502, 'No image data received from the model.');
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Ambiance generation failed';
    sendError(res, 502, message);
  }
}
