import * as THREE from 'three';
import { PlayerClass } from '@migame/common';
import { ProceduralTextureFactory } from '../textures/ProceduralTextureFactory';


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
  private colorHex: string;

  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;
  private leftArmMesh: THREE.Mesh;
  private rightArmMesh: THREE.Mesh;
  private leftLegMesh: THREE.Mesh;
  private rightLegMesh: THREE.Mesh;
  private weaponGroup?: THREE.Group;
  private walkTimer: number = 0;
  private lastUpdateTime: number = performance.now();

  constructor(scene: THREE.Scene, id: string, colorHex: string, isLocal: boolean, name: string = 'Aventurero') {
    this.id = id;
    this.name = name;
    this.isLocal = isLocal;
    this.colorHex = colorHex;
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

    // 1. Torso del Jugador con material procedural de la clase
    const bodyGeo = new THREE.CapsuleGeometry(0.45, 0.75, 8, 16);
    const bodyMat = ProceduralTextureFactory.getMaterialForPlayer(this.classType, colorHex);
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.y = 0.95;
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);

    // Visor frontal con halo luminoso
    const visorGeo = new THREE.BoxGeometry(0.32, 0.18, 0.28);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.18, 0.38);
    this.group.add(visor);

    // 2. Extremidades superiores (Brazos y Manos)
    const armGeo = new THREE.CapsuleGeometry(0.11, 0.35, 6, 8);
    const handGeo = new THREE.SphereGeometry(0.13, 8, 8);
    const handMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7, metalness: 0.3 });

    // Brazo Izquierdo (Pivote en el hombro)
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.52, 1.12, 0);
    this.leftArmMesh = new THREE.Mesh(armGeo, bodyMat);
    this.leftArmMesh.position.y = -0.2;
    this.leftArmMesh.castShadow = true;
    this.leftArmGroup.add(this.leftArmMesh);

    const leftHand = new THREE.Mesh(handGeo, handMat);
    leftHand.position.y = -0.42;
    this.leftArmGroup.add(leftHand);
    this.group.add(this.leftArmGroup);

    // Brazo Derecho (Pivote en el hombro)
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.52, 1.12, 0);
    this.rightArmMesh = new THREE.Mesh(armGeo, bodyMat);
    this.rightArmMesh.position.y = -0.2;
    this.rightArmMesh.castShadow = true;
    this.rightArmGroup.add(this.rightArmMesh);

    const rightHand = new THREE.Mesh(handGeo, handMat);
    rightHand.position.y = -0.42;
    this.rightArmGroup.add(rightHand);
    this.group.add(this.rightArmGroup);

    // 3. Extremidades inferiores (Piernas y Pies / Botas)
    const legGeo = new THREE.CapsuleGeometry(0.12, 0.32, 6, 8);
    const bootGeo = new THREE.BoxGeometry(0.19, 0.14, 0.28);
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85, metalness: 0.2 });

    // Pierna Izquierda (Pivote en la cadera)
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.21, 0.54, 0);
    this.leftLegMesh = new THREE.Mesh(legGeo, bodyMat);
    this.leftLegMesh.position.y = -0.2;
    this.leftLegMesh.castShadow = true;
    this.leftLegGroup.add(this.leftLegMesh);

    const leftFoot = new THREE.Mesh(bootGeo, bootMat);
    leftFoot.position.set(0, -0.4, 0.05);
    leftFoot.castShadow = true;
    this.leftLegGroup.add(leftFoot);
    this.group.add(this.leftLegGroup);

    // Pierna Derecha (Pivote en la cadera)
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.21, 0.54, 0);
    this.rightLegMesh = new THREE.Mesh(legGeo, bodyMat);
    this.rightLegMesh.position.y = -0.2;
    this.rightLegMesh.castShadow = true;
    this.rightLegGroup.add(this.rightLegMesh);

    const rightFoot = new THREE.Mesh(bootGeo, bootMat);
    rightFoot.position.set(0, -0.4, 0.05);
    rightFoot.castShadow = true;
    this.rightLegGroup.add(rightFoot);
    this.group.add(this.rightLegGroup);

    // 4. Arma equipada en la mano derecha según el rol
    this.updateWeapon(this.classType);

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

  private updateWeapon(classType: PlayerClass): void {
    if (this.weaponGroup) {
      this.rightArmGroup.remove(this.weaponGroup);
      this.weaponGroup = undefined;
    }

    const wg = new THREE.Group();
    wg.position.set(0, -0.42, 0.12);

    if (classType === 'WARRIOR') {
      // Espada de acero reforzado
      const bladeGeo = new THREE.BoxGeometry(0.08, 0.7, 0.16);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.y = 0.35;
      blade.castShadow = true;
      wg.add(blade);

      const crossGeo = new THREE.BoxGeometry(0.26, 0.06, 0.12);
      const crossMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.3 });
      const cross = new THREE.Mesh(crossGeo, crossMat);
      cross.position.y = 0.05;
      wg.add(cross);

      const hiltGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6);
      const hiltMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
      const hilt = new THREE.Mesh(hiltGeo, hiltMat);
      hilt.position.y = -0.06;
      wg.add(hilt);

      wg.rotation.x = Math.PI / 4;
    } else if (classType === 'CLERIC') {
      // Mazo sagrado radiante
      const shaftGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.6, 6);
      const shaftMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.y = 0.25;
      wg.add(shaft);

      const headGeo = new THREE.DodecahedronGeometry(0.16, 1);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.8, metalness: 0.6 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 0.55;
      wg.add(head);

      wg.rotation.x = Math.PI / 5;
    } else {
      // Mago: Báculo arcano con cristal que levita
      const staffGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.85, 6);
      const staffMat = new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.7 });
      const staff = new THREE.Mesh(staffGeo, staffMat);
      staff.position.y = 0.35;
      wg.add(staff);

      const gemGeo = new THREE.OctahedronGeometry(0.14, 0);
      const gemMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x06b6d4, emissiveIntensity: 1.5, roughness: 0.1 });
      const gem = new THREE.Mesh(gemGeo, gemMat);
      gem.position.y = 0.82;
      wg.add(gem);

      wg.rotation.x = Math.PI / 6;
    }

    this.weaponGroup = wg;
    this.rightArmGroup.add(wg);
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
      if (this.classType !== classType) {
        this.classType = classType;
        const newMat = ProceduralTextureFactory.getMaterialForPlayer(classType, this.colorHex);
        this.bodyMesh.material = newMat;
        this.leftArmMesh.material = newMat;
        this.rightArmMesh.material = newMat;
        this.leftLegMesh.material = newMat;
        this.rightLegMesh.material = newMat;
        this.updateWeapon(classType);
      }
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

  private renderHealthBar(): void {
    const ctx = this.healthCtx;
    ctx.clearRect(0, 0, 256, 64);

    // 1. Título superior: [Nv. X] Nombre
    const classBadge = this.classType === 'WARRIOR' ? '🛡️' : (this.classType === 'CLERIC' ? '💚' : '🔥');
    const titleText = `${classBadge} [Nv.${this.level}] ${this.isLocal ? (this.name || 'Tú') : this.name}`;
    ctx.font = 'bold 14px "Segoe UI", system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.strokeText(titleText, 128, 14);
    ctx.fillStyle = this.isLocal ? '#38bdf8' : '#ffffff';
    ctx.fillText(titleText, 128, 14);

    // 2. Marco exterior oscuro con borde
    this.drawRoundedRect(ctx, 10, 24, 236, 26, 7);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = this.isLocal ? 'rgba(56, 189, 248, 0.5)' : 'rgba(255, 255, 255, 0.25)';
    ctx.stroke();

    // 3. Pista de fondo de salud (lo que falta de vida en oscuro)
    this.drawRoundedRect(ctx, 13, 27, 230, 20, 5);
    ctx.fillStyle = 'rgba(15, 15, 20, 0.95)';
    ctx.fill();

    // 4. Relleno de vida activa
    const pct = Math.max(0, Math.min(1, this.health / this.maxHealth));
    const barWidth = 230 * pct;
    if (barWidth > 1) {
      this.drawRoundedRect(ctx, 13, 27, barWidth, 20, 5);
      ctx.fillStyle = pct > 0.5 ? '#22c55e' : (pct > 0.25 ? '#eab308' : '#ef4444');
      ctx.fill();
    }

    // 5. Texto de Salud numérico en el centro de la barra
    const hpText = `${Math.round(this.health)} / ${this.maxHealth}`;
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

  public setTarget(x: number, z: number, rotation: number): void {
    this.targetX = x;
    this.targetZ = z;
    this.targetRot = rotation;
  }

  public update(posLerp: number = 0.25, rotLerp: number = 0.3): void {
    const now = performance.now();
    const dt = Math.min((now - this.lastUpdateTime) / 1000, 0.1);
    this.lastUpdateTime = now;

    if (this.health <= 0) {
      this.bodyMesh.rotation.x = THREE.MathUtils.lerp(this.bodyMesh.rotation.x, Math.PI / 2, 0.15);
      this.bodyMesh.position.y = THREE.MathUtils.lerp(this.bodyMesh.position.y, 0.1, 0.15);
      this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(this.leftArmGroup.rotation.x, 0, 0.2);
      this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(this.rightArmGroup.rotation.x, 0, 0.2);
      this.leftLegGroup.rotation.x = THREE.MathUtils.lerp(this.leftLegGroup.rotation.x, 0, 0.2);
      this.rightLegGroup.rotation.x = THREE.MathUtils.lerp(this.rightLegGroup.rotation.x, 0, 0.2);
      this.healthBarMesh.visible = false;
      return;
    }

    this.healthBarMesh.visible = true;

    // Distancia al objetivo de posición para saber si está caminando
    const distToTarget = Math.hypot(this.targetX - this.group.position.x, this.targetZ - this.group.position.z);
    const isMoving = distToTarget > 0.04;

    if (isMoving) {
      this.walkTimer += 14.0 * dt;

      // Balanceo dinámico y alternado de piernas (adelante / atrás)
      this.leftLegGroup.rotation.x = Math.sin(this.walkTimer) * 0.7;
      this.rightLegGroup.rotation.x = -Math.sin(this.walkTimer) * 0.7;

      // Balanceo coordinado de brazos (inverso al paso de las piernas)
      this.leftArmGroup.rotation.x = -Math.sin(this.walkTimer) * 0.6;
      this.rightArmGroup.rotation.x = Math.sin(this.walkTimer) * 0.6;

      // Bobbing vertical y leve balanceo lateral para transmitir peso físico
      this.bodyMesh.position.y = 0.95 + Math.abs(Math.sin(this.walkTimer * 2)) * 0.05;
      this.bodyMesh.rotation.z = Math.sin(this.walkTimer) * 0.03;
    } else {
      // Reposo (IDLE): Suavizar extremidades a postura de descanso
      this.leftLegGroup.rotation.x = THREE.MathUtils.lerp(this.leftLegGroup.rotation.x, 0, 0.2);
      this.rightLegGroup.rotation.x = THREE.MathUtils.lerp(this.rightLegGroup.rotation.x, 0, 0.2);
      this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(this.leftArmGroup.rotation.x, 0, 0.2);
      this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(this.rightArmGroup.rotation.x, 0, 0.2);
      this.bodyMesh.rotation.z = THREE.MathUtils.lerp(this.bodyMesh.rotation.z, 0, 0.2);

      // Suave respiración en IDLE
      const breathe = Math.sin(now * 0.003) * 0.015;
      this.bodyMesh.position.y = THREE.MathUtils.lerp(this.bodyMesh.position.y, 0.95 + breathe, 0.2);
    }

    this.bodyMesh.rotation.x = THREE.MathUtils.lerp(this.bodyMesh.rotation.x, 0, 0.2);

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
