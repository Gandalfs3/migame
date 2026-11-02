import * as THREE from 'three';
import { ZoneThemeDTO } from '@migame/common';
import { ProceduralTextureFactory } from '../textures/ProceduralTextureFactory.js';

export class Engine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public cameraOffset: THREE.Vector3 = new THREE.Vector3(14, 18, 14);

  private ambientLight!: THREE.AmbientLight;
  private dirLight!: THREE.DirectionalLight;
  private groundMesh!: THREE.Mesh;
  private groundMat!: THREE.MeshStandardMaterial;
  private gridHelper!: THREE.GridHelper;
  private borderRing!: THREE.Mesh;

  constructor(containerId: string = 'canvas-container') {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container #${containerId} no encontrado.`);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#09140e');
    this.scene.fog = new THREE.FogExp2('#09140e', 0.024);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(this.cameraOffset.x, this.cameraOffset.y, this.cameraOffset.z);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.setupEnvironment();
    this.setupResize();
  }

  private setupLighting(): void {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    this.dirLight.position.set(25, 40, 20);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.scene.add(this.dirLight);
  }

  private setupEnvironment(): void {
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    this.groundMat = ProceduralTextureFactory.getMaterialForGround('zone_forest');
    this.groundMesh = new THREE.Mesh(groundGeo, this.groundMat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    this.gridHelper = new THREE.GridHelper(50, 50, 0x22c55e, 0x14532d);
    this.gridHelper.position.y = 0.01;
    (this.gridHelper.material as THREE.Material).transparent = true;
    (this.gridHelper.material as THREE.Material).opacity = 0.25;
    this.scene.add(this.gridHelper);

    // Límite circular del mapa
    const borderGeo = new THREE.RingGeometry(23.8, 24.2, 64);
    const borderMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    this.borderRing = new THREE.Mesh(borderGeo, borderMat);
    this.borderRing.rotation.x = -Math.PI / 2;
    this.borderRing.position.y = 0.02;
    this.scene.add(this.borderRing);
  }

  public applyZoneTheme(theme: ZoneThemeDTO): void {
    this.scene.background = new THREE.Color(theme.fogColor);
    this.scene.fog = new THREE.FogExp2(theme.fogColor, theme.fogDensity);

    this.groundMat = ProceduralTextureFactory.getMaterialForGround(theme.id);
    this.groundMesh.material = this.groundMat;

    if (this.gridHelper) {
      this.scene.remove(this.gridHelper);
      this.gridHelper.geometry.dispose();
    }
    this.gridHelper = new THREE.GridHelper(
      50,
      50,
      new THREE.Color(theme.gridColor1),
      new THREE.Color(theme.gridColor2)
    );
    this.gridHelper.position.y = 0.01;
    (this.gridHelper.material as THREE.Material).transparent = true;
    (this.gridHelper.material as THREE.Material).opacity = 0.25;
    this.scene.add(this.gridHelper);

    this.ambientLight.color.set(theme.ambientLightColor);
    this.dirLight.color.set(theme.dirLightColor);
  }

  private setupResize(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  public followTarget(targetX: number, targetZ: number, lerpRate: number = 0.1): void {
    const desiredX = targetX + this.cameraOffset.x;
    const desiredY = this.cameraOffset.y;
    const desiredZ = targetZ + this.cameraOffset.z;

    this.camera.position.x += (desiredX - this.camera.position.x) * lerpRate;
    this.camera.position.y += (desiredY - this.camera.position.y) * lerpRate;
    this.camera.position.z += (desiredZ - this.camera.position.z) * lerpRate;

    this.camera.lookAt(targetX, 1, targetZ);
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
