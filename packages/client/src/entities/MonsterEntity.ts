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
  public level: number;
  public defense: number;
  public name: string;
  public state: MonsterState = 'IDLE';

  private healthBarMesh: THREE.Sprite;
  private healthCanvas: HTMLCanvasElement;
  private healthCtx: CanvasRenderingContext2D;
  private healthTexture: THREE.CanvasTexture;
  private selectionRing: THREE.Mesh;
  private bodyMesh: THREE.Object3D;
  private staffOrb?: THREE.Mesh;
  private astralRing?: THREE.Mesh;
  public isBoss: boolean;

  constructor(scene: THREE.Scene, dto: MonsterDTO) {
    this.id = dto.id;
    this.name = dto.name;
    this.health = dto.health;
    this.maxHealth = dto.maxHealth;
    this.level = dto.level || 1;
    this.defense = dto.defense || 0;
    this.targetX = dto.x;
    this.targetZ = dto.z;
    this.group = new THREE.Group();
    this.group.position.set(dto.x, 0, dto.z);

    this.isBoss =
      dto.type === 'BOSS_GOLEM' ||
      dto.type === 'BOSS_NECROMANCER' ||
      dto.type === 'BOSS_MAGMA_LORD' ||
      dto.type === 'BOSS_ASTRAL_TITAN';

    // 1. Malla 3D según el tipo de monstruo
    if (dto.type === 'BOSS_GOLEM') {
      // ------------------------------------
      // GÓLEM ANCESTRAL (JEFE DEL BOSQUE)
      // ------------------------------------
      const golemGroup = new THREE.Group();

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

      const coreGeo = new THREE.SphereGeometry(0.4, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.set(0, 1.8, 0.9);
      golemGroup.add(core);

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
    } else if (dto.type === 'BOSS_NECROMANCER') {
      // ------------------------------------
      // NIGROMANTE DE LAS CENIZAS (JEFE CRIPTA)
      // ------------------------------------
      const necroGroup = new THREE.Group();

      const robeGeo = new THREE.ConeGeometry(1.0, 2.3, 8);
      const robeMat = new THREE.MeshStandardMaterial({
        color: 0x2e1065,
        roughness: 0.6,
        flatShading: true
      });
      const robe = new THREE.Mesh(robeGeo, robeMat);
      robe.position.y = 1.3;
      robe.castShadow = true;
      necroGroup.add(robe);

      const crownGeo = new THREE.CylinderGeometry(0.48, 0.42, 0.35, 6);
      const crownMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.7, roughness: 0.3 });
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.set(0, 2.7, 0);
      necroGroup.add(crown);

      const skullGeo = new THREE.DodecahedronGeometry(0.45, 1);
      const skullMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
      const skull = new THREE.Mesh(skullGeo, skullMat);
      skull.position.set(0, 2.45, 0.1);
      skull.castShadow = true;
      necroGroup.add(skull);

      const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xd946ef });
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
      eyeL.position.set(-0.16, 2.5, 0.48);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
      eyeR.position.set(0.16, 2.5, 0.48);
      necroGroup.add(eyeL, eyeR);

      const staffGeo = new THREE.CylinderGeometry(0.06, 0.08, 2.6, 6);
      const staffMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
      const staff = new THREE.Mesh(staffGeo, staffMat);
      staff.position.set(0.95, 1.4, 0.3);
      staff.rotation.z = -0.15;
      necroGroup.add(staff);

      const orbGeo = new THREE.SphereGeometry(0.28, 16, 16);
      const orbMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
      this.staffOrb = new THREE.Mesh(orbGeo, orbMat);
      this.staffOrb.position.set(1.15, 2.8, 0.3);
      necroGroup.add(this.staffOrb);

      this.bodyMesh = necroGroup;
      this.group.add(necroGroup);
    } else if (dto.type === 'BOSS_MAGMA_LORD') {
      // ------------------------------------
      // SEÑOR DEL MAGMA (JEFE VOLCÁNICO)
      // ------------------------------------
      const magmaGroup = new THREE.Group();

      const torsoGeo = new THREE.DodecahedronGeometry(1.6, 1);
      const torsoMat = new THREE.MeshStandardMaterial({
        color: 0x7f1d1d,
        roughness: 0.6,
        metalness: 0.4,
        flatShading: true
      });
      const torso = new THREE.Mesh(torsoGeo, torsoMat);
      torso.position.y = 2.0;
      torso.castShadow = true;
      magmaGroup.add(torso);

      // Núcleo de lava ardiente
      const coreGeo = new THREE.SphereGeometry(0.6, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.set(0, 2.0, 1.0);
      magmaGroup.add(core);

      // Cuernos volcánicos
      const hornGeo = new THREE.ConeGeometry(0.35, 1.3, 5);
      const hornMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
      const hornL = new THREE.Mesh(hornGeo, hornMat);
      hornL.position.set(-0.7, 3.2, 0.2);
      hornL.rotation.z = Math.PI / 4;
      const hornR = new THREE.Mesh(hornGeo, hornMat);
      hornR.position.set(0.7, 3.2, 0.2);
      hornR.rotation.z = -Math.PI / 4;
      magmaGroup.add(hornL, hornR);

      this.bodyMesh = magmaGroup;
      this.group.add(magmaGroup);
    } else if (dto.type === 'BOSS_ASTRAL_TITAN') {
      // ------------------------------------
      // TITÁN ASTRAL (JEFE SUPREMO DEL VACÍO)
      // ------------------------------------
      const titanGroup = new THREE.Group();

      const titanGeo = new THREE.OctahedronGeometry(1.8, 1);
      const titanMat = new THREE.MeshStandardMaterial({
        color: 0x312e81,
        metalness: 0.8,
        roughness: 0.2,
        flatShading: true
      });
      const titanBody = new THREE.Mesh(titanGeo, titanMat);
      titanBody.position.y = 2.4;
      titanBody.castShadow = true;
      titanGroup.add(titanBody);

      // Anillo cósmico orbital
      const ringGeo = new THREE.TorusGeometry(2.2, 0.08, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
      this.astralRing = new THREE.Mesh(ringGeo, ringMat);
      this.astralRing.position.y = 2.4;
      this.astralRing.rotation.x = Math.PI / 3;
      titanGroup.add(this.astralRing);

      this.bodyMesh = titanGroup;
      this.group.add(titanGroup);
    } else if (dto.type === 'FIRE_DEMON') {
      // ------------------------------------
      // DEMONIO DE FUEGO
      // ------------------------------------
      const demonGroup = new THREE.Group();
      const bodyGeo = new THREE.CapsuleGeometry(0.5, 0.8, 8, 16);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.9;
      body.castShadow = true;
      demonGroup.add(body);

      const eyeGeo = new THREE.SphereGeometry(0.08, 6, 6);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
      eyeL.position.set(-0.18, 1.1, 0.42);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
      eyeR.position.set(0.18, 1.1, 0.42);
      demonGroup.add(eyeL, eyeR);

      this.bodyMesh = demonGroup;
      this.group.add(demonGroup);
    } else if (dto.type === 'MAGMA_GARGOYLE') {
      // ------------------------------------
      // GÁRGOLA DE CENIZA
      // ------------------------------------
      const gargGroup = new THREE.Group();
      const bodyGeo = new THREE.DodecahedronGeometry(0.55, 1);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.8, flatShading: true });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 1.0;
      body.castShadow = true;
      gargGroup.add(body);

      // Alas de piedra
      const wingGeo = new THREE.BoxGeometry(1.6, 0.4, 0.08);
      const wing = new THREE.Mesh(wingGeo, bodyMat);
      wing.position.set(0, 1.2, -0.3);
      gargGroup.add(wing);

      this.bodyMesh = gargGroup;
      this.group.add(gargGroup);
    } else if (dto.type === 'VOID_SPAWN') {
      // ------------------------------------
      // ENGENDRO DEL VACÍO
      // ------------------------------------
      const voidGroup = new THREE.Group();
      const sphereGeo = new THREE.SphereGeometry(0.65, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.3 });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.y = 0.9;
      sphere.castShadow = true;
      voidGroup.add(sphere);

      const eyeGeo = new THREE.SphereGeometry(0.2, 12, 12);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(0, 0.9, 0.55);
      voidGroup.add(eye);

      this.bodyMesh = voidGroup;
      this.group.add(voidGroup);
    } else if (dto.type === 'CHAOS_MAGE') {
      // ------------------------------------
      // HECHICERO DEL CAOS
      // ------------------------------------
      const chaosGroup = new THREE.Group();
      const robeGeo = new THREE.ConeGeometry(0.7, 1.8, 7);
      const robeMat = new THREE.MeshStandardMaterial({ color: 0x4c1d95, roughness: 0.6 });
      const robe = new THREE.Mesh(robeGeo, robeMat);
      robe.position.y = 0.9;
      robe.castShadow = true;
      chaosGroup.add(robe);

      this.bodyMesh = chaosGroup;
      this.group.add(chaosGroup);
    } else if (dto.type === 'SKELETON_WARRIOR') {
      // ------------------------------------
      // GUERRERO ESQUELETO
      // ------------------------------------
      const skelGroup = new THREE.Group();
      const torsoGeo = new THREE.BoxGeometry(0.55, 0.75, 0.35);
      const boneMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
      const torso = new THREE.Mesh(torsoGeo, boneMat);
      torso.position.y = 0.85;
      torso.castShadow = true;
      skelGroup.add(torso);

      const skullGeo = new THREE.DodecahedronGeometry(0.32, 1);
      const skull = new THREE.Mesh(skullGeo, boneMat);
      skull.position.set(0, 1.45, 0);
      skull.castShadow = true;
      skelGroup.add(skull);

      const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
      eyeL.position.set(-0.11, 1.48, 0.28);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
      eyeR.position.set(0.11, 1.48, 0.28);
      skelGroup.add(eyeL, eyeR);

      this.bodyMesh = skelGroup;
      this.group.add(skelGroup);
    } else if (dto.type === 'SKELETON_ARCHER') {
      // ------------------------------------
      // ARQUERO MALDITO
      // ------------------------------------
      const archerGroup = new THREE.Group();
      const cowlGeo = new THREE.ConeGeometry(0.4, 0.6, 6);
      const cowlMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.7 });
      const cowl = new THREE.Mesh(cowlGeo, cowlMat);
      cowl.position.set(0, 1.55, 0);
      archerGroup.add(cowl);

      const skullGeo = new THREE.DodecahedronGeometry(0.3, 1);
      const boneMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
      const skull = new THREE.Mesh(skullGeo, boneMat);
      skull.position.set(0, 1.35, 0.05);
      archerGroup.add(skull);

      this.bodyMesh = archerGroup;
      this.group.add(archerGroup);
    } else {
      // ------------------------------------
      // GOBLIN
      // ------------------------------------
      const goblinGroup = new THREE.Group();
      const bodyGeo = new THREE.CapsuleGeometry(0.4, 0.6, 8, 16);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.5 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.7;
      body.castShadow = true;
      goblinGroup.add(body);

      const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
      eyeL.position.set(-0.16, 0.9, 0.35);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
      eyeR.position.set(0.16, 0.9, 0.35);
      goblinGroup.add(eyeL, eyeR);

      this.bodyMesh = goblinGroup;
      this.group.add(goblinGroup);
    }

    // 2. Anillo de Selección en el suelo
    const ringRadius = this.isBoss ? 1.9 : 0.9;
    const ringGeo = new THREE.RingGeometry(ringRadius, ringRadius + 0.18, 32);
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
    this.healthBarMesh.scale.set(this.isBoss ? 3.6 : 2.2, this.isBoss ? 0.9 : 0.55, 1);
    this.healthBarMesh.position.y = this.isBoss ? 4.0 : 1.7;
    this.group.add(this.healthBarMesh);

    this.renderHealthBar(dto.name, dto.health, dto.maxHealth, this.level, this.defense, this.isBoss);

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

  private renderHealthBar(name: string, health: number, maxHealth: number, level: number, defense: number, isBoss: boolean): void {
    const ctx = this.healthCtx;
    ctx.clearRect(0, 0, 256, 64);

    // 1. Título superior: Nivel + Nombre + Corona si es jefe
    const titleText = isBoss ? `👑 [Nv. ${level}] ${name}` : `💀 [Nv. ${level}] ${name}`;
    ctx.font = isBoss ? 'bold 15px "Segoe UI", system-ui, sans-serif' : 'bold 13px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.strokeText(titleText, 128, 14);
    ctx.fillStyle = isBoss ? '#f59e0b' : (level >= 6 ? '#f87171' : '#facc15');
    ctx.fillText(titleText, 128, 14);

    // 2. Marco exterior oscuro
    this.drawRoundedRect(ctx, 10, 24, 236, 26, 7);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isBoss ? 'rgba(245, 158, 11, 0.7)' : 'rgba(255, 255, 255, 0.25)';
    ctx.stroke();

    // 3. Pista de fondo de salud oscura
    this.drawRoundedRect(ctx, 13, 27, 230, 20, 5);
    ctx.fillStyle = 'rgba(30, 10, 10, 0.95)';
    ctx.fill();

    // 4. Relleno de vida activa
    const pct = Math.max(0, Math.min(1, health / maxHealth));
    const barWidth = 230 * pct;
    if (barWidth > 1) {
      this.drawRoundedRect(ctx, 13, 27, barWidth, 20, 5);
      ctx.fillStyle = isBoss ? '#dc2626' : (pct < 0.3 ? '#ef4444' : '#22c55e');
      ctx.fill();
    }

    // 5. Texto de salud y defensa en el centro
    const hpText = `${Math.round(health)} / ${maxHealth}  🛡️${defense}`;
    ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
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

    if (
      this.health !== dto.health ||
      this.maxHealth !== dto.maxHealth ||
      this.state !== dto.state ||
      this.level !== dto.level ||
      this.defense !== dto.defense
    ) {
      this.health = dto.health;
      this.maxHealth = dto.maxHealth;
      this.level = dto.level || this.level;
      this.defense = dto.defense || this.defense;
      this.state = dto.state;
      this.renderHealthBar(dto.name, dto.health, dto.maxHealth, this.level, this.defense, this.isBoss);
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

    if (this.staffOrb) {
      const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.15;
      this.staffOrb.scale.set(pulse, pulse, pulse);
    }

    if (this.astralRing) {
      this.astralRing.rotation.z += 0.02;
    }

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
