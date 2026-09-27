/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CommandDispatch, MilitaryRankId, MILITARY_RANKS, CareerProfile } from '../types/career';
import { ChevronUp, ChevronDown, Radio, Crosshair, Award, ShieldAlert, CheckCircle2, Sparkles, UserCheck, RotateCcw } from 'lucide-react';

interface CommandAdvisorBarProps {
  dispatch: CommandDispatch | null;
  careerProfile: CareerProfile;
  onFocusTerritory?: (territoryId: string) => void;
  onToggleCareerMode?: () => void;
  onResetCareer?: () => void;
}

export const CommandAdvisorBar: React.FC<CommandAdvisorBarProps> = ({
  dispatch,
  careerProfile,
  onFocusTerritory,
  onToggleCareerMode,
  onResetCareer
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const currentRank = MILITARY_RANKS[careerProfile.rankId] || MILITARY_RANKS.cadet;

  if (!careerProfile.careerModeActive || !dispatch) {
    return null;
  }

  // Calculate XP percentage to next rank
  const xpCurrentLevel = Math.max(0, careerProfile.xp - currentRank.minXp);
  const xpNeeded = Math.max(1, currentRank.maxXp - currentRank.minXp);
  const xpProgress = Math.min(100, Math.round((xpCurrentLevel / xpNeeded) * 100));

  const targetTerritoryToFocus = dispatch.highlightTerritories[0] || dispatch.targetTerritories?.[0];

  return (
    <aside aria-label="Despacho do Alto Comando" className="w-full bg-stone-950/95 backdrop-blur-md border-t border-amber-900/40 text-stone-200 z-30 transition-all duration-300 shadow-2xl">
      {/* Collapsed Top Strip (Minimal footprint: 36px) */}
      <div className="w-full px-2.5 sm:px-4 py-1.5 flex items-center justify-between gap-2">
        {/* Left: Rank Badge & Dispatch Title */}
        <button
          onClick={() => setIsExpanded(prev => !prev)}
          className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 text-left hover:text-amber-200 transition group focus:outline-none"
        >
          {/* Tactical Radar / Pulsing Beacon Icon */}
          <div className="relative shrink-0 flex items-center justify-center w-6 h-6 rounded-md bg-stone-900 border border-amber-500/40 text-amber-400">
            <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          </div>

          <div className="min-w-0 truncate">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
              <span className="font-mono font-bold text-amber-400 uppercase tracking-wider shrink-0">
                {currentRank.badge} {currentRank.title}:
              </span>
              <span className="text-stone-300 font-semibold truncate group-hover:text-white transition">
                {dispatch.title}
              </span>
              {dispatch.badgeText && (
                <span
                  className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                    dispatch.outcomeType === 'deviated_heroic'
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50'
                      : dispatch.outcomeType === 'deviated_disaster'
                      ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50'
                      : dispatch.outcomeType === 'followed_success'
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
                      : 'bg-stone-800 text-stone-300 border border-stone-700'
                  }`}
                >
                  {dispatch.badgeText}
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Right: Quick Tactical Action & Expand/Collapse */}
        <div className="flex items-center gap-1.5 shrink-0">
          {dispatch.badgeText && (
            <span
              className={`sm:hidden px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                dispatch.outcomeType === 'deviated_heroic'
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50'
                  : dispatch.outcomeType === 'deviated_disaster'
                  ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50'
                  : dispatch.outcomeType === 'followed_success'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
                  : 'bg-stone-800 text-stone-300 border border-stone-700'
              }`}
            >
              {dispatch.badgeText}
            </span>
          )}

          {targetTerritoryToFocus && onFocusTerritory && (
            <button
              onClick={() => onFocusTerritory(targetTerritoryToFocus)}
              className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 transition active:scale-95 shadow-sm"
              title="Focar território ordenado no mapa"
            >
              <Crosshair className="w-3 h-3 text-amber-400" />
              <span className="hidden xs:inline">Focar Posição</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className="p-1 rounded bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
            title={isExpanded ? 'Recolher feed militar' : 'Expandir relatório de inteligência'}
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Military Dossier Drawer */}
      {isExpanded && (
        <div className="px-3 sm:px-6 py-3 border-t border-stone-800/80 bg-gradient-to-b from-stone-950 via-stone-900/90 to-stone-950 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            {/* Advisor Intelligence & Message */}
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-lg bg-stone-900 border border-amber-500/30 flex flex-col items-center justify-center shrink-0 shadow-inner">
                <span className="text-base select-none">{currentRank.badge}</span>
                <span className="text-[8px] font-mono text-amber-400 font-bold">QG</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-amber-200 font-serif">
                    {dispatch.advisorName}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    · {dispatch.advisorRole}
                  </span>
                </div>
                <p className="text-xs text-stone-300 mt-0.5 leading-relaxed font-sans">
                  {dispatch.message}
                </p>
                {dispatch.suggestedArmies && dispatch.suggestedArmies > 0 && (
                  <div className="mt-1.5 text-[11px] text-amber-300 font-medium flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Recomendação de contingente: <strong>+{dispatch.suggestedArmies} tropas</strong> no setor.</span>
                  </div>
                )}

                {dispatch.actionTakenText && (
                  <div className="mt-2 p-2 rounded-lg bg-stone-900/90 border border-stone-800 text-[11px] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-stone-300">
                      <span className="font-bold text-amber-400">Manobra Avaliada:</span>
                      <span>{dispatch.actionTakenText}</span>
                    </div>
                    {dispatch.badgeText && (
                      <span className="text-[10px] font-mono font-bold text-amber-300">
                        {dispatch.badgeText}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Rank Progression Card & Controls */}
            <div className="w-full md:w-64 shrink-0 bg-stone-900/80 border border-stone-800 rounded-xl p-2.5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-stone-400 font-semibold flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-400" />
                  Progresso Militar:
                </span>
                <span className="font-mono text-amber-300 font-bold">
                  {careerProfile.xp} XP
                </span>
              </div>

              {/* XP Progress Bar */}
              <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[9px] text-stone-400">
                <span>{currentRank.title}</span>
                <span>{xpProgress}% para promoção</span>
              </div>

              {/* Mode Toggle Button */}
              {onToggleCareerMode && (
                <button
                  onClick={onToggleCareerMode}
                  className="mt-0.5 w-full py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-semibold transition flex items-center justify-center gap-1"
                >
                  <UserCheck className="w-3 h-3 text-stone-400" />
                  <span>Alternar para Modo Campanha Livre</span>
                </button>
              )}

              {/* Iniciar Nova Carreira */}
              {onResetCareer && (
                <div className="mt-1">
                  {confirmReset ? (
                    <div className="p-1.5 rounded-lg bg-rose-950/70 border border-rose-800/60 flex items-center justify-between gap-1 text-[10px]">
                      <span className="text-rose-200 font-semibold">Zerar para Cadete?</span>
                      <div className="flex items-center gap-1 shrink-0">
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
                          className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 hover:text-white text-[10px] transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmReset(true)}
                      className="w-full py-1 rounded bg-stone-950/70 hover:bg-stone-800 text-stone-400 hover:text-amber-300 text-[9.5px] font-medium transition flex items-center justify-center gap-1 border border-stone-800/80"
                      title="Reiniciar carreira militar como Cadete (0 XP)"
                    >
                      <RotateCcw className="w-2.5 h-2.5 text-stone-400" />
                      <span>Iniciar Nova Carreira (Zerar XP)</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
