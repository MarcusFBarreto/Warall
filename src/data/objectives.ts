/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SecretObjective, TerritoryState, Player, ContinentId, PlayerColor } from '../types/game';
import { CONTINENTS } from './continents';

function ownsContinent(
  continentId: ContinentId,
  playerId: string,
  territories: Record<string, TerritoryState>
): boolean {
  const continent = CONTINENTS[continentId];
  return continent.territoryIds.every(tId => territories[tId]?.playerId === playerId);
}

function countTotalTerritories(playerId: string, territories: Record<string, TerritoryState>): number {
  return Object.values(territories).filter(t => t.playerId === playerId).length;
}

function countTerritoriesWithMinArmies(
  playerId: string,
  territories: Record<string, TerritoryState>,
  minArmies: number
): number {
  return Object.values(territories).filter(t => t.playerId === playerId && t.armies >= minArmies).length;
}

function getOwnedContinents(playerId: string, territories: Record<string, TerritoryState>): ContinentId[] {
  return (Object.keys(CONTINENTS) as ContinentId[]).filter(cId => ownsContinent(cId, playerId, territories));
}

function evaluateElimination(
  targetColor: PlayerColor,
  targetColorName: string,
  playerId: string,
  territories: Record<string, TerritoryState>,
  players: Player[]
) {
  const player = players.find(p => p.id === playerId);
  const targetPlayer = players.find(p => p.color === targetColor);

  // If the target is the player itself or not in the match, fallback to 24 territories
  if (!targetPlayer || targetPlayer.id === playerId) {
    const total = countTotalTerritories(playerId, territories);
    return {
      completed: total >= 24,
      progress: Math.min(100, Math.round((total / 24) * 100)),
      progressText: `${total}/24 territórios conquistados (Missão alternativa)`
    };
  }

  // Count target player's remaining territories
  const targetTerritories = Object.values(territories).filter(t => t.playerId === targetPlayer.id).length;
  if (targetTerritories === 0) {
    return {
      completed: true,
      progress: 100,
      progressText: `Exército ${targetColorName} completamente destruído!`
    };
  }

  return {
    completed: false,
    progress: Math.max(5, Math.round(((42 - targetTerritories) / 42) * 100)),
    progressText: `Restam ${targetTerritories} territórios do exército ${targetColorName}`
  };
}

export const SECRET_OBJECTIVES: SecretObjective[] = [
  {
    id: 1,
    title: 'Europa, Oceania e +1 Continente',
    description: 'Conquistar na totalidade a Europa, a Oceania e mais um terceiro continente à sua escolha.',
    evaluate: (playerId, territories) => {
      const europe = ownsContinent('europe', playerId, territories);
      const oceania = ownsContinent('oceania', playerId, territories);
      const owned = getOwnedContinents(playerId, territories);
      const otherContinents = owned.filter(c => c !== 'europe' && c !== 'oceania');
      const completed = europe && oceania && otherContinents.length >= 1;

      let score = (europe ? 1 : 0) + (oceania ? 1 : 0) + (otherContinents.length > 0 ? 1 : 0);
      return {
        completed,
        progress: Math.round((score / 3) * 100),
        progressText: `${score}/3 continentes dominados (Europa: ${europe ? '✓' : '✗'}, Oceania: ${oceania ? '✓' : '✗'}, 3º: ${otherContinents.length > 0 ? '✓' : '✗'})`
      };
    }
  },
  {
    id: 2,
    title: 'Ásia e América do Sul',
    description: 'Conquistar na totalidade a Ásia e a América do Sul.',
    evaluate: (playerId, territories) => {
      const asia = ownsContinent('asia', playerId, territories);
      const sa = ownsContinent('south_america', playerId, territories);
      const asiaCount = CONTINENTS.asia.territoryIds.filter(id => territories[id]?.playerId === playerId).length;
      const saCount = CONTINENTS.south_america.territoryIds.filter(id => territories[id]?.playerId === playerId).length;

      return {
        completed: asia && sa,
        progress: Math.round(((asiaCount + saCount) / 16) * 100),
        progressText: `Ásia: ${asiaCount}/12 | América do Sul: ${saCount}/4`
      };
    }
  },
  {
    id: 3,
    title: 'Europa, América do Sul e +1 Continente',
    description: 'Conquistar na totalidade a Europa, a América do Sul e mais um terceiro continente à sua escolha.',
    evaluate: (playerId, territories) => {
      const europe = ownsContinent('europe', playerId, territories);
      const sa = ownsContinent('south_america', playerId, territories);
      const owned = getOwnedContinents(playerId, territories);
      const otherContinents = owned.filter(c => c !== 'europe' && c !== 'south_america');
      const completed = europe && sa && otherContinents.length >= 1;
      let score = (europe ? 1 : 0) + (sa ? 1 : 0) + (otherContinents.length > 0 ? 1 : 0);

      return {
        completed,
        progress: Math.round((score / 3) * 100),
        progressText: `${score}/3 continentes (Europa: ${europe ? '✓' : '✗'}, América do Sul: ${sa ? '✓' : '✗'}, 3º: ${otherContinents.length > 0 ? '✓' : '✗'})`
      };
    }
  },
  {
    id: 4,
    title: '18 Territórios com 2+ Exércitos',
    description: 'Conquistar 18 territórios e ocupar cada um deles com pelo menos 2 exércitos.',
    evaluate: (playerId, territories) => {
      const qualified = countTerritoriesWithMinArmies(playerId, territories, 2);
      return {
        completed: qualified >= 18,
        progress: Math.min(100, Math.round((qualified / 18) * 100)),
        progressText: `${qualified}/18 territórios com 2 ou mais exércitos`
      };
    }
  },
  {
    id: 5,
    title: 'Ásia e África',
    description: 'Conquistar na totalidade a Ásia e a África.',
    evaluate: (playerId, territories) => {
      const asia = ownsContinent('asia', playerId, territories);
      const africa = ownsContinent('africa', playerId, territories);
      const asiaCount = CONTINENTS.asia.territoryIds.filter(id => territories[id]?.playerId === playerId).length;
      const africaCount = CONTINENTS.africa.territoryIds.filter(id => territories[id]?.playerId === playerId).length;

      return {
        completed: asia && africa,
        progress: Math.round(((asiaCount + africaCount) / 18) * 100),
        progressText: `Ásia: ${asiaCount}/12 | África: ${africaCount}/6`
      };
    }
  },
  {
    id: 6,
    title: 'América do Norte e África',
    description: 'Conquistar na totalidade a América do Norte e a África.',
    evaluate: (playerId, territories) => {
      const na = ownsContinent('north_america', playerId, territories);
      const africa = ownsContinent('africa', playerId, territories);
      const naCount = CONTINENTS.north_america.territoryIds.filter(id => territories[id]?.playerId === playerId).length;
      const africaCount = CONTINENTS.africa.territoryIds.filter(id => territories[id]?.playerId === playerId).length;

      return {
        completed: na && africa,
        progress: Math.round(((naCount + africaCount) / 15) * 100),
        progressText: `América do Norte: ${naCount}/9 | África: ${africaCount}/6`
      };
    }
  },
  {
    id: 7,
    title: '24 Territórios à Escolha',
    description: 'Conquistar 24 territórios à sua escolha no tabuleiro.',
    evaluate: (playerId, territories) => {
      const total = countTotalTerritories(playerId, territories);
      return {
        completed: total >= 24,
        progress: Math.min(100, Math.round((total / 24) * 100)),
        progressText: `${total}/24 territórios dominados`
      };
    }
  },
  {
    id: 8,
    title: 'América do Norte e Oceania',
    description: 'Conquistar na totalidade a América do Norte e a Oceania.',
    evaluate: (playerId, territories) => {
      const na = ownsContinent('north_america', playerId, territories);
      const oceania = ownsContinent('oceania', playerId, territories);
      const naCount = CONTINENTS.north_america.territoryIds.filter(id => territories[id]?.playerId === playerId).length;
      const ocCount = CONTINENTS.oceania.territoryIds.filter(id => territories[id]?.playerId === playerId).length;

      return {
        completed: na && oceania,
        progress: Math.round(((naCount + ocCount) / 13) * 100),
        progressText: `América do Norte: ${naCount}/9 | Oceania: ${ocCount}/4`
      };
    }
  },
  {
    id: 9,
    title: 'Destruir o Exército Amarelo',
    description: 'Destruir totalmente os exércitos Amarelos. Se você for o Amarelo ou não houver jogador Amarelo, seu objetivo é conquistar 24 territórios.',
    targetColor: 'yellow',
    evaluate: (playerId, territories, players) =>
      evaluateElimination('yellow', 'Amarelo', playerId, territories, players)
  },
  {
    id: 10,
    title: 'Destruir o Exército Azul',
    description: 'Destruir totalmente os exércitos Azuis. Se você for o Azul ou não houver jogador Azul, seu objetivo é conquistar 24 territórios.',
    targetColor: 'blue',
    evaluate: (playerId, territories, players) =>
      evaluateElimination('blue', 'Azul', playerId, territories, players)
  },
  {
    id: 11,
    title: 'Destruir o Exército Branco',
    description: 'Destruir totalmente os exércitos Brancos. Se você for o Branco ou não houver jogador Branco, seu objetivo é conquistar 24 territórios.',
    targetColor: 'white',
    evaluate: (playerId, territories, players) =>
      evaluateElimination('white', 'Branco', playerId, territories, players)
  },
  {
    id: 12,
    title: 'Destruir o Exército Preto',
    description: 'Destruir totalmente os exércitos Pretos. Se você for o Preto ou não houver jogador Preto, seu objetivo é conquistar 24 territórios.',
    targetColor: 'black',
    evaluate: (playerId, territories, players) =>
      evaluateElimination('black', 'Preto', playerId, territories, players)
  },
  {
    id: 13,
    title: 'Destruir o Exército Vermelho',
    description: 'Destruir totalmente os exércitos Vermelhos. Se você for o Vermelho ou não houver jogador Vermelho, seu objetivo é conquistar 24 territórios.',
    targetColor: 'red',
    evaluate: (playerId, territories, players) =>
      evaluateElimination('red', 'Vermelho', playerId, territories, players)
  },
  {
    id: 14,
    title: 'Destruir o Exército Verde',
    description: 'Destruir totalmente os exércitos Verdes. Se você for o Verde ou não houver jogador Verde, seu objetivo é conquistar 24 territórios.',
    targetColor: 'green',
    evaluate: (playerId, territories, players) =>
      evaluateElimination('green', 'Verde', playerId, territories, players)
  }
];
