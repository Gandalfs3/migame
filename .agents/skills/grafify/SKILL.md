---
name: grafify
description: Mapeo y navegación rápida de arquitectura, archivos, contratos de red y responsabilidades del proyecto sin necesidad de leer todo el árbol de directorios repetidamente.
---

# Skill: Grafify (Navegación e Índice Rápido del Proyecto)

`grafify` genera y mantiene un grafo estructurado y liviano (`PROJECT_GRAPH.md` y `PROJECT_GRAPH.json`) que cataloga la ubicación de cada componente, módulo, tipo y contrato de red.

## Cuándo Usar Grafify
1. **Antes de buscar a ciegas**: Cuando necesites saber dónde reside una funcionalidad (movimiento, combate, serialización de red, colisiones, HUD, persistencia), consulta primero `PROJECT_GRAPH.md` o `PROJECT_GRAPH.json`.
2. **Tras crear o reorganizar archivos**: Ejecuta `node scripts/grafify.js` para regenerar el mapa instantáneamente.

## Comandos Disponibles
- **Generar / Actualizar Grafo**:
  ```bash
  node scripts/grafify.js
  ```

## Estructura de Salida
- `PROJECT_GRAPH.md`: Tabla legible de rutas, resúmenes, diagrama Mermaid de flujo de arquitectura y matriz de conceptos clave.
- `PROJECT_GRAPH.json`: Árbol de archivos y metadatos estructurados para inspección programática ultrarrápida.
