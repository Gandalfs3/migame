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

  private renderHealthBar(name: string, health: number, maxHealth: number, isBoss: boolean): void {
    const ctx = this.healthCtx;
    ctx.clearRect(0, 0, 256, 64);

    // Fondo oscuro con borde
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.roundRect ? ctx.roundRect(10, 20, 236, 24, 6) : ctx.fillRect(10, 20, 236, 24);
    ctx.fill();

    // Relleno de vida (Rojo / Naranja si es jefe, Verde si es esbirro)
    const pct = Math.max(0, Math.min(1, health / maxHealth));
    ctx.fillStyle = isBoss ? '#dc2626' : (pct < 0.3 ? '#ef4444' : '#22c55e');
    const barWidth = 232 * pct;
    if (barWidth > 0) {
      ctx.roundRect ? ctx.roundRect(12, 22, barWidth, 20, 4) : ctx.fillRect(12, 22, barWidth, 20);
      ctx.fill();
    }

    // Nombre y Texto de Vida
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${name} (${health}/${maxHealth})`, 128, 16);

    this.healthTexture.needsUpdate = true;
  }

  public updateData(dto: MonsterDTO): void {
    this.targetX = dto.x;
    this.targetZ = dto.z;
    this.targetRot = dto.rotation;

    if (this.health !== dto.health || this.state !== dto.state) {
      this.health = dto.health;
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
