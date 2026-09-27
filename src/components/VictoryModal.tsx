/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Player, TerritoryState } from '../types/game';
import { sounds } from '../utils/audio';
import { Trophy, Award, Crown, RotateCcw, CheckCircle2, Shield, TrendingUp, X, Eye } from 'lucide-react';

interface VictoryModalProps {
  winner: Player;
  territories: Record<string, TerritoryState>;
  onNewGame: () => void;
  onOpenWarReport?: () => void;
  onClose?: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  winner,
  territories,
  onNewGame,
  onOpenWarReport,
  onClose
}) => {
  useEffect(() => {
    sounds.playVictory();
  }, []);

  const ownedCount = Object.values(territories).filter(t => t.playerId === winner.id).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/90 backdrop-blur-md">
      <div className="relative w-full max-w-lg max-h-[92dvh] overflow-y-auto bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-amber-500/80 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 text-center text-stone-100 animate-in fade-in zoom-in duration-300">
        {/* Top-Right Dismiss Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition active:scale-95 z-10"
            title="Fechar e inspecionar o mapa"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 flex items-center justify-center text-stone-950 shadow-xl shadow-amber-500/30 mb-4 animate-pulse">
          <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-widest border border-amber-500/30 mb-3">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>Vitória Decisiva em Warall</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white font-serif tracking-wide mb-2">
          {winner.name} Conquistou o Mundo!
        </h2>

        <p className="text-xs sm:text-sm text-stone-400 mb-6">
          O General cumpriu com êxito seu objetivo secreto e dominou o cenário geopolítico global com maestria tática.
        </p>

        {/* Revealed Secret Objective Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-stone-950/80 border border-stone-800 text-left mb-6 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Objetivo Secreto Cumprido:</span>
          </div>

          <div className="font-bold text-sm sm:text-base text-white font-serif">
            {winner.objective.title}
          </div>

          <p className="text-xs text-stone-300 leading-relaxed font-sans">
            "{winner.objective.description}"
          </p>

          <div className="pt-2 mt-2 border-t border-stone-850 flex items-center justify-between text-xs text-stone-400 font-mono">
            <span>Territórios dominados:</span>
            <span className="font-bold text-amber-400 text-sm">
              {ownedCount} de 42
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={onNewGame}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Iniciar Nova Partida</span>
          </button>

          {onOpenWarReport && (
            <button
              onClick={onOpenWarReport}
              className="w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-700 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-98"
            >
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Ver Relatório de Guerra Completo</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-98"
            >
              <Eye className="w-4 h-4 text-stone-400" />
              <span>Visualizar Mapa Final</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
