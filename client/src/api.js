const base = (
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : import.meta.env.VITE_API_URL
)?.replace(/\/$/, '');

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
    data = { message: text };
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