# Master Game Document & Bootstrap: RPG Cooperativo WLAN / Futuro MMORPG Cloud

> **INSTRUCCIÓN OPERATIVA DIRECTA PARA GOOGLE ANTIGRAVITY:**
> Al leer este documento por primera vez, tu **prioridad absoluta e inmediata** es ejecutar la **Sección 0: "Bootstrap de la Demo Jugable Inmediata"**. Debes generar todos los archivos fuente de la demo mínima autoritativa (servidor WebSocket + cliente Three.js en navegador) y dejar el servidor listo y escuchando en `0.0.0.0:3000` para que el desarrollador pueda probar el movimiento multijugador local de inmediato con su familia. Una vez validada la demo por el usuario, procederás con la arquitectura completa en monorepo de las secciones siguientes.

---

## 0. Bootstrap de la Demo Jugable Inmediata (Fase Cero)

Antigravity debe crear y desplegar de inmediato la siguiente estructura de archivos mínima ejecutable:

### Archivos a generar por Antigravity de inmediato:
1. `package.json`: Configurado con `"type": "module"` y dependencias `express` y `ws`.
2. `server.js`:
   - Servidor HTTP con `express` sirviendo la carpeta estática `public/`.
   - Servidor `ws` (WebSocket) escuchando en `0.0.0.0` y puerto `3000`.
   - Loop autoritativo a 30 ticks por segundo (`setInterval` a 33.3ms).
   - Manejo de entradas (`up`, `down`, `left`, `right`) y cálculo de coordenadas en el servidor.
   - Emisión de estado consolidado (`WorldState`) a todos los sockets conectados.
3. `public/index.html`:
   - Vista web con Three.js cargado vía importmap (`https://unpkg.com/three@0.160.0/build/three.module.js`).
   - Cámara cenital isométrica a 45 grados.
   - Plano con `GridHelper` y luces básica (Ambiental y Direccional).
   - Conexión dinámica a `ws://${window.location.host}` (para funcionar tanto en `localhost` como a través de IPs locales `192.168.x.x`).
   - Mallas 3D para jugadores (azul para el cliente local, rojo para otros dispositivos en la red).
   - Interpolación lineal (*lerp*) entre los estados de posición recibidos del servidor.
   - Captura de teclado (WASD y flechas) transmitiendo los inputs hacia el servidor.
   - Indicador en pantalla en tiempo real con la IP local sugerida para que otros dispositivos de la casa se conecten.

---

## 1. Visión del Proyecto y Filosofía de Diseño

* **Concepto:** Juego de rol cooperativo en tiempo real con perspectiva isométrica (estilo *Albion Online* / *World of Warcraft* / *Diablo*).
* **Enfoque Inicial:** Red de Área Local Inalámbrica (**WLAN/LAN**), optimizado para partidas de 2 a 6 jugadores sin necesidad de internet externo ni costos de servidores en la nube.
* **Enfoque Futuro:** Migración transparente a la nube con servidores dedicados, múltiples zonas y combate PvP masivo.
* **Plataforma Objetivo:** Navegadores web de escritorio y móviles mediante WebGL/WebGPU (Chrome, Firefox, Safari/Edge).
* **Regla Fundamental:** **Servidor Autoritativo ("Never Trust the Client")**. Todo cálculo de movimiento, colisión, cooldowns, daño, inventario y persistencia reside en el backend. El cliente solo renderiza e interactúa.

---

## 2. Stack Tecnológico Definitivo

| Capa | Tecnología | Justificación |
| :--- | :--- | :--- |
| **Arquitectura de Código** | Monorepo (pnpm workspaces / npm workspaces) | Código compartido tipado entre cliente y servidor sin duplicación de modelos. |
| **Lenguaje Principal** | TypeScript (modo estricto) | Seguridad de tipos de extremo a extremo. |
| **Cliente Web (Frontend)** | Three.js / Babylon.js + Vite | Ligero, modular, óptimo para navegadores y bajo consumo de memoria. |
| **Interfaz de Usuario (HUD)** | DOM Overlay HTML5/CSS | Desacoplada del canvas 3D para interfaces de inventario, chat y vida. |
| **Servidor Autoritativo** | Node.js con WebSockets (`ws`) | Loop de simulación en ticks (20-30 Hz) con bajo consumo de CPU. |
| **Persistencia** | Prisma o Drizzle ORM | Permite usar **SQLite** en la etapa local y conmutar a **PostgreSQL** en la nube sin cambiar modelos de datos. |

---

## 3. Estructura del Monorepo Progresivo

```
game-project/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── packages/
│   ├── common/                # Paquete compartido (Zero dependencies externas)
│   │   ├── src/
│   │   │   ├── types/         # Entidades, Enums, DTOs
│   │   │   ├── network/       # Definición de mensajes (Packets/Events)
│   │   │   └── constants/     # Ticks por segundo, velocidades, stats base
│   │   └── package.json
│   ├── server/                # Servidor Autoritativo Node.js
│   │   ├── src/
│   │   │   ├── game/          # GameLoop, WorldState, SpatialGrid, PlayerManager
│   │   │   ├── systems/       # MovementSystem, CombatSystem, SpawningSystem
│   │   │   ├── network/       # WebSocket Server, Sesiones, Serializadores
│   │   │   └── db/            # Schema ORM, Repositorios (SQLite / Postgres)
│   │   ├── prisma/ o drizzle/
│   │   └── package.json
│   └── client/                # Cliente Web (Vite + 3D Engine)
│       ├── src/
│       │   ├── core/          # Inicialización del Engine 3D, Render Loop
│       │   ├── network/       # Conexión WebSocket, Reconciliación, Interpolación
│       │   ├── entities/      # Renderizado de Mallas, Animaciones, Interpoladores
│       │   ├── input/         # Keyboard, Mouse / Touch Input
│       │   └── ui/            # HUD, Chat, Barras de Vida, Inventario
│       ├── public/assets/     # Modelos .glb, texturas, audios
│       └── package.json
```

---

## 4. Prompts Estructurados de Ejecución para Antigravity

Antigravity debe ejecutar estos prompts secuencialmente:

### Prompt 0: Construcción y Arranque de la Demo Inmediata
```
Lee este documento y ejecuta de inmediato la Sección 0.
Genera el package.json con express y ws, el archivo server.js autoritativo a 30 ticks escuchando en 0.0.0.0:3000 y el archivo public/index.html con Three.js e interpolación de movimiento multijugador.
Instala las dependencias y deja el servidor listo para que pueda abrir http://localhost:3000 y probar el movimiento con otro dispositivo en la red Wi-Fi.
```

### Prompt 1: Monorepo TypeScript y Contratos de Red
```
Ahora que la demo básica está validada, migra el código hacia la arquitectura de monorepo formal descrita en la Sección 3:
1. Configura npm/pnpm workspaces con tsconfig.base.json y los paquetes: common, server y client.
2. En 'common': define los tipos de red (JOIN, LEAVE, INPUT, WORLD_STATE, Vector3, PlayerDTO).
3. En 'server': porta el servidor a TypeScript, enlazando los tipos de 'common' y escuchando en 0.0.0.0:3001.
4. En 'client': inicializa una app con Vite + TypeScript que consuma los tipos compartidos y se conecte automáticamente al host de la red local.
```

### Prompt 2: Sistema de Entidades, Cámara Isométrica y Colisiones
```
Sobre la base del monorepo:
1. En 'server': agrega un bucle de simulación con deltaTime compensado, límites de mapa y colisiones estáticas con obstáculos circulares y rectangulares.
2. En 'client': implementa una cámara isométrica suave (smooth follow) que siga al jugador local.
3. Agrega interpolación por buffer de estados en el cliente para eliminar cualquier micro-stuttering visual.
```

### Prompt 3: Sistema de Combate Cooperativo PvE (Tanque, Healer, DPS)
```
Implementa el sistema cooperativo de combate autoritativo:
1. En 'common': define roles (Warrior, Cleric, Mage) y habilidades con rango, cooldown y tipo de efecto.
2. En 'server': crea un Spawner de monstruos con una máquina de estados básica (IDLE, CHASE, ATTACK, DEAD) y tabla de aggro.
3. El cliente solo envía solicitudes de habilidad ('CAST_SPELL'). El servidor valida cooldowns y distancias antes de aplicar daño o curación.
4. En 'client': agrega selección de objetivo con clic de ratón y un HUD en HTML/CSS con barras de vida flotantes y barra de skills.
```

### Prompt 4: Persistencia Local con ORM y Carga de Modelos 3D (.glb)
```
1. En 'server': integra Prisma o Drizzle ORM con base de datos SQLite local ('dev.db') para guardar perfiles de personajes e inventario.
2. En 'client': configura GLTFLoader para sustituir los cubos primitivos por mallas 3D estilizadas con animaciones de correr, estar quieto y atacar.
3. Configura el script de ejecución 'npm run serve:lan' para iniciar todo con un solo comando.
```

### Prompt 5: Preparación para Despliegue en la Nube (Producción / MMO)
```
Prepara el proyecto para migración a la nube:
1. Configura el ORM para soportar PostgreSQL mediante la variable 'DATABASE_URL'.
2. Diseña Dockerfile multi-stage y docker-compose.yml con contenedores para el Game Server, PostgreSQL y Redis.
3. Agrega validación estricta de esquemas (Zod) para todos los paquetes de entrada del cliente y modulariza el servidor para soportar múltiples estancias o zonas de mapa.
```