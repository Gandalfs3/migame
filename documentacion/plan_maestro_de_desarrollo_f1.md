# Master Game Document: RPG Cooperativo WLAN / Futuro MMORPG Cloud

Este documento define la visión técnica, la arquitectura de software, la hoja de ruta en fases progresivas y los prompts estructurados para la suite de agentes **Google Antigravity**.

## 1. Visión del Proyecto y Filosofía de Diseño

* **Concepto:** Juego de rol cooperativo en tiempo real con perspectiva isométrica (estilo *Albion Online* / *World of Warcraft* / *Diablo*).

* **Enfoque Inicial (Fase 1-4):** Red de Área Local Inalámbrica (**WLAN/LAN**), optimizado para partidas familiares de 2 a 6 jugadores sin necesidad de conexión a internet externa ni costos de infraestructura.

* **Enfoque Futuro (Fase 5+):** Migración a la nube con capacidades de escalado, servidores dedicados, múltiples zonas y combate PvP masivo.

* **Plataforma Objetivo:** Navegadores web de escritorio y tablets mediante WebGL/WebGPU (Chrome, Firefox, Safari/Edge).

* **Regla Fundamental de Arquitectura:** **Servidor Autoritativo ("Never Trust the Client")**. Todo cálculo de movimiento, colisión, cooldowns, daño, inventario y persistencia reside en el servidor. El cliente es puramente una interfaz de renderizado, audio y captura de inputs.

## 2. Stack Tecnológico

| Capa | Tecnología | Justificación | 
| ----- | ----- | ----- | 
| **Arquitectura de Repositorio** | Monorepo (pnpm workspaces / npm workspaces) | Código compartido tipado entre cliente y servidor sin duplicación de modelos. | 
| **Lenguaje Principal** | TypeScript (estricto en todo el proyecto) | Seguridad de tipos de extremo a extremo y consistencia cognitiva. | 
| **Cliente Web (Frontend)** | **Three.js** o **Babylon.js** + **Vite** | Ligero, modular, excelente soporte de modelos `.glb` y shaders en navegador. | 
| **Interfaz de Usuario (HUD)** | DOM Overlay HTML5/CSS sobre el Canvas | Mantiene menús, barras de vida e inventarios desacoplados del loop gráfico 3D. | 
| **Servidor Autoritativo** | **Node.js** con WebSocket (`ws`) o **Colyseus** | Simulación en ticks (20-30 Hz) con bajo consumo de recursos en la máquina host. | 
| **Red y Transporte** | WebSockets (WLAN) / WebTransport (Cloud futuro) | Baja latencia en red local con soporte universal en navegadores. | 
| **Capa de Persistencia** | **Prisma** o **Drizzle ORM** | Permite utilizar **SQLite** para la fase local y migrar a **PostgreSQL** en la nube solo cambiando la cadena de conexión. | 

## 3. Estructura del Monorepo

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
│   │   │   └── constants/     # Ticks por segundo, velocidad base, cooldowns
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

## 4. Fases de Desarrollo

```
┌─────────────────────────────────┐
│ Fase 1: Arquitectura Base & Red │
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ Fase 2: Simulación y Movimiento │
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ Fase 3: Combate Cooperativo PvE │
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ Fase 4: Persistencia & Entorno  │
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ Fase 5: Migración a la Nube     │
└─────────────────────────────────┘

```

## 5. Prompts Estructurados para Antigravity

Usa los siguientes prompts en el orden indicado dentro del workspace de Antigravity. Cada prompt está redactado con restricciones arquitectónicas estrictas.

### Fase 1: Inicialización del Monorepo y Canal de Red

#### Objetivo

Crear el monorepo de TypeScript, la configuración compartida, el servidor WebSocket escuchando en todas las interfaces de red (`0.0.0.0`) y un cliente web con Vite que establezca conexión exitosa.

#### Prompt para Antigravity:

```
Eres el arquitecto principal de un juego multijugador web en tiempo real.
Vamos a inicializar el monorepo con soporte para TypeScript y las carpetas:
- packages/common
- packages/server
- packages/client

Requisitos técnicos estrictos:
1. Configura un monorepo usando npm/pnpm workspaces con un tsconfig.base.json compartido.
2. En 'packages/common':
   - Exporta tipos de red tipados: MessageType (JOIN, LEAVE, WORLD_STATE, INPUT), PlayerDTO y Vector3 (x, y, z).
3. En 'packages/server':
   - Implementa un servidor Node.js usando 'ws' y TypeScript.
   - El servidor debe escuchar en '0.0.0.0' y un puerto configurable por variable de entorno (por defecto 3001) para aceptar conexiones de cualquier dispositivo en la red local WLAN.
   - Asigna un ID único por conexión y registra entradas y salidas de jugadores.
4. En 'packages/client':
   - Configura una app basada en Vite + TypeScript.
   - Debe leer la dirección del servidor desde una variable de entorno 'VITE_SERVER_URL'. Si no está definida, debe conectarse dinámicamente a `ws://${window.location.hostname}:3001` para que funcione automáticamente en cualquier dispositivo familiar sin tocar código.
   - Muestra en pantalla el estado de la conexión (Conectado / Desconectado) y la lista de IDs de jugadores conectados.

Genera los archivos de configuración, package.json y el código fuente mínimo necesario y verifícalo.

```

### Fase 2: Servidor Autoritativo, Loop de Simulación e Interpolación

#### Objetivo

Implementar un bucle de juego autoritativo a 20-30 ticks por segundo, movimiento por teclado/mouse validado en el servidor y renderizado 3D fluido en el cliente mediante interpolación lineal (*lerp*).

#### Prompt para Antigravity:

```
Continuando con nuestro monorepo, vamos a implementar el bucle de simulación autoritativo y el renderizado 3D básico.

Requisitos técnicos:
1. En 'packages/common':
   - Agrega estructuras para 'PlayerInputMessage' (teclas presionadas o dirección de movimiento deseada) y 'WorldStateMessage' (timestamp, lista de jugadores con posición, rotación y velocidad).
2. En 'packages/server':
   - Implementa un GameLoop autoritativo que se ejecute a 20 ticks por segundo (50ms por tick) usando setInterval con delta time compensado.
   - Las entradas de los clientes no alteran directamente la posición en el cliente: el cliente envía su dirección de movimiento deseada; el servidor calcula la nueva posición (previniendo velocidades mayores a PLAYER_SPEED * deltaTime) y emite el WorldState a todos los clientes.
   - Implementa un límite de mapa circular o cuadrado simple para evitar que los jugadores salgan del área jugable.
3. En 'packages/client':
   - Integra Three.js (o Babylon.js) en un canvas responsivo a pantalla completa.
   - Configura una cámara isométrica (cenital inclinada a ~45 grados) que siga al jugador local.
   - Representa a cada jugador conectado como un cubo o cápsula 3D con un color distintivo.
   - Implementa interpolación de entidades (Entity Interpolation / Lerp) en el bucle 'requestAnimationFrame' del cliente para que el movimiento sea completamente fluido a 60 FPS a pesar de recibir datos del servidor a 20 Hz.
   - Captura eventos de entrada (WASD o clics en el terreno) y envíalos continuamente al servidor por WebSocket.

```

### Fase 3: Combate Cooperativo (PvE), Roles y Máquina de Estados de NPCs

#### Objetivo

Construir el núcleo del juego cooperativo familiar: roles de personaje (Tanque, Sanador, DPS), enemigos controlados por el servidor con IA simple y sistema de habilidades con target y cooldowns.

#### Prompt para Antigravity:

```
Vamos a implementar el sistema de combate cooperativo PvE autoritativo.

Requisitos técnicos:
1. En 'packages/common':
   - Define clases de personaje: 'WARRIOR' (Tanque: alta vida, habilidad 'Taunt'), 'CLERIC' (Sanador: cura en área), 'MAGE' (DPS: daño a distancia con tiempo de lanzamiento).
   - Estructura de habilidades: Spell (id, name, cooldown, castTime, range, cost, effectType).
   - Define entidades enemigas: MonsterEntity (id, type, health, maxHealth, targetId, position).
   - Eventos de red: 'CAST_SPELL_REQUEST', 'SPELL_EXECUTED', 'DAMAGE_TAKEN', 'ENTITY_DIED'.
2. En 'packages/server':
   - Lógica de combate 100% autoritativa: el cliente solo solicita ejecutar una habilidad sobre un objetivo. El servidor valida rango, línea de visión y enfriamientos (cooldowns).
   - Sistema de IA de monstruos (Tick del servidor):
     - Estados: IDLE, CHASE (persigue al jugador más cercano o al que tenga más aggro), ATTACK, DEAD.
     - Spawner que genera monstruos en puntos fijos del mapa y los hace reaparecer tras un temporizador al morir.
3. En 'packages/client':
   - Sistema de selección de objetivo (hacer clic en un enemigo o aliado para seleccionarlo con un círculo en el suelo).
   - Barras de vida flotantes encima de cada jugador y enemigo.
   - Barra de acción en el HUD (HTML/CSS) con 3 habilidades y visualización de tiempo de reutilización (cooldown overlay).
   - Feedback visual simple cuando se aplica daño o curación (números flotantes o parpadeo de color).

```

### Fase 4: Persistencia Local y Carga de Escenarios 3D

#### Objetivo

Guardar el progreso del grupo en un archivo SQLite local mediante un ORM y cargar un mapa 3D estilizado en formato `.glb`.

#### Prompt para Antigravity:

```
Vamos a agregar persistencia de datos local con SQLite y soporte para carga de assets 3D optimizados.

Requisitos técnicos:
1. Persistencia en 'packages/server':
   - Configura Prisma o Drizzle ORM apuntando a una base de datos local SQLite ('dev.db').
   - Diseña el esquema para:
     - 'PlayerProfile': nombre, clase, nivel, experiencia, vida_actual.
     - 'InventoryItem': slot_index, item_type, cantidad, playerId.
   - Al conectarse un jugador desde el cliente, debe poder seleccionar un perfil existente o escribir su nombre para crear uno nuevo.
   - Guarda el estado del jugador automáticamente al desconectarse o periódicamente cada 60 segundos.
2. Assets y Entorno en 'packages/client':
   - Configura la carga de mapas en formato GLTF/GLB usando GLTFLoader.
   - Agrega un mapa estilizado de prueba (terreno con obstáculos simples como árboles y rocas con colisión por bounding box en el servidor).
   - Reemplaza las figuras primitivas de los jugadores por un modelo 3D con animaciones básicas ('Idle', 'Run', 'Attack') controladas por el estado de velocidad y acción reportado por el servidor.
3. Despliegue Local (WLAN):
   - Configura un script 'npm run serve:lan' que inicie el servidor y el cliente listos para ser consumidos desde cualquier celular, tablet o laptop conectada al Wi-Fi del hogar.

```

### Fase 5: Preparación y Migración a la Nube (MMO / PvP Escalable)

#### Objetivo

Transicionar de la red local a la nube: cambiar SQLite por PostgreSQL, dockerizar los servicios y desacoplar la simulación para soportar múltiples estancias/zonas.

#### Prompt para Antigravity:

```
Vamos a preparar el proyecto para su migración a producción en la nube con soporte multizona.

Requisitos técnicos:
1. Base de datos:
   - Configura el ORM para cambiar el conector a PostgreSQL mediante una variable de entorno 'DATABASE_URL'.
   - Agrega scripts de migración automáticos para producción.
2. Contenerización y Arquitectura:
   - Crea un 'Dockerfile' multi-stage para compilar el cliente web (servido como archivos estáticos con NGINX o Caddy) y ejecutar el servidor Node.js en un contenedor liviano.
   - Diseña un 'docker-compose.yml' que orqueste:
     - 1 instancia de PostgreSQL.
     - 1 instancia de Redis (para pub/sub y caché de sesiones activas).
     - El Game Server.
3. Seguridad y Red:
   - Agrega validación de esquemas (usando Zod) para todos los paquetes de entrada del cliente para evitar payloads maliciosos.
   - Implementa rate limiting básico a nivel de conexión WebSocket.
   - Prepara la abstracción de 'Zonas': el servidor debe poder manejar múltiples 'Rooms' o regiones de mapa aisladas en lugar de una única sala global, permitiendo portales de viaje entre zonas.

```

## 6. Procedimiento de Ejecución en Antigravity

1. **Abrir Workspace:** Clona o crea el directorio raíz en tu máquina y ábrelo dentro del entorno de Antigravity.

2. **Ejecución Secuencial:** Entrega los prompts fase por fase. **No ejecutes la Fase 2 hasta que la Fase 1 compile sin errores y los clientes conecten entre sí.**

3. **Verificación de Red Local:**

   * Averigua la IP local de tu máquina anfitriona (ejemplo en terminal: `ipconfig` en Windows o `ifconfig` / `ip a` en Linux/Mac).

   * Conecta una tablet o laptop secundaria en el mismo Wi-Fi navegando a `http://<IP-DE-TU-PC>:<PUERTO-DEL-CLIENTE>`.

   * Verifica que el segundo dispositivo aparezca en el mundo y se mueva en la pantalla del primero.