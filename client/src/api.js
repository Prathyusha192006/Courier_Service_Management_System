const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, options);
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try { const data = await res.json(); if (data?.message) message = data.message; } catch {}
    throw new Error(message);
  }
  return res.json();
}

export { API_URL };
