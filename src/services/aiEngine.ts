import { Territory, TerritoryState, Player } from '../types/game';
import { TERRITORIES_MAP } from '../data/territories';
import { CONTINENTS } from '../data/continents';
import { isValidCombination } from '../data/cards';

/**
 * Função utilitária: Retorna vizinhos inimigos de um território
 */
const getEnemyNeighbors = (territory: Territory, territoriesState: Record<string, TerritoryState>, aiId: string): TerritoryState[] => {
  return territory.neighbors
    .map(neighborId => territoriesState[neighborId])
    .filter(t => t !== undefined && t.playerId !== aiId);
};

/**
 * Avalia o status de cada continente para a IA:
 * - Quantos territórios a IA possui
 * - Quantos faltam para fechar o continente
 * - Se algum oponente está prestes a fechar o continente (para bloqueio)
 */
export interface ContinentAnalysis {
  continentId: string;
  name: string;
  bonus: number;
  totalTerritories: number;
  aiTerritoriesCount: number;
  aiMissingTerritories: string[];
  enemyLeadingPlayerId: string | null;
  enemyMissingTerritories: string[];
  isAiDominated: boolean;
  isOpportunity: boolean; // Faltam 1 ou 2 territórios para a IA fechar
  isEnemyThreat: boolean; // Um inimigo está a 1 território de fechar
}

export const analyzeContinents = (
  territoriesState: Record<string, TerritoryState>,
  aiId: string
): ContinentAnalysis[] => {
  return Object.values(CONTINENTS).map(continent => {
    const total = continent.territoryIds.length;
    const aiOwned = continent.territoryIds.filter(tId => territoriesState[tId]?.playerId === aiId);
    const aiMissing = continent.territoryIds.filter(tId => territoriesState[tId]?.playerId !== aiId);

    // Contagem de oponentes
    const enemyHoldings: Record<string, string[]> = {};
    continent.territoryIds.forEach(tId => {
      const pId = territoriesState[tId]?.playerId;
      if (pId && pId !== aiId) {
        if (!enemyHoldings[pId]) enemyHoldings[pId] = [];
        enemyHoldings[pId].push(tId);
      }
    });

    let enemyLeader: string | null = null;
    let enemyLeaderCount = 0;
    Object.entries(enemyHoldings).forEach(([pId, list]) => {
      if (list.length > enemyLeaderCount) {
        enemyLeaderCount = list.length;
        enemyLeader = pId;
      }
    });

    const enemyMissing = enemyLeader
      ? continent.territoryIds.filter(tId => territoriesState[tId]?.playerId !== enemyLeader)
      : [];

    return {
      continentId: continent.id,
      name: continent.name,
      bonus: continent.bonus,
      totalTerritories: total,
      aiTerritoriesCount: aiOwned.length,
      aiMissingTerritories: aiMissing,
      enemyLeadingPlayerId: enemyLeader,
      enemyMissingTerritories: enemyMissing,
      isAiDominated: aiMissing.length === 0,
      isOpportunity: aiMissing.length > 0 && aiMissing.length <= 2,
      isEnemyThreat: enemyLeaderCount > 0 && total - enemyLeaderCount <= 1
    };
  });
};

// ==========================================
// FASE 1: ALOCAÇÃO DE REFORÇOS (Deploy)
// Considera defesa de fronteiras e avanço em continentes quase dominados
// ==========================================
export const calculateBestDeployTargets = (
  territoriesState: Record<string, TerritoryState>, 
  aiId: string, 
  availableTroops: number
): { territoryId: string; troopsToPlace: number }[] => {
  if (availableTroops <= 0) return [];

  const myTerritories = Object.values(territoriesState).filter(t => t.playerId === aiId);
  if (myTerritories.length === 0) return [];

  const continentAnalyses = analyzeContinents(territoriesState, aiId);
  const prioritizedContinentTargets = new Set<string>();

  // Continentes com oportunidade de fechar ganham prioridade máxima
  continentAnalyses.forEach(c => {
    if (c.isOpportunity) {
      c.aiMissingTerritories.forEach(missingId => {
        // Encontra territórios da IA vizinhos ao território que falta
        const missingData = TERRITORIES_MAP[missingId];
        if (missingData) {
          missingData.neighbors.forEach(nId => {
            if (territoriesState[nId]?.playerId === aiId) {
              prioritizedContinentTargets.add(nId);
            }
          });
        }
      });
    }
  });

  // Calcula o nível de ameaça e valor estratégico de cada território meu
  const threatScores = myTerritories.map(tState => {
    const territory = TERRITORIES_MAP[tState.territoryId];
    if (!territory) return { territoryId: tState.territoryId, score: 0 };

    const enemies = getEnemyNeighbors(territory, territoriesState, aiId);
    if (enemies.length === 0) return { territoryId: tState.territoryId, score: 0 }; // Interior seguro

    // A ameaça é a soma das tropas inimigas nas fronteiras
    const totalEnemyTroops = enemies.reduce((sum, e) => sum + e.armies, 0);

    // Multiplicador estratégico se for ponta de lança para fechar continente
    let strategicMultiplier = 1.0;
    if (prioritizedContinentTargets.has(tState.territoryId)) {
      strategicMultiplier = 2.4;
    }

    // Se o território estiver em um continente que a IA domina integralmente, precisa de forte guarnição nas saídas
    const continentOfThisTerritory = Object.values(CONTINENTS).find(c =>
      c.territoryIds.includes(tState.territoryId)
    );
    if (continentOfThisTerritory) {
      const ownsFull = continentOfThisTerritory.territoryIds.every(
        id => territoriesState[id]?.playerId === aiId
      );
      if (ownsFull) {
        strategicMultiplier = Math.max(strategicMultiplier, 1.8);
      }
    }

    return { 
      territoryId: tState.territoryId, 
      score: ((totalEnemyTroops + 1) / Math.max(1, tState.armies)) * strategicMultiplier
    };
  });

  // Ordena do maior valor estratégico para o menor
  const borders = threatScores.filter(t => t.score > 0).sort((a, b) => b.score - a.score);

  if (borders.length === 0) {
    return [{ territoryId: myTerritories[0].territoryId, troopsToPlace: availableTroops }];
  }

  // Distribui as tropas nos até 3 territórios mais vitais
  const allocations: { territoryId: string; troopsToPlace: number }[] = [];
  let remaining = availableTroops;
  const targetCount = Math.min(borders.length, 3);
  
  for (let i = 0; i < targetCount; i++) {
    const share = i === targetCount - 1 ? remaining : Math.ceil(remaining * 0.55);
    const amount = Math.min(share, remaining);
    if (amount > 0) {
      allocations.push({ territoryId: borders[i].territoryId, troopsToPlace: amount });
      remaining -= amount;
    }
  }

  return allocations;
};

// ==========================================
// FASE 2: CÁLCULO DE ATAQUE (Attack)
// Pondera bônus de continente, bloqueio de oponentes e fraqueza numérica
// ==========================================
export interface AttackDecision {
  attackerId: string;
  defenderId: string;
  confidence: number;
  reason?: string;
}

export const determineNextAttack = (territoriesState: Record<string, TerritoryState>, aiId: string): AttackDecision | null => {
  const myTerritories = Object.values(territoriesState).filter(t => t.playerId === aiId && t.armies > 1);
  let bestAttack: AttackDecision | null = null;
  let highestConfidence = -999;

  const continentAnalyses = analyzeContinents(territoriesState, aiId);

  // Mapa de territórios cruciais para completar ou negar continente
  const conquerContinentMissingIds = new Set<string>();
  const denyContinentTargetIds = new Set<string>();

  continentAnalyses.forEach(c => {
    if (c.isOpportunity) {
      c.aiMissingTerritories.forEach(id => conquerContinentMissingIds.add(id));
    }
    if (c.isEnemyThreat && c.enemyLeadingPlayerId) {
      c.enemyMissingTerritories.forEach(id => denyContinentTargetIds.add(id));
    }
  });

  myTerritories.forEach(attackerState => {
    const attacker = TERRITORIES_MAP[attackerState.territoryId];
    if (!attacker) return;

    const enemies = getEnemyNeighbors(attacker, territoriesState, aiId);
    
    enemies.forEach(defenderState => {
      // Condição mínima: atacante precisa de vantagem ou no mínimo igualdade com alto número
      const diff = attackerState.armies - defenderState.armies;
      if (attackerState.armies >= 2 && (diff >= 1 || (attackerState.armies >= 4 && diff >= 0))) {
        
        // Base de confiança: vantagem de tropas
        let confidence = diff * 2.5;

        // Bônus 1: O defensor é extremamente fraco (1 tropa = chance fácil de vitória e carta)
        if (defenderState.armies === 1) {
          confidence += 8;
        }

        // Bônus 2: Conquistar este território fecha um continente para a IA (+Bônus permanente!)
        let attackReason = 'Vantagem numérica operacional';
        if (conquerContinentMissingIds.has(defenderState.territoryId)) {
          confidence += 15;
          attackReason = 'Ofensiva para fechar Bônus de Continente!';
        }

        // Bônus 3: Bloquear um oponente prestes a garantir um continente
        if (denyContinentTargetIds.has(defenderState.territoryId)) {
          confidence += 10;
          attackReason = 'Ataque preventivo de negação territorial!';
        }

        // Penalidade: Deixar o território de origem desprotegido se tiver outros vizinhos inimigos
        const remainingDefenders = attackerState.armies - 1;
        const otherEnemies = enemies.filter(e => e.territoryId !== defenderState.territoryId);
        const exposedEnemyPower = otherEnemies.reduce((s, e) => s + e.armies, 0);
        if (exposedEnemyPower > remainingDefenders) {
          confidence -= 4; // Desencoraja suicídio tático
        }

        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestAttack = {
            attackerId: attackerState.territoryId,
            defenderId: defenderState.territoryId,
            confidence,
            reason: attackReason
          };
        }
      }
    });
  });

  // Só executa o ataque se a confiança for favorável
  if (bestAttack && highestConfidence > 0) {
    return bestAttack;
  }

  return null;
};

// ==========================================
// FASE 3: REMANEJAMENTO (Fortify/Move)
// Tirar tropas do interior seguro e deslocar para a fronteira ativa
// ==========================================
export const calculateFortification = (territoriesState: Record<string, TerritoryState>, aiId: string) => {
  const myTerritories = Object.values(territoriesState).filter(t => t.playerId === aiId);
  
  // Encontra um território "interior" (sem vizinhos inimigos, mas com > 1 tropa)
  const safeInteriorCandidates = myTerritories.filter(tState => {
    const t = TERRITORIES_MAP[tState.territoryId];
    if (!t) return false;
    return tState.armies > 1 && getEnemyNeighbors(t, territoriesState, aiId).length === 0;
  });

  if (safeInteriorCandidates.length === 0) return null;

  // Prioriza o que tem mais tropas ociosas
  safeInteriorCandidates.sort((a, b) => b.armies - a.armies);
  const safeInteriorState = safeInteriorCandidates[0];
  const safeInterior = TERRITORIES_MAP[safeInteriorState.territoryId];
  if (!safeInterior) return null;

  // Encontra vizinho aliado de fronteira para receber as tropas
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
      troopsToMove: safeInteriorState.armies - 1
    };
  }

  return null;
};

// ==========================================
// FASE EXTRA: TROCA INTELIGENTE DE CARTAS
// ==========================================
export function findAiCardSetToExchange(player: Player) {
  if (!player || !player.cards || player.cards.length < 3) return null;
  const cards = player.cards;

  // Procura qualquer combinação válida de 3 cartas
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
