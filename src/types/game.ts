/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ContinentId = 'north_america' | 'south_america' | 'europe' | 'africa' | 'asia' | 'oceania';

export type CardSymbol = 'circle' | 'triangle' | 'square' | 'wildcard';

export type PlayerColor = 'red' | 'blue' | 'yellow' | 'green' | 'white' | 'black';

export type GamePhase = 'reinforce' | 'attack' | 'fortify' | 'conquer_move' | 'game_over';

export interface Territory {
  id: string;
  name: string;
  continentId: ContinentId;
  neighbors: string[]; // Connected territory IDs
  // SVG coordinates for placing army badge & labels on the 1000x600 board map
  x: number;
  y: number;
  labelX?: number;
  labelY?: number;
  cardSymbol: CardSymbol;
}

export interface TerritoryState {
  territoryId: string;
  playerId: string;
  armies: number;
}

export interface Continent {
  id: ContinentId;
  name: string;
  bonus: number;
  color: string;
  territoryIds: string[];
}

export interface TerritoryCard {
  id: string;
  territoryId?: string; // undefined if wildcard
  symbol: CardSymbol;
  name: string;
}

export interface SecretObjective {
  id: number;
  title: string;
  description: string;
  evaluate: (
    playerId: string,
    territories: Record<string, TerritoryState>,
    players: Player[],
    gameTurn: number
  ) => { completed: boolean; progress: number; progressText: string };
  targetColor?: PlayerColor; // for elimination objectives
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  isAi: boolean;
  cards: TerritoryCard[];
  objective: SecretObjective;
  eliminated: boolean;
  conqueredThisTurn: boolean;
}

export interface CombatResult {
  attackerId: string;
  defenderId: string;
  fromTerritoryId: string;
  toTerritoryId: string;
  attackDice: number[];
  defenseDice: number[];
  attackerLosses: number;
  defenderLosses: number;
  conquered: boolean;
}

export interface GameLog {
  id: string;
  timestamp: string;
  text: string;
  type: 'attack' | 'conquer' | 'reinforce' | 'trade' | 'turn' | 'elimination' | 'system';
  playerColor?: PlayerColor;
}

export interface PlayerRoundStats {
  playerId: string;
  playerName: string;
  color: PlayerColor;
  isAi: boolean;
  armies: number;
  territories: number;
  eliminated: boolean;
}

export interface RoundHistoryEntry {
  round: number;
  timestamp: string;
  stats: Record<string, PlayerRoundStats>;
}
