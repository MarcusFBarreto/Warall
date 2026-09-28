/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlayerColor } from '../types/game';
import { Swords, Users, Bot, User, Check, Play, ShieldAlert, RotateCcw, Award } from 'lucide-react';
import { CareerProfile, MILITARY_RANKS } from '../types/career';
import { PlayerProfile } from '../types/player';

interface PlayerConfig {
  name: string;
  color: PlayerColor;
  isAi: boolean;
}

interface NewGameModalProps {
  onStartGame: (configs: PlayerConfig[], careerMode?: boolean) => void;
  onCancel?: () => void;
  initialCareerMode?: boolean;
  careerProfile?: CareerProfile;
  playerProfile?: PlayerProfile | null;
  onResetCareer?: () => void;
}

const AVAILABLE_COLORS: { color: PlayerColor; label: string; hex: string }[] = [
  { color: 'red', label: 'Vermelho', hex: '#dc2626' },
  { color: 'blue', label: 'Azul', hex: '#2563eb' },
  { color: 'yellow', label: 'Amarelo', hex: '#eab308' },
  { color: 'green', label: 'Verde', hex: '#16a34a' },
  { color: 'white', label: 'Branco', hex: '#f8fafc' },
  { color: 'black', label: 'Preto', hex: '#1e293b' }
];

export const NewGameModal: React.FC<NewGameModalProps> = ({
  onStartGame,
  onCancel,
  initialCareerMode = true,
  careerProfile,
  playerProfile,
  onResetCareer
}) => {
  const [careerMode, setCareerMode] = useState<boolean>(initialCareerMode);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [playerConfigs, setPlayerConfigs] = useState<PlayerConfig[]>([
    { name: playerProfile ? `${playerProfile.nickname} (Você)` : 'General (Você)', color: 'blue', isAi: false },
    { name: 'Gen. Montgomery', color: 'red', isAi: true },
    { name: 'Gen. Rommel', color: 'yellow', isAi: true },
    { name: 'Gen. Patton', color: 'green', isAi: true },
    { name: 'Gen. Sun Tzu', color: 'white', isAi: true },
    { name: 'Gen. Napoleão', color: 'black', isAi: true }
  ]);

  const handleSetCount = (count: number) => {
    setPlayerCount(count);
  };

  const updatePlayerName = (idx: number, name: string) => {
    setPlayerConfigs(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], name };
      return copy;
    });
  };

  const togglePlayerAi = (idx: number) => {
    setPlayerConfigs(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], isAi: !copy[idx].isAi };
      return copy;
    });
  };

  const changePlayerColor = (idx: number, color: PlayerColor) => {
    setPlayerConfigs(prev => {
      const copy = [...prev];
      // Swap colors if another player has it
      const existingIdx = copy.findIndex((p, i) => i !== idx && p.color === color);
      if (existingIdx !== -1) {
        copy[existingIdx].color = copy[idx].color;
      }
      copy[idx].color = color;
      return copy;
    });
  };

  const handleStart = () => {
    const selected = playerConfigs.slice(0, playerCount);
    onStartGame(selected, careerMode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/90 backdrop-blur-md">
      <div className="w-full max-w-xl max-h-[92dvh] bg-stone-900 border-2 border-amber-900/60 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-stone-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="shrink-0 bg-gradient-to-r from-stone-950 via-amber-950 to-stone-950 px-4 sm:px-6 py-4 border-b border-stone-800 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 mb-1.5">
            <Swords className="w-5 h-5" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white font-serif tracking-wider uppercase">
            Warall – Sala de Guerra
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Escolha o número de generais e configure sua partida estratégica.
          </p>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto overscroll-contain">
          {/* Player Count Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              Quantidade de Generais na Mesa:
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[2, 3, 4, 5, 6].map(count => (
                <button
                  key={count}
                  onClick={() => handleSetCount(count)}
                  className={`py-2 rounded-xl font-bold text-sm transition border ${
                    playerCount === count
                      ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                      : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-750'
                  }`}
                >
                  {count} Jogadores
                </button>
              ))}
            </div>
          </div>

          {/* Player Config List */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Generais Concorrentes:
            </label>

            {playerConfigs.slice(0, playerCount).map((cfg, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-stone-950/70 border border-stone-800 flex items-center justify-between gap-3"
              >
                {/* Color Dot & Selector */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {AVAILABLE_COLORS.map(c => (
                    <button
                      key={c.color}
                      onClick={() => changePlayerColor(idx, c.color)}
                      className={`w-6 h-6 rounded-full border-2 transition ${
                        cfg.color === c.color
                          ? 'ring-2 ring-white scale-110 border-white'
                          : 'opacity-40 hover:opacity-80 border-transparent'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={`Cor ${c.label}`}
                    />
                  ))}
                </div>

                {/* Name Input */}
                <input
                  type="text"
                  value={cfg.name}
                  onChange={e => updatePlayerName(idx, e.target.value)}
                  className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-400"
                  placeholder="Nome do General"
                />

                {/* AI / Human Toggle */}
                <button
                  onClick={() => togglePlayerAi(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    cfg.isAi
                      ? 'bg-stone-800 text-amber-400 border border-stone-700'
                      : 'bg-amber-500 text-stone-950 font-bold'
                  }`}
                >
                  {cfg.isAi ? (
                    <>
                      <Bot className="w-3.5 h-3.5" />
                      <span>IA</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5" />
                      <span>Humano</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Game Mode Selector: Career vs Free Campaign */}
        <div className="px-4 sm:px-6 py-2.5 bg-stone-950/60 border-t border-stone-800 space-y-2">
          <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl select-none shrink-0">🎖️</span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-stone-200">Modo Carreira Militar</div>
                <div className="text-[10px] text-stone-400 truncate">Despachos do Alto Comando, tutoria de cadete a marechal e balizas táticas no mapa.</div>
              </div>
            </div>
            <button
              onClick={() => setCareerMode(prev => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                careerMode
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'bg-stone-800 text-stone-400 border border-stone-700'
              }`}
            >
              {careerMode ? 'Ativado' : 'Desativado'}
            </button>
          </div>

          {/* Current Career Status & Iniciar Nova Carreira */}
          {careerMode && careerProfile && (
            <div className="p-2.5 rounded-xl bg-stone-900/60 border border-amber-900/30 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg select-none shrink-0">
                  {MILITARY_RANKS[careerProfile.rankId]?.badge || '🎖️'}
                </span>
                <div className="min-w-0">
                  <div className="text-amber-300 font-bold text-[11px] truncate">
                    Patente: {MILITARY_RANKS[careerProfile.rankId]?.title || 'Cadete da Academia'} ({careerProfile.xp} XP)
                  </div>
                  <div className="text-[10px] text-stone-400 truncate">
                    {careerProfile.battlesWon} vitórias · {careerProfile.territoriesConquered} setores dominados
                  </div>
                </div>
              </div>

              {onResetCareer && (
                <div className="shrink-0">
                  {confirmReset ? (
                    <div className="flex items-center gap-1.5 bg-rose-950/70 border border-rose-800/60 px-2 py-1 rounded-lg">
                      <span className="text-[10px] text-rose-200 font-semibold">Zerar Carreira?</span>
                      <button
                        onClick={() => {
                          onResetCareer();
                          setConfirmReset(false);
                        }}
                        className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition"
                      >
                        Sim, Zerar
                      </button>
                      <button
                        onClick={() => setConfirmReset(false)}
                        className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmReset(true)}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-amber-300 hover:text-amber-200 border border-amber-900/40 text-[10px] font-semibold transition flex items-center gap-1"
                      title="Reiniciar carreira militar como Cadete (0 XP)"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                      <span>Iniciar Nova Carreira</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs transition"
            >
              Continuar Partida Atual
            </button>
          )}

          <button
            onClick={handleStart}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-98"
          >
            <Play className="w-4 h-4 fill-stone-950" />
            <span>Iniciar Conquista Mundial</span>
          </button>
        </div>
      </div>
    </div>
  );
};
