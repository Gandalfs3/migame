import * as THREE from 'three';

interface ActiveProjectile {
  mesh: THREE.Group;
  startX: number;
  startY: number;
  startZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  duration: number;
  elapsed: number;
  spellId: string;
}

interface ActiveVFX {
  mesh: THREE.Object3D;
  duration: number;
  elapsed: number;
  update?: (progress: number, dt: number) => void;
}

export class SpellFXRenderer {
  private scene: THREE.Scene;
  private projectiles: ActiveProjectile[] = [];
  private vfxList: ActiveVFX[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public spawnSpellEffect(
    spellId: string,
    casterPos: { x: number; y?: number; z: number },
    targetPos?: { x: number; y?: number; z: number }
  ): void {
    const fromY = (casterPos.y ?? 0) + 1.2;
    const to = targetPos || { x: casterPos.x + 1, y: casterPos.y ?? 0, z: casterPos.z + 1 };
    const toY = (to.y ?? 0) + 0.9;

    switch (spellId) {
      case 'frostbolt':
        this.spawnFrostbolt(casterPos.x, fromY, casterPos.z, to.x, toY, to.z);
        break;
      case 'fireball':
        this.spawnFireball(casterPos.x, fromY, casterPos.z, to.x, toY, to.z);
        break;
      case 'meteor':
        this.spawnMeteor(to.x, to.z);
        break;
      case 'smite':
        this.spawnSmite(to.x, to.z);
        break;
      case 'heal':
        this.spawnHeal(to.x, to.z);
        break;
      case 'sanctuary':
        this.spawnSanctuary(casterPos.x, casterPos.z);
        break;
      case 'slash':
        this.spawnSlash(casterPos.x, (casterPos.y ?? 0) + 0.9, casterPos.z, to.x, to.z);
        break;
      case 'shield_slam':
        this.spawnShieldSlam(casterPos.x, (casterPos.y ?? 0) + 0.9, casterPos.z, to.x, to.z);
        break;
      case 'taunt':
        this.spawnTaunt(casterPos.x, (casterPos.y ?? 0) + 0.1, casterPos.z);
        break;
      default:
        // Fallback: proyectil genérico de energía
        this.spawnFrostbolt(casterPos.x, fromY, casterPos.z, to.x, toY, to.z);
        break;
    }
  }

  // 1. Frostbolt: Proyectil de hielo veloz con partículas congeladas
  private spawnFrostbolt(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): void {
    const group = new THREE.Group();

    const coreGeo = new THREE.IcosahedronGeometry(0.22, 1);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    const haloGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.45 });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    group.add(halo);

    group.position.set(x1, y1, z1);
    this.scene.add(group);

    const dist = Math.hypot(x2 - x1, z2 - z1);
    const duration = Math.max(0.2, Math.min(0.7, dist / 22));

    this.projectiles.push({
      mesh: group,
      startX: x1,
      startY: y1,
      startZ: z1,
      targetX: x2,
      targetY: y2,
      targetZ: z2,
      duration,
      elapsed: 0,
      spellId: 'frostbolt'
    });
  }

  // 2. Fireball: Bola de fuego crepitante con estela ígnea
  private spawnFireball(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): void {
    const group = new THREE.Group();

    const coreGeo = new THREE.DodecahedronGeometry(0.28, 1);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    const flameGeo = new THREE.SphereGeometry(0.42, 8, 8);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.65 });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    group.add(flame);

    group.position.set(x1, y1, z1);
    this.scene.add(group);

    const dist = Math.hypot(x2 - x1, z2 - z1);
    const duration = Math.max(0.22, Math.min(0.75, dist / 20));

    this.projectiles.push({
      mesh: group,
      startX: x1,
      startY: y1,
      startZ: z1,
      targetX: x2,
      targetY: y2,
      targetZ: z2,
      duration,
      elapsed: 0,
      spellId: 'fireball'
    });
  }

  // 3. Meteor: Roca astral llameante cayendo del cielo con cráter ardiente
  private spawnMeteor(targetX: number, targetZ: number): void {
    // Anillo rúnico en el suelo
    const runeGeo = new THREE.RingGeometry(1.5, 2.2, 24);
    runeGeo.rotateX(-Math.PI / 2);
    const runeMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const rune = new THREE.Mesh(runeGeo, runeMat);
    rune.position.set(targetX, 0.05, targetZ);
    this.scene.add(rune);

    // Meteoro en descenso
    const meteorGeo = new THREE.DodecahedronGeometry(0.75, 1);
    const meteorMat = new THREE.MeshStandardMaterial({
      color: 0x7f1d1d,
      emissive: 0xf97316,
      emissiveIntensity: 2.2,
      roughness: 0.4
    });
    const meteor = new THREE.Mesh(meteorGeo, meteorMat);
    meteor.position.set(targetX + 3.0, 16.0, targetZ + 3.0);
    this.scene.add(meteor);

    const duration = 0.55;
    this.vfxList.push({
      mesh: meteor,
      duration,
      elapsed: 0,
      update: (p) => {
        meteor.position.x = THREE.MathUtils.lerp(targetX + 3.0, targetX, p);
        meteor.position.y = THREE.MathUtils.lerp(16.0, 0.5, p * p);
        meteor.position.z = THREE.MathUtils.lerp(targetZ + 3.0, targetZ, p);
        meteor.rotation.x += 0.2;
        meteor.rotation.y += 0.15;
        runeMat.opacity = 0.4 + Math.sin(p * Math.PI * 4) * 0.4;

        if (p >= 0.98) {
          // Explosión al tocar el suelo
          this.scene.remove(rune);
          this.spawnImpactBurst(targetX, 0.5, targetZ, 0xf97316, 2.8, 16);
        }
      }
    });
  }

  // 4. Smite: Rayo de luz divina fulminante
  private spawnSmite(x: number, z: number): void {
    const beamGeo = new THREE.CylinderGeometry(0.35, 0.55, 16, 12);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.95
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(x, 8.0, z);
    this.scene.add(beam);

    this.vfxList.push({
      mesh: beam,
      duration: 0.35,
      elapsed: 0,
      update: (p) => {
        beamMat.opacity = (1 - p) * 0.95;
        beam.scale.set(1 + p * 0.5, 1, 1 + p * 0.5);
      }
    });

    this.spawnImpactBurst(x, 1.0, z, 0xfde047, 1.8, 10);
  }

  // 5. Heal: Pilar sanador radiante ascendente
  private spawnHeal(x: number, z: number): void {
    const pillarGeo = new THREE.CylinderGeometry(0.8, 1.1, 4.0, 16, 1, true);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(x, 2.0, z);
    this.scene.add(pillar);

    this.vfxList.push({
      mesh: pillar,
      duration: 0.6,
      elapsed: 0,
      update: (p) => {
        pillar.position.y = 2.0 + p * 1.5;
        pillarMat.opacity = (1 - p) * 0.75;
        pillar.rotation.y += 0.08;
      }
    });

    this.spawnImpactBurst(x, 1.5, z, 0x22c55e, 1.4, 8);
  }

  // 6. Sanctuary: Domo áureo protector
  private spawnSanctuary(x: number, z: number): void {
    const domeGeo = new THREE.RingGeometry(0.5, 5.0, 32);
    domeGeo.rotateX(-Math.PI / 2);
    const domeMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(x, 0.08, z);
    this.scene.add(dome);

    this.vfxList.push({
      mesh: dome,
      duration: 1.0,
      elapsed: 0,
      update: (p) => {
        const scale = 0.2 + p * 0.8;
        dome.scale.set(scale, 1, scale);
        domeMat.opacity = (1 - p) * 0.7;
      }
    });
  }

  // 7. Slash: Arco cortante de acero y energía
  private spawnSlash(x1: number, y1: number, z1: number, targetX: number, targetZ: number): void {
    const angle = Math.atan2(targetX - x1, targetZ - z1);
    const arcGeo = new THREE.RingGeometry(0.8, 1.4, 16, 1, -Math.PI / 3, (Math.PI * 2) / 3);
    arcGeo.rotateX(-Math.PI / 2);
    const arcMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    const arc = new THREE.Mesh(arcGeo, arcMat);
    arc.position.set(x1 + Math.sin(angle) * 0.7, y1 - 0.2, z1 + Math.cos(angle) * 0.7);
    arc.rotation.y = angle;
    this.scene.add(arc);

    this.vfxList.push({
      mesh: arc,
      duration: 0.22,
      elapsed: 0,
      update: (p) => {
        arc.scale.set(1 + p * 0.6, 1, 1 + p * 0.6);
        arcMat.opacity = (1 - p) * 0.85;
      }
    });
  }

  // 8. Shield Slam: Onda de choque frontal contundente
  private spawnShieldSlam(x1: number, y1: number, z1: number, targetX: number, targetZ: number): void {
    const angle = Math.atan2(targetX - x1, targetZ - z1);
    const waveGeo = new THREE.PlaneGeometry(1.6, 0.8);
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    const wave = new THREE.Mesh(waveGeo, waveMat);
    wave.position.set(x1 + Math.sin(angle) * 0.9, y1, z1 + Math.cos(angle) * 0.9);
    wave.rotation.y = angle;
    this.scene.add(wave);

    this.vfxList.push({
      mesh: wave,
      duration: 0.25,
      elapsed: 0,
      update: (p) => {
        wave.scale.set(1 + p * 0.8, 1 + p * 0.5, 1);
        waveMat.opacity = (1 - p) * 0.9;
      }
    });
  }

  // 9. Taunt: Ondas de grito de guerra en el suelo
  private spawnTaunt(x: number, y: number, z: number): void {
    const ringGeo = new THREE.RingGeometry(0.5, 1.0, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(x, y, z);
    this.scene.add(ring);

    this.vfxList.push({
      mesh: ring,
      duration: 0.6,
      elapsed: 0,
      update: (p) => {
        const s = 1 + p * 8.0;
        ring.scale.set(s, 1, s);
        ringMat.opacity = (1 - p) * 0.8;
      }
    });
  }

  // Efecto genérico de impacto (estallido radial de chispas)
  private spawnImpactBurst(x: number, y: number, z: number, colorHex: number, radius: number, count: number): void {
    const sparkGroup = new THREE.Group();
    sparkGroup.position.set(x, y, z);

    const sparkMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.95 });
    const sparks: { mesh: THREE.Mesh; dir: THREE.Vector3; speed: number }[] = [];

    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.08, 6, 6);
      const spark = new THREE.Mesh(geo, sparkMat);
      const theta = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
      const dir = new THREE.Vector3(Math.cos(theta), Math.random() * 0.6, Math.sin(theta)).normalize();
      sparkGroup.add(spark);
      sparks.push({ mesh: spark, dir, speed: 2.5 + Math.random() * 2.0 });
    }

    this.scene.add(sparkGroup);

    this.vfxList.push({
      mesh: sparkGroup,
      duration: 0.38,
      elapsed: 0,
      update: (p, dt) => {
        sparkMat.opacity = (1 - p) * 0.95;
        for (const s of sparks) {
          s.mesh.position.addScaledVector(s.dir, s.speed * dt);
        }
      }
    });
  }

  public update(dt: number): void {
    // 1. Actualizar proyectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.elapsed += dt;
      const p = Math.min(1.0, proj.elapsed / proj.duration);

      proj.mesh.position.x = THREE.MathUtils.lerp(proj.startX, proj.targetX, p);
      proj.mesh.position.y = THREE.MathUtils.lerp(proj.startY, proj.targetY, p);
      proj.mesh.position.z = THREE.MathUtils.lerp(proj.startZ, proj.targetZ, p);
      proj.mesh.rotation.y += 0.2;

      if (p >= 1.0) {
        this.scene.remove(proj.mesh);
        this.projectiles.splice(i, 1);

        // Estallido al impactar
        const color = proj.spellId === 'frostbolt' ? 0x38bdf8 : 0xf97316;
        this.spawnImpactBurst(proj.targetX, proj.targetY, proj.targetZ, color, 1.5, 10);
      }
    }

    // 2. Actualizar efectos visuales temporales
    for (let i = this.vfxList.length - 1; i >= 0; i--) {
      const vfx = this.vfxList[i];
      vfx.elapsed += dt;
      const p = Math.min(1.0, vfx.elapsed / vfx.duration);

      if (vfx.update) {
        vfx.update(p, dt);
      }

      if (p >= 1.0) {
        this.scene.remove(vfx.mesh);
        this.vfxList.splice(i, 1);
      }
    }
  }

  public clear(): void {
    for (const p of this.projectiles) {
      this.scene.remove(p.mesh);
    }
    this.projectiles = [];
    for (const v of this.vfxList) {
      this.scene.remove(v.mesh);
    }
    this.vfxList = [];
  }
}
