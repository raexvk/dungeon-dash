// @ts-nocheck
export { GameRoom } from './GameRoom';

interface Env {
  GAME_ROOM: DurableObjectNamespace;
  ASSETS: Fetcher;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API: Create room
    if (url.pathname === '/api/rooms/create' && request.method === 'POST') {
      const code = generateRoomCode();
      const id = env.GAME_ROOM.idFromName(code);
      const stub = env.GAME_ROOM.get(id);
      await stub.fetch(
        new Request(`https://internal/init?code=${code}`),
      );
      return new Response(JSON.stringify({ roomCode: code }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // API: Room status
    if (url.pathname.match(/^\/api\/rooms\/[A-Z0-9]{4}\/status$/)) {
      const code = url.pathname.split('/')[3];
      const id = env.GAME_ROOM.idFromName(code);
      const stub = env.GAME_ROOM.get(id);
      return stub.fetch(new Request('https://internal/status'));
    }

    // WebSocket: Connect to room
    if (url.pathname.match(/^\/api\/rooms\/[A-Z0-9]{4}\/ws$/)) {
      const code = url.pathname.split('/')[3];
      const id = env.GAME_ROOM.idFromName(code);
      const stub = env.GAME_ROOM.get(id);
      return stub.fetch(
        new Request('https://internal/ws', {
          headers: request.headers,
        }),
      );
    }

    // Serve static assets for everything else (SPA fallback handled by assets)
    return env.ASSETS.fetch(request);
  },
};
