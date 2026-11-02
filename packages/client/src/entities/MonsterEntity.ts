import * as THREE from 'three';
import { MonsterDTO, MonsterState } from '@migame/common';

export class MonsterEntity {
  public id: string;
  public group: THREE.Group;
  public targetX: number = 0;
  public targetZ: number = 0;
  public targetRot: number = 0;
  public health: number;
  public maxHealth: number;
  public state: MonsterState = 'IDLE';

  private healthBarMesh: THREE.Sprite;
  private healthCanvas: HTMLCanvasElement;
  private healthCtx: CanvasRenderingContext2D;
  private healthTexture: THREE.CanvasTexture;
  private selectionRing: THREE.Mesh;
  private bodyMesh: THREE.Object3D;

  constructor(scene: THREE.Scene, dto: MonsterDTO) {
    this.id = dto.id;
    this.health = dto.health;
    this.maxHealth = dto.maxHealth;
    this.targetX = dto.x;
    this.targetZ = dto.z;
    this.group = new THREE.Group();
    this.group.position.set(dto.x, 0, dto.z);

    const isBoss = dto.type === 'BOSS_GOLEM';

    // 1. Malla 3D del monstruo
    if (isBoss) {
      // GÓLEM JEFE
      const golemGroup = new THREE.Group();

      // Torso de piedra masivo
      const torsoGeo = new THREE.DodecahedronGeometry(1.4, 1);
      const torsoMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.7,
        metalness: 0.3,
        flatShading: true
      });
      const torso = new THREE.Mesh(torsoGeo, torsoMat);
      torso.position.y = 1.8;
      torso.scale.set(1.1, 1.2, 0.9);
      torso.castShadow = true;
      golemGroup.add(torso);

      // Núcleo rúnico brillante en el pecho
      const coreGeo = new THREE.SphereGeometry(0.4, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.set(0, 1.8, 0.9);
      golemGroup.add(core);

      // Cabeza de piedra con ojos ardientes
      const headGeo = new THREE.BoxGeometry(0.8, 0.7, 0.8);
      const headMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(0, 2.9, 0.2);
      head.castShadow = true;
      golemGroup.add(head);

      const eyeGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
      eyeL.position.set(-0.22, 2.9, 0.6);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
      eyeR.position.set(0.22, 2.9, 0.6);
      golemGroup.add(eyeL, eyeR);

      // Hombreras de roca
      const shoulderGeo = new THREE.ConeGeometry(0.6, 0.9, 5);
      const shoulderMat = new THREE.MeshStandardMaterial({ color: 0x475569, flatShading: true });
      const shoulderL = new THREE.Mesh(shoulderGeo, shoulderMat);
      shoulderL.position.set(-1.4, 2.3, 0);
      shoulderL.rotation.z = Math.PI / 4;
      const shoulderR = new THREE.Mesh(shoulderGeo, shoulderMat);
      shoulderR.position.set(1.4, 2.3, 0);
      shoulderR.rotation.z = -Math.PI / 4;
      golemGroup.add(shoulderL, shoulderR);

      this.bodyMesh = golemGroup;
      this.group.add(golemGroup);
    } else {
      // GOBLIN
      const goblinGroup = new THREE.Group();

      // Cuerpo verde
      const bodyGeo = new THREE.CapsuleGeometry(0.4, 0.6, 8, 16);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.5 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.7;
      body.castShadow = true;
      goblinGroup.add(body);

      // Ojos rojos amenazantes
      const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
      eyeL.position.set(-0.16, 0.9, 0.35);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
      eyeR.position.set(0.16, 0.9, 0.35);
      goblinGroup.add(eyeL, eyeR);

      // Garrote / Arma
      const clubGeo = new THREE.CylinderGeometry(0.08, 0.16, 0.8, 6);
      const clubMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
      const club = new THREE.Mesh(clubGeo, clubMat);
      club.position.set(0.45, 0.7, 0.3);
      club.rotation.x = Math.PI / 3;
      club.castShadow = true;
      goblinGroup.add(club);

      this.bodyMesh = goblinGroup;
      this.group.add(goblinGroup);
    }

    // 2. Anillo de Selección en el suelo
    const ringGeo = new THREE.RingGeometry(isBoss ? 1.8 : 0.9, isBoss ? 2.0 : 1.05, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0
    });
    this.selectionRing = new THREE.Mesh(ringGeo, ringMat);
    this.selectionRing.rotation.x = -Math.PI / 2;
    this.selectionRing.position.y = 0.04;
    this.group.add(this.selectionRing);

    // 3. Barra de Vida Flotante (Sprite con Canvas dinámico)
    this.healthCanvas = document.createElement('canvas');
    this.healthCanvas.width = 256;
    this.healthCanvas.height = 64;
    this.healthCtx = this.healthCanvas.getContext('2d')!;

    this.healthTexture = new THREE.CanvasTexture(this.healthCanvas);
    const spriteMat = new THREE.SpriteMaterial({ map: this.healthTexture, depthTest: false });
    this.healthBarMesh = new THREE.Sprite(spriteMat);
    this.healthBarMesh.scale.set(isBoss ? 3.5 : 2.2, isBoss ? 0.85 : 0.55, 1);
    this.healthBarMesh.position.y = isBoss ? 3.8 : 1.7;
    this.group.add(this.healthBarMesh);

    this.renderHealthBar(dto.name, dto.health, dto.maxHealth, isBoss);

    scene.add(this.group);
  }

  public setSelected(selected: boolean): void {
    const mat = this.selectionRing.material as THREE.MeshBasicMaterial;
    mat.opacity = selected ? 0.9 : 0;
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number
  ): void {
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, Math.max(0, w), Math.max(0, h), radius);
    } else {
      const r = Math.min(radius, w / 2, h / 2);
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    }
  }

  private renderHealthBar(name: string, health: number, maxHealth: number, isBoss: boolean): void {
    const ctx = this.healthCtx;
    ctx.clearRect(0, 0, 256, 64);

    // 1. Título superior: [JEFE] Nombre o Calavera + Nombre
    const titleText = isBoss ? `👑 [JEFE] ${name}` : `💀 ${name}`;
    ctx.font = isBoss ? 'bold 15px "Segoe UI", system-ui, -apple-system, sans-serif' : 'bold 14px "Segoe UI", system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.strokeText(titleText, 128, 14);
    ctx.fillStyle = isBoss ? '#f59e0b' : '#f87171';
    ctx.fillText(titleText, 128, 14);

    // 2. Marco exterior oscuro con borde dorado/blanco
    this.drawRoundedRect(ctx, 10, 24, 236, 26, 7);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isBoss ? 'rgba(245, 158, 11, 0.6)' : 'rgba(255, 255, 255, 0.25)';
    ctx.stroke();

    // 3. Pista de fondo de salud oscura (porción vacía de vida)
    this.drawRoundedRect(ctx, 13, 27, 230, 20, 5);
    ctx.fillStyle = 'rgba(30, 10, 10, 0.95)';
    ctx.fill();

    // 4. Relleno de vida activa (Rojo / Naranja si es jefe, Verde a Rojo si es goblin)
    const pct = Math.max(0, Math.min(1, health / maxHealth));
    const barWidth = 230 * pct;
    if (barWidth > 1) {
      this.drawRoundedRect(ctx, 13, 27, barWidth, 20, 5);
      ctx.fillStyle = isBoss ? '#dc2626' : (pct < 0.3 ? '#ef4444' : '#22c55e');
      ctx.fill();
    }

    // 5. Texto de salud numérico en el centro de la barra
    const hpText = `${Math.round(health)} / ${maxHealth}`;
    ctx.font = 'bold 12px "Segoe UI", system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.strokeText(hpText, 128, 37);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(hpText, 128, 37);

    this.healthTexture.needsUpdate = true;
  }

  public updateData(dto: MonsterDTO): void {
    this.targetX = dto.x;
    this.targetZ = dto.z;
    this.targetRot = dto.rotation;

    if (this.health !== dto.health || this.maxHealth !== dto.maxHealth || this.state !== dto.state) {
      this.health = dto.health;
      this.maxHealth = dto.maxHealth;
      this.state = dto.state;
      this.renderHealthBar(dto.name, dto.health, dto.maxHealth, dto.type === 'BOSS_GOLEM');
    }
  }

  public update(posLerp: number = 0.25, rotLerp: number = 0.3): void {
    if (this.state === 'DEAD') {
      this.bodyMesh.rotation.x = THREE.MathUtils.lerp(this.bodyMesh.rotation.x, Math.PI / 2, 0.15);
      this.bodyMesh.position.y = THREE.MathUtils.lerp(this.bodyMesh.position.y, 0.1, 0.15);
      this.healthBarMesh.visible = false;
      return;
    }

    this.healthBarMesh.visible = true;
    this.bodyMesh.rotation.x = THREE.MathUtils.lerp(this.bodyMesh.rotation.x, 0, 0.2);
    this.bodyMesh.position.y = THREE.MathUtils.lerp(this.bodyMesh.position.y, 0, 0.2);

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
