import * as THREE from 'three';
import { PlayerClass } from '@migame/common';

export const CLASS_RANGES: Record<PlayerClass, number> = {
  WARRIOR: 2.8,
  CLERIC: 11.0,
  MAGE: 13.0
};

export class RangeIndicator {
  private group: THREE.Group;
  private fillMesh: THREE.Mesh;
  private ringMesh: THREE.Mesh;
  private currentRadius: number = 2.8;
  private targetRadius: number = 2.8;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.position.y = 0.025; // Justo sobre el suelo

    // 1. Área interior gris suave y translúcida
    const fillGeo = new THREE.CircleGeometry(1, 64);
    const fillMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.10,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.fillMesh = new THREE.Mesh(fillGeo, fillMat);
    this.fillMesh.rotation.x = -Math.PI / 2;
    this.group.add(this.fillMesh);

    // 2. Anillo perimetral sutil que delimita el alcance
    const ringGeo = new THREE.RingGeometry(0.96, 1.0, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xcbd5e1,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.ringMesh = new THREE.Mesh(ringGeo, ringMat);
    this.ringMesh.rotation.x = -Math.PI / 2;
    this.group.add(this.ringMesh);

    // Escala inicial
    this.group.scale.set(this.currentRadius, 1, this.currentRadius);
    scene.add(this.group);
  }

  public setClass(classType: PlayerClass): void {
    this.targetRadius = CLASS_RANGES[classType] || 2.8;
  }

  public update(playerX: number, playerZ: number): void {
    this.group.position.x = playerX;
    this.group.position.z = playerZ;

    // Transición suave de tamaño al cambiar de rol
    if (Math.abs(this.currentRadius - this.targetRadius) > 0.05) {
      this.currentRadius += (this.targetRadius - this.currentRadius) * 0.15;
      this.group.scale.set(this.currentRadius, 1, this.currentRadius);
    }
  }

  public setVisible(visible: boolean): void {
    this.group.visible = visible;
  }
}
