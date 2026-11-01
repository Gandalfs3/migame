import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class AssetManager {
  private loader: GLTFLoader;
  private cache: Map<string, GLTF> = new Map();

  constructor() {
    this.loader = new GLTFLoader();
  }

  public async loadGLTF(url: string): Promise<GLTF | null> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    try {
      const gltf = await new Promise<GLTF>((resolve, reject) => {
        this.loader.load(
          url,
          (loaded) => resolve(loaded),
          undefined,
          (err) => reject(err)
        );
      });
      this.cache.set(url, gltf);
      return gltf;
    } catch (err) {
      console.warn(`[AssetManager] Modelo no encontrado en '${url}'. Usando fallback procedural nativo.`);
      return null;
    }
  }
}
