const API_BASE = import.meta.env.VITE_API_URL

export function resolveMediaUrl(url) {
  if (!url) return '';
  try {
    return new URL(url, API_BASE).href;
  } catch {
    return url;
  }
}

// هدر احراز هویت و مدیریت خطا برای همهٔ درخواست‌های JSON مشترک است.
async function requestJson(path, options, connectionMessage, fallbackMessage) {
  const token = localStorage.getItem('motrly_token');
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(connectionMessage);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || fallbackMessage);
  return body;
}

export const apiRequest = (path, options = {}) =>
  requestJson(
    path,
    options,
    'Cannot reach Motrly API. Start the Express server and check DATABASE_URL in .env.',
    'Something went wrong. Please try again.',
  );

  // Change to JSON
export async function uploadFiles(path, files) {
  const encodedImages = await Promise.all(
    files.map(async (file) => {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = '';
      const chunkSize = 0x8000;
      for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
      }
      return { name: file.name, mimeType: file.type, data: btoa(binary) };
    }),
  );
  const body = path.endsWith('/avatar') ? { image: encodedImages[0] } : { images: encodedImages };
  return requestJson(
    path,
    { method: 'POST', body: JSON.stringify(body) },
    'Cannot upload to Motrly API. Start the Express server and check your connection.',
    'Image upload failed.',
  );
}
