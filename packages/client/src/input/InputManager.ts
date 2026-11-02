import { InputState } from '@migame/common';

export class InputManager {
  public state: InputState = { up: false, down: false, left: false, right: false };
  private onInputChange?: (state: InputState) => void;

  constructor(callback?: (state: InputState) => void) {
    this.onInputChange = callback;
    this.setupKeyboard();
    this.setupTouchControls();
  }

  public setCallback(callback: (state: InputState) => void): void {
    this.onInputChange = callback;
  }

  private notify(): void {
    if (this.onInputChange) {
      this.onInputChange({ ...this.state });
    }
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      let changed = false;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        if (!this.state.up) { this.state.up = true; changed = true; }
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        if (!this.state.down) { this.state.down = true; changed = true; }
      }
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        if (!this.state.left) { this.state.left = true; changed = true; }
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        if (!this.state.right) { this.state.right = true; changed = true; }
      }
      if (changed) this.notify();
    });

    window.addEventListener('keyup', (e) => {
      let changed = false;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        if (this.state.up) { this.state.up = false; changed = true; }
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        if (this.state.down) { this.state.down = false; changed = true; }
      }
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        if (this.state.left) { this.state.left = false; changed = true; }
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        if (this.state.right) { this.state.right = false; changed = true; }
      }
      if (changed) this.notify();
    });
  }

  private setupTouchControls(): void {
    const dpad = document.getElementById('mobile-dpad');
    if (!dpad) return;

    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');

    const buttons: { id: string; key: keyof InputState; el: HTMLElement | null }[] = [
      { id: 'btn-up', key: 'up', el: btnUp },
      { id: 'btn-down', key: 'down', el: btnDown },
      { id: 'btn-left', key: 'left', el: btnLeft },
      { id: 'btn-right', key: 'right', el: btnRight }
    ];

    const resetAll = () => {
      let changed = false;
      for (const b of buttons) {
        if (this.state[b.key]) {
          this.state[b.key] = false;
          changed = true;
        }
        b.el?.classList.remove('active');
      }
      if (changed) this.notify();
    };

    const updateFromTouch = (touch: Touch) => {
      const hit = document.elementFromPoint(touch.clientX, touch.clientY);
      let changed = false;

      for (const b of buttons) {
        const isHit = b.el && (hit === b.el || b.el.contains(hit));
        if (isHit) {
          if (!this.state[b.key]) {
            this.state[b.key] = true;
            b.el?.classList.add('active');
            changed = true;
          }
        } else {
          if (this.state[b.key]) {
            this.state[b.key] = false;
            b.el?.classList.remove('active');
            changed = true;
          }
        }
      }

      if (changed) this.notify();
    };

    // Soporte para gestos táctiles (flick / arrastrar pulgar fluido)
    dpad.addEventListener('touchstart', (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        updateFromTouch(e.touches[0]);
      }
    }, { passive: false });

    dpad.addEventListener('touchmove', (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        updateFromTouch(e.touches[0]);
      }
    }, { passive: false });

    dpad.addEventListener('touchend', (e: TouchEvent) => {
      e.preventDefault();
      resetAll();
    }, { passive: false });

    dpad.addEventListener('touchcancel', (e: TouchEvent) => {
      e.preventDefault();
      resetAll();
    }, { passive: false });

    // Fallback para clicks con mouse
    for (const b of buttons) {
      if (!b.el) continue;
      b.el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.state[b.key] = true;
        b.el?.classList.add('active');
        this.notify();
      });
      b.el.addEventListener('mouseup', (e) => {
        e.preventDefault();
        this.state[b.key] = false;
        b.el?.classList.remove('active');
        this.notify();
      });
      b.el.addEventListener('mouseleave', () => {
        if (this.state[b.key]) {
          this.state[b.key] = false;
          b.el?.classList.remove('active');
          this.notify();
        }
      });
    }
  }
}
