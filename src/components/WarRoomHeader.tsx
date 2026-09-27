/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Player, GamePhase, PlayerColor } from '../types/game';
import {
  Shield,
  Swords,
  MoveRight,
  BookOpen,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Layers,
  ScrollText,
  Lock,
  ArrowRight,
  Maximize2,
  Minimize2,
  TrendingUp,
  Save,
  Check,
  Trophy
} from 'lucide-react';

interface WarRoomHeaderProps {
  currentPlayer: Player;
  currentPhase: GamePhase;
  turnNumber: number;
  availableArmiesToPlace: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenObjective: () => void;
  onOpenCards: () => void;
  onOpenRules: () => void;
  onOpenLog: () => void;
  onOpenWarReport?: () => void;
  onSaveGame?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  careerRankBadge?: string;
  careerRankTitle?: string;
  careerModeActive?: boolean;
  onToggleCareerMode?: () => void;
  winner?: Player | null;
  onOpenVictory?: () => void;
  onNewGame: () => void;
  onAdvancePhase: () => void;
  onAutoDistribute?: () => void;
}

const PLAYER_BADGE: Record<PlayerColor, { name: string; bg: string; text: string; dot: string }> = {
  red: { name: 'Vermelho', bg: 'bg-red-500/20 text-red-300 border-red-500/30', dot: 'bg-red-500', text: 'text-red-400' },
  blue: { name: 'Azul', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30', dot: 'bg-blue-500', text: 'text-blue-400' },
  yellow: { name: 'Amarelo', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', dot: 'bg-amber-400', text: 'text-amber-400' },
  green: { name: 'Verde', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-500', text: 'text-emerald-400' },
  white: { name: 'Branco', bg: 'bg-stone-200/20 text-stone-200 border-stone-200/30', dot: 'bg-stone-100', text: 'text-stone-200' },
  black: { name: 'Preto', bg: 'bg-stone-800 text-stone-300 border-stone-700', dot: 'bg-stone-900 border border-stone-600', text: 'text-stone-300' }
};

export const WarRoomHeader: React.FC<WarRoomHeaderProps> = ({
  currentPlayer,
  currentPhase,
  turnNumber,
  availableArmiesToPlace,
  soundEnabled,
  onToggleSound,
  onOpenObjective,
  onOpenCards,
  onOpenRules,
  onOpenLog,
  onOpenWarReport,
  onSaveGame,
  isFullscreen: externalIsFullscreen,
  onToggleFullscreen,
  careerRankBadge,
  careerRankTitle,
  careerModeActive,
  onToggleCareerMode,
  winner,
  onOpenVictory,
  onNewGame,
  onAdvancePhase,
  onAutoDistribute
}) => {
  const badge = PLAYER_BADGE[currentPlayer.color] || PLAYER_BADGE.blue;
  const [internalFullscreen, setInternalFullscreen] = useState<boolean>(false);
  const activeFullscreen = externalIsFullscreen !== undefined ? externalIsFullscreen : internalFullscreen;
  const [isSavedFeedback, setIsSavedFeedback] = useState<boolean>(false);

  const handleManualSave = () => {
    if (onSaveGame) {
      onSaveGame();
      setIsSavedFeedback(true);
      setTimeout(() => setIsSavedFeedback(false), 2000);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setInternalFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (onToggleFullscreen) {
      onToggleFullscreen();
    } else {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    }
  };

  // Helper text per phase
  const getPhaseInstruction = () => {
    switch (currentPhase) {
      case 'reinforce':
        return availableArmiesToPlace > 0
          ? `Alocação: +${availableArmiesToPlace} tropas disponíveis. Toque nos seus territórios ou use "Auto-Distribuir".`
          : 'Reforços alocados com sucesso! Avance para a Fase de Ataque.';
      case 'attack':
        return 'Ataque: Territórios em fronteira com pulso dourado estão prontos para combate. Selecione a base e o alvo inimigo.';
      case 'fortify':
        return 'Remanejamento: Desloque tropas entre territórios vizinhos aliados para reforçar fronteiras.';
      default:
        return '';
    }
  };

  return (
    <header className="w-full bg-stone-900 border-b border-stone-800 shadow-xl shrink-0 z-30 select-none">
      {/* Top Brand & Utility Bar */}
      <div className="w-full px-2 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Game Title & Turn Counter */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-amber-600 via-red-600 to-amber-700 flex items-center justify-center text-white shadow-md">
            <Swords className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-black text-sm sm:text-lg tracking-wider text-amber-100">
                WARALL
              </span>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-stone-800 text-amber-300 border border-amber-900/60">
                R{turnNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Current Commander Badge */}
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
          <div className={`px-2 sm:px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${badge.bg} max-w-[130px] sm:max-w-[200px] truncate shadow-sm`}>
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${badge.dot}`} />
            <span className="font-bold text-xs text-white truncate">
              {currentPlayer.name}
            </span>
          </div>

          {/* Career Rank Badge */}
          {careerModeActive && careerRankTitle && (
            <button
              onClick={onToggleCareerMode}
              className="px-1.5 sm:px-2 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900/80 border border-amber-600/40 text-[10px] sm:text-xs font-mono font-bold text-amber-300 flex items-center gap-1 transition shrink-0 active:scale-95 shadow-sm"
              title="Modo Carreira Ativo (Clique para alternar para Campanha Livre)"
            >
              <span>{careerRankBadge || '🎖️'}</span>
              <span className="hidden md:inline">{careerRankTitle}</span>
            </button>
          )}

          {/* Secret Objective Button */}
          <button
            onClick={onOpenObjective}
            className="px-2 sm:px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition active:scale-95 shrink-0"
            title="Ver objetivo secreto"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Missão</span>
          </button>

          {/* Victory Screen Recall Button (when match is won) */}
          {winner && onOpenVictory && (
            <button
              onClick={onOpenVictory}
              className="px-2 sm:px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 font-black text-xs flex items-center gap-1 shadow-md shadow-amber-500/30 animate-pulse transition active:scale-95 shrink-0"
              title="Vitória da partida! Reabrir tela de comemoração"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Vitória!</span>
            </button>
          )}

          {/* Cards Inventory Button */}
          <button
            onClick={onOpenCards}
            className="px-2 sm:px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1 transition relative shrink-0"
            title="Ver cartas de território"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Cartas</span>
            <span>({currentPlayer.cards?.length || 0})</span>
            {(currentPlayer.cards?.length || 0) >= 3 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 absolute -top-0.5 -right-0.5 animate-ping" />
            )}
          </button>

          {/* War Report / Tactical Charts Button */}
          {onOpenWarReport && (
            <button
              onClick={onOpenWarReport}
              className="px-2 sm:px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
              title="Relatório de Guerra: gráficos de evolução militar e territórios (Recharts)"
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Relatório</span>
            </button>
          )}
        </div>

        {/* System Action Icons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onOpenLog}
            className="p-1.5 sm:p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
            title="Diário de Guerra (Histórico)"
          >
            <ScrollText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={onOpenRules}
            className="p-1.5 sm:p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition hidden md:inline-flex"
            title="Manual de Regras"
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={onToggleSound}
            className="p-1.5 sm:p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
            title={soundEnabled ? 'Silenciar Áudio' : 'Ativar Sons'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-500" />
            )}
          </button>

          <button
            onClick={handleToggleFullscreen}
            className={`p-1.5 sm:p-2 rounded-lg transition ${
              activeFullscreen
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-500/20'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white'
            }`}
            title={activeFullscreen ? 'Sair da Tela Cheia' : 'Modo Tela Cheia (F11)'}
          >
            {activeFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </button>

          {onSaveGame && (
            <button
              onClick={handleManualSave}
              className={`p-1.5 sm:p-2 rounded-lg transition ${
                isSavedFeedback
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white'
              }`}
              title={isSavedFeedback ? 'Partida Salva!' : 'Salvar Partida no Navegador'}
            >
              {isSavedFeedback ? (
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-100" />
              ) : (
                <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </button>
          )}

          <button
            onClick={onNewGame}
            className="p-1.5 sm:p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
            title="Nova Partida"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Turn Phase Stepper & Tactical Banner */}
      <div className="bg-stone-950 px-2 sm:px-4 py-1.5 border-t border-stone-800 flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Phase Stepper Tabs */}
        <div className="flex items-center gap-1 text-[11px] sm:text-xs shrink-0">
          <div
            className={`px-2 py-0.5 rounded flex items-center gap-1 font-semibold transition ${
              currentPhase === 'reinforce'
                ? 'bg-amber-600 text-stone-950 font-black shadow-sm'
                : 'text-stone-500'
            }`}
          >
            <span>1. Reforço</span>
            {currentPhase === 'reinforce' && availableArmiesToPlace > 0 && (
              <span className="px-1 bg-stone-950 text-amber-300 rounded text-[9px] font-mono font-bold animate-pulse">
                +{availableArmiesToPlace}
              </span>
            )}
          </div>

          <span className="text-stone-700 text-[10px]">→</span>

          <div
            className={`px-2 py-0.5 rounded font-semibold transition ${
              currentPhase === 'attack'
                ? 'bg-red-600 text-white font-black shadow-sm'
                : 'text-stone-500'
            }`}
          >
            <span>2. Ataque</span>
          </div>

          <span className="text-stone-700 text-[10px]">→</span>

          <div
            className={`px-2 py-0.5 rounded font-semibold transition ${
              currentPhase === 'fortify'
                ? 'bg-blue-600 text-white font-black shadow-sm'
                : 'text-stone-500'
            }`}
          >
            <span>3. Mover</span>
          </div>
        </div>

        {/* Phase Tactical Advice - Visible on all devices */}
        <div className="text-[10px] sm:text-[11px] text-stone-300 font-medium truncate flex-1 px-1 sm:px-2 min-w-0">
          {getPhaseInstruction()}
        </div>

        {/* Action Controls for Current Human Player */}
        {!currentPlayer.isAi && (
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Auto-Distribute button if in reinforce phase with armies */}
            {currentPhase === 'reinforce' && availableArmiesToPlace > 0 && onAutoDistribute && (
              <button
                onClick={onAutoDistribute}
                className="px-2 sm:px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] sm:text-xs font-bold flex items-center gap-1 transition active:scale-95"
                title="Distribuir todas as tropas restantes automaticamente nas fronteiras"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="hidden xs:inline">Auto-Distribuir</span>
                <span>(+{availableArmiesToPlace})</span>
              </button>
            )}

            {/* Advance Phase Action Button */}
            <button
              onClick={onAdvancePhase}
              className={`px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1 transition active:scale-95 shadow-md ${
                currentPhase === 'reinforce'
                  ? availableArmiesToPlace > 0
                    ? 'bg-amber-600/90 hover:bg-amber-500 text-stone-950 font-black'
                    : 'bg-amber-500 hover:bg-amber-400 text-stone-950 animate-pulse'
                  : currentPhase === 'attack'
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
              title={
                currentPhase === 'reinforce' && availableArmiesToPlace > 0
                  ? 'Distribui automaticamente as tropas restantes e avança para o Ataque'
                  : undefined
              }
            >
              <span>
                {currentPhase === 'reinforce'
                  ? availableArmiesToPlace > 0
                    ? 'Alocar & Atacar'
                    : 'Iniciar Ataque'
                  : currentPhase === 'attack'
                  ? 'Fase Mover'
                  : 'Finalizar Turno'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
