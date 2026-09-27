/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Player, TerritoryCard, TerritoryState, GamePhase } from '../types/game';
import { TERRITORIES_MAP } from '../data/territories';
import { CONTINENTS } from '../data/continents';
import { isValidCombination, getExchangeBonus } from '../data/cards';
import { sounds } from '../utils/audio';
import { Circle, Triangle, Square, Sparkles, X, Plus, Check } from 'lucide-react';

interface CardsModalProps {
  player: Player;
  territories: Record<string, TerritoryState>;
  exchangeCount: number;
  currentPhase: GamePhase;
  onExchangeCards: (selectedCards: TerritoryCard[], bonusArmies: number) => void;
  onClose: () => void;
}

export const CardsModal: React.FC<CardsModalProps> = ({
  player,
  territories,
  exchangeCount,
  currentPhase,
  onExchangeCards,
  onClose
}) => {
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  const toggleSelectCard = (cardId: string) => {
    if (selectedCardIds.includes(cardId)) {
      setSelectedCardIds(prev => prev.filter(id => id !== cardId));
    } else {
      if (selectedCardIds.length < 3) {
        setSelectedCardIds(prev => [...prev, cardId]);
      }
    }
  };

  const selectedCards = player.cards.filter(c => selectedCardIds.includes(c.id));
  const validSet = isValidCombination(selectedCards);
  const baseBonus = getExchangeBonus(exchangeCount);

  // Check extra +2 for owning territory on card
  const extraBonuses: { card: TerritoryCard; territoryName: string }[] = [];
  if (validSet) {
    selectedCards.forEach(card => {
      if (card.territoryId && territories[card.territoryId]?.playerId === player.id) {
        extraBonuses.push({
          card,
          territoryName: TERRITORIES_MAP[card.territoryId]?.name || card.name
        });
      }
    });
  }

  const totalBonus = validSet ? baseBonus + extraBonuses.length * 2 : 0;

  const handlePerformExchange = () => {
    if (!validSet) return;
    sounds.playCard();
    onExchangeCards(selectedCards, totalBonus);
    onClose();
  };

  const renderSymbolIcon = (symbol: string) => {
    switch (symbol) {
      case 'circle':
        return <Circle className="w-5 h-5 text-amber-400 fill-amber-400/20" />;
      case 'triangle':
        return <Triangle className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />;
      case 'square':
        return <Square className="w-5 h-5 text-blue-400 fill-blue-400/20" />;
      case 'wildcard':
        return <Sparkles className="w-5 h-5 text-purple-400 fill-purple-400/20" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/85 backdrop-blur-md">
      <div className="w-full max-w-2xl max-h-[92dvh] bg-stone-900 border-2 border-stone-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-stone-100 flex flex-col">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 px-4 sm:px-6 py-3.5 border-b border-stone-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-white">Cartas de Território</h3>
            <p className="text-xs text-stone-400">
              Próxima troca concederá{' '}
              <strong className="text-amber-400 font-bold">{baseBonus} exércitos</strong> (+2 por território próprio).
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cards Grid */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto overscroll-contain">
          {player.cards.length === 0 ? (
            <div className="text-center py-12 text-stone-500 text-sm">
              Você ainda não possui cartas. Conquiste ao menos um território durante o seu turno para receber uma carta!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {player.cards.map(card => {
                const isSelected = selectedCardIds.includes(card.id);
                const territory = card.territoryId ? TERRITORIES_MAP[card.territoryId] : null;
                const isOwned = card.territoryId
                  ? territories[card.territoryId]?.playerId === player.id
                  : false;
                const continent = territory ? CONTINENTS[territory.continentId] : null;

                return (
                  <div
                    key={card.id}
                    onClick={() => toggleSelectCard(card.id)}
                    className={`cursor-pointer rounded-2xl p-4 border transition-all duration-150 relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 shadow-md ring-1 ring-amber-500'
                        : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 hover:bg-stone-850'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-700 flex items-center justify-center">
                          {renderSymbolIcon(card.symbol)}
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="font-bold text-sm text-stone-100 mb-1">
                        {card.name}
                      </div>

                      {continent && (
                        <div
                          className="text-[10px] font-medium"
                          style={{ color: continent.color }}
                        >
                          {continent.name}
                        </div>
                      )}
                    </div>

                    {isOwned && (
                      <div className="mt-3 pt-2 border-t border-stone-800/80 text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <span>★ Território sob seu comando (+2)</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Exchange Status */}
        <div className="px-6 py-4 bg-stone-950/80 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs">
            {selectedCardIds.length === 3 ? (
              validSet ? (
                <div className="text-emerald-400 font-semibold">
                  Combinação válida! Total de reforço: <strong>+{totalBonus} exércitos</strong>
                  {extraBonuses.length > 0 && (
                    <span className="text-stone-400 block text-[11px]">
                      (Inclui +{extraBonuses.length * 2} por possuir{' '}
                      {extraBonuses.map(b => b.territoryName).join(', ')})
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-rose-400">
                  Combinação inválida. Escolha 3 símbolos iguais, 3 diferentes ou um Curinga.
                </span>
              )
            ) : (
              <span className="text-stone-400">
                Selecione 3 cartas para trocar ({selectedCardIds.length}/3 selecionadas)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition"
            >
              Fechar
            </button>

            {currentPhase === 'reinforce' && (
              <button
                disabled={!validSet}
                onClick={handlePerformExchange}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider transition shadow-md"
              >
                Trocar por +{totalBonus} Exércitos
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
