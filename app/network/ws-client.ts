import type { ClientMessage, ServerMessage } from '~/game/types';

export class WSClient {
  private ws: WebSocket | null = null;
  private onMessage: (msg: ServerMessage) => void;
  private onConnect?: () => void;
  private onDisconnect?: () => void;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private url: string;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    url: string,
    onMessage: (msg: ServerMessage) => void,
    onConnect?: () => void,
    onDisconnect?: () => void,
  ) {
    this.url = url;
    this.onMessage = onMessage;
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
  }

  connect(): void {
    if (this.ws) return;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.onConnect?.();
      // Start ping interval
      this.pingInterval = setInterval(() => {
        this.send({ type: 'ping', t: Date.now() });
      }, 5000);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);
        this.onMessage(msg);
      } catch {
        // ignore parse errors
      }
    };

    this.ws.onclose = () => {
      this.cleanup();
      this.onDisconnect?.();
    };

    this.ws.onerror = () => {
      this.cleanup();
    };
  }

  send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.cleanup();
    this.ws?.close();
    this.ws = null;
  }

  private cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
