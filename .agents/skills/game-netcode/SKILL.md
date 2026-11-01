---
name: game-netcode
description: Directrices, algoritmos y patrones para netcode multijugador web en tiempo real, simulación autoritativa en ticks, interpolación lineal de entidades y Three.js isométrico.
---

# Game Netcode & Multiplayer 3D Web Guide

Esta skill proporciona las mejores prácticas y snippets para el desarrollo del RPG cooperativo.

## 1. Loop Autoritativo en Node.js (Delta Time Compensado)
- Mantener una tasa fija de ticks (20 Hz = 50ms, 30 Hz = 33.3ms).
- Usar `performance.now()` o `process.hrtime.bigint()` para calcular el delta exacto entre ticks y evitar desincronización acumulada.

```javascript
const TICK_RATE = 30;
const TICK_INTERVAL = 1000 / TICK_RATE;
let lastTickTime = performance.now();

setInterval(() => {
  const now = performance.now();
  const dt = (now - lastTickTime) / 1000;
  lastTickTime = now;
  updateGameWorld(dt);
  broadcastWorldState();
}, TICK_INTERVAL);
```

## 2. Interpolación en el Cliente (Three.js Lerp)
- Recibir `WorldState` del servidor y guardar la posición objetivo (`targetPosition`) de cada entidad.
- En cada frame de `requestAnimationFrame`:
```javascript
mesh.position.lerp(targetPosition, 0.2);
```

## 3. Descubrimiento de IP Local en Node.js
Para mostrar la IP de la máquina anfitriona a los demás miembros de la familia:
```javascript
import os from 'os';

export function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}
```

## 4. Cámara Isométrica Suave
- Posicionar la cámara a un ángulo fijo (ej. `x + 15, y + 20, z + 15`) mirando a la posición del jugador.
- Usar `camera.position.lerp(...)` y `controls.target.lerp(...)` o `camera.lookAt(...)`.
