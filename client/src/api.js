function normalizeBaseUrl(value) {
  return String(value || '')
    .trim()
    .replace(/\/$/, '')
    .replace(/\/api$/i, '');
}

const envBase = normalizeBaseUrl(import.meta.env.VITE_API_URL);
const isLocalDev =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);
const base = isLocalDev ? '' : envBase;

function normalizeErrorMessage(text, res) {
  if (!text) return res.statusText;

  const preMatch = text.match(/<pre>(.*?)<\/pre>/is);
  if (preMatch?.[1]) {
    return preMatch[1].trim();
  }

  if (/<(?:!DOCTYPE|html|body|head)\b/i.test(text)) {
    return `API trả về HTML thay vì JSON (${res.status})`;
  }

  return text;
}

export function assetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${base}${path}`;
}

async function request(path, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: normalizeErrorMessage(text, res) };
  }

  if (!res.ok) {
    const err = new Error(data?.message || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) =>
    request(p, { method: 'POST', body: JSON.stringify(body) }),
  patch: (p, body) =>
    request(p, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (p) => request(p, { method: 'DELETE' }),
  upload: (p, formData) =>
    request(p, { method: 'POST', body: formData }),
};

export default api;
