import { Territory, TerritoryState, Player } from '../types/game';
import { TERRITORIES_MAP } from '../data/territories';
import { isValidCombination } from '../data/cards';

/**
 * Função utilitária: Retorna vizinhos inimigos de um território
 */
const getEnemyNeighbors = (territory: Territory, territoriesState: Record<string, TerritoryState>, aiId: string): TerritoryState[] => {
  return territory.neighbors
    .map(neighborId => territoriesState[neighborId])
    .filter(t => t !== undefined && t.playerId !== aiId);
};

// ==========================================
// FASE 1: ALOCAÇÃO DE REFORÇOS (Deploy)
// Onde o general deve colocar as tropas que ganhou?
// ==========================================
export const calculateBestDeployTargets = (
  territoriesState: Record<string, TerritoryState>, 
  aiId: string, 
  availableTroops: number
): { territoryId: string; troopsToPlace: number }[] => {
  
  const myTerritories = Object.values(territoriesState).filter(t => t.playerId === aiId);
  
  // Calcula o nível de ameaça de cada território meu
  const threatScores = myTerritories.map(tState => {
    const territory = TERRITORIES_MAP[tState.territoryId];
    if (!territory) return { territoryId: tState.territoryId, score: 0 };

    const enemies = getEnemyNeighbors(territory, territoriesState, aiId);
    if (enemies.length === 0) return { territoryId: tState.territoryId, score: 0 }; // Interior seguro (não precisa de tropas)

    // A ameaça é a soma das tropas inimigas nas fronteiras
    const totalEnemyTroops = enemies.reduce((sum, e) => sum + e.armies, 0);
    // Peso extra se for um território chave para fechar um continente
    const isContinentVital = 1.5; // (Simplificado: depois podemos checar domínio de continente)

    return { 
      territoryId: tState.territoryId, 
      score: (totalEnemyTroops / tState.armies) * isContinentVital 
    };
  });

  // Ordena do mais ameaçado para o menos ameaçado
  const borders = threatScores.filter(t => t.score > 0).sort((a, b) => b.score - a.score);

  // Se não tem fronteira ameaçada (raro), coloca tudo no primeiro
  if (borders.length === 0 && myTerritories.length > 0) {
    return [{ territoryId: myTerritories[0].territoryId, troopsToPlace: availableTroops }];
  }

  // Distribui as tropas nos 2 ou 3 territórios mais ameaçados
  const allocations = [];
  let remaining = availableTroops;
  
  for (let i = 0; i < Math.min(borders.length, 3); i++) {
    const slice = i === 0 ? Math.ceil(remaining * 0.6) : Math.ceil(remaining * 0.5);
    const amount = Math.min(slice, remaining);
    if (amount > 0) {
      allocations.push({ territoryId: borders[i].territoryId, troopsToPlace: amount });
      remaining -= amount;
    }
  }

  return allocations;
};

// ==========================================
// FASE 2: CÁLCULO DE ATAQUE (Attack)
// Quem a IA deve atacar neste turno?
// ==========================================
export interface AttackDecision {
  attackerId: string;
  defenderId: string;
  confidence: number;
}

export const determineNextAttack = (territoriesState: Record<string, TerritoryState>, aiId: string): AttackDecision | null => {
  const myTerritories = Object.values(territoriesState).filter(t => t.playerId === aiId && t.armies > 1);
  let bestAttack: AttackDecision | null = null;
  let highestConfidence = 0;

  myTerritories.forEach(attackerState => {
    const attacker = TERRITORIES_MAP[attackerState.territoryId];
    if (!attacker) return;

    const enemies = getEnemyNeighbors(attacker, territoriesState, aiId);
    
    enemies.forEach(defenderState => {
      // Regra de Ouro: Só ataca se tiver pelo menos 1.5x mais tropas (Margem de segurança)
      if (attackerState.armies > defenderState.armies + 1) {
        
        // Confiança baseada na diferença numérica
        let confidence = attackerState.armies - defenderState.armies;

        // Bônus heurístico: O inimigo está muito fraco (1 ou 2 tropas)? Vale a pena esmagar.
        if (defenderState.armies <= 2) confidence += 5;

        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestAttack = {
            attackerId: attackerState.territoryId,
            defenderId: defenderState.territoryId,
            confidence
          };
        }
      }
    });
  });

  return bestAttack; // Retorna null se não houver ataque seguro
};

// ==========================================
// FASE 3: REMANEJAMENTO (Fortify/Move)
// Tirar tropas do "miolo" seguro e mandar para a fronteira
// ==========================================
export const calculateFortification = (territoriesState: Record<string, TerritoryState>, aiId: string) => {
  const myTerritories = Object.values(territoriesState).filter(t => t.playerId === aiId);
  
  // Encontra um território "inútil" (sem vizinhos inimigos, mas com > 1 tropa)
  const safeInteriorState = myTerritories.find(tState => {
    const t = TERRITORIES_MAP[tState.territoryId];
    if (!t) return false;
    return tState.armies > 1 && getEnemyNeighbors(t, territoriesState, aiId).length === 0;
  });

  if (!safeInteriorState) return null;

  const safeInterior = TERRITORIES_MAP[safeInteriorState.territoryId];
  if (!safeInterior) return null;

  // Encontra um território vizinho aliado que seja fronteira para receber as tropas
  const alliedNeighbors = safeInterior.neighbors
    .map(nId => territoriesState[nId])
    .filter(t => t !== undefined && t.playerId === aiId);

  const borderNeighbor = alliedNeighbors.find(allyState => {
    const ally = TERRITORIES_MAP[allyState.territoryId];
    if (!ally) return false;
    return getEnemyNeighbors(ally, territoriesState, aiId).length > 0;
  });

  if (borderNeighbor) {
    return {
      fromId: safeInteriorState.territoryId,
      toId: borderNeighbor.territoryId,
      troopsToMove: safeInteriorState.armies - 1 // Deixa 1 tropa para trás
    };
  }

  return null;
};

// ==========================================
// FASE EXTRA: TROCA DE CARTAS
// ==========================================
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
