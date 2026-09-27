/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GamePhase } from './game';

export type MilitaryRankId = 'cadet' | 'captain' | 'major' | 'marshal';

export interface MilitaryRank {
  id: MilitaryRankId;
  title: string;
  badge: string;
  stars: number;
  minXp: number;
  maxXp: number;
  description: string;
  autonomySummary: string;
  guidanceLevel: 'strict' | 'guided' | 'tactical' | 'autonomous';
}

export const MILITARY_RANKS: Record<MilitaryRankId, MilitaryRank> = {
  cadet: {
    id: 'cadet',
    title: 'Cadete da Academia',
    badge: '🎖️',
    stars: 1,
    minXp: 0,
    maxXp: 150,
    description: 'Em fase de instrução militar. O Alto Comando dita ordens de reforço e aponta alvos prioritários.',
    autonomySummary: 'Ordens diretas do Comando com balizas luminosas no mapa.',
    guidanceLevel: 'strict'
  },
  captain: {
    id: 'captain',
    title: 'Capitão de Frente',
    badge: '⚔️',
    stars: 2,
    minXp: 150,
    maxXp: 400,
    description: 'Oficial operacional com autonomia para escolher ofensivas. O Comando recomenda alocações e manobras.',
    autonomySummary: 'Autonomia em ataques; orientações estratégicas de reforço.',
    guidanceLevel: 'guided'
  },
  major: {
    id: 'major',
    title: 'Major-General',
    badge: '⭐',
    stars: 3,
    minXp: 400,
    maxXp: 850,
    description: 'Comandante de corpo de exército. Recebe relatórios avançados de inteligência e pontos fracos inimigos.',
    autonomySummary: 'Autonomia quase total; inteligência de satélite e reconhecimento.',
    guidanceLevel: 'tactical'
  },
  marshal: {
    id: 'marshal',
    title: 'Marechal de Campo',
    badge: '🌟',
    stars: 4,
    minXp: 850,
    maxXp: 2000,
    description: 'Comandante Supremo das Forças Aliadas. Controle absoluto do teatro de operações e condecorações de honra.',
    autonomySummary: 'Livre arbítrio total; status de lenda militar.',
    guidanceLevel: 'autonomous'
  }
};

export type SubordinateOutcome =
  | 'followed_success'
  | 'followed_struggle'
  | 'deviated_disaster'
  | 'deviated_heroic'
  | 'deviated_neutral'
  | null;

export interface CommandDispatch {
  id: string;
  turnNumber: number;
  phase: GamePhase | 'briefing' | 'post-combat' | 'promotion';
  title: string;
  message: string;
  advisorName: string;
  advisorRole: string;
  highlightTerritories: string[]; // Territories to highlight with tactical beacon on map
  targetTerritories?: string[];    // Target enemy territories for attack
  suggestedArmies?: number;
  urgency: 'routine' | 'priority' | 'urgent' | 'victory';
  outcomeType?: SubordinateOutcome;
  xpDelta?: number;
  badgeText?: string;
  actionTakenText?: string;
}

export interface CareerProfile {
  xp: number;
  rankId: MilitaryRankId;
  careerModeActive: boolean;
  battlesWon: number;
  territoriesConquered: number;
  continentsConquered: number;
  generalsDefeated: number;
  campaignsWon: number;
}
