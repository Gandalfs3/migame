import {
  SPELLS,
  CombatFeedback,
  Spell
} from '@migame/common';
import { Player } from './Player.js';
import { Monster } from './Monster.js';

export class CombatSystem {
  public executeSpell(
    caster: Player,
    spellId: string,
    targetId: string | null | undefined,
    players: Map<string, Player>,
    monsters: Map<string, Monster>,
    onMonsterKilled?: (monster: Monster, xp: number, gold: number, killer: Player) => void
  ): CombatFeedback[] {
    const spell = SPELLS[spellId];
    if (!spell) return [];

    if (caster.classType !== spell.classType) return [];
    if (caster.isSpellOnCooldown(spell.id)) return [];

    const feedbacks: CombatFeedback[] = [];

    // Helper: encontrar el monstruo vivo más cercano dentro de la misma zona
    const findClosestMonster = (maxRange: number): Monster | null => {
      let closest: Monster | null = null;
      let closestDist = maxRange;
      for (const m of monsters.values()) {
        if (m.state === 'DEAD' || m.zoneId !== caster.currentZone) continue;
        const d = Math.hypot(m.x - caster.x, m.z - caster.z);
        if (d <= closestDist) {
          closestDist = d;
          closest = m;
        }
      }
      return closest;
    };

    // Helper: encontrar el aliado con menor porcentaje de vida dentro de la misma zona
    const findMostInjuredAlly = (maxRange: number): Player => {
      let bestTarget: Player = caster;
      let lowestPct = caster.health / caster.maxHealth;

      for (const p of players.values()) {
        if (p.health <= 0 || p.currentZone !== caster.currentZone) continue;
        const d = Math.hypot(p.x - caster.x, p.z - caster.z);
        if (d <= maxRange) {
          const pct = p.health / p.maxHealth;
          if (pct < lowestPct) {
            lowestPct = pct;
            bestTarget = p;
          }
        }
      }
      return bestTarget;
    };

    // 1. Hechizos de Área (AOE)
    if (spell.isAoe) {
      const radius = spell.aoeRadius || 6.0;

      if (spell.id === 'taunt') {
        for (const monster of monsters.values()) {
          if (monster.state === 'DEAD' || monster.zoneId !== caster.currentZone) continue;
          const d = Math.hypot(monster.x - caster.x, monster.z - caster.z);
          if (d <= radius) {
            monster.addThreat(caster.id, 120);
            feedbacks.push({
              targetId: monster.id,
              amount: 0,
              isHeal: false,
              x: monster.x,
              z: monster.z
            });
          }
        }
      } else if (spell.heal) {
        // Santuario: Cura a todos los aliados cercanos en la misma zona
        for (const ally of players.values()) {
          if (ally.health <= 0 || ally.currentZone !== caster.currentZone) continue;
          const d = Math.hypot(ally.x - caster.x, ally.z - caster.z);
          if (d <= radius) {
            const healed = ally.heal(spell.heal);
            feedbacks.push({
              targetId: ally.id,
              amount: healed,
              isHeal: true,
              x: ally.x,
              z: ally.z
            });
          }
        }
      } else if (spell.damage) {
        // Meteoro de Mago: apunta al objetivo seleccionado o al monstruo más cercano en la zona
        let centerPoint = { x: caster.x, z: caster.z };
        let aimTarget: Monster | null = null;

        if (targetId && monsters.has(targetId)) {
          const candidate = monsters.get(targetId)!;
          if (candidate.zoneId === caster.currentZone) {
            aimTarget = candidate;
          }
        } else {
          aimTarget = findClosestMonster(spell.range);
        }

        if (aimTarget && aimTarget.state !== 'DEAD') {
          centerPoint = { x: aimTarget.x, z: aimTarget.z };
        }

        for (const monster of monsters.values()) {
          if (monster.state === 'DEAD' || monster.zoneId !== caster.currentZone) continue;
          const d = Math.hypot(monster.x - centerPoint.x, monster.z - centerPoint.z);
          if (d <= radius) {
            const result = monster.takeDamage(spell.damage, caster.id);
            feedbacks.push({
              targetId: monster.id,
              amount: result.actualDamage,
              isHeal: false,
              x: monster.x,
              z: monster.z
            });

            if (result.died) {
              onMonsterKilled?.(monster, result.xp, result.gold, caster);
            }
          }
        }
      }

      caster.setSpellCooldown(spell.id, spell.cooldownMs);
      return feedbacks;
    }

    // 2. Hechizos de Curación Directa (Luz Sanadora de Clérigo)
    if (spell.heal) {
      let healTarget: Player | null = null;

      if (targetId && players.has(targetId)) {
        const potential = players.get(targetId)!;
        if (potential.currentZone === caster.currentZone) {
          const dist = Math.hypot(potential.x - caster.x, potential.z - caster.z);
          if (dist <= spell.range && potential.health > 0) {
            healTarget = potential;
          }
        }
      }

      if (!healTarget) {
        healTarget = findMostInjuredAlly(spell.range);
      }

      const healedAmount = healTarget.heal(spell.heal);
      caster.setSpellCooldown(spell.id, spell.cooldownMs);
      feedbacks.push({
        targetId: healTarget.id,
        amount: healedAmount,
        isHeal: true,
        x: healTarget.x,
        z: healTarget.z
      });
      return feedbacks;
    }

    // 3. Hechizos de Daño a Objetivo Único
    if (spell.damage) {
      let finalTarget: Monster | null = null;

      if (targetId && monsters.has(targetId)) {
        const candidate = monsters.get(targetId)!;
        if (candidate.state !== 'DEAD' && candidate.zoneId === caster.currentZone) {
          const dist = Math.hypot(candidate.x - caster.x, candidate.z - caster.z);
          if (dist <= spell.range) {
            finalTarget = candidate;
          }
        }
      }

      if (!finalTarget) {
        finalTarget = findClosestMonster(spell.range);
      }

      if (!finalTarget) {
        return [];
      }

      const result = finalTarget.takeDamage(spell.damage, caster.id);
      caster.setSpellCooldown(spell.id, spell.cooldownMs);

      feedbacks.push({
        targetId: finalTarget.id,
        amount: result.actualDamage,
        isHeal: false,
        x: finalTarget.x,
        z: finalTarget.z
      });

      if (result.died) {
        onMonsterKilled?.(finalTarget, result.xp, result.gold, caster);
      }
    }

    return feedbacks;
  }
}
