import * as THREE from 'three';

export class Engine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public cameraOffset: THREE.Vector3 = new THREE.Vector3(14, 18, 14);

  constructor(containerId: string = 'canvas-container') {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container #${containerId} no encontrado.`);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#090d16');
    this.scene.fog = new THREE.FogExp2('#090d16', 0.025);

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    dirLight.position.set(25, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);
  }

  private setupEnvironment(): void {
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.85,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const grid = new THREE.GridHelper(50, 50, 0x3b82f6, 0x1e293b);
    grid.position.y = 0.01;
    this.scene.add(grid);

    // Límite circular del mapa
    const borderGeo = new THREE.RingGeometry(23.8, 24.2, 64);
    const borderMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    const borderRing = new THREE.Mesh(borderGeo, borderMat);
    borderRing.rotation.x = -Math.PI / 2;
    borderRing.position.y = 0.02;
    this.scene.add(borderRing);
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
