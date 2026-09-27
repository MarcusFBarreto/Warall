/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Player, TerritoryState } from '../types/game';
import { Shield, EyeOff, Award, Lock, FileText, CheckCircle2 } from 'lucide-react';

interface ObjectiveCardModalProps {
  player: Player;
  territories: Record<string, TerritoryState>;
  players: Player[];
  gameTurn: number;
  onClose: () => void;
}

export const ObjectiveCardModal: React.FC<ObjectiveCardModalProps> = ({
  player,
  territories,
  players,
  gameTurn,
  onClose
}) => {
  const objective = player.objective;
  const status = objective.evaluate(player.id, territories, players, gameTurn);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/85 backdrop-blur-md">
      <div className="w-full max-w-md max-h-[92dvh] bg-stone-900 border-2 border-amber-800/60 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-stone-100 flex flex-col">
        {/* Envelope Top Header with Secret Seal */}
        <div className="shrink-0 bg-gradient-to-r from-stone-950 via-amber-950 to-stone-950 px-4 sm:px-6 py-3 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-xs uppercase tracking-widest text-amber-300 font-mono">
              Documento Confidencial
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-stone-400 hover:text-white px-2 py-1 rounded bg-stone-800 transition"
          >
            Fechar
          </button>
        </div>

        {/* Vintage Secret Mission Card Graphic */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-b from-stone-900 to-[#1c1917] space-y-4 sm:space-y-6 overscroll-contain">
          <div className="relative p-6 rounded-2xl bg-[#f5ede0] text-stone-900 border-4 border-[#d6c7b2] shadow-inner font-serif">
            {/* Wax Seal Stamp */}
            <div className="absolute top-3 right-3 w-12 h-12 rounded-full bg-red-800 border-2 border-red-950 flex flex-col items-center justify-center text-red-100 shadow-md transform rotate-12">
              <span className="text-[7px] uppercase tracking-widest font-sans font-bold">WARALL</span>
              <span className="text-[10px] font-black"># {objective.id}</span>
            </div>

            <div className="text-[11px] uppercase tracking-wider text-stone-600 font-sans font-bold mb-1">
              Missão Militar Secreta
            </div>

            <h3 className="text-xl font-bold text-stone-900 mb-3 pr-10 leading-snug">
              {objective.title}
            </h3>

            <div className="h-0.5 w-16 bg-amber-800/40 mb-3" />

            <p className="text-sm text-stone-800 leading-relaxed font-sans mb-4">
              "{objective.description}"
            </p>

            {/* Live Mission Progress Bar */}
            <div className="mt-4 pt-4 border-t border-stone-300 font-sans">
              <div className="flex items-center justify-between text-xs mb-1.5 font-semibold text-stone-700">
                <span>Progresso da Operação:</span>
                <span className={status.completed ? 'text-emerald-700 font-black' : 'text-amber-800'}>
                  {status.progress}%
                </span>
              </div>

              <div className="w-full h-2.5 bg-stone-300 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    status.completed
                      ? 'bg-emerald-600 shadow-sm'
                      : 'bg-gradient-to-r from-amber-600 to-amber-700'
                  }`}
                  style={{ width: `${status.progress}%` }}
                />
              </div>

              <div className="text-[11px] text-stone-600 mt-2 font-mono flex items-center gap-1.5">
                {status.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                )}
                <span>{status.progressText}</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800/80 text-xs text-stone-400 flex items-start gap-2">
            <EyeOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Mantenha seu objetivo em segredo dos seus adversários. Ao cumprir esta condição, você será imediatamente declarado o <strong>Vencedor de Warall</strong>!
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs uppercase tracking-wider transition border border-stone-700"
          >
            Guardar Carta no Envelope
          </button>
        </div>
      </div>
    </div>
  );
};
