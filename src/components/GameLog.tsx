/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameLog as GameLogType, PlayerColor } from '../types/game';
import { ScrollText, X, Swords, Flag, Sparkles, Layers, ShieldAlert } from 'lucide-react';

interface GameLogProps {
  logs: GameLogType[];
  onClose: () => void;
}

const COLOR_TEXT: Record<PlayerColor, string> = {
  red: 'text-red-400',
  blue: 'text-blue-400',
  yellow: 'text-amber-400',
  green: 'text-emerald-400',
  white: 'text-stone-200',
  black: 'text-stone-400'
};

export const GameLog: React.FC<GameLogProps> = ({ logs, onClose }) => {
  const getLogIcon = (type: GameLogType['type']) => {
    switch (type) {
      case 'attack':
        return <Swords className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />;
      case 'conquer':
        return <Flag className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
      case 'reinforce':
        return <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />;
      case 'trade':
        return <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />;
      case 'elimination':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />;
      default:
        return <ScrollText className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-stone-900 border-l border-stone-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 text-stone-100">
      <div className="p-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-sm uppercase tracking-wider text-white">
            Diário de Guerra
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-2.5 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-stone-500 font-sans">
            Nenhuma operação militar registrada até o momento.
          </div>
        ) : (
          logs.map(log => (
            <div
              key={log.id}
              className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800/80 flex items-start gap-2.5"
            >
              {getLogIcon(log.type)}
              <div className="flex-1 leading-relaxed">
                <span className="text-[10px] text-stone-500 block">
                  [{log.timestamp}]
                </span>
                <span
                  className={log.playerColor ? COLOR_TEXT[log.playerColor] : 'text-stone-300'}
                >
                  {log.text}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
