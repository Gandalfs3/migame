import * as THREE from 'three';
import { PlayerClass } from '@migame/common';

export class PlayerEntity {
  public id: string;
  public group: THREE.Group;
  public targetX: number = 0;
  public targetZ: number = 0;
  public targetRot: number = 0;
  public isLocal: boolean;
  public name: string = 'Aventurero';
  public level: number = 1;
  public health: number = 100;
  public maxHealth: number = 100;
  public classType: PlayerClass = 'WARRIOR';

  private healthBarMesh: THREE.Sprite;
  private healthCanvas: HTMLCanvasElement;
  private healthCtx: CanvasRenderingContext2D;
  private healthTexture: THREE.CanvasTexture;
  private selectionRing: THREE.Mesh;
  private bodyMesh: THREE.Mesh;

  constructor(scene: THREE.Scene, id: string, colorHex: string, isLocal: boolean, name: string = 'Aventurero') {
    this.id = id;
    this.name = name;
    this.isLocal = isLocal;
    this.group = new THREE.Group();

    // Sombra en el suelo
    const shadowGeo = new THREE.CircleGeometry(0.7, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: isLocal ? 0x38bdf8 : 0x000000,
      transparent: true,
      opacity: isLocal ? 0.6 : 0.45
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.03;
    this.group.add(shadow);

    // Anillo de Selección en el suelo
    const ringGeo = new THREE.RingGeometry(0.85, 1.0, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0
    });
    this.selectionRing = new THREE.Mesh(ringGeo, ringMat);
    this.selectionRing.rotation.x = -Math.PI / 2;
    this.selectionRing.position.y = 0.04;
    this.group.add(this.selectionRing);

    // Cuerpo
    const bodyGeo = new THREE.CapsuleGeometry(0.5, 0.8, 8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: 0.3,
      metalness: 0.2
    });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.y = 0.9;
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);

    // Visor frontal
    const visorGeo = new THREE.BoxGeometry(0.35, 0.2, 0.3);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.15, 0.4);
    this.group.add(visor);

    // Barra de Vida y Nombre Flotante
    this.healthCanvas = document.createElement('canvas');
    this.healthCanvas.width = 256;
    this.healthCanvas.height = 64;
    this.healthCtx = this.healthCanvas.getContext('2d')!;

    this.healthTexture = new THREE.CanvasTexture(this.healthCanvas);
    const spriteMat = new THREE.SpriteMaterial({ map: this.healthTexture, depthTest: false });
    this.healthBarMesh = new THREE.Sprite(spriteMat);
    this.healthBarMesh.scale.set(2.2, 0.55, 1);
    this.healthBarMesh.position.y = 2.1;
    this.group.add(this.healthBarMesh);

    this.renderHealthBar();

    scene.add(this.group);
  }

  public setSelected(selected: boolean): void {
    const mat = this.selectionRing.material as THREE.MeshBasicMaterial;
    mat.opacity = selected ? 0.9 : 0;
  }

  public setStats(
    health: number,
    maxHealth: number,
    classType: PlayerClass,
    name?: string,
    level?: number
  ): void {
    let changed = false;
    if (this.health !== health || this.maxHealth !== maxHealth || this.classType !== classType) {
      this.health = health;
      this.maxHealth = maxHealth;
      this.classType = classType;
      changed = true;
    }
    if (name && this.name !== name) {
      this.name = name;
      changed = true;
    }
    if (level && this.level !== level) {
      this.level = level;
      changed = true;
    }

    if (changed) {
      this.renderHealthBar();
    }
  }

  private renderHealthBar(): void {
    const ctx = this.healthCtx;
    ctx.clearRect(0, 0, 256, 64);

    // Fondo
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.roundRect ? ctx.roundRect(10, 20, 236, 22, 6) : ctx.fillRect(10, 20, 236, 22);
    ctx.fill();

    // Relleno de vida
    const pct = Math.max(0, Math.min(1, this.health / this.maxHealth));
    ctx.fillStyle = pct > 0.5 ? '#22c55e' : (pct > 0.25 ? '#eab308' : '#ef4444');
    const barWidth = 232 * pct;
    if (barWidth > 0) {
      ctx.roundRect ? ctx.roundRect(12, 22, barWidth, 18, 4) : ctx.fillRect(12, 22, barWidth, 18);
      ctx.fill();
    }

    // Texto: [Nvl. X] Nombre
    const classBadge = this.classType === 'WARRIOR' ? '🛡️' : (this.classType === 'CLERIC' ? '💚' : '🔥');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${classBadge} [Nv.${this.level}] ${this.isLocal ? (this.name || 'Tú') : this.name}`, 128, 16);

    this.healthTexture.needsUpdate = true;
  }

  public setTarget(x: number, z: number, rotation: number): void {
    this.targetX = x;
    this.targetZ = z;
    this.targetRot = rotation;
  }

  public update(posLerp: number = 0.25, rotLerp: number = 0.3): void {
    if (this.health <= 0) {
      this.bodyMesh.rotation.x = THREE.MathUtils.lerp(this.bodyMesh.rotation.x, Math.PI / 2, 0.15);
      this.bodyMesh.position.y = THREE.MathUtils.lerp(this.bodyMesh.position.y, 0.1, 0.15);
      this.healthBarMesh.visible = false;
      return;
    }

    this.healthBarMesh.visible = true;
    this.bodyMesh.rotation.x = THREE.MathUtils.lerp(this.bodyMesh.rotation.x, 0, 0.2);
    this.bodyMesh.position.y = THREE.MathUtils.lerp(this.bodyMesh.position.y, 0.9, 0.2);

    this.group.position.x += (this.targetX - this.group.position.x) * posLerp;
    this.group.position.z += (this.targetZ - this.group.position.z) * posLerp;

    let diffRot = this.targetRot - this.group.rotation.y;
    while (diffRot < -Math.PI) diffRot += Math.PI * 2;
    while (diffRot > Math.PI) diffRot -= Math.PI * 2;
    this.group.rotation.y += diffRot * rotLerp;
  }

  public destroy(scene: THREE.Scene): void {
    scene.remove(this.group);
  }
}
