# Project Knowledge Graph (Grafify)

> **Generado automáticamente**: 2026-11-01T16:59:23.013Z
> **Propósito**: Mapa de alta velocidad para que agentes de IA y desarrolladores ubiquen componentes, flujos de red y responsabilidades sin tener que leer todo el proyecto.

## 1. Índice Rápido de Componentes y Archivos

| Archivo / Módulo | Extensión | Rol / Descripción |
| :--- | :--- | :--- |
| [`.agents/skills/game-netcode/SKILL.md`](file:///.agents/skills/game-netcode/SKILL.md) | `.md` | Game Netcode & Multiplayer 3D Web Guide |
| [`.agents/skills/grafify/SKILL.md`](file:///.agents/skills/grafify/SKILL.md) | `.md` | Skill: Grafify (Navegación e Índice Rápido del Proyecto) |
| [`.agents/skills/security-audit/AI-AND-LLM.md`](file:///.agents/skills/security-audit/AI-AND-LLM.md) | `.md` | AI, LLM, and Agent Hunting |
| [`.agents/skills/security-audit/ATTACK-CLASSES.md`](file:///.agents/skills/security-audit/ATTACK-CLASSES.md) | `.md` | Attack Classes |
| [`.agents/skills/security-audit/CLIENT-SIDE.md`](file:///.agents/skills/security-audit/CLIENT-SIDE.md) | `.md` | Client-Side and Browser Hunting |
| [`.agents/skills/security-audit/CLOUD-AND-DEPLOYMENT.md`](file:///.agents/skills/security-audit/CLOUD-AND-DEPLOYMENT.md) | `.md` | Cloud and Deployment Hunting |
| [`.agents/skills/security-audit/DATA-ISOLATION-AND-LIFECYCLE.md`](file:///.agents/skills/security-audit/DATA-ISOLATION-AND-LIFECYCLE.md) | `.md` | Data Isolation and Lifecycle Hunting |
| [`.agents/skills/security-audit/DESKTOP-MOBILE-AND-LOCAL-IPC.md`](file:///.agents/skills/security-audit/DESKTOP-MOBILE-AND-LOCAL-IPC.md) | `.md` | Desktop, Mobile, and Local IPC Hunting |
| [`.agents/skills/security-audit/HUNTING.md`](file:///.agents/skills/security-audit/HUNTING.md) | `.md` | Vulnerability Hunting |
| [`.agents/skills/security-audit/MEMORY-SAFETY-AND-BINARY.md`](file:///.agents/skills/security-audit/MEMORY-SAFETY-AND-BINARY.md) | `.md` | Memory Safety, Binary, and Kernel Hunting |
| [`.agents/skills/security-audit/PROTOCOLS-RPC-AND-MESSAGING.md`](file:///.agents/skills/security-audit/PROTOCOLS-RPC-AND-MESSAGING.md) | `.md` | Protocols, RPC, and Messaging Hunting |
| [`.agents/skills/security-audit/RECONNAISSANCE.md`](file:///.agents/skills/security-audit/RECONNAISSANCE.md) | `.md` | Reconnaissance |
| [`.agents/skills/security-audit/report-schema.json`](file:///.agents/skills/security-audit/report-schema.json) | `.json` | Source / Asset file |
| [`.agents/skills/security-audit/RESOURCE-EXHAUSTION-AND-AVAILABILITY.md`](file:///.agents/skills/security-audit/RESOURCE-EXHAUSTION-AND-AVAILABILITY.md) | `.md` | Resource Exhaustion and Availability Hunting |
| [`.agents/skills/security-audit/SKILL.md`](file:///.agents/skills/security-audit/SKILL.md) | `.md` | Security Audit |
| [`.agents/skills/security-audit/SUPPLY-CHAIN-AND-RELEASE.md`](file:///.agents/skills/security-audit/SUPPLY-CHAIN-AND-RELEASE.md) | `.md` | Supply Chain and Release Hunting |
| [`.agents/skills/security-audit/validate-coverage-ledger.cjs`](file:///.agents/skills/security-audit/validate-coverage-ledger.cjs) | `.cjs` | !/usr/bin/env node |
| [`.agents/skills/security-audit/validate-coverage-ledger.test.cjs`](file:///.agents/skills/security-audit/validate-coverage-ledger.test.cjs) | `.cjs` | Source / Asset file |
| [`.agents/skills/security-audit/validate-findings.cjs`](file:///.agents/skills/security-audit/validate-findings.cjs) | `.cjs` | !/usr/bin/env node |
| [`.agents/skills/security-audit/validate-findings.test.cjs`](file:///.agents/skills/security-audit/validate-findings.test.cjs) | `.cjs` | Source / Asset file |
| [`.agents/skills/security-audit/VALIDATION-AND-REPORTING.md`](file:///.agents/skills/security-audit/VALIDATION-AND-REPORTING.md) | `.md` | Validation, Structured Output, Verification, and Reporting |
| [`.agents/skills/security-audit/WEB-PROTOCOL-AND-AUTH.md`](file:///.agents/skills/security-audit/WEB-PROTOCOL-AND-AUTH.md) | `.md` | HTTP-Protocol and Authentication Hunting |
| [`documentacion/plan_maestro_de_desarrollo_f1.md`](file:///documentacion/plan_maestro_de_desarrollo_f1.md) | `.md` | Master Game Document: RPG Cooperativo WLAN / Futuro MMORPG Cloud |
| [`documentacion/plan_maestro_de_desarrollo_f2.md`](file:///documentacion/plan_maestro_de_desarrollo_f2.md) | `.md` | Master Game Document & Bootstrap: RPG Cooperativo WLAN / Futuro MMORPG Cloud |
| [`GEMINI.md`](file:///GEMINI.md) | `.md` | Reglas del Proyecto: RPG Cooperativo WLAN / MMORPG |
| [`scripts/grafify.js`](file:///scripts/grafify.js) | `.js` | !/usr/bin/env node |

## 2. Mapa de Arquitectura y Flujo

```mermaid
flowchart TD
  subgraph Client ["Cliente Web (Navegador)"]
    UI["HUD (DOM Overlay)"]
    Renderer["Three.js Isométrico"]
    Input["WASD / Mouse / Touch"]
    Interpolation["Buffer / Lerp de Entidades"]
  end

  subgraph Network ["Canal de Red (WLAN)"]
    WSClient["WebSocket Client"]
    WSServer["WebSocket Server (0.0.0.0:3000/3001)"]
  end

  subgraph Server ["Servidor Autoritativo Node.js"]
    GameLoop["GameLoop (20-30 Ticks/seg)"]
    WorldState["Estado del Mundo"]
    CombatSystem["Sistema de Combate & Aggro"]
    Persistence["SQLite / Prisma / Drizzle"]
  end

  Input --> WSClient
  WSClient <-->|Eventos e Inputs| WSServer
  WSServer --> GameLoop
  GameLoop --> WorldState
  WorldState -->|Broadcast WorldState| WSServer
  WSServer --> WSClient
  WSClient --> Interpolation
  Interpolation --> Renderer
  GameLoop --> CombatSystem
  GameLoop --> Persistence
```

## 3. Matriz de Conceptos Clave -> Archivos

- **Reglas y Visión:** [`GEMINI.md`](file:///GEMINI.md), [`documentacion/plan_maestro_de_desarrollo_f1.md`](file:///documentacion/plan_maestro_de_desarrollo_f1.md), [`documentacion/plan_maestro_de_desarrollo_f2.md`](file:///documentacion/plan_maestro_de_desarrollo_f2.md)
- **Netcode y Ticks:** [`.agents/skills/game-netcode/SKILL.md`](file:///.agents/skills/game-netcode/SKILL.md)
- **Seguridad:** [`.agents/skills/security-audit/SKILL.md`](file:///.agents/skills/security-audit/SKILL.md)
- **Mapeo de Proyecto:** [`scripts/grafify.js`](file:///scripts/grafify.js), [`PROJECT_GRAPH.md`](file:///PROJECT_GRAPH.md)

