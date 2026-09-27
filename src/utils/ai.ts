/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Player, TerritoryState, CombatResult } from '../types/game';
import { TERRITORIES_MAP } from '../data/territories';
import { isValidCombination } from '../data/cards';

export interface AiAttackPlan {
  fromId: string;
  toId: string;
  attackerDice: number;
  defenderDice: number;
}

export interface AiReinforcePlan {
  territoryId: string;
  count: number;
}

export interface AiFortifyPlan {
  fromId: string;
  toId: string;
  count: number;
}

export function evaluateAiReinforcements(
  aiPlayer: Player,
  territories: Record<string, TerritoryState>,
  totalTroops: number
): AiReinforcePlan[] {
  const plans: AiReinforcePlan[] = [];
  if (!aiPlayer || !territories || totalTroops <= 0) return plans;

  const ownedTerritories = Object.values(territories).filter(
    t => t && t.playerId === aiPlayer.id
  );

  if (ownedTerritories.length === 0) return plans;

  // Identify frontier territories (those with at least 1 enemy neighbor)
  const frontierTerritories = ownedTerritories.filter(t => {
    const territoryData = TERRITORIES_MAP[t.territoryId];
    if (!territoryData || !territoryData.neighbors) return false;
    return territoryData.neighbors.some(
      nId => territories[nId] && territories[nId].playerId !== aiPlayer.id
    );
  });

  const targetList = frontierTerritories.length > 0 ? frontierTerritories : ownedTerritories;

  // Score territories based on vulnerability and strategic weight
  const scored = targetList.map(t => {
    const data = TERRITORIES_MAP[t.territoryId];
    if (!data || !data.neighbors) return { territoryId: t.territoryId, score: 1 };

    const enemyNeighbors = data.neighbors
      .map(nId => territories[nId])
      .filter(n => n && n.playerId !== aiPlayer.id);

    const enemyPower = enemyNeighbors.reduce((acc, curr) => acc + (curr.armies || 1), 0);
    const score = enemyPower / Math.max(1, t.armies);
    return { territoryId: t.territoryId, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Distribute troops among top 1-3 frontier territories
  let remaining = totalTroops;
  const topCount = Math.min(3, scored.length);
  for (let i = 0; i < topCount; i++) {
    const share = i === topCount - 1 ? remaining : Math.ceil(remaining / (topCount - i));
    if (share > 0) {
      plans.push({
        territoryId: scored[i].territoryId,
        count: share
      });
      remaining -= share;
    }
  }

  return plans;
}

export function findAiCardSetToExchange(player: Player) {
  if (!player || !player.cards || player.cards.length < 3) return null;
  const cards = player.cards;

  // Try to find any combination of 3 cards that is valid
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        const combo = [cards[i], cards[j], cards[k]];
        if (isValidCombination(combo)) {
          return combo;
        }
      }
    }
  }
  return null;
}

export function chooseAiAttack(
  aiPlayer: Player,
  territories: Record<string, TerritoryState>
): AiAttackPlan | null {
  if (!aiPlayer || !territories) return null;

  const owned = Object.values(territories).filter(
    t => t && t.playerId === aiPlayer.id && t.armies >= 2
  );

  const potentialAttacks: {
    fromId: string;
    toId: string;
    advantage: number;
  }[] = [];

  for (const t of owned) {
    const data = TERRITORIES_MAP[t.territoryId];
    if (!data || !data.neighbors) continue;

    for (const neighborId of data.neighbors) {
      const neighbor = territories[neighborId];
      if (neighbor && neighbor.playerId !== aiPlayer.id && neighbor.armies >= 1) {
        // Evaluate attack advantage: attacker needs advantage to risk it
        const advantage = t.armies - neighbor.armies;
        if (advantage >= 1 || (t.armies >= 4 && advantage >= 0)) {
          potentialAttacks.push({
            fromId: t.territoryId,
            toId: neighborId,
            advantage
          });
        }
      }
    }
  }

  if (potentialAttacks.length === 0) return null;

  // Pick the highest advantage or most favorable target
  potentialAttacks.sort((a, b) => b.advantage - a.advantage);
  const chosen = potentialAttacks[0];

  const fromTerr = territories[chosen.fromId];
  const toTerr = territories[chosen.toId];
  if (!fromTerr || !toTerr) return null;

  const attackerArmies = Math.max(1, fromTerr.armies);
  const defenderArmies = Math.max(1, toTerr.armies);

  const attackerDice = Math.max(1, Math.min(3, attackerArmies - 1));
  const defenderDice = Math.max(1, Math.min(3, defenderArmies));

  return {
    fromId: chosen.fromId,
    toId: chosen.toId,
    attackerDice,
    defenderDice
  };
}

export function chooseAiFortify(
  aiPlayer: Player,
  territories: Record<string, TerritoryState>
): AiFortifyPlan | null {
  if (!aiPlayer || !territories) return null;

  const owned = Object.values(territories).filter(
    t => t && t.playerId === aiPlayer.id && t.armies >= 2
  );

  for (const t of owned) {
    const data = TERRITORIES_MAP[t.territoryId];
    if (!data || !data.neighbors) continue;

    const isSurroundedByFriends = data.neighbors.every(
      nId => territories[nId] && territories[nId].playerId === aiPlayer.id
    );

    // If safe inside friendly borders, move troops towards a frontier neighbor
    if (isSurroundedByFriends && t.armies > 1) {
      for (const nId of data.neighbors) {
        const neighborData = TERRITORIES_MAP[nId];
        if (!neighborData || !neighborData.neighbors) continue;

        const neighborHasEnemy = neighborData.neighbors.some(
          subId => territories[subId] && territories[subId].playerId !== aiPlayer.id
        );
        if (neighborHasEnemy) {
          return {
            fromId: t.territoryId,
            toId: nId,
            count: Math.max(1, t.armies - 1)
          };
        }
      }
    }
  }

  return null;
}
