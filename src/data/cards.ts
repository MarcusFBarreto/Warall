/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TerritoryCard, CardSymbol } from '../types/game';
import { TERRITORIES } from './territories';

export function createDeck(): TerritoryCard[] {
  const cards: TerritoryCard[] = TERRITORIES.map(t => ({
    id: `card_${t.id}`,
    territoryId: t.id,
    symbol: t.cardSymbol,
    name: t.name
  }));

  // Add 2 wildcards (Curingas)
  cards.push(
    {
      id: 'wildcard_1',
      symbol: 'wildcard',
      name: 'Curinga Especial'
    },
    {
      id: 'wildcard_2',
      symbol: 'wildcard',
      name: 'Curinga Especial'
    }
  );

  return shuffleDeck(cards);
}

export function shuffleDeck<T>(items: T[]): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function getExchangeBonus(exchangeCount: number): number {
  const progression = [4, 6, 8, 10, 12, 15, 20, 25, 30];
  if (exchangeCount < progression.length) {
    return progression[exchangeCount];
  }
  return 30 + (exchangeCount - (progression.length - 1)) * 5;
}

export function isValidCombination(cards: TerritoryCard[]): boolean {
  if (cards.length !== 3) return false;

  const hasWildcard = cards.some(c => c.symbol === 'wildcard');
  if (hasWildcard) return true;

  const symbols = cards.map(c => c.symbol);
  // All three identical
  if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
    return true;
  }

  // All three different
  const unique = new Set(symbols);
  return unique.size === 3;
}
