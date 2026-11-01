import * as THREE from 'three';

interface TextEntry {
  element: HTMLElement;
  worldPos: THREE.Vector3;
  startTime: number;
  duration: number;
}

export class FloatingTextManager {
  private container: HTMLElement;
  private entries: TextEntry[] = [];

  constructor() {
    let el = document.getElementById('floating-combat-text-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'floating-combat-text-container';
      el.style.position = 'absolute';
      el.style.top = '0';
      el.style.left = '0';
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.pointerEvents = 'none';
      el.style.overflow = 'hidden';
      el.style.zIndex = '50';
      document.body.appendChild(el);
    }
    this.container = el;
  }

  public spawn(amount: number, isHeal: boolean, x: number, z: number, y: number = 2.0): void {
    const textEl = document.createElement('div');
    textEl.textContent = (isHeal ? '+' : '-') + Math.round(amount);
    textEl.style.position = 'absolute';
    textEl.style.transform = 'translate(-50%, -50%)';
    textEl.style.fontWeight = '800';
    textEl.style.fontSize = isHeal ? '18px' : '20px';
    textEl.style.color = isHeal ? '#22c55e' : (amount >= 40 ? '#f97316' : '#ef4444');
    textEl.style.textShadow = '0 0 6px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.9)';
    textEl.style.transition = 'opacity 0.2s';
    textEl.style.fontFamily = 'monospace, sans-serif';

    this.container.appendChild(textEl);

    this.entries.push({
      element: textEl,
      worldPos: new THREE.Vector3(x + (Math.random() - 0.5) * 0.5, y, z + (Math.random() - 0.5) * 0.5),
      startTime: performance.now(),
      duration: 1200 // 1.2 segundos de animación
    });
  }

  public update(camera: THREE.Camera): void {
    const now = performance.now();
    const remaining: TextEntry[] = [];

    const tempV = new THREE.Vector3();
    const widthHalf = window.innerWidth / 2;
    const heightHalf = window.innerHeight / 2;

    for (const entry of this.entries) {
      const elapsed = now - entry.startTime;
      if (elapsed >= entry.duration) {
        entry.element.remove();
        continue;
      }

      const progress = elapsed / entry.duration;
      // Flotar hacia arriba
      const curY = entry.worldPos.y + progress * 1.5;

      tempV.set(entry.worldPos.x, curY, entry.worldPos.z);
      tempV.project(camera);

      // Si está detrás de la cámara, ocultar
      if (tempV.z > 1) {
        entry.element.style.display = 'none';
      } else {
        entry.element.style.display = 'block';
        const screenX = (tempV.x * widthHalf) + widthHalf;
        const screenY = -(tempV.y * heightHalf) + heightHalf;

        entry.element.style.left = `${screenX}px`;
        entry.element.style.top = `${screenY}px`;
        entry.element.style.opacity = `${1 - Math.pow(progress, 2)}`;
      }

      remaining.push(entry);
    }

    this.entries = remaining;
  }
}
