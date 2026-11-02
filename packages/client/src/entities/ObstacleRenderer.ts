import * as THREE from 'three';
import { ObstacleDTO } from '@migame/common';
import { ProceduralTextureFactory } from '../textures/ProceduralTextureFactory';


export class ObstacleRenderer {
  private scene: THREE.Scene;
  private meshes: THREE.Object3D[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public clear(): void {
    for (const mesh of this.meshes) {
      this.scene.remove(mesh);
    }
    this.meshes = [];
  }

  public renderObstacles(obstacles: ObstacleDTO[]): void {
    this.clear();

    for (const obs of obstacles) {
      if (obs.type === 'box') {
        const group = new THREE.Group();
        group.position.set(obs.x, 0, obs.z);

        if (obs.kind === 'pillar') {
          // Base del pilar
          const baseGeo = new THREE.BoxGeometry(obs.width * 1.15, 0.4, obs.depth * 1.15);
          const baseMat = ProceduralTextureFactory.getMaterialForObstacle("pillar");
          const base = new THREE.Mesh(baseGeo, baseMat);
          base.position.y = 0.2;
          base.castShadow = true;
          base.receiveShadow = true;
          group.add(base);

          // Fuste / Cuerpo del pilar
          const bodyGeo = new THREE.BoxGeometry(obs.width, obs.height - 0.8, obs.depth);
          const bodyMat = ProceduralTextureFactory.getMaterialForObstacle("pillar");
          const body = new THREE.Mesh(bodyGeo, bodyMat);
          body.position.y = obs.height / 2;
          body.castShadow = true;
          body.receiveShadow = true;
          group.add(body);

          // Capitel superior
          const capGeo = new THREE.BoxGeometry(obs.width * 1.2, 0.4, obs.depth * 1.2);
          const cap = new THREE.Mesh(capGeo, baseMat);
          cap.position.y = obs.height - 0.2;
          cap.castShadow = true;
          group.add(cap);
        } else {
          // Muro de piedra
          const wallGeo = new THREE.BoxGeometry(obs.width, obs.height, obs.depth);
          const wallMat = ProceduralTextureFactory.getMaterialForObstacle("wall");
          const wall = new THREE.Mesh(wallGeo, wallMat);
          wall.position.y = obs.height / 2;
          wall.castShadow = true;
          wall.receiveShadow = true;
          group.add(wall);
        }

        this.scene.add(group);
        this.meshes.push(group);
      } else if (obs.type === 'circle') {
        const group = new THREE.Group();
        group.position.set(obs.x, 0, obs.z);

        if (obs.kind === 'tree') {
          // Tronco de árbol estilizado
          const trunkGeo = new THREE.CylinderGeometry(obs.radius * 0.35, obs.radius * 0.45, obs.height * 0.4, 8);
          const trunkMat = ProceduralTextureFactory.getMaterialForObstacle("tree");
          const trunk = new THREE.Mesh(trunkGeo, trunkMat);
          trunk.position.y = (obs.height * 0.4) / 2;
          trunk.castShadow = true;
          group.add(trunk);

          // Copa de hojas cónica / estilizada baja poligonización
          const foliageGeo1 = new THREE.ConeGeometry(obs.radius * 1.3, obs.height * 0.4, 7);
          const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
          const foliage1 = new THREE.Mesh(foliageGeo1, foliageMat);
          foliage1.position.y = obs.height * 0.4 + (obs.height * 0.4) / 2;
          foliage1.castShadow = true;
          group.add(foliage1);

          const foliageGeo2 = new THREE.ConeGeometry(obs.radius * 0.95, obs.height * 0.35, 7);
          const foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 });
          const foliage2 = new THREE.Mesh(foliageGeo2, foliageMat2);
          foliage2.position.y = obs.height * 0.65 + (obs.height * 0.35) / 2;
          foliage2.castShadow = true;
          group.add(foliage2);
        } else {
          // Roca estilizada
          const rockGeo = new THREE.DodecahedronGeometry(obs.radius, 1);
          const rockMat = ProceduralTextureFactory.getMaterialForObstacle("rock");
          const rock = new THREE.Mesh(rockGeo, rockMat);
          rock.position.y = obs.radius * 0.85;
          rock.scale.set(1, 0.75, 1);
          rock.castShadow = true;
          rock.receiveShadow = true;
          group.add(rock);
        }

        this.scene.add(group);
        this.meshes.push(group);
      }
    }
  }
}
