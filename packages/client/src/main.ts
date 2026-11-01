import * as THREE from 'three';
import { Engine } from './core/Engine.js';
import { HUD } from './ui/HUD.js';
import { CombatHUD } from './ui/CombatHUD.js';
import { FloatingTextManager } from './ui/FloatingText.js';
import { SettingsMenu } from './ui/SettingsMenu.js';
import { CharacterLoginModal } from './ui/CharacterLoginModal.js';
import { RangeIndicator } from './entities/RangeIndicator.js';
import { AssetManager } from './core/AssetManager.js';
import { NetworkClient } from './network/NetworkClient.js';
import { InputManager } from './input/InputManager.js';
import { PlayerEntity } from './entities/PlayerEntity.js';
import { MonsterEntity } from './entities/MonsterEntity.js';
import { ObstacleRenderer } from './entities/ObstacleRenderer.js';
import { DEFAULT_CLIENT_PORT, PlayerClass } from '@migame/common';

const engine = new Engine('canvas-container');
const hud = new HUD();
const combatHud = new CombatHUD();
const floatingText = new FloatingTextManager();
const obstacleRenderer = new ObstacleRenderer(engine.scene);
const rangeIndicator = new RangeIndicator(engine.scene);
const assetManager = new AssetManager();
const network = new NetworkClient();

// Menú de Ajustes de Interfaz (⚙️)
const settingsMenu = new SettingsMenu((settings) => {
  rangeIndicator.setVisible(settings.showRangeIndicator);
});
rangeIndicator.setVisible(settingsMenu.settings.showRangeIndicator);

// Botón de descarte rápido de guía de controles
const dismissControlsBtn = document.getElementById('btn-dismiss-controls');
if (dismissControlsBtn) {
  dismissControlsBtn.onclick = () => {
    settingsMenu.settings.showControlsGuide = false;
    settingsMenu.applySettingsToDOM();
  };
}

const inputManager = new InputManager((state) => {
  network.sendInput(state);
});

const playerEntities = new Map<string, PlayerEntity>();
const monsterEntities = new Map<string, MonsterEntity>();
let selectedTargetId: string | null = null;
let currentLocalClass: PlayerClass = 'WARRIOR';

// Modal de Inicio Simplificado
new CharacterLoginModal((name) => {
  network.sendLogin(name, currentLocalClass);
});

// Conexión y Bienvenida
network.onConnectionChange = (connected) => {
  hud.setConnected(connected);
};

network.onWelcome = (msg) => {
  hud.setPlayerId(msg.playerId);
  hud.setLanUrl(msg.hostIp, DEFAULT_CLIENT_PORT);

  if (msg.obstacles && Array.isArray(msg.obstacles)) {
    obstacleRenderer.renderObstacles(msg.obstacles);
  }
};

// Subida de Nivel
network.onLevelUp = (msg) => {
  combatHud.showLevelUp(msg.playerName, msg.newLevel);
};

// Cambio de Clase dinámico
combatHud.onSelectClass = (classType) => {
  currentLocalClass = classType;
  network.selectClass(classType);
  rangeIndicator.setClass(classType);
};

combatHud.onCastSpell = (spellId) => {
  network.castSpell(spellId, selectedTargetId);
};

// Feedbacks de Combate
network.onCombatFeedback = (feedbacks) => {
  if (!settingsMenu.settings.showFloatingCombatText) return;
  for (const fb of feedbacks) {
    floatingText.spawn(fb.amount, fb.isHeal, fb.x, fb.z);
  }
};

// Estado del Mundo
network.onWorldState = (msg) => {
  hud.updateStats(msg.players.length, network.lastPing);

  // 1. Actualizar Jugadores
  const activePlayerIds = new Set<string>();
  for (const p of msg.players) {
    activePlayerIds.add(p.id);
    let entity = playerEntities.get(p.id);

    if (!entity) {
      const isLocal = p.id === network.localPlayerId;
      entity = new PlayerEntity(engine.scene, p.id, p.color, isLocal, p.name);
      entity.group.position.set(p.x, 0, p.z);
      entity.group.rotation.y = p.rotation;
      playerEntities.set(p.id, entity);
    }

    entity.setTarget(p.x, p.z, p.rotation);
    entity.setStats(p.health, p.maxHealth, p.classType, p.name, p.level);
    entity.setSelected(p.id === selectedTargetId);

    if (p.id === network.localPlayerId) {
      combatHud.updatePlayerVitals(p.name, p.level, p.health, p.maxHealth, p.experience, p.gold);
      if (currentLocalClass !== p.classType) {
        currentLocalClass = p.classType;
        combatHud.setClass(p.classType);
        rangeIndicator.setClass(p.classType);
      }
    }
  }

  for (const [id, entity] of playerEntities.entries()) {
    if (!activePlayerIds.has(id)) {
      entity.destroy(engine.scene);
      playerEntities.delete(id);
    }
  }

  // 2. Actualizar Monstruos
  const activeMonsterIds = new Set<string>();
  if (msg.monsters) {
    for (const m of msg.monsters) {
      activeMonsterIds.add(m.id);
      let mon = monsterEntities.get(m.id);

      if (!mon) {
        mon = new MonsterEntity(engine.scene, m);
        monsterEntities.set(m.id, mon);
      } else {
        mon.updateData(m);
      }

      mon.setSelected(m.id === selectedTargetId);

      if (m.id === selectedTargetId) {
        combatHud.updateTarget(m.name, m.health, m.maxHealth);
      }
    }
  }

  for (const [id, entity] of monsterEntities.entries()) {
    if (!activeMonsterIds.has(id)) {
      entity.destroy(engine.scene);
      monsterEntities.delete(id);
    }
  }
};

// Raycasting para Selección de Objetivo
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function handlePointerSelection(event: MouseEvent | TouchEvent) {
  let clientX = 0;
  let clientY = 0;

  if (window.TouchEvent && event instanceof TouchEvent) {
    if (event.touches.length === 0) return;
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else if (event instanceof MouseEvent) {
    clientX = event.clientX;
    clientY = event.clientY;
  }

  mouse.x = (clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, engine.camera);

  const candidates: { id: string; name: string; obj: THREE.Object3D; isMonster: boolean }[] = [];

  for (const [id, mon] of monsterEntities.entries()) {
    if (mon.state !== 'DEAD') {
      candidates.push({ id, name: mon.id, obj: mon.group, isMonster: true });
    }
  }

  for (const [id, player] of playerEntities.entries()) {
    if (id !== network.localPlayerId && player.health > 0) {
      candidates.push({ id, name: player.name || player.id, obj: player.group, isMonster: false });
    }
  }

  const clickableObjects = candidates.map(c => c.obj);
  const intersects = raycaster.intersectObjects(clickableObjects, true);

  if (intersects.length > 0) {
    const hitObj = intersects[0].object;
    for (const c of candidates) {
      let cur: THREE.Object3D | null = hitObj;
      while (cur) {
        if (cur === c.obj) {
          selectTarget(c.id);
          return;
        }
        cur = cur.parent;
      }
    }
  }
}

function selectTarget(id: string | null) {
  selectedTargetId = id;
  network.selectTarget(id);

  for (const [pId, p] of playerEntities) {
    p.setSelected(pId === id);
    if (pId === id) {
      combatHud.updateTarget(p.name, p.health, p.maxHealth);
    }
  }

  for (const [mId, m] of monsterEntities) {
    m.setSelected(mId === id);
    if (mId === id) {
      combatHud.updateTarget(m.id, m.health, m.maxHealth);
    }
  }

  if (!id) {
    combatHud.updateTarget(null);
  }
}

window.addEventListener('mousedown', (e) => {
  if ((e.target as HTMLElement).closest('.hud-overlay, #combat-hud-container, #character-login-modal, #settings-modal-overlay, #btn-settings-gear')) return;
  handlePointerSelection(e);
});

// Bucle de renderizado
function renderLoop(): void {
  requestAnimationFrame(renderLoop);

  for (const entity of playerEntities.values()) {
    entity.update(0.25, 0.3);
  }

  for (const entity of monsterEntities.values()) {
    entity.update(0.25, 0.3);
  }

  if (network.localPlayerId && playerEntities.has(network.localPlayerId)) {
    const localEntity = playerEntities.get(network.localPlayerId)!;
    engine.followTarget(localEntity.group.position.x, localEntity.group.position.z, 0.08);

    if (settingsMenu.settings.showRangeIndicator) {
      rangeIndicator.update(localEntity.group.position.x, localEntity.group.position.z);
    }
  }

  floatingText.update(engine.camera);

  engine.render();
}

renderLoop();
