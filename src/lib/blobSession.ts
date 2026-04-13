/** Last uploaded music blob pathname — cleared after delete or replaced on new generation. */
export const SESSION_BLOB_PATHNAME_KEY = 'sonic_last_blob_pathname';

export function getStoredBlobPathname(): string | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }
  const value = sessionStorage.getItem(SESSION_BLOB_PATHNAME_KEY);
  return value?.trim() ? value.trim() : null;
}

export function setStoredBlobPathname(pathname: string): void {
  sessionStorage.setItem(SESSION_BLOB_PATHNAME_KEY, pathname);
}

export function clearStoredBlobPathname(): void {
  sessionStorage.removeItem(SESSION_BLOB_PATHNAME_KEY);
}

export async function deleteBlobOnServer(pathname: string): Promise<void> {
  const response = await fetch('/api/blob-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pathname }),
  });

  if (response.status === 204) {
    return;
  }

  const text = await response.text();
  let message = `Request failed with status ${response.status}`;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (typeof parsed === 'object' && parsed !== null && 'error' in parsed) {
      const err = (parsed as { error: unknown }).error;
      if (typeof err === 'string') {
        message = err;
      }
    }
  } catch {
    if (text.trim()) {
      message = text;
    }
  }
  throw new Error(message);
}

export function downloadedKeyForPathname(pathname: string): string {
  return `sonic_downloaded_${pathname}`;
}

export function markDownloadedInSession(pathname: string): void {
  if (!pathname) {
    return;
  }
  sessionStorage.setItem(downloadedKeyForPathname(pathname), '1');
}

export function hasMarkedDownloaded(pathname: string): boolean {
  if (!pathname) {
    return false;
  }
  return sessionStorage.getItem(downloadedKeyForPathname(pathname)) === '1';
}

export function clearDownloadedMark(pathname: string): void {
  if (!pathname) {
    return;
  }
  sessionStorage.removeItem(downloadedKeyForPathname(pathname));
}
