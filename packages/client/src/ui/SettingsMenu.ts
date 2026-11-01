export interface UXSettings {
  showControlsGuide: boolean;
  showLanBanner: boolean;
  showNetworkStats: boolean;
  showRangeIndicator: boolean;
  showTouchControls: boolean;
  showFloatingCombatText: boolean;
}

const STORAGE_KEY = 'migame_ux_settings';

export const DEFAULT_SETTINGS: UXSettings = {
  showControlsGuide: false, // Ocultar por defecto para tener UX limpia
  showLanBanner: true,
  showNetworkStats: false, // Minimalista por defecto
  showRangeIndicator: true,
  showTouchControls: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  showFloatingCombatText: true
};

export class SettingsMenu {
  public settings: UXSettings;
  private modalEl: HTMLElement;
  private gearBtn: HTMLElement;
  private onSettingsChanged?: (settings: UXSettings) => void;

  constructor(onChange?: (settings: UXSettings) => void) {
    this.onSettingsChanged = onChange;
    this.settings = this.loadSettings();

    this.gearBtn = this.createGearButton();
    this.modalEl = this.createModal();

    document.body.appendChild(this.gearBtn);
    document.body.appendChild(this.modalEl);

    this.applySettingsToDOM();
  }

  private loadSettings(): UXSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      // Ignorar error de parsing
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    this.applySettingsToDOM();
    this.onSettingsChanged?.(this.settings);
  }

  private createGearButton(): HTMLElement {
    const btn = document.createElement('button');
    btn.id = 'btn-settings-gear';
    btn.innerHTML = '⚙️';
    btn.title = 'Ajustes de Interfaz (UX)';
    btn.style.position = 'absolute';
    btn.style.top = '16px';
    btn.style.right = '16px';
    btn.style.width = '42px';
    btn.style.height = '42px';
    btn.style.background = 'rgba(15, 23, 42, 0.85)';
    btn.style.backdropFilter = 'blur(8px)';
    btn.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    btn.style.borderRadius = '12px';
    btn.style.color = '#fff';
    btn.style.fontSize = '20px';
    btn.style.cursor = 'pointer';
    btn.style.zIndex = '30';
    btn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
    btn.style.transition = 'transform 0.15s, background 0.2s';

    btn.onmouseover = () => btn.style.transform = 'rotate(30deg) scale(1.05)';
    btn.onmouseout = () => btn.style.transform = 'rotate(0deg) scale(1)';
    btn.onclick = () => this.toggleModal();

    return btn;
  }

  private createModal(): HTMLElement {
    const el = document.createElement('div');
    el.id = 'settings-modal-overlay';
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '0';
    el.style.width = '100vw';
    el.style.height = '100vh';
    el.style.background = 'rgba(0, 0, 0, 0.65)';
    el.style.backdropFilter = 'blur(6px)';
    el.style.display = 'none';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.zIndex = '150';

    el.onclick = (e) => {
      if (e.target === el) this.toggleModal(false);
    };

    el.innerHTML = `
      <div style="background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 16px; padding: 24px; width: 90%; max-width: 440px; box-shadow: 0 20px 40px rgba(0,0,0,0.8); color: #fff;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;">
          <h3 style="margin: 0; font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
            ⚙️ Personalizar Interfaz (UX)
          </h3>
          <button id="btn-close-settings" style="background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer;">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px; font-size: 14px;">
          <!-- Guía de Controles WASD -->
          <label style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
            <div>
              <div style="font-weight: 600;">🎮 Guía de Controles (WASD)</div>
              <div style="font-size: 11px; color: #94a3b8;">Muestra las teclas de movimiento en pantalla</div>
            </div>
            <input type="checkbox" id="toggle-controls-guide" ${this.settings.showControlsGuide ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
          </label>

          <!-- Banner Wi-Fi / IP -->
          <label style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
            <div>
              <div style="font-weight: 600;">🌐 Banner de Conexión Wi-Fi</div>
              <div style="font-size: 11px; color: #94a3b8;">Muestra la IP y botón de enlace para la familia</div>
            </div>
            <input type="checkbox" id="toggle-lan-banner" ${this.settings.showLanBanner ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
          </label>

          <!-- Detalles de Ping y Conexión -->
          <label style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
            <div>
              <div style="font-weight: 600;">📊 Latencia y Estadísticas de Red</div>
              <div style="font-size: 11px; color: #94a3b8;">Muestra ms de ping y estado del servidor</div>
            </div>
            <input type="checkbox" id="toggle-network-stats" ${this.settings.showNetworkStats ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
          </label>

          <!-- Círculo de Rango de Alcance -->
          <label style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
            <div>
              <div style="font-weight: 600;">⭕ Círculo de Alcance en el Suelo</div>
              <div style="font-size: 11px; color: #94a3b8;">Área gris que marca hasta dónde llegan tus ataques</div>
            </div>
            <input type="checkbox" id="toggle-range-circle" ${this.settings.showRangeIndicator ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
          </label>

          <!-- Cruceta Táctil -->
          <label style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
            <div>
              <div style="font-weight: 600;">📱 Cruceta Táctil en Pantalla</div>
              <div style="font-size: 11px; color: #94a3b8;">D-Pad virtual para jugar desde tablets o móviles</div>
            </div>
            <input type="checkbox" id="toggle-touch-controls" ${this.settings.showTouchControls ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
          </label>

          <!-- Números de Daño Flotantes -->
          <label style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
            <div>
              <div style="font-weight: 600;">💬 Números Flotantes de Combate</div>
              <div style="font-size: 11px; color: #94a3b8;">Muestra el daño y curación en números 3D</div>
            </div>
            <input type="checkbox" id="toggle-combat-numbers" ${this.settings.showFloatingCombatText ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
          </label>
        </div>

        <button id="btn-save-settings" style="margin-top: 20px; width: 100%; padding: 10px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
          Listo y Guardar Preferencias
        </button>
      </div>
    `;

    this.bindEvents(el);
    return el;
  }

  private bindEvents(modal: HTMLElement): void {
    const closeBtn = modal.querySelector('#btn-close-settings') as HTMLButtonElement;
    const saveBtn = modal.querySelector('#btn-save-settings') as HTMLButtonElement;

    closeBtn.onclick = () => this.toggleModal(false);
    saveBtn.onclick = () => this.toggleModal(false);

    const checkControls = modal.querySelector('#toggle-controls-guide') as HTMLInputElement;
    const checkLan = modal.querySelector('#toggle-lan-banner') as HTMLInputElement;
    const checkStats = modal.querySelector('#toggle-network-stats') as HTMLInputElement;
    const checkRange = modal.querySelector('#toggle-range-circle') as HTMLInputElement;
    const checkTouch = modal.querySelector('#toggle-touch-controls') as HTMLInputElement;
    const checkCombat = modal.querySelector('#toggle-combat-numbers') as HTMLInputElement;

    const onToggle = () => {
      this.settings.showControlsGuide = checkControls.checked;
      this.settings.showLanBanner = checkLan.checked;
      this.settings.showNetworkStats = checkStats.checked;
      this.settings.showRangeIndicator = checkRange.checked;
      this.settings.showTouchControls = checkTouch.checked;
      this.settings.showFloatingCombatText = checkCombat.checked;
      this.saveSettings();
    };

    checkControls.onchange = onToggle;
    checkLan.onchange = onToggle;
    checkStats.onchange = onToggle;
    checkRange.onchange = onToggle;
    checkTouch.onchange = onToggle;
    checkCombat.onchange = onToggle;
  }

  public toggleModal(show?: boolean): void {
    const isVisible = this.modalEl.style.display === 'flex';
    const next = typeof show === 'boolean' ? show : !isVisible;
    this.modalEl.style.display = next ? 'flex' : 'none';
  }

  public applySettingsToDOM(): void {
    // 1. Guía de controles
    const controlsPanel = document.getElementById('controls-panel');
    if (controlsPanel) {
      controlsPanel.style.display = this.settings.showControlsGuide ? 'flex' : 'none';
    }

    // 2. Banner Wi-Fi
    const lanBanner = document.getElementById('lan-banner');
    if (lanBanner) {
      lanBanner.style.display = this.settings.showLanBanner ? 'flex' : 'none';
    }

    // 3. Tarjeta de estadísticas de red
    const badgeCard = document.getElementById('badge-card-container');
    if (badgeCard) {
      badgeCard.style.display = this.settings.showNetworkStats ? 'block' : 'none';
    }

    // 4. Cruceta táctil
    const dpad = document.getElementById('mobile-dpad');
    if (dpad) {
      dpad.style.display = this.settings.showTouchControls ? 'grid' : 'none';
    }
  }
}
