export function resolveAvatarUrl(avatar, updatedAt, fallbackName = 'User') {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=0a5c86&color=fff`;
  const base = avatar || fallback;

  if (!avatar) {
    return base;
  }

  const apiOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');
  const normalized = base.replace(/^http:\/\/localhost(?!:\d)/, apiOrigin).replace(/^\/storage\//, `${apiOrigin}/storage/`);
  const hasQuery = normalized.includes('?');
  const version = updatedAt ? `v=${encodeURIComponent(updatedAt)}` : `v=${Date.now()}`;
  return `${normalized}${hasQuery ? '&' : '?'}${version}`;
}
