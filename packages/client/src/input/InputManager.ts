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
    const attachButton = (id: string, key: keyof InputState) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      const press = (e: Event) => {
        e.preventDefault();
        this.state[key] = true;
        btn.classList.add('active');
        this.notify();
      };

      const release = (e: Event) => {
        e.preventDefault();
        this.state[key] = false;
        btn.classList.remove('active');
        this.notify();
      };

      btn.addEventListener('touchstart', press, { passive: false });
      btn.addEventListener('touchend', release, { passive: false });
      btn.addEventListener('mousedown', press);
      btn.addEventListener('mouseup', release);
      btn.addEventListener('mouseleave', release);
    };

    attachButton('btn-up', 'up');
    attachButton('btn-down', 'down');
    attachButton('btn-left', 'left');
    attachButton('btn-right', 'right');
  }
}
