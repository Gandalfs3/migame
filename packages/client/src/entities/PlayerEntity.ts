import * as THREE from 'three';

export class PlayerEntity {
  public id: string;
  public group: THREE.Group;
  public targetX: number = 0;
  public targetZ: number = 0;
  public targetRot: number = 0;
  public isLocal: boolean;

  constructor(scene: THREE.Scene, id: string, colorHex: string, isLocal: boolean) {
    this.id = id;
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

    // Cuerpo (cápsula estilizada)
    const bodyGeo = new THREE.CapsuleGeometry(0.5, 0.8, 8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: 0.3,
      metalness: 0.2
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.9;
    body.castShadow = true;
    this.group.add(body);

    // Visor frontal
    const visorGeo = new THREE.BoxGeometry(0.35, 0.2, 0.3);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.15, 0.4);
    this.group.add(visor);

    scene.add(this.group);
  }

  public setTarget(x: number, z: number, rotation: number): void {
    this.targetX = x;
    this.targetZ = z;
    this.targetRot = rotation;
  }

  public update(posLerp: number = 0.25, rotLerp: number = 0.3): void {
    // Interpolación de posición (Lerp)
    this.group.position.x += (this.targetX - this.group.position.x) * posLerp;
    this.group.position.z += (this.targetZ - this.group.position.z) * posLerp;

    // Interpolación de rotación tomando el camino más corto
    let diffRot = this.targetRot - this.group.rotation.y;
    while (diffRot < -Math.PI) diffRot += Math.PI * 2;
    while (diffRot > Math.PI) diffRot -= Math.PI * 2;
    this.group.rotation.y += diffRot * rotLerp;
  }

  public destroy(scene: THREE.Scene): void {
    scene.remove(this.group);
  }
}
