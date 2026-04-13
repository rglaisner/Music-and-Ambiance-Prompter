export type MusicModelName = 'lyria-3-clip-preview' | 'lyria-3-pro-preview';

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const text = await response.text();
    if (!text.trim()) {
      return response.statusText || `Request failed with status ${response.status}`;
    }
    try {
      const parsed = JSON.parse(text) as unknown;
      if (typeof parsed === 'object' && parsed !== null && 'error' in parsed) {
        const err = (parsed as { error: unknown }).error;
        if (typeof err === 'string') {
          return err;
        }
      }
    } catch {
      return text;
    }
    return text;
  } catch {
    return response.statusText || `Request failed with status ${response.status}`;
  }
}

export async function generateMusic(
  prompt: string,
  modelName: MusicModelName = 'lyria-3-pro-preview',
) {
  const response = await fetch('/api/music', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, modelName }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  interface MusicPayload {
    lyrics?: unknown;
    mimeType?: unknown;
    audioBase64?: unknown;
  }

  const payload = (await response.json()) as MusicPayload;
  const audioBase64 =
    typeof payload.audioBase64 === 'string' ? payload.audioBase64 : '';
  if (!audioBase64) {
    throw new Error('No audio data received from the server.');
  }

  const mimeType =
    typeof payload.mimeType === 'string' && payload.mimeType
      ? payload.mimeType
      : 'audio/wav';
  const lyrics =
    typeof payload.lyrics === 'string' ? payload.lyrics : '';

  const binary = atob(audioBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  const audioUrl = URL.createObjectURL(blob);

  return { audioUrl, lyrics, blob };
}
