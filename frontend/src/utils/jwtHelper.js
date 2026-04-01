import { jwtDecode } from 'jwt-decode';

export function decodeToken(token) {
  if (!token) return null;

  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = decodeToken(token);

  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now();
}

export function getRole(token) {
  return decodeToken(token)?.role ?? null;
}
