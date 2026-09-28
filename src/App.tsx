/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from './hooks/useGameState';
import { useGameEngine } from './hooks/useGameEngine';
import {
  Player,
  TerritoryState,
  GamePhase,
  CombatResult,
  GameLog as GameLogType,
  TerritoryCard,
  PlayerColor,
  RoundHistoryEntry,
  PlayerRoundStats
} from './types/game';
import { TERRITORIES, TERRITORIES_MAP } from './data/territories';
import { CONTINENTS } from './data/continents';
import { SECRET_OBJECTIVES } from './data/objectives';
import { createDeck, shuffleDeck } from './data/cards';
import { sounds } from './utils/audio';

// Components
import { Board, TerritoryChangeIndicator } from './components/Board';
import { WarRoomHeader } from './components/WarRoomHeader';
import { DiceTray } from './components/DiceTray';
import { ObjectiveCardModal } from './components/ObjectiveCardModal';
import { CardsModal } from './components/CardsModal';
import { FortifyModal } from './components/FortifyModal';
import { GameLog } from './components/GameLog';
import { VictoryModal } from './components/VictoryModal';
import { RulebookModal } from './components/RulebookModal';
import { NewGameModal } from './components/NewGameModal';
import { WarReportModal } from './components/WarReportModal';
import { CommandAdvisorBar } from './components/CommandAdvisorBar';
import { CommandDispatch, CareerProfile, MilitaryRankId, MILITARY_RANKS } from './types/career';
import { Bot, Loader2, Sparkles, Swords, Check, ArrowRight, Shield, TrendingUp } from 'lucide-react';

export default function App() {
  const gameState = useGameState();
  const engine = useGameEngine(gameState);
  
  const {
    playerProfile, setPlayerProfile, careerProfile, setCareerProfile, currentDispatch, setCurrentDispatch,
    lastConqueredTerritory, setLastConqueredTerritory, players, setPlayers, currentPlayerIdx, setCurrentPlayerIdx,
    turnNumber, setTurnNumber, currentPhase, setCurrentPhase, exchangeCount, setExchangeCount, deck, setDeck,
    territories, setTerritories, recentChanges, setRecentChanges, availableArmiesToPlace, setAvailableArmiesToPlace,
    selectedTerritoryId, setSelectedTerritoryId, targetTerritoryId, setTargetTerritoryId, showObjectiveModal, setShowObjectiveModal,
    showCardsModal, setShowCardsModal, showRulesModal, setShowRulesModal, showLogDrawer, setShowLogDrawer,
    showNewGameModal, setShowNewGameModal, showDiceTray, setShowDiceTray, showFortifyModal, setShowFortifyModal,
    showWarReportModal, setShowWarReportModal, winner, setWinner, showVictoryModal, setShowVictoryModal,
    roundHistory, setRoundHistory, isAiThinking, setIsAiThinking, aiStatusMessage, setAiStatusMessage,
    turnAnnouncement, setTurnAnnouncement, soundEnabled, setSoundEnabled, logs, setLogs, isFullscreen, setIsFullscreen,
    handleEnlist, handleResetProfile
  } = gameState;

  const {
    addLog, dispatchMilitaryAction, triggerTerritoryChange, recordRoundSnapshot, calculateReinforcements,
    startNewGame, saveGameState, loadGameState, getValidTargets, addXp, toggleCareerMode,
    handleSelectTerritory, handleResolveCombat, handleConquerMove, handleConfirmFortify, handleExchangeCards,
    handleAutoDistributeReinforcements, handleAdvancePhase, passTurnToNext, toggleFullscreen, toggleSound, currentPlayer
  } = engine;

  return (
    <div className={`h-[100dvh] w-full bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-700 selection:text-white overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen' : ''}`}>
      {/* Header Controller */}
      {currentPlayer && (
        <WarRoomHeader
          currentPlayer={currentPlayer}
          currentPhase={currentPhase}
          turnNumber={turnNumber}
          availableArmiesToPlace={availableArmiesToPlace}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          careerRankBadge={(MILITARY_RANKS as any)[careerProfile.rankId]?.badge}
          careerRankTitle={(MILITARY_RANKS as any)[careerProfile.rankId]?.title}
          careerModeActive={careerProfile.careerModeActive}
          onToggleCareerMode={toggleCareerMode}
          onOpenObjective={() => setShowObjectiveModal(true)}
          onOpenCards={() => setShowCardsModal(true)}
          onOpenRules={() => setShowRulesModal(true)}
          onOpenLog={() => setShowLogDrawer(true)}
          onOpenWarReport={() => setShowWarReportModal(true)}
          onSaveGame={saveGameState}
          winner={winner}
          onOpenVictory={() => setShowVictoryModal(true)}
          onNewGame={() => setShowNewGameModal(true)}
          onAdvancePhase={handleAdvancePhase}
          onAutoDistribute={handleAutoDistributeReinforcements}
        />
      )}

      {/* AI Processing Notification Banner */}
      {isAiThinking && (
        <div className="shrink-0 bg-gradient-to-r from-amber-950/95 via-stone-900/95 to-amber-950/95 border-b border-amber-800/60 px-4 py-2 flex items-center justify-center gap-2 text-xs sm:text-sm text-amber-200 z-20 shadow-md">
          <Bot className="w-4 h-4 text-amber-400 animate-bounce" />
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
          <span className="font-semibold">{aiStatusMessage || 'Aguarde os generais virtuais...'}</span>
        </div>
      )}

      {/* Human Reinforce Phase Prompt Banner */}
      {!currentPlayer?.isAi && currentPhase === 'reinforce' && availableArmiesToPlace > 0 && (
        <div className="shrink-0 bg-stone-900/90 border-b border-amber-500/40 px-3 py-1.5 sm:py-2 flex items-center justify-between gap-2 text-xs sm:text-sm text-stone-200 z-20 backdrop-blur-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span className="font-bold text-amber-300 truncate">
              Distribua suas tropas (+{availableArmiesToPlace} disponíveis):
            </span>
            <span className="hidden sm:inline text-stone-400 text-xs">
              Toque nos territórios com borda brilhante
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleAutoDistributeReinforcements}
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1 transition shadow-sm"
              title="Posiciona todas as tropas automaticamente"
            >
              <Sparkles className="w-3 h-3" />
              <span>Auto-Distribuir (+{availableArmiesToPlace})</span>
            </button>
          </div>
        </div>
      )}

      {/* Turn Announcement Toast */}
      {turnAnnouncement && turnAnnouncement.show && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto max-w-[92vw]">
          <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 border-2 border-amber-500 rounded-2xl shadow-2xl px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4 text-stone-100">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shrink-0">
              <Swords className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-400">
                Sua Vez de Jogar
              </div>
              <div className="font-serif font-black text-sm sm:text-base text-white">
                {turnAnnouncement.playerName.includes('General') ? '' : 'General '}{turnAnnouncement.playerName}, assuma o comando!
              </div>
              <div className="text-[11px] sm:text-xs text-amber-200/90">
                Você recebeu <strong className="text-white font-bold">+{turnAnnouncement.armies} tropas</strong> de reforço militar.
              </div>
            </div>
            <button
              onClick={() => setTurnAnnouncement((prev: any) => prev ? { ...prev, show: false } : null)}
              className="ml-1 sm:ml-2 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider transition active:scale-95 shadow-md"
            >
              Comandar
            </button>
          </div>
        </div>
      )}

      {/* Main Board Viewport with Army Change Indicators */}
      <main className="flex-1 w-full min-h-0 relative p-1 sm:p-2 flex flex-col items-center justify-center overflow-hidden">
        {currentPlayer && (
          <Board
            territories={territories}
            players={players}
            currentPlayer={currentPlayer}
            currentPhase={currentPhase}
            selectedTerritoryId={selectedTerritoryId}
            targetTerritoryId={targetTerritoryId}
            onSelectTerritory={handleSelectTerritory}
            validTargets={getValidTargets()}
            recentChanges={recentChanges}
            commandHighlights={careerProfile.careerModeActive ? currentDispatch?.highlightTerritories || [] : []}
            commandTargets={careerProfile.careerModeActive ? currentDispatch?.targetTerritories || [] : []}
          />
        )}
      </main>

      {/* High Command Dispatch HUD Bar (Mobile-First Collapsible Drawer) */}
      {careerProfile.careerModeActive && !currentPlayer?.isAi && currentDispatch && (
        <CommandAdvisorBar
          dispatch={currentDispatch}
          careerProfile={careerProfile}
          onFocusTerritory={handleSelectTerritory}
          onToggleCareerMode={toggleCareerMode}
        />
      )}

      {/* Battle Dice Tray Modal (for Human Player) */}
      {showDiceTray && selectedTerritoryId && targetTerritoryId && (
        <DiceTray
          attacker={currentPlayer}
          defender={players.find((p: any) => p.id === territories[targetTerritoryId!]?.playerId) || players[0]}
          fromTerritory={TERRITORIES_MAP[selectedTerritoryId]}
          toTerritory={TERRITORIES_MAP[targetTerritoryId]}
          territories={territories}
          onResolveCombat={handleResolveCombat}
          onConquerMove={handleConquerMove}
          onClose={() => {
            setShowDiceTray(false);
            setTargetTerritoryId(null);
          }}
        />
      )}

      {/* Fortify Troops Relocation Modal (for Human Player) */}
      {showFortifyModal && selectedTerritoryId && targetTerritoryId && (
        <FortifyModal
          fromTerritory={TERRITORIES_MAP[selectedTerritoryId]}
          toTerritory={TERRITORIES_MAP[targetTerritoryId]}
          fromState={territories[selectedTerritoryId]}
          toState={territories[targetTerritoryId]}
          onConfirmMove={handleConfirmFortify}
          onCancel={() => {
            setShowFortifyModal(false);
            setSelectedTerritoryId(null);
            setTargetTerritoryId(null);
          }}
        />
      )}

      {/* Secret Mission Card Modal */}
      {showObjectiveModal && currentPlayer && (
        <ObjectiveCardModal
          player={currentPlayer}
          territories={territories}
          players={players}
          gameTurn={turnNumber}
          onClose={() => setShowObjectiveModal(false)}
        />
      )}

      {/* Territory Cards Modal */}
      {showCardsModal && currentPlayer && (
        <CardsModal
          player={currentPlayer}
          territories={territories}
          exchangeCount={exchangeCount}
          currentPhase={currentPhase}
          onExchangeCards={handleExchangeCards}
          onClose={() => setShowCardsModal(false)}
        />
      )}

      {/* Official Rulebook Modal */}
      {showRulesModal && (
        <RulebookModal onClose={() => setShowRulesModal(false)} />
      )}

      {/* Game Log Drawer */}
      {showLogDrawer && (
        <GameLog logs={logs} onClose={() => setShowLogDrawer(false)} />
      )}

      {/* Victory Screen Modal */}
      {winner && showVictoryModal && (
        <VictoryModal
          winner={winner}
          territories={territories}
          onNewGame={() => {
            setShowVictoryModal(false);
            setShowNewGameModal(true);
          }}
          onOpenWarReport={() => {
            setShowVictoryModal(false);
            setShowWarReportModal(true);
          }}
          onClose={() => setShowVictoryModal(false)}
        />
      )}

      {/* War Report Modal (Recharts) */}
      {showWarReportModal && (
        <WarReportModal
          players={players}
          territories={territories}
          currentRound={turnNumber}
          history={roundHistory}
          onClose={() => {
            setShowWarReportModal(false);
            if (winner) setShowVictoryModal(true);
          }}
        />
      )}

      {/* Setup New Game Modal */}
      {showNewGameModal && (
        <NewGameModal
          onStartGame={startNewGame}
          onCancel={() => {
            setShowNewGameModal(false);
            if (winner) setShowVictoryModal(true);
          }}
          initialCareerMode={careerProfile.careerModeActive}
        />
      )}
    </div>
  );
}
