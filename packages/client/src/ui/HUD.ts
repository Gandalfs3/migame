export class HUD {
  private statusDot: HTMLElement | null;
  private statusText: HTMLElement | null;
  private playerIdText: HTMLElement | null;
  private pingText: HTMLElement | null;
  private lanUrlSpan: HTMLElement | null;
  private btnCopy: HTMLElement | null;

  constructor() {
    this.statusDot = document.getElementById('status-dot');
    this.statusText = document.getElementById('status-text');
    this.playerIdText = document.getElementById('player-id-text');
    this.pingText = document.getElementById('ping-text');
    this.lanUrlSpan = document.getElementById('lan-url');
    this.btnCopy = document.getElementById('btn-copy');
  }

  public setConnected(connected: boolean): void {
    if (this.statusDot) {
      if (connected) {
        this.statusDot.classList.add('connected');
      } else {
        this.statusDot.classList.remove('connected');
      }
    }
    if (this.statusText) {
      this.statusText.textContent = connected ? 'Conectado al Servidor' : 'Desconectado';
    }
  }

  public setPlayerId(id: string): void {
    if (this.playerIdText) {
      this.playerIdText.textContent = `Tu ID: ${id}`;
    }
  }

  public updateStats(playerCount: number, pingMs: number): void {
    if (this.pingText) {
      this.pingText.textContent = `Jugadores en línea: ${playerCount} | Latencia: ${pingMs} ms`;
    }
  }

  public setLanUrl(hostIp: string, clientPort: number = 3000): void {
    const url = `http://${hostIp}:${clientPort}`;
    if (this.lanUrlSpan) {
      this.lanUrlSpan.textContent = url;
    }
    if (this.btnCopy) {
      this.btnCopy.onclick = () => {
        navigator.clipboard.writeText(url);
        if (this.btnCopy) {
          this.btnCopy.textContent = '¡Copiado!';
          setTimeout(() => {
            if (this.btnCopy) this.btnCopy.textContent = 'Copiar';
          }, 2000);
        }
      };
    }
  }
}
