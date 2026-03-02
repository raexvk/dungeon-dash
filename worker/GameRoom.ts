// @ts-nocheck
import type {
  GameState,
  ClientMessage,
  ServerMessage,
  LobbyPlayer,
  PlayerClass,
  Player,
  BufferedInput,
} from '../app/game/types';
import { CLASS_STATS, PLAYER_COLORS } from '../app/game/types';
import { initializeGameFromConfig } from '../app/game/engine';
import { processMultiplayerTick } from '../app/game/engine';
import { buildScoreEntries, calculateHighlights } from '../app/game/scoring';
import { MP_LEVELS } from '../app/game/mp-levels';

interface PlayerConnection {
  id: number;
  ws: WebSocket;
}

export class GameRoom {
  private state: DurableObjectState;
  private players: Map<WebSocket, PlayerConnection> = new Map();
  private lobbyPlayers: LobbyPlayer[] = [];
  private gameState: GameState | null = null;
  private phase: 'lobby' | 'playing' | 'ended' = 'lobby';
  private roomCode: string = '';
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private hostWs: WebSocket | null = null;
  private currentLevel: number = 0;
  private startTime: number = 0;
  private hostDisconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/init') {
      this.roomCode = url.searchParams.get('code') || '';
      return new Response('OK');
    }

    if (url.pathname === '/ws') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.accept();
      this.handleNewConnection(server);
      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname === '/status') {
      return new Response(
        JSON.stringify({
          roomCode: this.roomCode,
          phase: this.phase,
          playerCount: this.lobbyPlayers.length,
        }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response('Not found', { status: 404 });
  }

  private handleNewConnection(ws: WebSocket): void {
    // Connection will be set up when they send 'join'
    ws.addEventListener('message', (event: MessageEvent) => {
      try {
        const msg: ClientMessage = JSON.parse(event.data as string);
        this.handleMessage(ws, msg);
      } catch {
        // ignore
      }
    });

    ws.addEventListener('close', () => {
      this.handleDisconnect(ws);
    });
  }

  private handleMessage(ws: WebSocket, msg: ClientMessage): void {
    switch (msg.type) {
      case 'join':
        this.handleJoin(ws, msg);
        break;
      case 'ready':
        this.handleReady(ws);
        break;
      case 'start':
        this.handleStart(ws);
        break;
      case 'input':
        this.handleInput(ws, msg);
        break;
      case 'reconnect':
        this.handleReconnect(ws, msg);
        break;
      case 'ping':
        ws.send(
          JSON.stringify({
            type: 'pong',
            t: msg.t,
            serverT: Date.now(),
          }),
        );
        break;
    }
  }

  private handleJoin(
    ws: WebSocket,
    msg: Extract<ClientMessage, { type: 'join' }>,
  ): void {
    if (this.phase !== 'lobby') {
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Game already in progress',
        }),
      );
      return;
    }

    const id = this.lobbyPlayers.length;
    const isHost = id === 0;
    const player: LobbyPlayer = {
      id,
      name: msg.name.slice(0, 8),
      classType: msg.classType,
      color: msg.color,
      ready: false,
      isHost,
    };
    this.lobbyPlayers.push(player);
    this.players.set(ws, { id, ws });
    if (isHost) this.hostWs = ws;

    this.broadcastLobby();
  }

  private handleReady(ws: WebSocket): void {
    const conn = this.players.get(ws);
    if (!conn) return;
    const player = this.lobbyPlayers.find((p) => p.id === conn.id);
    if (player) {
      player.ready = !player.ready;
      this.broadcastLobby();
    }
  }

  private handleStart(ws: WebSocket): void {
    if (ws !== this.hostWs) return;
    if (this.lobbyPlayers.length < 1) return;
    if (!this.lobbyPlayers.every((p) => p.ready || p.isHost)) return;

    this.startLevel(0);
  }

  private startLevel(level: number): void {
    this.currentLevel = level;
    this.phase = 'playing';

    const config = MP_LEVELS[level];
    const playerDefs = this.lobbyPlayers.map((p) => ({
      name: p.name,
      classType: p.classType,
      color: p.color,
    }));

    this.gameState = initializeGameFromConfig(config, level, playerDefs);
    this.startTime = Date.now();

    this.broadcast({
      type: 'gameStart',
      level,
      state: this.gameState,
    } as ServerMessage);

    // Start 30Hz tick loop
    this.tickInterval = setInterval(() => {
      if (!this.gameState) return;

      processMultiplayerTick(this.gameState);

      // Broadcast state at 10Hz (every 3rd tick)
      if (this.gameState.tick % 3 === 0) {
        this.broadcast({
          type: 'state',
          tick: this.gameState.tick,
          players: this.gameState.players,
          monsters: this.gameState.monsters,
          boss: this.gameState.boss,
          items: this.gameState.items,
          key: this.gameState.key,
          door: this.gameState.door,
          telegraphs: this.gameState.telegraphs,
          hazards: this.gameState.hazards,
          projectiles: this.gameState.projectiles,
          events: this.gameState.events.slice(-5),
        } as ServerMessage);
      }

      // Check for level summary
      if (this.gameState.phase === 'summary') {
        this.handleLevelSummary();
      }

      if (this.gameState.phase === 'gameOver') {
        this.handleGameOver();
      }
    }, 33);
  }

  private handleInput(
    ws: WebSocket,
    msg: Extract<ClientMessage, { type: 'input' }>,
  ): void {
    const conn = this.players.get(ws);
    if (!conn || !this.gameState) return;
    const player = this.gameState.players[conn.id];
    if (player) {
      player.inputBuffer.push({
        seq: msg.seq,
        action: msg.action,
        dir: msg.dir,
        ability: msg.ability,
      });
    }
  }

  private handleReconnect(
    ws: WebSocket,
    msg: Extract<ClientMessage, { type: 'reconnect' }>,
  ): void {
    if (!this.gameState) return;
    const player = this.gameState.players[msg.playerId];
    if (player) {
      player.connected = true;
      this.players.set(ws, { id: msg.playerId, ws });

      // If this is the host reconnecting, restore host status
      if (msg.playerId === 0) {
        this.hostWs = ws;
        if (this.hostDisconnectTimer) {
          clearTimeout(this.hostDisconnectTimer);
          this.hostDisconnectTimer = null;
        }
      }

      // Send current game state so the client can catch up
      ws.send(
        JSON.stringify({
          type: 'gameStart',
          level: this.currentLevel,
          state: this.gameState,
        }),
      );
    }
  }

  private handleDisconnect(ws: WebSocket): void {
    const conn = this.players.get(ws);
    if (!conn) return;

    if (this.phase === 'playing' && this.gameState) {
      const player = this.gameState.players[conn.id];
      if (player) {
        player.connected = false;
        if (player.hasKey) {
          player.hasKey = false;
          this.gameState.key.heldBy = -1;
          this.gameState.key.r = player.r;
          this.gameState.key.c = player.c;
          this.gameState.events.push({
            tick: this.gameState.tick,
            type: 'keyDrop',
            message: `${player.name} disconnected and dropped the key!`,
            playerId: player.id,
          });
        }
      }
    }

    if (ws === this.hostWs) {
      this.hostWs = null;
      // Give the host 5 seconds to reconnect (e.g., page navigation from lobby to game)
      this.hostDisconnectTimer = setTimeout(() => {
        // If host hasn't reconnected, end the game
        if (!this.hostWs) {
          this.broadcast({
            type: 'error',
            message: 'Host disconnected. Game over.',
          });
          this.endGame();
        }
      }, 5000);
    }

    this.players.delete(ws);
  }

  private handleLevelSummary(): void {
    if (!this.gameState) return;

    clearInterval(this.tickInterval!);
    this.tickInterval = null;

    const totalTime = Date.now() - this.startTime;
    const scores = buildScoreEntries(this.gameState, totalTime);
    const mvp = scores.reduce((a, b) =>
      a.totalScore > b.totalScore ? a : b,
    ).playerId;

    this.broadcast({
      type: 'levelSummary',
      level: this.currentLevel,
      scores,
      mvp,
    } as ServerMessage);

    // Advance to next level after 8 seconds
    setTimeout(() => {
      const nextLevel = this.currentLevel + 1;
      if (nextLevel < 5) {
        this.startLevel(nextLevel);
      } else {
        this.handleGameOver();
      }
    }, 8000);
  }

  private handleGameOver(): void {
    if (!this.gameState) return;

    const totalTime = Date.now() - this.startTime;
    const rankings = buildScoreEntries(this.gameState, totalTime);
    rankings.sort((a, b) => b.totalScore - a.totalScore);
    const highlights = calculateHighlights(rankings);

    this.broadcast({
      type: 'gameOver',
      rankings,
      highlights,
    } as ServerMessage);

    this.endGame();
  }

  private broadcast(msg: ServerMessage): void {
    const data = JSON.stringify(msg);
    for (const { ws } of this.players.values()) {
      try {
        ws.send(data);
      } catch {
        // disconnected
      }
    }
  }

  private broadcastLobby(): void {
    const hostId = this.lobbyPlayers.find((p) => p.isHost)?.id ?? 0;
    this.broadcast({
      type: 'lobby',
      roomCode: this.roomCode,
      players: this.lobbyPlayers,
      hostId,
    });
  }

  private endGame(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.phase = 'ended';
  }
}
