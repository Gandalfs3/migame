import * as THREE from 'three';
import { PortalDTO } from '@migame/common';

interface PortalInstance {
  group: THREE.Group;
  vortex: THREE.Mesh;
  glowRing: THREE.Mesh;
  labelSprite: THREE.Sprite;
  pulseTimer: number;
}

export class PortalRenderer {
  private scene: THREE.Scene;
  private portals: Map<string, PortalInstance> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public clear(): void {
    for (const p of this.portals.values()) {
      this.scene.remove(p.group);
    }
    this.portals.clear();
  }

  public renderPortals(portals: PortalDTO[]): void {
    this.clear();

    for (const portal of portals) {
      const group = new THREE.Group();
      group.position.set(portal.x, 0, portal.z);

      const colorHex = new THREE.Color(portal.color || '#a855f7');

      // 1. Anillo exterior rúnico brillante en el suelo
      const ringGeo = new THREE.RingGeometry(portal.radius * 0.8, portal.radius * 1.15, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const glowRing = new THREE.Mesh(ringGeo, ringMat);
      glowRing.rotation.x = -Math.PI / 2;
      glowRing.position.y = 0.05;
      group.add(glowRing);

      // 2. Vórtice mágico interior giratorio
      const vortexGeo = new THREE.CylinderGeometry(portal.radius * 0.85, portal.radius * 0.85, 0.25, 24, 1, true);
      const vortexMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
        wireframe: true
      });
      const vortex = new THREE.Mesh(vortexGeo, vortexMat);
      vortex.position.y = 0.2;
      group.add(vortex);

      // 3. Disco central brillante
      const discGeo = new THREE.CircleGeometry(portal.radius * 0.78, 32);
      const discMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55
      });
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = 0.06;
      group.add(disc);

      // 4. Etiqueta flotante 3D (Billboard Canvas)
      const canvas = document.createElement('canvas');
      canvas.width = 384;
      canvas.height = 96;
      const ctx = canvas.getContext('2d')!;

      // Fondo redondeado oscuro
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(12, 12, 360, 72, 14);
      } else {
        ctx.rect(12, 12, 360, 72);
      }
      ctx.fill();

      // Borde del cartel con el color del portal
      ctx.lineWidth = 3;
      ctx.strokeStyle = portal.color || '#a855f7';
      ctx.stroke();

      // Título del portal
      ctx.font = 'bold 19px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`🌀 ${portal.name}`, 192, 36);

      // Requisito de nivel
      ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = portal.minLevel > 1 ? '#f59e0b' : '#38bdf8';
      ctx.fillText(`Nivel Requerido: ${portal.minLevel}+`, 192, 62);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
      const labelSprite = new THREE.Sprite(spriteMat);
      labelSprite.position.y = 2.8;
      labelSprite.scale.set(3.4, 0.85, 1);
      group.add(labelSprite);

      this.scene.add(group);
      this.portals.set(portal.id, {
        group,
        vortex,
        glowRing,
        labelSprite,
        pulseTimer: Math.random() * Math.PI
      });
    }
  }

  public update(dt: number): void {
    for (const p of this.portals.values()) {
      p.pulseTimer += dt * 2.5;
      p.vortex.rotation.y += 1.8 * dt;

      const scalePulse = 1 + Math.sin(p.pulseTimer) * 0.06;
      p.glowRing.scale.set(scalePulse, scalePulse, 1);

      // Leve flotación del letrero
      p.labelSprite.position.y = 2.8 + Math.sin(p.pulseTimer * 0.8) * 0.12;
    }
  }
}
