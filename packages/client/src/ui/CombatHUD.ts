import { PlayerClass, Spell, SPELLS, getXpForNextLevel } from '@migame/common';

export class CombatHUD {
  private container: HTMLElement;
  private classSelectorEl: HTMLElement;
  private actionBarEl: HTMLElement;
  private targetFrameEl: HTMLElement;
  private playerVitalsEl: HTMLElement;
  private levelUpBannerEl: HTMLElement;

  private currentClass: PlayerClass = 'WARRIOR';
  private cooldowns: Map<string, { duration: number; endsAt: number }> = new Map();

  public onSelectClass?: (classType: PlayerClass) => void;
  public onCastSpell?: (spellId: string) => void;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'combat-hud-container';
    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.pointerEvents = 'none';
    this.container.style.zIndex = '20';
    document.body.appendChild(this.container);

    this.classSelectorEl = this.createClassSelector();
    this.actionBarEl = this.createActionBar();
    this.targetFrameEl = this.createTargetFrame();
    this.playerVitalsEl = this.createPlayerVitals();
    this.levelUpBannerEl = this.createLevelUpBanner();

    this.container.appendChild(this.classSelectorEl);
    this.container.appendChild(this.actionBarEl);
    this.container.appendChild(this.targetFrameEl);
    this.container.appendChild(this.playerVitalsEl);
    this.container.appendChild(this.levelUpBannerEl);

    this.setupKeybindings();
    this.startCooldownTick();
  }

  private createClassSelector(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'class-selector-card';
    el.style.position = 'absolute';
    el.style.top = '72px';
    el.style.left = '16px';
    el.style.pointerEvents = 'auto';
    el.style.display = 'flex';
    el.style.gap = '6px';
    el.style.background = 'rgba(15, 23, 42, 0.85)';
    el.style.backdropFilter = 'blur(8px)';
    el.style.padding = '6px';
    el.style.borderRadius = '10px';
    el.style.border = '1px solid rgba(255, 255, 255, 0.1)';

    const classes: { type: PlayerClass; label: string }[] = [
      { type: 'WARRIOR', label: '🛡️ Guerrero' },
      { type: 'CLERIC', label: '💚 Clérigo' },
      { type: 'MAGE', label: '🔥 Mago' }
    ];

    for (const c of classes) {
      const btn = document.createElement('button');
      btn.textContent = c.label;
      btn.dataset.class = c.type;
      btn.style.background = c.type === this.currentClass ? '#3b82f6' : 'rgba(30, 41, 59, 0.7)';
      btn.style.color = '#fff';
      btn.style.border = 'none';
      btn.style.padding = '6px 12px';
      btn.style.borderRadius = '6px';
      btn.style.fontSize = '12px';
      btn.style.fontWeight = '600';
      btn.style.cursor = 'pointer';
      btn.onclick = () => {
        this.setClass(c.type);
        this.onSelectClass?.(c.type);
      };
      el.appendChild(btn);
    }

    return el;
  }

  public setClass(newClass: PlayerClass): void {
    this.currentClass = newClass;
    const buttons = this.classSelectorEl.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.style.background = btn.dataset.class === newClass ? '#3b82f6' : 'rgba(30, 41, 59, 0.7)';
    });
    this.refreshActionBar();
  }

  private createPlayerVitals(): HTMLElement {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.bottom = '96px';
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';
    el.style.width = '300px';
    el.style.pointerEvents = 'auto';
    el.style.background = 'rgba(15, 23, 42, 0.88)';
    el.style.backdropFilter = 'blur(8px)';
    el.style.padding = '8px 14px';
    el.style.borderRadius = '10px';
    el.style.border = '1px solid rgba(255, 255, 255, 0.15)';
    el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.5)';

    el.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; margin-bottom: 4px; font-weight: bold;">
        <span id="player-vital-name" style="color: #60a5fa;">[Nvl. 1] Aventurero</span>
        <span id="player-vital-gold" style="color: #fbbf24;">🪙 10 Oro</span>
      </div>

      <!-- Barra de Salud -->
      <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
        <span style="color: #94a3b8;">Salud</span>
        <span id="player-vital-value" style="font-weight: bold;">100 / 100</span>
      </div>
      <div style="background: rgba(0,0,0,0.5); border-radius: 4px; height: 12px; overflow: hidden; margin-bottom: 6px;">
        <div id="player-vital-fill" style="width: 100%; height: 100%; background: #22c55e; transition: width 0.2s;"></div>
      </div>

      <!-- Barra de Experiencia -->
      <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px; color: #a855f7;">
        <span>Experiencia (XP)</span>
        <span id="player-xp-value">0 / 100</span>
      </div>
      <div style="background: rgba(0,0,0,0.5); border-radius: 4px; height: 6px; overflow: hidden;">
        <div id="player-xp-fill" style="width: 0%; height: 100%; background: #a855f7; transition: width 0.3s;"></div>
      </div>
    `;

    return el;
  }

  public updatePlayerVitals(
    name: string,
    level: number,
    currentHp: number,
    maxHp: number,
    experience: number,
    gold: number
  ): void {
    const nameEl = document.getElementById('player-vital-name');
    const goldEl = document.getElementById('player-vital-gold');
    const hpValEl = document.getElementById('player-vital-value');
    const hpFillEl = document.getElementById('player-vital-fill');
    const xpValEl = document.getElementById('player-xp-value');
    const xpFillEl = document.getElementById('player-xp-fill');

    if (nameEl) nameEl.textContent = `[Nvl. ${level}] ${name}`;
    if (goldEl) goldEl.textContent = `🪙 ${gold} Oro`;
    if (hpValEl) hpValEl.textContent = `${Math.round(currentHp)} / ${maxHp}`;
    if (hpFillEl) {
      const pct = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
      hpFillEl.style.width = `${pct}%`;
      hpFillEl.style.background = pct > 50 ? '#22c55e' : (pct > 25 ? '#eab308' : '#ef4444');
    }

    const neededXp = getXpForNextLevel(level);
    if (xpValEl) xpValEl.textContent = `${experience} / ${neededXp}`;
    if (xpFillEl) {
      const xpPct = Math.max(0, Math.min(100, (experience / neededXp) * 100));
      xpFillEl.style.width = `${xpPct}%`;
    }
  }

  private createTargetFrame(): HTMLElement {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.top = '16px';
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';
    el.style.width = '240px';
    el.style.pointerEvents = 'auto';
    el.style.background = 'rgba(15, 23, 42, 0.9)';
    el.style.backdropFilter = 'blur(8px)';
    el.style.padding = '8px 12px';
    el.style.borderRadius = '10px';
    el.style.border = '1px solid rgba(245, 158, 11, 0.4)';
    el.style.display = 'none';

    el.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <span id="target-name" style="font-weight: bold; font-size: 13px; color: #f59e0b;">Objetivo</span>
        <span id="target-hp-text" style="font-size: 11px; color: #cbd5e1;">-- / --</span>
      </div>
      <div style="background: rgba(0,0,0,0.6); border-radius: 4px; height: 10px; overflow: hidden;">
        <div id="target-hp-fill" style="width: 100%; height: 100%; background: #ef4444; transition: width 0.2s;"></div>
      </div>
    `;

    return el;
  }

  public updateTarget(name: string | null, health: number = 0, maxHealth: number = 0): void {
    if (!name) {
      this.targetFrameEl.style.display = 'none';
      return;
    }

    this.targetFrameEl.style.display = 'block';
    const nameEl = document.getElementById('target-name');
    const hpTextEl = document.getElementById('target-hp-text');
    const hpFillEl = document.getElementById('target-hp-fill');

    if (nameEl) nameEl.textContent = name;
    if (hpTextEl) hpTextEl.textContent = `${Math.round(health)} / ${maxHealth}`;
    if (hpFillEl) {
      const pct = maxHealth > 0 ? Math.max(0, Math.min(100, (health / maxHealth) * 100)) : 0;
      hpFillEl.style.width = `${pct}%`;
    }
  }

  private createActionBar(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'action-bar';
    el.style.position = 'absolute';
    el.style.bottom = '20px';
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';
    el.style.display = 'flex';
    el.style.gap = '10px';
    el.style.pointerEvents = 'auto';

    return el;
  }

  private refreshActionBar(): void {
    this.actionBarEl.innerHTML = '';
    const classSpells = Object.values(SPELLS).filter(s => s.classType === this.currentClass);

    classSpells.forEach((spell, idx) => {
      const btn = document.createElement('div');
      btn.className = `skill-slot skill-slot-${idx + 1}`;
      btn.style.width = '60px';
      btn.style.height = '60px';
      btn.style.background = 'rgba(30, 41, 59, 0.9)';
      btn.style.backdropFilter = 'blur(6px)';
      btn.style.border = '2px solid rgba(255, 255, 255, 0.2)';
      btn.style.borderRadius = '12px';
      btn.style.display = 'flex';
      btn.style.flexDirection = 'column';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.position = 'relative';
      btn.style.cursor = 'pointer';
      btn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
      btn.style.transition = 'transform 0.1s, border-color 0.1s';
      btn.title = `${spell.name} (${spell.description})`;

      btn.innerHTML = `
        <span style="font-size: 24px;">${spell.icon}</span>
        <span style="position: absolute; top: 4px; left: 6px; font-size: 11px; font-weight: bold; background: rgba(0,0,0,0.5); padding: 1px 4px; border-radius: 4px;">${idx + 1}</span>
        <div id="cd-overlay-${spell.id}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); border-radius: 10px; display: none; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; color: #fff;"></div>
      `;

      btn.onmousedown = () => {
        btn.style.transform = 'scale(0.95)';
        this.triggerCast(spell);
      };
      btn.onmouseup = () => btn.style.transform = 'scale(1)';
      btn.ontouchstart = (e) => {
        e.preventDefault();
        btn.style.transform = 'scale(0.95)';
        this.triggerCast(spell);
      };
      btn.ontouchend = () => btn.style.transform = 'scale(1)';

      this.actionBarEl.appendChild(btn);
    });
  }

  private triggerCast(spell: Spell): void {
    const cd = this.cooldowns.get(spell.id);
    if (cd && Date.now() < cd.endsAt) {
      return;
    }

    this.cooldowns.set(spell.id, {
      duration: spell.cooldownMs,
      endsAt: Date.now() + spell.cooldownMs
    });

    this.onCastSpell?.(spell.id);
  }

  private setupKeybindings(): void {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const classSpells = Object.values(SPELLS).filter(s => s.classType === this.currentClass);

      if (e.key === '1' && classSpells[0]) this.triggerCast(classSpells[0]);
      if (e.key === '2' && classSpells[1]) this.triggerCast(classSpells[1]);
      if (e.key === '3' && classSpells[2]) this.triggerCast(classSpells[2]);
    });
  }

  private startCooldownTick(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [spellId, cd] of this.cooldowns.entries()) {
        const overlay = document.getElementById(`cd-overlay-${spellId}`);
        if (!overlay) continue;

        const remaining = cd.endsAt - now;
        if (remaining > 0) {
          overlay.style.display = 'flex';
          overlay.textContent = (remaining / 1000).toFixed(1) + 's';
        } else {
          overlay.style.display = 'none';
          this.cooldowns.delete(spellId);
        }
      }
    }, 50);
  }

  private createLevelUpBanner(): HTMLElement {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.top = '140px';
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%) scale(0.8)';
    el.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.95))';
    el.style.color = '#fff';
    el.style.padding = '12px 24px';
    el.style.borderRadius = '14px';
    el.style.fontWeight = '800';
    el.style.fontSize = '20px';
    el.style.boxShadow = '0 0 25px rgba(245, 158, 11, 0.8)';
    el.style.display = 'none';
    el.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    el.style.pointerEvents = 'none';

    return el;
  }

  public showLevelUp(name: string, level: number): void {
    this.levelUpBannerEl.textContent = `⭐ ¡${name} HA SUBIDO AL NIVEL ${level}! ⭐`;
    this.levelUpBannerEl.style.display = 'block';
    this.levelUpBannerEl.style.transform = 'translateX(-50%) scale(1.1)';

    setTimeout(() => {
      this.levelUpBannerEl.style.transform = 'translateX(-50%) scale(1)';
    }, 200);

    setTimeout(() => {
      this.levelUpBannerEl.style.transform = 'translateX(-50%) scale(0.8)';
      this.levelUpBannerEl.style.opacity = '0';
      setTimeout(() => {
        this.levelUpBannerEl.style.display = 'none';
        this.levelUpBannerEl.style.opacity = '1';
      }, 300);
    }, 2500);
  }
}
