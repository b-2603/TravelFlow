export function resolveAvatarUrl(avatar, updatedAt, fallbackName = 'User') {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=0a5c86&color=fff`;
  const base = avatar || fallback;

  if (!avatar) {
    return base;
  }

  const hasQuery = base.includes('?');
  const version = updatedAt ? `v=${encodeURIComponent(updatedAt)}` : `v=${Date.now()}`;
  return `${base}${hasQuery ? '&' : '?'}${version}`;
}
