#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const OUTPUT_MD = path.join(ROOT_DIR, 'PROJECT_GRAPH.md');
const OUTPUT_JSON = path.join(ROOT_DIR, 'PROJECT_GRAPH.json');

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.gemini',
  'dist',
  'build',
  '.vscode',
  '.idea'
]);

const IGNORED_FILES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'PROJECT_GRAPH.md',
  'PROJECT_GRAPH.json'
]);

function scanDirectory(dir, relativePath = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const nodes = [];

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith('.') && entry.isDirectory() && entry.name !== '.agents') continue;

    const fullPath = path.join(dir, entry.name);
    const rel = path.join(relativePath, entry.name).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      const children = scanDirectory(fullPath, rel);
      nodes.push({
        type: 'directory',
        name: entry.name,
        path: rel,
        children
      });
    } else {
      if (IGNORED_FILES.has(entry.name)) continue;
      const stats = fs.statSync(fullPath);
      const ext = path.extname(entry.name);
      
      let summary = '';
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const firstLines = content.split('\n').slice(0, 10);
        for (const line of firstLines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
            summary = trimmed.replace(/^[\/#*\s]+/, '').trim();
            if (summary) break;
          }
        }
      } catch (err) {
        // binary or inaccessible
      }

      nodes.push({
        type: 'file',
        name: entry.name,
        path: rel,
        size: stats.size,
        extension: ext,
        summary: summary || 'Source / Asset file'
      });
    }
  }

  return nodes;
}

function flattenFiles(nodes) {
  let files = [];
  for (const node of nodes) {
    if (node.type === 'file') {
      files.push(node);
    } else if (node.children) {
      files = files.concat(flattenFiles(node.children));
    }
  }
  return files;
}

function buildGraphMarkdown(tree, files) {
  const date = new Date().toISOString();
  let md = `# Project Knowledge Graph (Grafify)\n\n`;
  md += `> **Generado automáticamente**: ${date}\n`;
  md += `> **Propósito**: Mapa de alta velocidad para que agentes de IA y desarrolladores ubiquen componentes, flujos de red y responsabilidades sin tener que leer todo el proyecto.\n\n`;

  md += `## 1. Índice Rápido de Componentes y Archivos\n\n`;
  md += `| Archivo / Módulo | Extensión | Rol / Descripción |\n`;
  md += `| :--- | :--- | :--- |\n`;

  for (const file of files) {
    md += `| [\`${file.path}\`](file:///${file.path}) | \`${file.extension || 'none'}\` | ${file.summary} |\n`;
  }

  md += `\n## 2. Mapa de Arquitectura y Flujo\n\n`;
  md += `\`\`\`mermaid
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
\`\`\`\n\n`;

  md += `## 3. Matriz de Conceptos Clave -> Archivos\n\n`;
  md += `- **Reglas y Visión:** [\`GEMINI.md\`](file:///GEMINI.md), [\`documentacion/plan_maestro_de_desarrollo_f1.md\`](file:///documentacion/plan_maestro_de_desarrollo_f1.md), [\`documentacion/plan_maestro_de_desarrollo_f2.md\`](file:///documentacion/plan_maestro_de_desarrollo_f2.md)\n`;
  md += `- **Netcode y Ticks:** [\`.agents/skills/game-netcode/SKILL.md\`](file:///.agents/skills/game-netcode/SKILL.md)\n`;
  md += `- **Seguridad:** [\`.agents/skills/security-audit/SKILL.md\`](file:///.agents/skills/security-audit/SKILL.md)\n`;
  md += `- **Mapeo de Proyecto:** [\`scripts/grafify.js\`](file:///scripts/grafify.js), [\`PROJECT_GRAPH.md\`](file:///PROJECT_GRAPH.md)\n\n`;

  return md;
}

function run() {
  console.log('[Grafify] Escaneando estructura del proyecto...');
  const tree = scanDirectory(ROOT_DIR);
  const files = flattenFiles(tree);

  const graphData = {
    generatedAt: new Date().toISOString(),
    totalFiles: files.length,
    tree,
    files
  };

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(graphData, null, 2), 'utf-8');
  console.log(`[Grafify] Generado JSON: ${OUTPUT_JSON}`);

  const md = buildGraphMarkdown(tree, files);
  fs.writeFileSync(OUTPUT_MD, md, 'utf-8');
  console.log(`[Grafify] Generado Markdown: ${OUTPUT_MD}`);
  console.log(`[Grafify] Mapeo completo: ${files.length} archivos indexados.`);
}

run();
