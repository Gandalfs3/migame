import * as THREE from 'three';
import { PlayerClass } from '@migame/common';
import { ProceduralTextureFactory } from '../textures/ProceduralTextureFactory';
import { AssetManager } from '../core/AssetManager';


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
  private visorMesh: THREE.Mesh;
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
  private customModelMesh?: THREE.Object3D;
  private assetManager?: AssetManager;
  private walkTimer: number = 0;
  private walkWeight: number = 0;
  private lastUpdateTime: number = performance.now();
  private customShaderMaterials: THREE.MeshStandardMaterial[] = [];

  // Animación de casteo / lanzamiento de habilidades
  private isCasting: boolean = false;
  private castTimer: number = 0;
  private castDuration: number = 0.4;
  private castType: 'MELEE' | 'PROJECTILE' | 'METEOR' | 'HEAL' | 'BUFF' = 'PROJECTILE';

  constructor(
    scene: THREE.Scene,
    id: string,
    colorHex: string,
    isLocal: boolean,
    name: string = 'Aventurero',
    assetManager?: AssetManager
  ) {
    this.id = id;
    this.name = name;
    this.isLocal = isLocal;
    this.colorHex = colorHex;
    this.assetManager = assetManager;
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
    this.visorMesh = new THREE.Mesh(visorGeo, visorMat);
    this.visorMesh.position.set(0, 1.18, 0.38);
    this.group.add(this.visorMesh);

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

    // Carga de modelo 3D GLB personalizado si existe
    this.loadCustomModel(this.classType);

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

  public loadCustomModel(classType: PlayerClass): void {
    if (!this.assetManager) return;
    const modelPath = `/assets/models/character_${classType.toLowerCase()}.glb`;
    this.assetManager.loadGLTF(modelPath).then((gltf) => {
      if (gltf && gltf.scene) {
        if (this.customModelMesh) {
          this.group.remove(this.customModelMesh);
        }
        this.customShaderMaterials = [];

        const container = new THREE.Group();

        gltf.scene.traverse((child) => {
          const meshChild = child as THREE.Mesh;
          if (meshChild.isMesh && meshChild.geometry) {
            const geom = meshChild.geometry.clone();
            geom.computeBoundingBox();
            const bbox = geom.boundingBox!;
            const minY = bbox.min.y;
            const minX = bbox.min.x;
            const maxX = bbox.max.x;
            const minZ = bbox.min.z;
            const maxZ = bbox.max.z;
            const height = bbox.max.y - minY;
            const scale = height > 0 ? 1.9 / height : 1.0;

            // Centrar X y Z, fijar pies exactamente en Y = 0 y escalar a altura humana (1.9m)
            geom.translate(-(minX + maxX) / 2, -minY, -(minZ + maxZ) / 2);
            geom.scale(scale, scale, scale);
            geom.computeVertexNormals();

            // Clonar material para aplicar el Shader de Deformación Cinemática de extremidades
            let origMat = meshChild.material as THREE.MeshStandardMaterial;
            if (Array.isArray(origMat)) origMat = origMat[0] as THREE.MeshStandardMaterial;
            const mat = origMat ? (origMat.clone() as THREE.MeshStandardMaterial) : new THREE.MeshStandardMaterial({ color: 0xcccccc });

            mat.roughness = 0.6;
            mat.metalness = 0.15;
            mat.customProgramCacheKey = () => 'cinematic_humanoid_walk_v2';

            // Inyectar deformación de zancada en piernas, braceo y túnica al Vertex Shader
            mat.onBeforeCompile = (shader) => {
              shader.uniforms.uWalkTime = { value: 0.0 };
              shader.uniforms.uWalkWeight = { value: 0.0 };

              shader.vertexShader = `
                uniform float uWalkTime;
                uniform float uWalkWeight;
              ` + shader.vertexShader;

              shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>

                if (uWalkWeight > 0.001) {
                  // 1. ZANCADA Y PASOS DE PIERNAS (Cadera en y=0.88, pies en y=0.0)
                  if (transformed.y < 0.88) {
                    float legFactor = clamp((0.88 - transformed.y) / 0.88, 0.0, 1.0);
                    float legWeight = legFactor * legFactor;

                    if (transformed.x < -0.03) {
                      // Pierna Izquierda: zancada alternada hacia adelante/atrás
                      float stride = sin(uWalkTime) * 0.28 * uWalkWeight;
                      transformed.z -= stride * legWeight;
                      float stepUp = max(0.0, sin(uWalkTime)) * 0.09 * legWeight * uWalkWeight;
                      transformed.y += stepUp;
                      transformed.x += sin(uWalkTime) * 0.015 * legWeight * uWalkWeight;
                    } else if (transformed.x > 0.03) {
                      // Pierna Derecha: zancada inversa
                      float stride = -sin(uWalkTime) * 0.28 * uWalkWeight;
                      transformed.z -= stride * legWeight;
                      float stepUp = max(0.0, -sin(uWalkTime)) * 0.09 * legWeight * uWalkWeight;
                      transformed.y += stepUp;
                      transformed.x -= sin(uWalkTime) * 0.015 * legWeight * uWalkWeight;
                    }
                  }

                  // 2. BRACEO DINÁMICO (|x| > 0.20, y entre 0.65 y 1.40)
                  float absX = abs(transformed.x);
                  if (absX > 0.20 && transformed.y > 0.65 && transformed.y < 1.40) {
                    float armWeight = clamp((absX - 0.20) / 0.22, 0.0, 1.0);
                    if (transformed.x < 0.0) {
                      // Brazo izquierdo: se mueve inverso a pierna izquierda
                      float armSwing = -sin(uWalkTime) * 0.24 * uWalkWeight * armWeight;
                      transformed.z -= armSwing;
                      transformed.y += abs(armSwing) * 0.08;
                    } else {
                      // Brazo derecho
                      float armSwing = sin(uWalkTime) * 0.24 * uWalkWeight * armWeight;
                      transformed.z += armSwing;
                      transformed.y += abs(armSwing) * 0.08;
                    }
                  }

                  // 3. ONDULACIÓN DE TÚNICA / CAPA AL CORRER
                  if (transformed.y < 0.75) {
                    float clothFactor = (0.75 - transformed.y) / 0.75;
                    float clothWave = sin(uWalkTime * 1.5 - transformed.y * 5.0) * 0.03 * uWalkWeight * clothFactor;
                    transformed.z += clothWave + 0.04 * uWalkWeight * clothFactor;
                  }
                }

                // 4. RESPIRACIÓN ORGÁNICA EN REPOSO
                if (transformed.y > 0.85 && transformed.y < 1.45) {
                  float chestWeight = sin((transformed.y - 0.85) / 0.6 * 3.14159);
                  float breath = sin(uWalkTime * 0.25) * 0.012 * (1.0 - uWalkWeight * 0.7) * chestWeight;
                  transformed.z -= breath;
                  transformed.x += breath * 0.3 * sign(transformed.x);
                }
                `
              );

              mat.userData.shader = shader;
            };

            const newMesh = new THREE.Mesh(geom, mat);
            newMesh.castShadow = true;
            newMesh.receiveShadow = true;
            newMesh.rotation.y = 0; // Rotación neutral interna (el contenedor aplica Math.PI)
            container.add(newMesh);
            this.customShaderMaterials.push(mat);
          }
        });

        this.customModelMesh = container;
        this.group.add(this.customModelMesh);

        // Ocultar partes procedurales cuando hay modelo 3D real
        this.setProceduralVisible(false);
      } else {
        if (this.customModelMesh) {
          this.group.remove(this.customModelMesh);
          this.customModelMesh = undefined;
        }
        this.setProceduralVisible(true);
      }
    }).catch(() => {
      this.setProceduralVisible(true);
    });
  }

  private setProceduralVisible(visible: boolean): void {
    this.bodyMesh.visible = visible;
    if (this.visorMesh) this.visorMesh.visible = visible;
    this.leftArmGroup.visible = visible;
    this.rightArmGroup.visible = visible;
    this.leftLegGroup.visible = visible;
    this.rightLegGroup.visible = visible;
    if (this.weaponGroup) {
      this.weaponGroup.visible = visible;
    }
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
        this.loadCustomModel(classType);
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

  public triggerSpellCast(spellId: string): void {
    this.isCasting = true;
    this.castTimer = 0;

    if (spellId === 'slash' || spellId === 'shield_slam') {
      this.castType = 'MELEE';
      this.castDuration = 0.35;
    } else if (spellId === 'meteor') {
      this.castType = 'METEOR';
      this.castDuration = 0.65;
    } else if (spellId === 'heal' || spellId === 'sanctuary') {
      this.castType = 'HEAL';
      this.castDuration = 0.5;
    } else if (spellId === 'taunt') {
      this.castType = 'BUFF';
      this.castDuration = 0.45;
    } else {
      this.castType = 'PROJECTILE';
      this.castDuration = 0.4;
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
      if (this.customModelMesh) {
        this.customModelMesh.rotation.x = THREE.MathUtils.lerp(this.customModelMesh.rotation.x, Math.PI / 2, 0.15);
        this.customModelMesh.position.y = THREE.MathUtils.lerp(this.customModelMesh.position.y, 0.1, 0.15);
      }
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

    // 1. Progresión y cinemática de lanzamiento de poderes (casting)
    let castOffsetY = 0;
    let castOffsetZ = 0;
    let castRotX = 0;
    let castRotY = 0;
    let castRotZ = 0;
    let castScale = 1.0;

    if (this.isCasting) {
      this.castTimer += dt;
      const cp = Math.min(1.0, this.castTimer / this.castDuration);

      if (this.castType === 'MELEE') {
        // Ataque cuerpo a cuerpo (Guerrero): Estocada frontal y tajo de espada
        if (cp < 0.28) {
          const p = cp / 0.28;
          castRotX = -p * 0.18;
          castOffsetZ = -p * 0.12;
        } else if (cp < 0.75) {
          const p = (cp - 0.28) / 0.47;
          const strike = Math.sin(p * Math.PI);
          castOffsetZ = strike * 0.48;
          castRotX = strike * 0.38;
          castRotZ = strike * 0.28;
          castScale = 1.0 + strike * 0.12;
        } else {
          const p = (cp - 0.75) / 0.25;
          castOffsetZ = (1 - p) * 0.12;
          castRotX = (1 - p) * 0.12;
        }
        if (this.rightArmGroup) {
          this.rightArmGroup.rotation.x = -Math.PI / 3 + Math.sin(cp * Math.PI) * 1.9;
        }
      } else if (this.castType === 'METEOR') {
        // Invocación celestial (Mago): Elevación y canalización estelar hacia el cielo
        const p = Math.sin(cp * Math.PI);
        castOffsetY = p * 0.45;
        castRotX = -p * 0.35;
        castScale = 1.0 + p * 0.15;
        if (this.rightArmGroup) this.rightArmGroup.rotation.x = -Math.PI * 0.85 * p;
        if (this.leftArmGroup) this.leftArmGroup.rotation.x = -Math.PI * 0.85 * p;
      } else if (this.castType === 'HEAL') {
        // Bendición sagrada (Clérigo): Ascenso divino y apertura de brazos
        const p = Math.sin(cp * Math.PI);
        castOffsetY = p * 0.32;
        castRotX = -p * 0.28;
        castScale = 1.0 + p * 0.1;
        if (this.rightArmGroup) {
          this.rightArmGroup.rotation.x = -Math.PI * 0.6 * p;
          this.rightArmGroup.rotation.z = p * 0.5;
        }
        if (this.leftArmGroup) {
          this.leftArmGroup.rotation.x = -Math.PI * 0.6 * p;
          this.leftArmGroup.rotation.z = -p * 0.5;
        }
      } else if (this.castType === 'BUFF') {
        // Grito de guerra / Rugido (Provocación): Salto firme y pecho erguido
        const p = Math.sin(cp * Math.PI);
        castOffsetY = p * 0.26;
        castRotX = p * 0.26;
        castScale = 1.0 + p * 0.18;
        if (this.rightArmGroup) this.rightArmGroup.rotation.x = -Math.PI * 0.5 * p;
        if (this.leftArmGroup) this.leftArmGroup.rotation.x = -Math.PI * 0.5 * p;
      } else {
        // Proyectiles (Mago Bola de Fuego / Ráfaga Gélida / Castigo Sagrado):
        // Carga de energía y retroceso explosivo
        if (cp < 0.38) {
          const p = cp / 0.38;
          castOffsetY = p * 0.22;
          castRotX = -p * 0.22;
        } else {
          const p = (cp - 0.38) / 0.62;
          const thrust = Math.sin(p * Math.PI);
          castOffsetZ = thrust * 0.25;
          castRotX = thrust * 0.28;
          castOffsetY = (1 - p) * 0.16;
        }
        if (this.rightArmGroup) {
          this.rightArmGroup.rotation.x = -Math.PI * 0.75 * Math.sin(cp * Math.PI);
        }
      }

      if (cp >= 1.0) {
        this.isCasting = false;
      }
    }

    // 2. Transición suave de aceleración/desaceleración (Walk Weight)
    this.walkTimer += 10.0 * dt;
    const targetWalkWeight = isMoving ? 1.0 : 0.0;
    this.walkWeight = THREE.MathUtils.lerp(this.walkWeight, targetWalkWeight, isMoving ? 0.22 : 0.12);

    // Actualizar uniforms de deformación en GPU para zancada de piernas y braceo
    for (const mat of this.customShaderMaterials) {
      if (mat.userData && mat.userData.shader) {
        mat.userData.shader.uniforms.uWalkTime.value = this.walkTimer;
        mat.userData.shader.uniforms.uWalkWeight.value = this.walkWeight;
      }
    }

    // Cinemática de locomoción fluida (sin saltos bruscos):
    // - Ondulación pélvica sutil (solo 2.2cm, onda continua sinusoidal)
    const verticalBob = -Math.cos(this.walkTimer * 2.0) * 0.022 * this.walkWeight;

    // - Inclinación centrífuga en curvas (turn banking)
    let diffRot = this.targetRot - this.group.rotation.y;
    while (diffRot < -Math.PI) diffRot += Math.PI * 2;
    while (diffRot > Math.PI) diffRot -= Math.PI * 2;
    const turnBank = THREE.MathUtils.clamp(-diffRot * 0.35, -0.14, 0.14) * this.walkWeight;

    // - Inclinación de inercia y balanceo suave de cadera
    const forwardLean = 0.07 * this.walkWeight;
    const hipSway = Math.sin(this.walkTimer) * 0.035 * this.walkWeight;
    const breathe = Math.sin(now * 0.003) * 0.015 * (1.0 - this.walkWeight);

    // Extremidades procedurales (cuando se usa fallback)
    this.leftLegGroup.rotation.x = Math.sin(this.walkTimer) * 0.65 * this.walkWeight;
    this.rightLegGroup.rotation.x = -Math.sin(this.walkTimer) * 0.65 * this.walkWeight;
    if (!this.isCasting) {
      this.leftArmGroup.rotation.x = -Math.sin(this.walkTimer) * 0.55 * this.walkWeight;
      this.leftArmGroup.rotation.z = THREE.MathUtils.lerp(this.leftArmGroup.rotation.z, turnBank, 0.2);
      this.rightArmGroup.rotation.x = Math.sin(this.walkTimer) * 0.55 * this.walkWeight;
      this.rightArmGroup.rotation.z = THREE.MathUtils.lerp(this.rightArmGroup.rotation.z, -turnBank, 0.2);
    }

    this.bodyMesh.position.y = 0.95 + verticalBob + breathe + castOffsetY;
    this.bodyMesh.position.z = castOffsetZ;
    this.bodyMesh.rotation.x = forwardLean + castRotX;
    this.bodyMesh.rotation.z = hipSway + turnBank + castRotZ;

    if (this.customModelMesh) {
      this.customModelMesh.position.y = verticalBob + breathe + castOffsetY;
      this.customModelMesh.position.z = castOffsetZ;
      this.customModelMesh.rotation.x = forwardLean + castRotX;
      this.customModelMesh.rotation.y = Math.PI + castRotY;
      this.customModelMesh.rotation.z = hipSway + turnBank + castRotZ;
      this.customModelMesh.scale.set(castScale, castScale, castScale);
    }

    this.group.position.x += (this.targetX - this.group.position.x) * posLerp;
    this.group.position.z += (this.targetZ - this.group.position.z) * posLerp;
    this.group.rotation.y += diffRot * rotLerp;
  }

  public destroy(scene: THREE.Scene): void {
    scene.remove(this.group);
  }
}
