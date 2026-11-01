import { PlayerClass } from '@migame/common';

export class CharacterLoginModal {
  private overlay: HTMLElement;
  private onLoginCallback?: (name: string, classType: PlayerClass) => void;
  private selectedClass: PlayerClass = 'WARRIOR';

  constructor(onLogin?: (name: string, classType: PlayerClass) => void) {
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

    const savedName = localStorage.getItem('migame_player_name') || '';
    const savedClass = (localStorage.getItem('migame_player_class') as PlayerClass) || 'WARRIOR';
    this.selectedClass = savedClass;

    this.render(savedName);
    document.body.appendChild(this.overlay);
  }

  private render(defaultName: string): void {
    this.overlay.innerHTML = `
      <div style="background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 16px; padding: 28px 32px; width: 90%; max-width: 420px; box-shadow: 0 20px 40px rgba(0,0,0,0.7); text-align: center; color: #fff;">
        <h2 style="font-size: 22px; margin-bottom: 6px; font-weight: 800; letter-spacing: 0.5px; background: linear-gradient(135deg, #60a5fa, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">RPG Cooperativo WLAN</h2>
        <p style="font-size: 13px; color: #94a3b8; margin-bottom: 20px;">Tu progreso se guardará automáticamente en el servidor familiar.</p>

        <div style="text-align: left; margin-bottom: 16px;">
          <label style="display: block; font-size: 12px; font-weight: bold; color: #cbd5e1; margin-bottom: 6px;">Nombre de tu Personaje:</label>
          <input id="login-char-name" type="text" maxlength="18" placeholder="Ej: Papá, Lucas, MagoX..." value="${defaultName}" style="width: 100%; padding: 10px 14px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; font-size: 15px; outline: none;" />
        </div>

        <div style="text-align: left; margin-bottom: 24px;">
          <label style="display: block; font-size: 12px; font-weight: bold; color: #cbd5e1; margin-bottom: 8px;">Elige tu Rol / Clase:</label>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
            <button class="modal-class-btn" data-class="WARRIOR" style="padding: 10px 6px; background: ${this.selectedClass === 'WARRIOR' ? '#2563eb' : 'rgba(15,23,42,0.8)'}; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 12px; font-weight: bold; cursor: pointer;">
              🛡️ Guerrero<br><span style="font-size: 10px; font-weight: normal; color: #93c5fd;">Tanque</span>
            </button>
            <button class="modal-class-btn" data-class="CLERIC" style="padding: 10px 6px; background: ${this.selectedClass === 'CLERIC' ? '#2563eb' : 'rgba(15,23,42,0.8)'}; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 12px; font-weight: bold; cursor: pointer;">
              💚 Clérigo<br><span style="font-size: 10px; font-weight: normal; color: #86efac;">Healer</span>
            </button>
            <button class="modal-class-btn" data-class="MAGE" style="padding: 10px 6px; background: ${this.selectedClass === 'MAGE' ? '#2563eb' : 'rgba(15,23,42,0.8)'}; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 12px; font-weight: bold; cursor: pointer;">
              🔥 Mago<br><span style="font-size: 10px; font-weight: normal; color: #fca5a5;">DPS</span>
            </button>
          </div>
        </div>

        <button id="btn-enter-world" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #2563eb, #1d4ed8); border: none; border-radius: 10px; color: #fff; font-size: 16px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 14px rgba(37,99,235,0.4); transition: transform 0.1s;">
          ⚔️ ¡Entrar a la Aventura!
        </button>
      </div>
    `;

    // Configurar botones de clase
    const classBtns = this.overlay.querySelectorAll('.modal-class-btn') as NodeListOf<HTMLButtonElement>;
    classBtns.forEach(btn => {
      btn.onclick = () => {
        this.selectedClass = btn.dataset.class as PlayerClass;
        classBtns.forEach(b => b.style.background = 'rgba(15,23,42,0.8)');
        btn.style.background = '#2563eb';
      };
    });

    const enterBtn = this.overlay.querySelector('#btn-enter-world') as HTMLButtonElement;
    const nameInput = this.overlay.querySelector('#login-char-name') as HTMLInputElement;

    const submit = () => {
      let name = nameInput.value.trim();
      if (!name) name = 'Aventurero';

      localStorage.setItem('migame_player_name', name);
      localStorage.setItem('migame_player_class', this.selectedClass);

      this.close();
      this.onLoginCallback?.(name, this.selectedClass);
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
