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
    monsters: Map<string, Monster>
  ): CombatFeedback[] {
    const spell = SPELLS[spellId];
    if (!spell) return [];

    // Validar clase
    if (caster.classType !== spell.classType) return [];

    // Validar cooldown
    if (caster.isSpellOnCooldown(spell.id)) return [];

    const feedbacks: CombatFeedback[] = [];

    // 1. Hechizos de Área (AOE)
    if (spell.isAoe) {
      const radius = spell.aoeRadius || 6.0;

      if (spell.id === 'taunt') {
        // Provocación: atraer todos los monstruos en radio
        for (const monster of monsters.values()) {
          if (monster.state === 'DEAD') continue;
          const d = Math.hypot(monster.x - caster.x, monster.z - caster.z);
          if (d <= radius) {
            monster.addThreat(caster.id, 100);
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
        // Curación en área para aliados cercanos
        for (const ally of players.values()) {
          if (ally.health <= 0) continue;
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
        // Daño en área (e.g. Meteoro)
        let centerPoint = { x: caster.x, z: caster.z };
        if (targetId && monsters.has(targetId)) {
          const targetMon = monsters.get(targetId)!;
          centerPoint = { x: targetMon.x, z: targetMon.z };
        }

        for (const monster of monsters.values()) {
          if (monster.state === 'DEAD') continue;
          const d = Math.hypot(monster.x - centerPoint.x, monster.z - centerPoint.z);
          if (d <= radius) {
            monster.takeDamage(spell.damage, caster.id);
            feedbacks.push({
              targetId: monster.id,
              amount: spell.damage,
              isHeal: false,
              x: monster.x,
              z: monster.z
            });
          }
        }
      }

      caster.setSpellCooldown(spell.id, spell.cooldownMs);
      return feedbacks;
    }

    // 2. Hechizos de Curación Directa (Luz Sanadora)
    if (spell.heal) {
      let healTarget = caster;
      if (targetId && players.has(targetId)) {
        const potentialTarget = players.get(targetId)!;
        const dist = Math.hypot(potentialTarget.x - caster.x, potentialTarget.z - caster.z);
        if (dist <= spell.range && potentialTarget.health > 0) {
          healTarget = potentialTarget;
        }
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
      if (!targetId || !monsters.has(targetId)) {
        return []; // Requiere un monstruo objetivo
      }

      const targetMonster = monsters.get(targetId)!;
      if (targetMonster.state === 'DEAD') return [];

      const dist = Math.hypot(targetMonster.x - caster.x, targetMonster.z - caster.z);
      if (dist > spell.range) return []; // Fuera de alcance

      targetMonster.takeDamage(spell.damage, caster.id);
      caster.setSpellCooldown(spell.id, spell.cooldownMs);

      feedbacks.push({
        targetId: targetMonster.id,
        amount: spell.damage,
        isHeal: false,
        x: targetMonster.x,
        z: targetMonster.z
      });
    }

    return feedbacks;
  }
}
