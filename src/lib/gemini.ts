export type MusicModelName = 'lyria-3-clip-preview' | 'lyria-3-pro-preview';

export interface GenerateMusicResult {
  audioUrl: string;
  lyrics: string;
  /** Server-side pathname when using Vercel Blob; empty for inline base64 fallback. */
  blobPathname: string;
  /** Present when API used inline storage; otherwise fetch from `audioUrl` for download. */
  blob: Blob | null;
  storage: 'blob' | 'inline';
}

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
): Promise<GenerateMusicResult> {
  const response = await fetch('/api/music', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, modelName }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  interface MusicPayloadBlob {
    lyrics?: unknown;
    mimeType?: unknown;
    audioUrl?: unknown;
    blobPathname?: unknown;
    storage?: unknown;
    audioBase64?: unknown;
  }

  const payload = (await response.json()) as MusicPayloadBlob;
  const lyrics =
    typeof payload.lyrics === 'string' ? payload.lyrics : '';

  const audioUrlRemote =
    typeof payload.audioUrl === 'string' ? payload.audioUrl.trim() : '';
  const blobPathnameRemote =
    typeof payload.blobPathname === 'string' ? payload.blobPathname.trim() : '';

  if (audioUrlRemote && blobPathnameRemote) {
    return {
      audioUrl: audioUrlRemote,
      lyrics,
      blobPathname: blobPathnameRemote,
      blob: null,
      storage: 'blob',
    };
  }

  const audioBase64 =
    typeof payload.audioBase64 === 'string' ? payload.audioBase64 : '';
  if (!audioBase64) {
    throw new Error('No audio data received from the server.');
  }

  const mimeType =
    typeof payload.mimeType === 'string' && payload.mimeType
      ? payload.mimeType
      : 'audio/mpeg';

  const binary = atob(audioBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  const audioUrl = URL.createObjectURL(blob);

  return {
    audioUrl,
    lyrics,
    blobPathname: '',
    blob,
    storage: 'inline',
  };
}
