export interface SessionData {
  playerId: number;
  roomCode: string;
  playerName: string;
  classType: string;
}

const COOKIE_PREFIX = 'dungeon_session_';
const MAX_AGE = 86400; // 24 hours

export function getSessionCookie(roomCode: string): SessionData | null {
  if (typeof document === 'undefined') return null;
  const name = `${COOKIE_PREFIX}${roomCode}=`;
  const cookies = document.cookie.split('; ');
  for (const c of cookies) {
    if (c.startsWith(name)) {
      try {
        return JSON.parse(decodeURIComponent(c.slice(name.length)));
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function setSessionCookie(roomCode: string, data: SessionData): void {
  if (typeof document === 'undefined') return;
  const value = encodeURIComponent(JSON.stringify(data));
  document.cookie = `${COOKIE_PREFIX}${roomCode}=${value}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
}

export function clearSessionCookie(roomCode: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_PREFIX}${roomCode}=; path=/; max-age=0; SameSite=Lax`;
}

export function clearAllSessionCookies(): void {
  if (typeof document === 'undefined') return;
  for (const c of document.cookie.split('; ')) {
    const eqIdx = c.indexOf('=');
    const cookieName = eqIdx > -1 ? c.slice(0, eqIdx) : c;
    if (cookieName.startsWith(COOKIE_PREFIX)) {
      document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax`;
    }
  }
}
