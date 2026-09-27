/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Territory, TerritoryState } from '../types/game';
import { sounds } from '../utils/audio';
import { MoveRight, Shield, Check, X } from 'lucide-react';

interface FortifyModalProps {
  fromTerritory: Territory;
  toTerritory: Territory;
  fromState: TerritoryState;
  toState: TerritoryState;
  onConfirmMove: (armies: number) => void;
  onCancel: () => void;
}

export const FortifyModal: React.FC<FortifyModalProps> = ({
  fromTerritory,
  toTerritory,
  fromState,
  toState,
  onConfirmMove,
  onCancel
}) => {
  const maxMovable = Math.max(1, fromState.armies - 1);
  const [moveCount, setMoveCount] = useState<number>(1);

  const handleConfirm = () => {
    sounds.playTroopMovement(moveCount);
    onConfirmMove(moveCount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[92dvh] bg-stone-900 border-2 border-stone-700 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-stone-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        <div className="shrink-0 bg-stone-950 px-4 sm:px-6 py-3 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MoveRight className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-white">
              Remanejamento de Tropas
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 p-3 sm:p-4 bg-stone-950/60 rounded-xl sm:rounded-2xl border border-stone-800 text-center">
            <div>
              <span className="text-[10px] text-stone-400 font-semibold uppercase block">
                Origem
              </span>
              <div className="font-bold text-xs sm:text-sm text-white truncate">{fromTerritory.name}</div>
              <div className="text-xs text-blue-400 mt-0.5">
                Ficam: <strong>{fromState.armies - moveCount}</strong>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-stone-400 font-semibold uppercase block">
                Destino
              </span>
              <div className="font-bold text-xs sm:text-sm text-white truncate">{toTerritory.name}</div>
              <div className="text-xs text-emerald-400 mt-0.5">
                Ficarão: <strong>{toState.armies + moveCount}</strong>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 bg-stone-950/40 p-3 rounded-xl border border-stone-800">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-stone-300">Quantidade a deslocar:</span>
              <span className="text-blue-400 text-sm font-black font-mono">
                {moveCount} exército(s)
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={maxMovable}
              value={moveCount}
              onChange={e => setMoveCount(parseInt(e.target.value))}
              className="w-full accent-blue-500 h-2 bg-stone-800 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-stone-500 font-mono">
              <span>Mín: 1</span>
              <span>Máx: {maxMovable}</span>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="shrink-0 p-3 sm:p-4 bg-stone-950 border-t border-stone-800 flex items-center gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30"
          >
            <Check className="w-4 h-4" />
            <span>Deslocar Tropas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
