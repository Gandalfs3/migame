// @ts-ignore
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { PlayerClass, CLASS_STATS } from '@migame/common';

export interface SavedPlayerProfile {
  name: string;
  class_type: PlayerClass;
  level: number;
  experience: number;
  health: number;
  max_health: number;
  gold: number;
  created_at: string;
  updated_at: string;
}

export class DatabaseManager {
  private db: any;

  constructor(dbPath: string = 'dev.db') {
    const resolvedPath = path.resolve(process.cwd(), dbPath);
    console.log(`[DatabaseManager] Inicializando SQLite local en: ${resolvedPath}`);
    this.db = new DatabaseSync(resolvedPath);
    this.initSchema();
  }

  private initSchema(): void {
    // 1. Tabla de Perfiles de Jugador
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS player_profiles (
        name TEXT PRIMARY KEY,
        class_type TEXT NOT NULL,
        level INTEGER NOT NULL DEFAULT 1,
        experience INTEGER NOT NULL DEFAULT 0,
        health INTEGER NOT NULL,
        max_health INTEGER NOT NULL,
        gold INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // 2. Tabla de Inventario de Jugador
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_name TEXT NOT NULL,
        slot_index INTEGER NOT NULL,
        item_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY(player_name) REFERENCES player_profiles(name) ON DELETE CASCADE
      );
    `);

    console.log('[DatabaseManager] Esquema SQLite verificado exitosamente (player_profiles, inventory_items).');
  }

  public loadOrCreateProfile(name: string, chosenClass: PlayerClass): SavedPlayerProfile {
    const trimmedName = (name || 'Aventurero').trim().slice(0, 20);

    const selectStmt = this.db.prepare('SELECT * FROM player_profiles WHERE name = ?');
    const existing = selectStmt.get(trimmedName) as SavedPlayerProfile | undefined;

    if (existing) {
      console.log(`[DatabaseManager] Perfil existente cargado para '${trimmedName}': Nivel ${existing.level}, Clase ${existing.class_type}, Oro ${existing.gold}.`);
      return existing;
    }

    // Crear nuevo perfil
    const now = new Date().toISOString();
    const baseHealth = CLASS_STATS[chosenClass].maxHealth;

    const insertStmt = this.db.prepare(`
      INSERT INTO player_profiles (name, class_type, level, experience, health, max_health, gold, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      trimmedName,
      chosenClass,
      1,
      0,
      baseHealth,
      baseHealth,
      10, // 10 de oro inicial para la familia
      now,
      now
    );

    console.log(`[DatabaseManager] Nuevo perfil creado para '${trimmedName}' (${chosenClass}).`);

    return {
      name: trimmedName,
      class_type: chosenClass,
      level: 1,
      experience: 0,
      health: baseHealth,
      max_health: baseHealth,
      gold: 10,
      created_at: now,
      updated_at: now
    };
  }

  public saveProfile(
    name: string,
    classType: PlayerClass,
    level: number,
    experience: number,
    health: number,
    maxHealth: number,
    gold: number
  ): void {
    const now = new Date().toISOString();
    const updateStmt = this.db.prepare(`
      UPDATE player_profiles
      SET class_type = ?, level = ?, experience = ?, health = ?, max_health = ?, gold = ?, updated_at = ?
      WHERE name = ?
    `);

    updateStmt.run(
      classType,
      level,
      experience,
      Math.max(1, Math.round(health)),
      maxHealth,
      gold,
      now,
      name
    );
  }

  public close(): void {
    if (this.db) {
      this.db.close();
    }
  }
}
