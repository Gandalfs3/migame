export class CharacterLoginModal {
  private overlay: HTMLElement;
  private onLoginCallback?: (name: string) => void;

  constructor(onLogin?: (name: string) => void) {
    this.onLoginCallback = onLogin;

    this.overlay = document.createElement('div');
    this.overlay.id = 'character-login-modal';
    this.overlay.style.position = 'fixed';
    this.overlay.style.top = '0';
    this.overlay.style.left = '0';
    this.overlay.style.width = '100vw';
    this.overlay.style.height = '100vh';
    this.overlay.style.background = 'radial-gradient(circle at center, rgba(15, 23, 42, 0.95), rgba(9, 13, 22, 0.98))';
    this.overlay.style.display = 'flex';
    this.overlay.style.alignItems = 'center';
    this.overlay.style.justifyContent = 'center';
    this.overlay.style.zIndex = '100';
    this.overlay.style.backdropFilter = 'blur(10px)';
    this.overlay.style.transition = 'opacity 0.3s ease';
    this.overlay.style.padding = '12px';
    this.overlay.style.overflowY = 'auto';

    const savedName = localStorage.getItem('migame_player_name') || '';

    this.render(savedName);
    document.body.appendChild(this.overlay);
  }

  private render(defaultName: string): void {
    this.overlay.innerHTML = `
      <div style="background: rgba(30, 41, 59, 0.95); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 16px; padding: 20px 24px; width: 95%; max-width: 420px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.7); text-align: center; color: #fff; box-sizing: border-box;">
        <h2 style="font-size: 22px; margin-bottom: 6px; font-weight: 800; letter-spacing: 0.5px; background: linear-gradient(135deg, #60a5fa, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">RPG Cooperativo Familiar</h2>
        <p style="font-size: 13px; color: #94a3b8; margin-bottom: 20px;">Tu progreso se guardará automáticamente en el servidor local.</p>

        <div style="text-align: left; margin-bottom: 24px;">
          <label style="display: block; font-size: 12px; font-weight: bold; color: #cbd5e1; margin-bottom: 8px;">¿Cómo te llamas en el juego?</label>
          <input id="login-char-name" type="text" maxlength="18" placeholder="Ej: Papá, Lucas, Mamá..." value="${defaultName}" style="width: 100%; padding: 12px 14px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; font-size: 16px; outline: none;" autofocus />
          <p style="font-size: 11px; color: #64748b; margin-top: 6px;">💡 Puedes cambiar de rol (Guerrero, Clérigo o Mago) en cualquier momento durante la partida.</p>
        </div>

        <button id="btn-enter-world" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #2563eb, #1d4ed8); border: none; border-radius: 10px; color: #fff; font-size: 16px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 14px rgba(37,99,235,0.4); transition: transform 0.1s;">
          ⚔️ ¡Entrar a Jugar!
        </button>
      </div>
    `;

    const enterBtn = this.overlay.querySelector('#btn-enter-world') as HTMLButtonElement;
    const nameInput = this.overlay.querySelector('#login-char-name') as HTMLInputElement;

    const submit = () => {
      let name = nameInput.value.trim();
      if (!name) name = 'Aventurero';

      localStorage.setItem('migame_player_name', name);
      this.close();
      this.onLoginCallback?.(name);
    };

    enterBtn.onclick = submit;
    nameInput.onkeydown = (e) => {
      if (e.key === 'Enter') submit();
    };
  }

  public close(): void {
    this.overlay.style.opacity = '0';
    setTimeout(() => {
      this.overlay.remove();
    }, 300);
  }
}
