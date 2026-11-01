import {
  MessageType,
  NetworkMessage,
  WelcomeMessage,
  WorldStateMessage,
  InputState,
  InputMessage,
  PingMessage,
  DEFAULT_SERVER_PORT
} from '@migame/common';

export class NetworkClient {
  private socket: WebSocket | null = null;
  private pingInterval: number | null = null;
  public lastPing: number = 0;
  public localPlayerId: string | null = null;

  public onWelcome?: (msg: WelcomeMessage) => void;
  public onWorldState?: (msg: WorldStateMessage) => void;
  public onConnectionChange?: (connected: boolean) => void;

  constructor() {
    this.connect();
  }

  private getSocketUrl(): string {
    const envUrl = (import.meta as any).env?.VITE_SERVER_URL;
    if (envUrl) return envUrl;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    return `${protocol}//${host}:${DEFAULT_SERVER_PORT}`;
  }

  public connect(): void {
    const url = this.getSocketUrl();
    console.log(`[NetworkClient] Conectando a ${url}...`);

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('[NetworkClient] Conexión establecida.');
      this.onConnectionChange?.(true);
      this.startPingLoop();
    };

    this.socket.onclose = () => {
      console.log('[NetworkClient] Conexión cerrada.');
      this.onConnectionChange?.(false);
      this.stopPingLoop();
      // Reintento automático de conexión
      setTimeout(() => this.connect(), 2000);
    };

    this.socket.onerror = (err) => {
      console.error('[NetworkClient Error]', err);
    };

    this.socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as NetworkMessage;
        this.handleMessage(msg);
      } catch (e) {
        console.error('[NetworkClient] Error procesando mensaje:', e);
      }
    };
  }

  private handleMessage(msg: NetworkMessage): void {
    if (msg.type === MessageType.WELCOME) {
      this.localPlayerId = msg.playerId;
      this.onWelcome?.(msg);
    } else if (msg.type === MessageType.WORLD_STATE) {
      this.onWorldState?.(msg);
    } else if (msg.type === MessageType.PONG) {
      this.lastPing = Math.round(performance.now() - msg.clientTime);
    }
  }

  public sendInput(state: InputState): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const msg: InputMessage = {
        type: MessageType.INPUT,
        ...state
      };
      this.socket.send(JSON.stringify(msg));
    }
  }

  private startPingLoop(): void {
    this.stopPingLoop();
    this.pingInterval = window.setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        const ping: PingMessage = {
          type: MessageType.PING,
          clientTime: performance.now()
        };
        this.socket.send(JSON.stringify(ping));
      }
    }, 2000);
  }

  private stopPingLoop(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}
