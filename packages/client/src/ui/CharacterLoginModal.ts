import { PlayerClass, CLASS_STATS, DEFAULT_SERVER_PORT, ZONE_THEMES } from '@migame/common';

export interface SavedPlayerProfile {
  name: string;
  class_type: PlayerClass;
  level: number;
  experience: number;
  health: number;
  max_health: number;
  gold: number;
  current_zone?: string;
  created_at?: string;
  updated_at?: string;
}

export class CharacterLoginModal {
  private overlay: HTMLElement;
  private onLoginCallback?: (name: string, classType: PlayerClass) => void;
  private profiles: SavedPlayerProfile[] = [];
  private isLoading: boolean = true;
  private viewMode: 'list' | 'create' = 'list';
  private selectedClass: PlayerClass = 'WARRIOR';
  private deletingProfileName: string | null = null;

  constructor(onLogin?: (name: string, classType: PlayerClass) => void) {
    this.onLoginCallback = onLogin;

    this.overlay = document.createElement('div');
    this.overlay.id = 'character-login-modal';
    this.overlay.style.position = 'fixed';
    this.overlay.style.top = '0';
    this.overlay.style.left = '0';
    this.overlay.style.width = '100vw';
    this.overlay.style.height = '100vh';
    this.overlay.style.background = 'radial-gradient(circle at center, rgba(15, 23, 42, 0.96), rgba(9, 13, 22, 0.98))';
    this.overlay.style.display = 'flex';
    this.overlay.style.alignItems = 'center';
    this.overlay.style.justifyContent = 'center';
    this.overlay.style.zIndex = '120';
    this.overlay.style.backdropFilter = 'blur(12px)';
    this.overlay.style.transition = 'opacity 0.25s ease';
    this.overlay.style.padding = '12px';
    this.overlay.style.overflowY = 'auto';
    this.overlay.style.boxSizing = 'border-box';

    document.body.appendChild(this.overlay);

    this.render();
    this.fetchProfiles();
  }

  private getApiBaseUrl(): string {
    const host = window.location.hostname || 'localhost';
    return `${window.location.protocol}//${host}:${DEFAULT_SERVER_PORT}`;
  }

  public async fetchProfiles(): Promise<void> {
    this.isLoading = true;
    this.render();

    try {
      const res = await fetch(`${this.getApiBaseUrl()}/api/profiles`);
      if (res.ok) {
        const data = await res.json();
        this.profiles = Array.isArray(data.profiles) ? data.profiles : [];
        // Si no hay perfiles, cambiar directamente a la vista de creación
        if (this.profiles.length === 0) {
          this.viewMode = 'create';
        } else {
          this.viewMode = 'list';
        }
      } else {
        this.profiles = [];
        this.viewMode = 'create';
      }
    } catch (err) {
      console.warn('[CharacterLoginModal] No se pudieron cargar perfiles vía REST:', err);
      // Fallback si no hay conexión REST aún
      const localName = localStorage.getItem('migame_player_name');
      if (localName) {
        this.profiles = [{
          name: localName,
          class_type: 'WARRIOR',
          level: 1,
          experience: 0,
          health: 180,
          max_health: 180,
          gold: 10,
          current_zone: 'zone_forest'
        }];
        this.viewMode = 'list';
      } else {
        this.viewMode = 'create';
      }
    } finally {
      this.isLoading = false;
      this.render();
    }
  }

  private async deleteProfile(name: string): Promise<void> {
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/api/profiles/${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        this.profiles = this.profiles.filter(p => p.name !== name);
        if (localStorage.getItem('migame_player_name') === name) {
          localStorage.removeItem('migame_player_name');
        }
        if (this.profiles.length === 0) {
          this.viewMode = 'create';
        }
      }
    } catch (err) {
      console.error('[CharacterLoginModal] Error borrando perfil:', err);
    } finally {
      this.deletingProfileName = null;
      this.render();
    }
  }

  private getClassDetails(type: PlayerClass): { label: string; icon: string; color: string; desc: string } {
    switch (type) {
      case 'WARRIOR':
        return {
          label: 'Guerrero',
          icon: '🛡️',
          color: '#3b82f6',
          desc: 'Tanque pesado con armadura reforzada y gran supervivencia.'
        };
      case 'CLERIC':
        return {
          label: 'Clérigo',
          icon: '💚',
          color: '#10b981',
          desc: 'Sanador sagrado, protector de aliados con curaciones divinas.'
        };
      case 'MAGE':
        return {
          label: 'Mago',
          icon: '🔥',
          color: '#8b5cf6',
          desc: 'DPS elemental a distancia con daño devastador de fuego y escarcha.'
        };
    }
  }

  private getZoneName(zoneId?: string): string {
    if (!zoneId) return 'Bosque de los Goblins';
    const theme = ZONE_THEMES[zoneId];
    return theme ? theme.name : 'Zona Desconocida';
  }

  public open(): void {
    this.overlay.style.display = 'flex';
    this.overlay.style.opacity = '1';
    this.fetchProfiles();
  }

  public close(): void {
    this.overlay.style.opacity = '0';
    setTimeout(() => {
      this.overlay.style.display = 'none';
    }, 250);
  }

  private render(): void {
    if (this.isLoading) {
      this.overlay.innerHTML = `
        <div style="background: rgba(30, 41, 59, 0.96); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 16px; padding: 30px; width: 95%; max-width: 440px; text-align: center; color: #fff; box-shadow: 0 25px 50px rgba(0,0,0,0.85);">
          <div style="font-size: 38px; margin-bottom: 12px; animation: spin 1s linear infinite;">⏳</div>
          <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 6px;">Cargando Perfiles de Jugador...</h3>
          <p style="font-size: 12px; color: #94a3b8;">Conectando con el servidor SQLite local...</p>
        </div>
      `;
      return;
    }

    if (this.viewMode === 'list') {
      this.renderProfileList();
    } else {
      this.renderCreateProfile();
    }
  }

  private renderProfileList(): void {
    const cardsHtml = this.profiles.map(p => {
      const cls = this.getClassDetails(p.class_type);
      const isDeleting = this.deletingProfileName === p.name;
      const zoneName = this.getZoneName(p.current_zone);

      if (isDeleting) {
        return `
          <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.6); border-radius: 12px; padding: 12px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 8px;">
            <div style="font-size: 13px; font-weight: bold; color: #fca5a5;">¿Seguro que deseas eliminar a "${p.name}"?</div>
            <div style="font-size: 11px; color: #cbd5e1;">Se borrará todo su nivel, oro y progreso permanentemente.</div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <button class="btn-cancel-delete" data-name="${p.name}" style="padding: 6px 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: #fff; font-size: 12px; cursor: pointer;">Cancelar</button>
              <button class="btn-confirm-delete" data-name="${p.name}" style="padding: 6px 12px; background: #dc2626; border: none; border-radius: 6px; color: #fff; font-size: 12px; font-weight: bold; cursor: pointer;">Sí, Eliminar</button>
            </div>
          </div>
        `;
      }

      return `
        <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 12px 14px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px; transition: transform 0.15s, border-color 0.15s; box-shadow: 0 4px 14px rgba(0,0,0,0.4);" onmouseover="this.style.borderColor='rgba(59,130,246,0.6)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.12)'">
          
          <!-- Info Personaje -->
          <div style="display: flex; align-items: center; gap: 12px; text-align: left; min-width: 0;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: ${cls.color}22; border: 1.5px solid ${cls.color}; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;">
              ${cls.icon}
            </div>
            <div style="min-width: 0;">
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span style="font-weight: 800; font-size: 15px; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">${p.name}</span>
                <span style="font-size: 10px; font-weight: bold; background: #2563eb; color: #fff; padding: 1px 6px; border-radius: 6px;">Nv. ${p.level}</span>
                <span style="font-size: 11px; color: ${cls.color}; font-weight: 600;">${cls.label}</span>
              </div>
              <div style="display: flex; gap: 10px; font-size: 11px; color: #94a3b8; margin-top: 3px; flex-wrap: wrap;">
                <span style="color: #fbbf24;">🪙 ${p.gold} Oro</span>
                <span style="color: #cbd5e1;">🗺️ ${zoneName}</span>
                <span style="color: #4ade80;">❤️ ${p.health}/${p.max_health} HP</span>
              </div>
            </div>
          </div>

          <!-- Acciones -->
          <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
            <button class="btn-play-char" data-name="${p.name}" data-class="${p.class_type}" style="padding: 9px 15px; background: linear-gradient(135deg, #2563eb, #1d4ed8); border: none; border-radius: 8px; color: #fff; font-size: 13px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(37,99,235,0.4); display: flex; align-items: center; gap: 4px;">
              ▶️ Jugar
            </button>
            <button class="btn-ask-delete" data-name="${p.name}" title="Eliminar héroe" style="padding: 8px 10px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; color: #f87171; font-size: 13px; cursor: pointer;">
              🗑️
            </button>
          </div>

        </div>
      `;
    }).join('');

    this.overlay.innerHTML = `
      <div style="background: rgba(30, 41, 59, 0.96); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 18px; padding: 20px 24px; width: 95%; max-width: 520px; max-height: 92vh; display: flex; flex-direction: column; box-shadow: 0 25px 50px rgba(0,0,0,0.85); color: #fff; box-sizing: border-box;">
        
        <!-- Cabecera -->
        <div style="text-align: center; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; flex-shrink: 0;">
          <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 4px; background: linear-gradient(135deg, #60a5fa, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            Gestor de Héroes y Perfiles
          </h2>
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">Selecciona tu personaje para continuar o crea uno nuevo para la partida.</p>
        </div>

        <!-- Lista scrolleable de tarjetas -->
        <div style="flex: 1; overflow-y: auto; padding-right: 4px; margin-bottom: 16px; min-height: 120px; max-height: 52vh;">
          ${cardsHtml}
        </div>

        <!-- Botón para Crear Nuevo Personaje -->
        <div style="flex-shrink: 0; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px;">
          <button id="btn-goto-create" style="width: 100%; padding: 12px; background: rgba(59, 130, 246, 0.15); border: 1.5px dashed rgba(59, 130, 246, 0.6); border-radius: 10px; color: #93c5fd; font-size: 14px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s;">
            ➕ Crear Nuevo Personaje
          </button>
        </div>

      </div>
    `;

    // Vincular eventos de la lista
    const playBtns = this.overlay.querySelectorAll('.btn-play-char');
    playBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const charName = btn.getAttribute('data-name')!;
        const charClass = (btn.getAttribute('data-class') || 'WARRIOR') as PlayerClass;
        localStorage.setItem('migame_player_name', charName);
        this.close();
        this.onLoginCallback?.(charName, charClass);
      });
    });

    const askDelBtns = this.overlay.querySelectorAll('.btn-ask-delete');
    askDelBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.deletingProfileName = btn.getAttribute('data-name');
        this.render();
      });
    });

    const cancelDelBtns = this.overlay.querySelectorAll('.btn-cancel-delete');
    cancelDelBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.deletingProfileName = null;
        this.render();
      });
    });

    const confirmDelBtns = this.overlay.querySelectorAll('.btn-confirm-delete');
    confirmDelBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const charName = btn.getAttribute('data-name')!;
        this.deleteProfile(charName);
      });
    });

    const gotoCreateBtn = this.overlay.querySelector('#btn-goto-create') as HTMLButtonElement;
    if (gotoCreateBtn) {
      gotoCreateBtn.onclick = () => {
        this.viewMode = 'create';
        this.render();
      };
    }
  }

  private renderCreateProfile(): void {
    const classes: PlayerClass[] = ['WARRIOR', 'CLERIC', 'MAGE'];

    const classCardsHtml = classes.map(c => {
      const isSel = this.selectedClass === c;
      const details = this.getClassDetails(c);
      const stats = CLASS_STATS[c];

      return `
        <div class="class-card-opt" data-class="${c}" style="flex: 1; min-width: 120px; background: ${isSel ? 'rgba(37,99,235,0.25)' : 'rgba(15,23,42,0.6)'}; border: 2px solid ${isSel ? details.color : 'rgba(255,255,255,0.12)'}; border-radius: 12px; padding: 10px; cursor: pointer; text-align: center; transition: all 0.15s; box-shadow: ${isSel ? `0 0 16px ${details.color}44` : 'none'};">
          <div style="font-size: 26px; margin-bottom: 4px;">${details.icon}</div>
          <div style="font-weight: 800; font-size: 13px; color: ${details.color};">${details.label}</div>
          <div style="font-size: 10px; color: #94a3b8; margin: 4px 0 6px 0; line-height: 1.3;">${details.desc}</div>
          <div style="font-size: 10px; color: #cbd5e1; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 4px;">
            ❤️ ${stats.maxHealth} HP | 🛡️ ${stats.baseDefense} Def
          </div>
        </div>
      `;
    }).join('');

    const backBtnHtml = this.profiles.length > 0
      ? `<button id="btn-back-to-list" style="padding: 6px 12px; background: transparent; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #cbd5e1; font-size: 12px; cursor: pointer;">⬅️ Volver</button>`
      : '';

    this.overlay.innerHTML = `
      <div style="background: rgba(30, 41, 59, 0.96); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 18px; padding: 20px 24px; width: 95%; max-width: 520px; max-height: 92vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.85); color: #fff; box-sizing: border-box;">
        
        <!-- Cabecera con botón volver -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 800; margin: 0; background: linear-gradient(135deg, #60a5fa, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
              Crear Nuevo Personaje
            </h2>
            <p style="font-size: 11px; color: #94a3b8; margin: 2px 0 0 0;">Elige tu nombre y tu rol heroico inicial.</p>
          </div>
          ${backBtnHtml}
        </div>

        <!-- Campo de Nombre -->
        <div style="margin-bottom: 18px; text-align: left;">
          <label style="display: block; font-size: 12px; font-weight: bold; color: #cbd5e1; margin-bottom: 6px;">Nombre del Héroe</label>
          <input id="input-new-char-name" type="text" maxlength="16" placeholder="Ej: León, Gandalf, Thor..." style="width: 100%; padding: 12px 14px; background: rgba(15, 23, 42, 0.85); border: 1.5px solid rgba(59, 130, 246, 0.4); border-radius: 10px; color: #fff; font-size: 16px; font-weight: 600; outline: none; box-sizing: border-box;" autofocus />
          <div id="create-error-msg" style="color: #f87171; font-size: 11px; margin-top: 4px; display: none;"></div>
        </div>

        <!-- Selector de Clase -->
        <div style="margin-bottom: 22px; text-align: left;">
          <label style="display: block; font-size: 12px; font-weight: bold; color: #cbd5e1; margin-bottom: 8px;">Elige tu Clase Inicial</label>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${classCardsHtml}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
            💡 Podrás cambiar entre roles en cualquier momento durante la partida con 6s de recarga.
          </div>
        </div>

        <!-- Botón de Confirmación -->
        <button id="btn-submit-create" style="width: 100%; padding: 13px; background: linear-gradient(135deg, #2563eb, #1d4ed8); border: none; border-radius: 10px; color: #fff; font-size: 15px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 16px rgba(37,99,235,0.45); transition: transform 0.1s;">
          ✨ ¡Crear Héroe y Entrar al Mundo!
        </button>

      </div>
    `;

    const nameInput = this.overlay.querySelector('#input-new-char-name') as HTMLInputElement;
    const errorMsg = this.overlay.querySelector('#create-error-msg') as HTMLElement;
    const submitBtn = this.overlay.querySelector('#btn-submit-create') as HTMLButtonElement;
    const backBtn = this.overlay.querySelector('#btn-back-to-list') as HTMLButtonElement;

    if (backBtn) {
      backBtn.onclick = () => {
        this.viewMode = 'list';
        this.render();
      };
    }

    const classCards = this.overlay.querySelectorAll('.class-card-opt');
    classCards.forEach(card => {
      card.addEventListener('click', () => {
        this.selectedClass = card.getAttribute('data-class') as PlayerClass;
        this.render();
      });
    });

    const submit = () => {
      const rawName = nameInput.value.trim();
      if (!rawName) {
        errorMsg.textContent = 'Por favor escribe un nombre para tu personaje.';
        errorMsg.style.display = 'block';
        return;
      }

      if (rawName.length < 2) {
        errorMsg.textContent = 'El nombre debe tener al menos 2 caracteres.';
        errorMsg.style.display = 'block';
        return;
      }

      // Validar si el nombre ya existe
      const exists = this.profiles.some(p => p.name.toLowerCase() === rawName.toLowerCase());
      if (exists) {
        errorMsg.textContent = `Ya existe un personaje llamado "${rawName}". Cárgalo desde la lista o elige otro nombre.`;
        errorMsg.style.display = 'block';
        return;
      }

      localStorage.setItem('migame_player_name', rawName);
      this.close();
      this.onLoginCallback?.(rawName, this.selectedClass);
    };

    submitBtn.onclick = submit;
    nameInput.onkeydown = (e) => {
      if (e.key === 'Enter') submit();
      else errorMsg.style.display = 'none';
    };
  }
}
