/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Territory, TerritoryState, Player, CombatResult } from '../types/game';
import { sounds } from '../utils/audio';
import { Swords, Shield, Skull, ArrowRight, Check, X, Flame, Sparkles } from 'lucide-react';
import { Dice } from './Dice';

interface DiceTrayProps {
  autoRoll?: boolean;
  attacker: Player;
  defender: Player;
  fromTerritory: Territory;
  toTerritory: Territory;
  territories: Record<string, TerritoryState>;
  onResolveCombat: (result: CombatResult) => void;
  onConquerMove: (movedArmies: number) => void;
  onClose: () => void;
}

export const DiceTray: React.FC<DiceTrayProps> = ({
  autoRoll,
  attacker,
  defender,
  fromTerritory,
  toTerritory,
  territories,
  onResolveCombat,
  onConquerMove,
  onClose
}) => {
  const fromState = territories[fromTerritory.id];
  const toState = territories[toTerritory.id];

  const maxAttackerDice = Math.min(3, Math.max(1, fromState.armies - 1));
  const maxDefenderDice = Math.min(3, Math.max(1, toState.armies));

  const [attackDiceCount, setAttackDiceCount] = useState<number>(maxAttackerDice);
  const [defenseDiceCount, setDefenseDiceCount] = useState<number>(maxDefenderDice);

  const [rolling, setRolling] = useState<boolean>(false);
  const [trayShaking, setTrayShaking] = useState<boolean>(false);
  const [displayRolls, setDisplayRolls] = useState<{ atk: number[]; def: number[] }>({ atk: [], def: [] });
  const [lastResult, setLastResult] = useState<CombatResult | null>(null);
  const [isConquered, setIsConquered] = useState<boolean>(false);
  const [movedArmies, setMovedArmies] = useState<number>(1);
  const [clashingPair, setClashingPair] = useState<number | null>(null);

  // Update dice counts if territory counts change
  useEffect(() => {
    setAttackDiceCount(Math.min(3, Math.max(1, fromState.armies - 1)));
    setDefenseDiceCount(Math.min(3, Math.max(1, toState.armies)));
  }, [fromState.armies, toState.armies]);

  const handleRollDice = () => {
    if (rolling || fromState.armies <= 1 || toState.armies <= 0) return;

    setRolling(true);
    setLastResult(null);
    sounds.playDiceRoll();
    sounds.playCannonShot(0.5);

    // Rapid intermediate face cycling during roll
    const interval = setInterval(() => {
      setDisplayRolls({
        atk: Array.from({ length: attackDiceCount }, () => Math.floor(Math.random() * 6) + 1),
        def: Array.from({ length: defenseDiceCount }, () => Math.floor(Math.random() * 6) + 1)
      });
    }, 70);

    setTimeout(() => {
      clearInterval(interval);

      // Final roll calculations
      const attackRolls: number[] = [];
      for (let i = 0; i < attackDiceCount; i++) {
        attackRolls.push(Math.floor(Math.random() * 6) + 1);
      }
      attackRolls.sort((a, b) => b - a);

      const defenseRolls: number[] = [];
      for (let i = 0; i < defenseDiceCount; i++) {
        defenseRolls.push(Math.floor(Math.random() * 6) + 1);
      }
      defenseRolls.sort((a, b) => b - a);

      let attackerLosses = 0;
      let defenderLosses = 0;

      const battlesCount = Math.min(attackRolls.length, defenseRolls.length);
      for (let i = 0; i < battlesCount; i++) {
        // Tie always favors the defender
        if (attackRolls[i] > defenseRolls[i]) {
          defenderLosses++;
        } else {
          attackerLosses++;
        }
      }

      const newDefenderArmies = toState.armies - defenderLosses;
      const conquered = newDefenderArmies <= 0;

      sounds.playWarCombat(attackerLosses, defenderLosses, conquered);
      setTrayShaking(true);
      setTimeout(() => setTrayShaking(false), 400);

      const result: CombatResult = {
        attackerId: attacker.id,
        defenderId: defender.id,
        fromTerritoryId: fromTerritory.id,
        toTerritoryId: toTerritory.id,
        attackDice: attackRolls,
        defenseDice: defenseRolls,
        attackerLosses,
        defenderLosses,
        conquered
      };

      setDisplayRolls({ atk: attackRolls, def: defenseRolls });
      setLastResult(result);
      onResolveCombat(result);
      setRolling(false);

      // Flash clash animation across compared pairs
      setClashingPair(0);
      setTimeout(() => setClashingPair(1), 250);
      setTimeout(() => setClashingPair(2), 500);
      setTimeout(() => setClashingPair(null), 850);

      if (conquered) {
        setIsConquered(true);
        sounds.playConquer();
        setMovedArmies(attackDiceCount);
      }
    }, 750);
  };

  const handleConfirmOccupation = () => {
    sounds.playTroopMovement(movedArmies);
    onConquerMove(movedArmies);
    onClose();
  };

  useEffect(() => {
    if (autoRoll && !rolling && !lastResult) {
      handleRollDice();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRoll]);

  const renderDieFace = (val: number, isAttack: boolean, lost: boolean, won: boolean, index: number) => {
    return <Dice key={index} value={val} type={isAttack ? 'attack' : 'defense'} isRolling={rolling} lost={lost} won={won} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/85 backdrop-blur-md">
      <div
        className={`w-full max-w-xl max-h-[92dvh] bg-stone-900 border-2 border-amber-900/60 rounded-2xl sm:rounded-3xl shadow-2xl text-stone-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden ${
          trayShaking ? 'animate-tray-rumble' : ''
        }`}
      >
        {/* Tray Fixed Header */}
        <div className="shrink-0 bg-gradient-to-r from-red-950 via-stone-900 to-amber-950 px-4 sm:px-6 py-3 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            <h3 className="font-bold text-sm sm:text-base tracking-wide uppercase font-serif">
              Mesa de Combate & Dados
            </h3>
          </div>
          {!isConquered && (
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition"
              title="Recuar Tropas"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Territory Clash Matchup Header */}
        <div className="shrink-0 px-4 sm:px-6 py-2.5 bg-stone-950/70 border-b border-stone-800 flex items-center justify-between gap-3 text-xs">
          {/* Attacker Territory */}
          <div className="flex-1 text-left min-w-0">
            <span className="text-[9px] font-semibold text-red-400 uppercase tracking-widest block truncate">
              Atacante ({attacker.name})
            </span>
            <div className="font-bold text-sm sm:text-base text-white truncate">{fromTerritory.name}</div>
            <div className="text-[11px] text-stone-400">
              Tropas: <strong className="text-red-400 font-bold">{fromState.armies}</strong>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Swords className="w-4 h-4" />
          </div>

          {/* Defender Territory */}
          <div className="flex-1 text-right min-w-0">
            <span className="text-[9px] font-semibold text-amber-400 uppercase tracking-widest block truncate">
              Defensor ({defender.name})
            </span>
            <div className="font-bold text-sm sm:text-base text-white truncate">{toTerritory.name}</div>
            <div className="text-[11px] text-stone-400">
              Defesa: <strong className="text-amber-400 font-bold">{toState.armies}</strong>
            </div>
          </div>
        </div>

        {/* Scrollable Middle Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Felt Battle Tray Area */}
          <div className="p-4 sm:p-5 bg-gradient-to-b from-[#132c20] via-[#0f241a] to-[#091710] border-b border-stone-800 flex flex-col justify-center items-center relative shadow-inner">
            <div className="w-full grid grid-cols-2 gap-3 sm:gap-6 relative z-10">
              {/* Attacker Dice Section */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-bold text-red-300 uppercase tracking-wider">
                  Ataque (Vermelho)
                </span>

                {/* Dice Count Selectors before roll */}
                {!lastResult && !isConquered && !rolling && (
                  <div className="flex items-center gap-1 bg-stone-900/70 p-0.5 rounded-lg border border-stone-800">
                    {[1, 2, 3].map(count => (
                      <button
                        key={count}
                        disabled={count > maxAttackerDice}
                        onClick={() => setAttackDiceCount(count)}
                        className={`px-2 py-0.5 rounded font-bold text-xs transition border ${
                          attackDiceCount === count
                            ? 'bg-red-600 text-white border-red-400 shadow-md scale-105'
                            : count <= maxAttackerDice
                            ? 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                            : 'bg-stone-900/40 text-stone-600 border-stone-800 cursor-not-allowed'
                        }`}
                      >
                        {count}d
                      </button>
                    ))}
                  </div>
                )}

                {/* Rolled Dice Faces */}
                <div className="flex items-center justify-center gap-2 min-h-[56px] sm:min-h-[66px]">
                  {lastResult || rolling
                    ? displayRolls.atk.map((val, idx) => {
                        const defVal = lastResult ? lastResult.defenseDice[idx] : undefined;
                        const lost = Boolean(lastResult && defVal !== undefined && val <= defVal);
                        const won = Boolean(lastResult && defVal !== undefined && val > defVal);
                        return (
                          <div key={idx} className="flex flex-col items-center gap-1">
                            {renderDieFace(val, true, lost, won, idx)}
                            {lastResult && (
                              <span className="text-[9px] text-stone-400 font-mono">
                                {idx + 1}º
                              </span>
                            )}
                          </div>
                        );
                      })
                    : Array.from({ length: attackDiceCount }).map((_, idx) => (
                        <div
                          key={idx}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-red-950/30 border-2 border-red-800/40 border-dashed flex items-center justify-center text-red-500/50 text-sm font-bold shadow-inner"
                        >
                          ?
                        </div>
                      ))}
                </div>
              </div>

              {/* Defender Dice Section */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  Defesa (Amarelo)
                </span>

                {/* Defender Dice Count Selectors */}
                {!lastResult && !isConquered && !rolling && (
                  <div className="flex items-center gap-1 bg-stone-900/70 p-0.5 rounded-lg border border-stone-800">
                    {[1, 2, 3].map(count => (
                      <button
                        key={count}
                        disabled={count > maxDefenderDice}
                        onClick={() => setDefenseDiceCount(count)}
                        className={`px-2 py-0.5 rounded font-bold text-xs transition border ${
                          defenseDiceCount === count
                            ? 'bg-amber-500 text-stone-950 border-amber-300 shadow-md scale-105'
                            : count <= maxDefenderDice
                            ? 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                            : 'bg-stone-900/40 text-stone-600 border-stone-800 cursor-not-allowed'
                        }`}
                      >
                        {count}d
                      </button>
                    ))}
                  </div>
                )}

                {/* Rolled Dice Faces */}
                <div className="flex items-center justify-center gap-2 min-h-[56px] sm:min-h-[66px]">
                  {lastResult || rolling
                    ? displayRolls.def.map((val, idx) => {
                        const atkVal = lastResult ? lastResult.attackDice[idx] : undefined;
                        const lost = Boolean(lastResult && atkVal !== undefined && atkVal > val);
                        const won = Boolean(lastResult && atkVal !== undefined && val >= atkVal);
                        return (
                          <div key={idx} className="flex flex-col items-center gap-1">
                            {renderDieFace(val, false, lost, won, idx)}
                            {lastResult && (
                              <span className="text-[9px] text-stone-400 font-mono">
                                {idx + 1}º
                              </span>
                            )}
                          </div>
                        );
                      })
                    : Array.from({ length: defenseDiceCount }).map((_, idx) => (
                        <div
                          key={idx}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-amber-950/30 border-2 border-amber-800/40 border-dashed flex items-center justify-center text-amber-500/50 text-sm font-bold shadow-inner"
                        >
                          ?
                        </div>
                      ))}
                </div>
              </div>
            </div>

            {/* Clash Result Toast */}
            {lastResult && (
              <div className="mt-3 px-3 py-1.5 rounded-xl bg-stone-950/85 border border-stone-800 flex items-center gap-3 text-[11px] font-medium shadow-md">
                <div className="flex items-center gap-1 text-red-400">
                  <Skull className="w-3.5 h-3.5" />
                  <span>Ataque: -{lastResult.attackerLosses}</span>
                </div>
                <span className="text-stone-700">|</span>
                <div className="flex items-center gap-1 text-emerald-400">
                  <Skull className="w-3.5 h-3.5" />
                  <span>Defesa: -{lastResult.defenderLosses}</span>
                </div>
                <span className="text-stone-500 text-[10px] hidden sm:inline">
                  (Empates: Defesa vence)
                </span>
              </div>
            )}
          </div>

          {/* Territory Conquered Section (when conquered) */}
          {isConquered && (
            <div className="p-4 sm:p-5 bg-stone-900 space-y-3 animate-in fade-in zoom-in-95 duration-300 animate-conquer-impact">
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-600/25 via-amber-500/35 to-amber-600/25 border-2 border-amber-400/70 text-center shadow-lg shadow-amber-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse pointer-events-none" />
                <div className="inline-flex items-center gap-2 text-amber-200 font-black text-base sm:text-xl uppercase tracking-wider font-serif drop-shadow-md">
                  <Flame className="w-6 h-6 text-amber-400 animate-bounce" />
                  <span>Território Conquistado!</span>
                  <Sparkles className="w-5 h-5 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
                <p className="text-xs text-stone-200 font-medium mt-1">
                  A guarnição inimiga foi expulsa de <strong className="text-amber-300 font-bold">{toTerritory.name}</strong>!
                </p>
              </div>

              {/* Army transfer slider */}
              <div className="space-y-1.5 bg-stone-950/70 p-3 rounded-xl border border-stone-800">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-stone-400">
                    Mover de {fromTerritory.name}:
                  </span>
                  <span className="text-amber-400 font-bold font-mono">
                    {movedArmies} tropas (Ficam {fromState.armies - movedArmies})
                  </span>
                </div>

                <input
                  type="range"
                  min={attackDiceCount}
                  max={Math.max(attackDiceCount, fromState.armies - 1)}
                  value={movedArmies}
                  onChange={e => setMovedArmies(parseInt(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-stone-800 rounded-lg cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                  <span>Mínimo: {attackDiceCount}</span>
                  <span>Máximo: {fromState.armies - 1}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ALWAYS VISIBLE STICKY FOOTER */}
        <div className="shrink-0 p-3 sm:p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-2.5">
          {isConquered ? (
            <button
              onClick={handleConfirmOccupation}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-98"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Ocupar Território e Retornar ao Mapa</span>
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={rolling}
                className="px-3 sm:px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs border border-stone-700 transition"
              >
                Recuar
              </button>

              <button
                onClick={handleRollDice}
                disabled={rolling || fromState.armies <= 1}
                className="flex-1 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-700/40 transition active:scale-98 disabled:opacity-50"
              >
                <Swords className={`w-4 h-4 ${rolling ? 'animate-spin' : ''}`} />
                <span>{rolling ? 'Rolando Dados...' : 'Rolar Dados de Batalha'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
