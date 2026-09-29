import { useEffect, useRef, useState } from 'react';
import { Player, TerritoryState, GamePhase, CombatResult, GameLog as GameLogType, TerritoryCard, PlayerColor, RoundHistoryEntry, PlayerRoundStats } from '../types/game';
import { TERRITORIES, TERRITORIES_MAP } from '../data/territories';
import { CONTINENTS } from '../data/continents';
import { SECRET_OBJECTIVES } from '../data/objectives';
import { createDeck, shuffleDeck, getExchangeBonus } from '../data/cards';
import { sounds } from '../utils/audio';
import { calculateBestDeployTargets, determineNextAttack, calculateFortification, findAiCardSetToExchange } from '../services/aiEngine';
import { PlayerProfile } from '../types/player';
import { CommandDispatch, CareerProfile, MilitaryRankId, MILITARY_RANKS } from '../types/career';
import { generateCommandDispatch, calculateNewRank, createReinforcementStepDispatch, evaluateSubordinateCombat, ActionType, processMilitaryAction, RANK_NAMES, generateInitialCampaignMissions, evaluateCampaignMissions } from '../services/careerEngine';
import { useGameState } from './useGameState';
import { TerritoryChangeIndicator } from '../components/Board';

type GameState = ReturnType<typeof useGameState>;
const LOCAL_STORAGE_KEY = 'warall_game_state_v1';

export const useGameEngine = (gameState: GameState) => {
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

  const currentPlayer = players[currentPlayerIdx] || players[0];
  // Reliable State Refs to prevent stale closures during async AI turns
  const territoriesRef = useRef<Record<string, TerritoryState>>({});
  territoriesRef.current = territories;

  const playersRef = useRef<Player[]>([]);
  playersRef.current = players;

  const deckRef = useRef<TerritoryCard[]>([]);
  deckRef.current = deck;

  const turnNumberRef = useRef<number>(1);
  turnNumberRef.current = turnNumber;

  const currentPlayerIdxRef = useRef<number>(0);
  currentPlayerIdxRef.current = currentPlayerIdx;

  const isAiRunningRef = useRef<boolean>(false);

  const addLog = (text: string, type: GameLogType['type'] = 'system', color?: PlayerColor) => {
    const newLog: GameLogType = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      text,
      type,
      playerColor: color
    };
    setLogs(prev => [newLog, ...prev.slice(0, 70)]);
  };

  // Trigger visual CSS animation for army changes on territory
  const triggerTerritoryChange = (
    territoryId: string,
    delta: number,
    type: 'gain' | 'loss' | 'conquer'
  ) => {
    const changeId = Date.now() + Math.random();
    setRecentChanges(prev => ({
      ...prev,
      [territoryId]: { delta, type, id: changeId }
    }));

    // Auto clear after animation duration (1.6s for conquer explosions, 1.2s for regular delta badges)
    const durationMs = type === 'conquer' ? 1600 : 1200;
    setTimeout(() => {
      setRecentChanges(prev => {
        if (prev[territoryId]?.id === changeId) {
          const next = { ...prev };
          delete next[territoryId];
          return next;
        }
        return prev;
      });
    }, durationMs);
  };

  // Helper to record / update round snapshot for War Report charts
  const recordRoundSnapshot = (
    round: number,
    currentPlayers: Player[],
    currentTerritories: Record<string, TerritoryState>
  ) => {
    const stats: Record<string, PlayerRoundStats> = {};
    currentPlayers.forEach(p => {
      const owned = Object.values(currentTerritories).filter(t => t.playerId === p.id);
      const totalArmies = owned.reduce((sum, t) => sum + t.armies, 0);
      stats[p.id] = {
        playerId: p.id,
        playerName: p.name,
        color: p.color,
        isAi: p.isAi,
        armies: totalArmies,
        territories: owned.length,
        eliminated: p.eliminated || owned.length === 0
      };
    });

    const newEntry: RoundHistoryEntry = {
      round,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stats
    };

    setRoundHistory(prev => {
      const existingIdx = prev.findIndex(e => e.round === round);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = newEntry;
        return next;
      }
      return [...prev, newEntry];
    });
  };

  // Helper to calculate reinforcements
  const calculateReinforcements = (playerId: string, currentTerritories: Record<string, TerritoryState>) => {
    const owned = Object.values(currentTerritories).filter(t => t.playerId === playerId);
    const base = Math.max(3, Math.floor(owned.length / 2));

    // Continent bonuses
    let continentBonus = 0;
    Object.values(CONTINENTS).forEach(c => {
      const ownsAll = c.territoryIds.every(tId => currentTerritories[tId]?.playerId === playerId);
      if (ownsAll) {
        continentBonus += c.bonus;
      }
    });

    return base + continentBonus;
  };

  // Initialize a match
  const startNewGame = (
    playerConfigs: { name: string; color: PlayerColor; isAi: boolean }[],
    careerMode?: boolean
  ) => {
    isAiRunningRef.current = false;
    setIsAiThinking(false);

    if (careerMode !== undefined) {
      setCareerProfile(prev => {
        const updated = { ...prev, careerModeActive: careerMode };
        try {
          localStorage.setItem('warall_career_profile_v1', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }

    const shuffledDeck = createDeck();
    const shuffledObjectives = shuffleDeck(SECRET_OBJECTIVES);

    const newPlayers: Player[] = playerConfigs.map((cfg, idx) => ({
      id: `p_${idx + 1}`,
      name: cfg.name,
      color: cfg.color,
      isAi: cfg.isAi,
      cards: [],
      objective: shuffledObjectives[idx % shuffledObjectives.length],
      eliminated: false,
      conqueredThisTurn: false
    }));

    // Distribute 42 territories among players
    const shuffledTerritories = shuffleDeck(TERRITORIES);
    const initialTerritoryState: Record<string, TerritoryState> = {};

    shuffledTerritories.forEach((t, idx) => {
      const assignedPlayer = newPlayers[idx % newPlayers.length];
      initialTerritoryState[t.id] = {
        territoryId: t.id,
        playerId: assignedPlayer.id,
        armies: 1
      };
    });

    setPlayers(newPlayers);
    playersRef.current = newPlayers;

    setTerritories(initialTerritoryState);
    territoriesRef.current = initialTerritoryState;

    setRecentChanges({});
    setDeck(shuffledDeck);
    deckRef.current = shuffledDeck;

    setCurrentPlayerIdx(0);
    currentPlayerIdxRef.current = 0;

    setTurnNumber(1);
    turnNumberRef.current = 1;

    setCurrentPhase('reinforce');
    setExchangeCount(0);
    setWinner(null);
    setShowVictoryModal(false);
    setSelectedTerritoryId(null);
    setTargetTerritoryId(null);
    setShowDiceTray(false);
    setShowFortifyModal(false);
    setShowNewGameModal(false);
    setShowWarReportModal(false);

    // Initial snapshot for Round 1
    const initialStats: Record<string, PlayerRoundStats> = {};
    newPlayers.forEach(p => {
      const owned = Object.values(initialTerritoryState).filter(t => t.playerId === p.id);
      const armiesCount = owned.reduce((sum, t) => sum + t.armies, 0);
      initialStats[p.id] = {
        playerId: p.id,
        playerName: p.name,
        color: p.color,
        isAi: p.isAi,
        armies: armiesCount,
        territories: owned.length,
        eliminated: false
      };
    });
    setRoundHistory([
      {
        round: 1,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        stats: initialStats
      }
    ]);

    // Initial reinforcement calculation for player 1
    const p1 = newPlayers[0];
    const initialReinforce = calculateReinforcements(p1.id, initialTerritoryState);
    setAvailableArmiesToPlace(initialReinforce);

    setLogs([]);
    addLog(`A partida de Warall foi iniciada com ${newPlayers.length} generais.`, 'system');
    addLog(`Turno 1: General ${p1.name} inicia com +${initialReinforce} tropas para posicionar.`, 'turn', p1.color);

    // Initialize Campaign Missions for human player in Career Mode
    const humanPlayer = newPlayers.find(p => !p.isAi) || newPlayers[0];
    const initialMissions = generateInitialCampaignMissions(humanPlayer, initialTerritoryState);
    setCareerProfile(prev => ({
      ...prev,
      activeMissions: initialMissions
    }));
  };

  const LOCAL_STORAGE_KEY = 'warall_game_state_v1';

  // Save current game state to browser's localStorage
  const saveGameState = () => {
    try {
      if (playersRef.current.length === 0 || Object.keys(territoriesRef.current).length === 0) {
        return;
      }

      const stateToSave = {
        version: 1,
        savedAt: Date.now(),
        turnNumber: turnNumberRef.current,
        currentPlayerIdx: currentPlayerIdxRef.current,
        currentPhase,
        availableArmiesToPlace,
        exchangeCount,
        territories: territoriesRef.current,
        players: playersRef.current.map(p => ({
          id: p.id,
          name: p.name,
          color: p.color,
          isAi: p.isAi,
          cards: p.cards,
          objectiveId: p.objective?.id ?? 7,
          eliminated: p.eliminated,
          conqueredThisTurn: p.conqueredThisTurn
        })),
        deck: deckRef.current,
        logs: logs.slice(0, 70),
        roundHistory,
        soundEnabled,
        winnerId: winner ? winner.id : null,
        careerProfile
      };

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (err) {
      console.warn('Não foi possível salvar a partida no localStorage:', err);
    }
  };

  // Restore game state from browser's localStorage
  const loadGameState = (): boolean => {
    try {
      const savedRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!savedRaw) return false;

      const saved = JSON.parse(savedRaw);
      if (
        !saved ||
        !saved.territories ||
        !saved.players ||
        !Array.isArray(saved.players) ||
        saved.players.length === 0
      ) {
        return false;
      }

      // Rehydrate players with original SecretObjective instances
      const hydratedPlayers: Player[] = saved.players.map((sp: any) => {
        const objective =
          SECRET_OBJECTIVES.find(o => o.id === sp.objectiveId) ||
          SECRET_OBJECTIVES.find(o => o.title === sp.objectiveTitle) ||
          SECRET_OBJECTIVES[0];

        return {
          id: sp.id,
          name: sp.name,
          color: sp.color,
          isAi: Boolean(sp.isAi),
          cards: Array.isArray(sp.cards) ? sp.cards : [],
          objective,
          eliminated: Boolean(sp.eliminated),
          conqueredThisTurn: Boolean(sp.conqueredThisTurn)
        };
      });

      // Update refs immediately to avoid stale closures
      playersRef.current = hydratedPlayers;
      territoriesRef.current = saved.territories;
      turnNumberRef.current = Number(saved.turnNumber) || 1;
      currentPlayerIdxRef.current = Number(saved.currentPlayerIdx) || 0;
      deckRef.current = Array.isArray(saved.deck) ? saved.deck : [];
      isAiRunningRef.current = false;

      // Update React state
      setPlayers(hydratedPlayers);
      setTerritories(saved.territories);
      setTurnNumber(Number(saved.turnNumber) || 1);
      setCurrentPlayerIdx(Number(saved.currentPlayerIdx) || 0);
      setCurrentPhase(saved.currentPhase || 'reinforce');
      setAvailableArmiesToPlace(Number(saved.availableArmiesToPlace) || 0);
      setExchangeCount(Number(saved.exchangeCount) || 0);
      setDeck(Array.isArray(saved.deck) ? saved.deck : []);
      setLogs(
        Array.isArray(saved.logs) && saved.logs.length > 0
          ? [
              {
                id: `restore_${Date.now()}`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                text: 'Partida restaurada do ponto salvo no navegador.',
                type: 'system' as const
              },
              ...saved.logs
            ]
          : saved.logs || []
      );
      setRoundHistory(Array.isArray(saved.roundHistory) ? saved.roundHistory : []);
      setSoundEnabled(saved.soundEnabled !== false);

      if (saved.winnerId) {
        const winnerPlayer = hydratedPlayers.find(p => p.id === saved.winnerId) || null;
        setWinner(winnerPlayer);
        setShowVictoryModal(true);
      } else {
        setWinner(null);
        setShowVictoryModal(false);
      }

      if (saved.careerProfile) {
        setCareerProfile(saved.careerProfile);
      }

      setSelectedTerritoryId(null);
      setTargetTerritoryId(null);
      setShowDiceTray(false);
      setShowFortifyModal(false);
      setShowWarReportModal(false);

      const activePlayer = hydratedPlayers[Number(saved.currentPlayerIdx) || 0];
      if (activePlayer && activePlayer.isAi && !activePlayer.eliminated) {
        setIsAiThinking(true);
        setAiStatusMessage(`General ${activePlayer.name} está planejando a estratégia...`);
        setTimeout(() => {
          executeCompleteAiTurn(
            Number(saved.currentPlayerIdx) || 0,
            Number(saved.availableArmiesToPlace) || 0
          );
        }, 500);
      } else {
        setIsAiThinking(false);
        setAiStatusMessage('');
      }

      return true;
    } catch (err) {
      console.warn('Erro ao carregar partida do localStorage:', err);
      return false;
    }
  };

  // Start game on mount or load previously saved state
  useEffect(() => {
    const loaded = loadGameState();
    if (!loaded) {
      startNewGame([
        { name: 'Marcus (Você)', color: 'blue', isAi: false },
        { name: 'Gen. Montgomery', color: 'red', isAi: true },
        { name: 'Gen. Rommel', color: 'yellow', isAi: true },
        { name: 'Gen. Patton', color: 'green', isAi: true }
      ]);
    }
  }, []);

  // Auto-save game state to localStorage whenever key match variables update
  useEffect(() => {
    if (players.length > 0 && Object.keys(territories).length > 0) {
      saveGameState();
    }
  }, [
    territories,
    players,
    turnNumber,
    currentPlayerIdx,
    currentPhase,
    availableArmiesToPlace,
    exchangeCount,
    roundHistory,
    winner
  ]);

  const currentPlayerLocal2 = players[currentPlayerIdx] || players[0];

  // Valid target neighbors for current selection
  const getValidTargets = (): string[] => {
    if (!selectedTerritoryId || !territories[selectedTerritoryId]) return [];
    const territoryData = TERRITORIES_MAP[selectedTerritoryId];
    if (!territoryData) return [];

    if (currentPhase === 'attack') {
      return territoryData.neighbors.filter(
        nId => territories[nId] && territories[nId].playerId !== currentPlayer?.id
      );
    }

    if (currentPhase === 'fortify') {
      return territoryData.neighbors.filter(
        nId => territories[nId] && territories[nId].playerId === currentPlayer?.id
      );
    }

    return [];
  };

  // Career Mode XP Progression & Rank Upgrades
  const addXp = (amount: number, reason: string) => {
    setCareerProfile(prev => {
      const newXp = Math.max(0, prev.xp + amount);
      const newRank = calculateNewRank(newXp);
      if (newRank !== prev.rankId && amount > 0) {
        const rankData = MILITARY_RANKS[newRank];
        addLog(`🎖️ PROMOÇÃO MILITAR! Você foi promovido a ${rankData.title} (${rankData.badge})!`, 'system');
        sounds.playConquer();
      }
      const updated: CareerProfile = {
        ...prev,
        xp: newXp,
        rankId: newRank,
        territoriesConquered: reason.includes('território') ? prev.territoriesConquered + 1 : prev.territoriesConquered,
        generalsDefeated: reason.includes('general') ? prev.generalsDefeated + 1 : prev.generalsDefeated,
        campaignsWon: reason.includes('Campanha') ? prev.campaignsWon + 1 : prev.campaignsWon
      };
      try {
        localStorage.setItem('warall_career_profile_v1', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const toggleCareerMode = () => {
    setCareerProfile(prev => {
      const updated = { ...prev, careerModeActive: !prev.careerModeActive };
      try {
        localStorage.setItem('warall_career_profile_v1', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Auto-generate High Command dispatch on turn, phase rotation, or mode toggle
  useEffect(() => {
    if (
      currentPlayer &&
      !currentPlayer.isAi &&
      careerProfile.careerModeActive &&
      Object.keys(territoriesRef.current).length > 0
    ) {
      const dispatch = generateCommandDispatch(
        currentPlayer,
        playersRef.current,
        territoriesRef.current,
        currentPhase,
        turnNumber,
        careerProfile.rankId,
        availableArmiesToPlace,
        lastConqueredTerritory
      );
      setCurrentDispatch(dispatch);
    } else {
      setCurrentDispatch(null);
    }
  }, [
    currentPlayerIdx,
    currentPhase,
    turnNumber,
    careerProfile.rankId,
    careerProfile.careerModeActive
  ]);

  // Handle Territory Click for Human Player
  const dispatchMilitaryAction = (action: ActionType) => {
    const currentPlayerLocal = players[currentPlayerIdx] || players[0];
    if (!careerProfile.careerModeActive || currentPlayerLocal.isAi) return;
    const newProfile = processMilitaryAction(careerProfile, action);
    const hasPromoted = newProfile.rankId !== careerProfile.rankId;
    setCareerProfile(newProfile);
    if (hasPromoted) {
      addLog(`PROMOÇÃO! ${currentPlayerLocal.name} alcançou a patente de ${RANK_NAMES[newProfile.rankId]}!`, 'system', currentPlayerLocal.color);
    }
  };

  const handleSelectTerritory = (territoryId: string) => {
    if (!currentPlayer || currentPlayer.isAi || currentPhase === 'game_over' || isAiThinking) return;
    const clickedState = territories[territoryId];
    if (!clickedState) return;

    // 1. REINFORCE PHASE
    if (currentPhase === 'reinforce') {
      if (clickedState.playerId !== currentPlayer.id) {
        return;
      }
      if (availableArmiesToPlace > 0) {
        sounds.playPlaceArmy();
        const nextArmies = clickedState.armies + 1;
        setTerritories(prev => ({
          ...prev,
          [territoryId]: {
            ...prev[territoryId],
            armies: nextArmies
          }
        }));
        triggerTerritoryChange(territoryId, 1, 'gain');
        const remainingArmies = availableArmiesToPlace - 1;
        setAvailableArmiesToPlace(remainingArmies);
        addLog(
          `${currentPlayer.name} reforçou ${TERRITORIES_MAP[territoryId]?.name} (+1 tropa).`,
          'reinforce',
          currentPlayer.color
        );

        // Update High Command Feed on every fulfilled or diverted reinforcement
        if (careerProfile.careerModeActive && !currentPlayer.isAi) {
          const orderedTerritoryId = currentDispatch?.highlightTerritories[0];
          const wasOrdered = Boolean(orderedTerritoryId && orderedTerritoryId === territoryId);
          const stepDispatch = createReinforcementStepDispatch(
            currentPlayer,
            territoryId,
            remainingArmies,
            turnNumber,
            careerProfile.rankId,
            wasOrdered,
            orderedTerritoryId
          );
          setCurrentDispatch(stepDispatch);
        }
      }
      return;
    }

    // 2. ATTACK PHASE
    if (currentPhase === 'attack') {
      if (clickedState.playerId === currentPlayer.id) {
        if (clickedState.armies >= 2) {
          sounds.playPlaceArmy();
          setSelectedTerritoryId(territoryId);
          setTargetTerritoryId(null);
        }
        return;
      }

      if (selectedTerritoryId && clickedState.playerId !== currentPlayer.id) {
        const validTargets = getValidTargets();
        if (validTargets.includes(territoryId)) {
          setTargetTerritoryId(territoryId);
          setShowDiceTray(true);
        }
      }
      return;
    }

    // 3. FORTIFY PHASE
    if (currentPhase === 'fortify') {
      if (clickedState.playerId === currentPlayer.id) {
        if (!selectedTerritoryId) {
          if (clickedState.armies >= 2) {
            sounds.playPlaceArmy();
            setSelectedTerritoryId(territoryId);
          }
        } else {
          const validTargets = getValidTargets();
          if (validTargets.includes(territoryId)) {
            setTargetTerritoryId(territoryId);
            setShowFortifyModal(true);
          } else {
            if (clickedState.armies >= 2) {
              sounds.playPlaceArmy();
              setSelectedTerritoryId(territoryId);
              setTargetTerritoryId(null);
            }
          }
        }
      }
    }
  };

  // Resolve Combat Result from DiceTray with casualty animations
  const handleResolveCombat = (result: CombatResult) => {
    const prev = territoriesRef.current;
    const fromArmies = prev[result.fromTerritoryId].armies - result.attackerLosses;
    const toArmies = prev[result.toTerritoryId].armies - result.defenderLosses;

    const updated = {
      ...prev,
      [result.fromTerritoryId]: {
        ...prev[result.fromTerritoryId],
        armies: Math.max(1, fromArmies)
      },
      [result.toTerritoryId]: {
        ...prev[result.toTerritoryId],
        armies: Math.max(0, toArmies)
      }
    };
    territoriesRef.current = updated;
    setTerritories(updated);

    if (result.attackerLosses > 0) {
      triggerTerritoryChange(result.fromTerritoryId, -result.attackerLosses, 'loss');
    }
    if (result.defenderLosses > 0) {
      triggerTerritoryChange(result.toTerritoryId, -result.defenderLosses, 'loss');
    }

    const toName = TERRITORIES_MAP[result.toTerritoryId]?.name;
    addLog(
      `Batalha em ${toName}: Ataque [${result.attackDice.join(',')}] vs Defesa [${result.defenseDice.join(',')}]. Perdas: Atacante -${result.attackerLosses}, Defensor -${result.defenderLosses}.`,
      'attack',
      currentPlayer.color
    );

    // Avaliação do Alto Comando: quando segue ou diverge das ordens (deu ruim / deu bom / neutro)
    if (careerProfile.careerModeActive && !currentPlayer.isAi) {
      const evalResult = evaluateSubordinateCombat(
        currentPlayer,
        result.fromTerritoryId,
        result.toTerritoryId,
        result,
        currentDispatch,
        turnNumber,
        careerProfile.rankId
      );
      setCurrentDispatch(evalResult.dispatch);
      if (evalResult.xpDelta !== 0) {
        addXp(evalResult.xpDelta, evalResult.dispatch.title);
      }
      if (evalResult.logMessage) {
        addLog(
          evalResult.logMessage,
          evalResult.outcomeType === 'deviated_heroic' ? 'conquer' :
          evalResult.outcomeType === 'deviated_disaster' ? 'elimination' : 'turn',
          currentPlayer.color
        );
      }
    }
  };

  // Conquering & transferring troops
  const handleConquerMove = (movedArmies: number) => {
    if (!selectedTerritoryId || !targetTerritoryId) return;

    sounds.playTroopMovement(movedArmies);

    const prev = territoriesRef.current;
    const fromCurrent = prev[selectedTerritoryId].armies;
    const toCurrent = prev[targetTerritoryId].armies;

    const updatedTerritories = {
      ...prev,
      [selectedTerritoryId]: {
        ...prev[selectedTerritoryId],
        armies: Math.max(1, fromCurrent - movedArmies)
      },
      [targetTerritoryId]: {
        territoryId: targetTerritoryId,
        playerId: currentPlayer.id,
        armies: toCurrent + movedArmies
      }
    };
    territoriesRef.current = updatedTerritories;
    setTerritories(updatedTerritories);

    triggerTerritoryChange(targetTerritoryId, movedArmies, 'conquer');

    const prevPlayers = playersRef.current;
    const updatedPlayers = prevPlayers.map(p => (p.id === currentPlayer.id ? { ...p, conqueredThisTurn: true } : p));
    playersRef.current = updatedPlayers;
    setPlayers(updatedPlayers);

    const toName = TERRITORIES_MAP[targetTerritoryId]?.name;
    addLog(`${currentPlayer.name} conquistou ${toName} e deslocou ${movedArmies} tropas!`, 'conquer', currentPlayer.color);

    if (!currentPlayer.isAi) {
      addXp(10, 'Conquista de território');
      setLastConqueredTerritory(targetTerritoryId);

      // Evaluate Blitzkrieg & Iron Defense campaign missions
      if (careerProfile.careerModeActive && careerProfile.activeMissions) {
        const evalResult = evaluateCampaignMissions(
          careerProfile.activeMissions,
          currentPlayer,
          territoriesRef.current,
          { conqueredThisTurn: true, conqueredTotal: careerProfile.territoriesConquered + 1 }
        );

        if (evalResult.completedMissions.length > 0) {
          evalResult.completedMissions.forEach(m => {
            addLog(`🎖️ [MISSÃO CUMPRIDA] ${m.title}! (+${m.xpReward} XP)`, 'conquer', currentPlayer.color);
            sounds.playVictory();
          });
          addXp(evalResult.totalXpAwarded, 'Missão de Campanha Cumprida');
        }

        setCareerProfile(prev => ({
          ...prev,
          activeMissions: evalResult.updatedMissions
        }));
      }
    }

    checkElimination(targetTerritoryId);

    setSelectedTerritoryId(null);
    setTargetTerritoryId(null);
    setShowDiceTray(false);

    checkVictory(currentPlayer.id);
  };

  // Check if a player lost all territories
  const checkElimination = (capturedTerritoryId: string) => {
    setTimeout(() => {
      setPlayers(prevPlayers => {
        const updated = prevPlayers.map(p => {
          if (p.eliminated) return p;
          const remaining = Object.values(territoriesRef.current).filter(t => t.playerId === p.id).length;
          if (remaining === 0 && p.id !== currentPlayer.id) {
            addLog(`O General ${p.name} foi totalmente aniquilado do mapa!`, 'elimination', p.color);
            if (!currentPlayer.isAi) {
              addXp(100, `Eliminação do General ${p.name}`);
            }
            return { ...p, eliminated: true };
          }
          return p;
        });
        playersRef.current = updated;
        return updated;
      });
    }, 100);
  };

  // Check Victory Condition
  const checkVictory = (playerId: string) => {
    const player = playersRef.current.find(p => p.id === playerId);
    if (!player) return false;
    const evalResult = player.objective.evaluate(
      player.id,
      territoriesRef.current,
      playersRef.current,
      turnNumberRef.current
    );
    if (evalResult.completed) {
      setWinner(player);
      setShowVictoryModal(true);
      setCurrentPhase('game_over');
      addLog(`VITÓRIA! ${player.name} cumpriu a missão: "${player.objective.title}"!`, 'system', player.color);
      if (!player.isAi) {
        addXp(250, 'Campanha Vitoriosa');
      }
      return true;
    }
    return false;
  };

  // Confirm fortify move
  const handleConfirmFortify = (movedCount: number) => {
    if (!selectedTerritoryId || !targetTerritoryId) return;

    sounds.playTroopMovement(movedCount);

    setTerritories(prev => {
      const updated = {
        ...prev,
        [selectedTerritoryId]: {
          ...prev[selectedTerritoryId],
          armies: prev[selectedTerritoryId].armies - movedCount
        },
        [targetTerritoryId]: {
          ...prev[targetTerritoryId],
          armies: prev[targetTerritoryId].armies + movedCount
        }
      };
      territoriesRef.current = updated;
      return updated;
    });

    triggerTerritoryChange(selectedTerritoryId, -movedCount, 'loss');
    triggerTerritoryChange(targetTerritoryId, movedCount, 'gain');

    const fromName = TERRITORIES_MAP[selectedTerritoryId]?.name;
    const toName = TERRITORIES_MAP[targetTerritoryId]?.name;
    addLog(
      `${currentPlayer.name} remanejou ${movedCount} tropas de ${fromName} para ${toName}.`,
      'turn',
      currentPlayer.color
    );

    setSelectedTerritoryId(null);
    setTargetTerritoryId(null);
    setShowFortifyModal(false);
  };

  // Exchange Territory Cards
  const handleExchangeCards = (selectedCards: TerritoryCard[], bonusArmies: number) => {
    const cardIds = new Set(selectedCards.map(c => c.id));
    setPlayers(prev => {
      const updated = prev.map(p =>
        p.id === currentPlayer.id
          ? { ...p, cards: p.cards.filter(c => !cardIds.has(c.id)) }
          : p
      );
      playersRef.current = updated;
      return updated;
    });

    // Apply +2 directly to owned territories on cards
    selectedCards.forEach(c => {
      if (c.territoryId && territoriesRef.current[c.territoryId]?.playerId === currentPlayer.id) {
        setTerritories(prev => {
          const updated = {
            ...prev,
            [c.territoryId!]: {
              ...prev[c.territoryId!],
              armies: prev[c.territoryId!].armies + 2
            }
          };
          territoriesRef.current = updated;
          return updated;
        });
        triggerTerritoryChange(c.territoryId, 2, 'gain');
      }
    });

    setAvailableArmiesToPlace(prev => prev + bonusArmies);
    setExchangeCount(prev => prev + 1);

    addLog(
      `${currentPlayer.name} trocou um conjunto de cartas por +${bonusArmies} exércitos de reforço!`,
      'trade',
      currentPlayer.color
    );
  };

  // Auto distribute remaining reinforcements for human player
  const handleAutoDistributeReinforcements = () => {
    if (!currentPlayer || currentPlayer.isAi || currentPhase !== 'reinforce' || availableArmiesToPlace <= 0) return;

    const plans = calculateBestDeployTargets(territoriesRef.current, currentPlayer.id, availableArmiesToPlace);
    if (plans.length > 0) {
      const nextTerritories = { ...territoriesRef.current };
      plans.forEach(plan => {
        if (nextTerritories[plan.territoryId]) {
          nextTerritories[plan.territoryId] = {
            ...nextTerritories[plan.territoryId],
            armies: nextTerritories[plan.territoryId].armies + plan.troopsToPlace
          };
          triggerTerritoryChange(plan.territoryId, plan.troopsToPlace, 'gain');
        }
      });
      territoriesRef.current = nextTerritories;
      setTerritories(nextTerritories);
      sounds.playTroopMovement(availableArmiesToPlace);
      addLog(
        `${currentPlayer.name} distribuiu +${availableArmiesToPlace} tropas automaticamente nas fronteiras.`,
        'reinforce',
        currentPlayer.color
      );
      setAvailableArmiesToPlace(0);

      if (careerProfile.careerModeActive && !currentPlayer.isAi) {
        const stepDispatch = createReinforcementStepDispatch(
          currentPlayer,
          plans[0]?.territoryId || 'Fronteira',
          0,
          turnNumber,
          careerProfile.rankId,
          true
        );
        setCurrentDispatch(stepDispatch);
      }
    } else {
      // Fallback to first owned territory
      const firstOwned = Object.values(territoriesRef.current).find(t => t.playerId === currentPlayer.id);
      if (firstOwned) {
        setTerritories(prev => ({
          ...prev,
          [firstOwned.territoryId]: {
            ...prev[firstOwned.territoryId],
            armies: prev[firstOwned.territoryId].armies + availableArmiesToPlace
          }
        }));
        triggerTerritoryChange(firstOwned.territoryId, availableArmiesToPlace, 'gain');
        setAvailableArmiesToPlace(0);

        if (careerProfile.careerModeActive && !currentPlayer.isAi) {
          const stepDispatch = createReinforcementStepDispatch(
            currentPlayer,
            firstOwned.territoryId,
            0,
            turnNumber,
            careerProfile.rankId,
            false
          );
          setCurrentDispatch(stepDispatch);
        }
      }
    }
  };

  // Advance Phase button for Human Player
  const handleAdvancePhase = () => {
    if (currentPhase === 'reinforce') {
      if (availableArmiesToPlace > 0) {
        // Automatically allocate remaining reinforcements so user is NEVER blocked!
        handleAutoDistributeReinforcements();
      }
      setCurrentPhase('attack');
      setSelectedTerritoryId(null);
      setTargetTerritoryId(null);
      addLog(`${currentPlayer.name} iniciou a Fase de Ataque.`, 'turn', currentPlayer.color);

      if (careerProfile.careerModeActive && !currentPlayer.isAi) {
        const nextDispatch = generateCommandDispatch(
          currentPlayer,
          playersRef.current,
          territoriesRef.current,
          'attack',
          turnNumber,
          careerProfile.rankId,
          0
        );
        setCurrentDispatch(nextDispatch);
      }
    } else if (currentPhase === 'attack') {
      setCurrentPhase('fortify');
      setSelectedTerritoryId(null);
      setTargetTerritoryId(null);
      setShowDiceTray(false);
      addLog(`${currentPlayer.name} encerrou os ataques e iniciou a Fase de Remanejamento.`, 'turn', currentPlayer.color);

      if (careerProfile.careerModeActive && !currentPlayer.isAi) {
        const nextDispatch = generateCommandDispatch(
          currentPlayer,
          playersRef.current,
          territoriesRef.current,
          'fortify',
          turnNumber,
          careerProfile.rankId,
          0
        );
        setCurrentDispatch(nextDispatch);
      }
    } else if (currentPhase === 'fortify') {
      passTurnToNext();
    }
  };

  // Pass Turn to next active player (handles both Human and AI handover)
  const passTurnToNext = () => {
    setSelectedTerritoryId(null);
    setTargetTerritoryId(null);
    setShowDiceTray(false);
    setShowFortifyModal(false);

    const currentActivePlayer = playersRef.current[currentPlayerIdxRef.current];

    if (currentActivePlayer) {
      // Card Draw if conquered this turn
      if (currentActivePlayer.conqueredThisTurn && deckRef.current.length > 0) {
        const drawnCard = deckRef.current[0];
        deckRef.current = deckRef.current.slice(1);
        setDeck(deckRef.current);

        setPlayers(prev => {
          const updated = prev.map(p =>
            p.id === currentActivePlayer.id
              ? { ...p, cards: [...p.cards, drawnCard], conqueredThisTurn: false }
              : p
          );
          playersRef.current = updated;
          return updated;
        });
        sounds.playCard();
        addLog(`${currentActivePlayer.name} conquistou territórios e recebeu 1 carta militar.`, 'trade', currentActivePlayer.color);
      } else {
        setPlayers(prev => {
          const updated = prev.map(p =>
            p.id === currentActivePlayer.id ? { ...p, conqueredThisTurn: false } : p
          );
          playersRef.current = updated;
          return updated;
        });
      }
    }

    // Determine Next Non-Eliminated Player Index
    let nextIdx = (currentPlayerIdxRef.current + 1) % playersRef.current.length;
    let attempts = 0;
    while (playersRef.current[nextIdx]?.eliminated && attempts < playersRef.current.length) {
      nextIdx = (nextIdx + 1) % playersRef.current.length;
      attempts++;
    }

    const nextPlayer = playersRef.current[nextIdx];
    if (!nextPlayer) return;

    // Increment round counter if wrapped
    if (nextIdx <= currentPlayerIdxRef.current) {
      const newTurn = turnNumberRef.current + 1;
      turnNumberRef.current = newTurn;
      setTurnNumber(newTurn);
      recordRoundSnapshot(newTurn, playersRef.current, territoriesRef.current);

      // Evaluate Campaign Missions for human players
      if (careerProfile.careerModeActive) {
        const humanPlayer = playersRef.current.find(p => !p.isAi);
        if (humanPlayer && careerProfile.activeMissions && careerProfile.activeMissions.length > 0) {
          const evalResult = evaluateCampaignMissions(
            careerProfile.activeMissions,
            humanPlayer,
            territoriesRef.current,
            { roundCompleted: true, conqueredTotal: careerProfile.territoriesConquered }
          );

          if (evalResult.completedMissions.length > 0) {
            evalResult.completedMissions.forEach(m => {
              addLog(`🎖️ [MISSÃO CUMPRIDA] ${m.title}! (+${m.xpReward} XP)`, 'conquer', humanPlayer.color);
              sounds.playVictory();
            });
            addXp(evalResult.totalXpAwarded, 'Missões de Campanha Concluídas');
          }

          setCareerProfile(prev => ({
            ...prev,
            activeMissions: evalResult.updatedMissions
          }));
        }
      }
    } else {
      recordRoundSnapshot(turnNumberRef.current, playersRef.current, territoriesRef.current);
    }

    currentPlayerIdxRef.current = nextIdx;
    setCurrentPlayerIdx(nextIdx);
    setCurrentPhase('reinforce');

    const nextReinforce = calculateReinforcements(nextPlayer.id, territoriesRef.current);
    setAvailableArmiesToPlace(nextReinforce);

    addLog(
      `--- Rodada ${turnNumberRef.current} --- Vez do General ${nextPlayer.name} (+${nextReinforce} tropas).`,
      'turn',
      nextPlayer.color
    );

    // If next player is human: notify sound & trigger prominent banner!
    if (!nextPlayer.isAi) {
      sounds.playTurnNotification();
      setIsAiThinking(false);
      setAiStatusMessage('');
      setTurnAnnouncement({
        show: true,
        isAi: nextPlayer.isAi,
        playerName: nextPlayer.name,
        playerColor: nextPlayer.color,
        armies: nextReinforce
      });
      setTimeout(() => {
        setTurnAnnouncement((prev: any) => prev ? { ...prev, show: false } : null);
      }, 4000);
    } else {
      // Next player is AI: schedule execution
      setIsAiThinking(true);
      setAiStatusMessage(`General ${nextPlayer.name} está planejando a estratégia...`);
      setTimeout(() => {
        executeCompleteAiTurn(nextIdx, nextReinforce);
      }, 450);
    }
  };

  // Robust, Self-Contained AI Turn Runner with Guaranteed Handover
  const executeCompleteAiTurn = async (aiPlayerIdx: number, reinforcePool: number) => {
    if (isAiRunningRef.current) return;
    isAiRunningRef.current = true;
    setIsAiThinking(true);

    const aiPlayer = playersRef.current[aiPlayerIdx];
    if (!aiPlayer || !aiPlayer.isAi || aiPlayer.eliminated) {
      isAiRunningRef.current = false;
      setIsAiThinking(false);
      passTurnToNext();
      return;
    }

    let matchWon = false;

    try {
      setAiStatusMessage(`General ${aiPlayer.name} está alocando reforços...`);

      // ==========================================
      // 1. REINFORCE PHASE
      // ==========================================
      setCurrentPhase('reinforce');
      await new Promise(r => setTimeout(r, 400));

      // Check if AI can exchange cards automatically
      let totalReinforcements = reinforcePool;
      const cardSet = findAiCardSetToExchange(aiPlayer);
      if (cardSet) {
        const cardIds = new Set(cardSet.map(c => c.id));
        setPlayers(prev => {
          const updated = prev.map(p =>
            p.id === aiPlayer.id
              ? { ...p, cards: p.cards.filter(c => !cardIds.has(c.id)) }
              : p
          );
          playersRef.current = updated;
          return updated;
        });

        // Official progression bonus (4, 6, 8, 10, 12, 15, 20...)
        const bonusArmies = getExchangeBonus(exchangeCount);
        totalReinforcements += bonusArmies;

        // Apply +2 directly to owned territories on cards if AI owns them
        let territoryBonusCount = 0;
        const nextTerrAfterCardBonus = { ...territoriesRef.current };
        cardSet.forEach(c => {
          if (c.territoryId && nextTerrAfterCardBonus[c.territoryId]?.playerId === aiPlayer.id) {
            nextTerrAfterCardBonus[c.territoryId] = {
              ...nextTerrAfterCardBonus[c.territoryId],
              armies: nextTerrAfterCardBonus[c.territoryId].armies + 2
            };
            triggerTerritoryChange(c.territoryId, 2, 'gain');
            territoryBonusCount += 2;
          }
        });
        if (territoryBonusCount > 0) {
          territoriesRef.current = nextTerrAfterCardBonus;
          setTerritories(nextTerrAfterCardBonus);
        }

        setExchangeCount(prev => prev + 1);
        sounds.playCard();
        addLog(
          `IA ${aiPlayer.name} trocou cartas por +${bonusArmies} tropas de reforço${territoryBonusCount > 0 ? ` (+${territoryBonusCount} tropas bônus em seus territórios)` : ''}!`,
          'trade',
          aiPlayer.color
        );
        await new Promise(r => setTimeout(r, 400));
      }

      // Place Reinforcements on frontier territories
      const plans = calculateBestDeployTargets(territoriesRef.current, aiPlayer.id, totalReinforcements);
      if (plans.length > 0) {
        const nextTerritories = { ...territoriesRef.current };
        plans.forEach(plan => {
          if (nextTerritories[plan.territoryId]) {
            nextTerritories[plan.territoryId] = {
              ...nextTerritories[plan.territoryId],
              armies: (nextTerritories[plan.territoryId].armies || 1) + plan.troopsToPlace
            };
            triggerTerritoryChange(plan.territoryId, plan.troopsToPlace, 'gain');
          }
        });
        territoriesRef.current = nextTerritories;
        setTerritories(nextTerritories);
        setAvailableArmiesToPlace(0);

        addLog(`IA ${aiPlayer.name} reforçou ${plans.length} territórios de fronteira.`, 'reinforce', aiPlayer.color);
      }

      await new Promise(r => setTimeout(r, 400));

      // ==========================================
      // 2. ATTACK PHASE
      // ==========================================
      setCurrentPhase('attack');
      setAiStatusMessage(`General ${aiPlayer.name} analisando alvos de ataque...`);

      let attacksExecuted = 0;
      const maxAttacksThisTurn = 4;

      while (attacksExecuted < maxAttacksThisTurn) {
        const attackPlan = determineNextAttack(territoriesRef.current, aiPlayer.id);
        if (!attackPlan) break;

        const fromState = territoriesRef.current[attackPlan.attackerId];
        const toState = territoriesRef.current[attackPlan.defenderId];
        if (!fromState || !toState || fromState.armies < 2 || toState.armies < 1) break;

        attacksExecuted++;
        const fromName = TERRITORIES_MAP[attackPlan.attackerId]?.name || attackPlan.attackerId;
        const toName = TERRITORIES_MAP[attackPlan.defenderId]?.name || attackPlan.defenderId;
        setAiStatusMessage(`General ${aiPlayer.name} atacando ${toName} a partir de ${fromName}...`);

        // Visually select attack origin and target on map
        setSelectedTerritoryId(attackPlan.attackerId);
        setTargetTerritoryId(attackPlan.defenderId);
        await new Promise(r => setTimeout(r, 350));

        const atkDiceCount = Math.max(1, Math.min(3, fromState.armies - 1));
        const defDiceCount = Math.max(1, Math.min(3, toState.armies));

        const attackRolls = Array.from({ length: atkDiceCount }, () =>
          Math.floor(Math.random() * 6) + 1
        ).sort((a, b) => b - a);

        const defenseRolls = Array.from({ length: defDiceCount }, () =>
          Math.floor(Math.random() * 6) + 1
        ).sort((a, b) => b - a);

        let atkLoss = 0;
        let defLoss = 0;
        const rounds = Math.min(attackRolls.length, defenseRolls.length);
        for (let i = 0; i < rounds; i++) {
          if (attackRolls[i] > defenseRolls[i]) {
            defLoss++;
          } else {
            atkLoss++;
          }
        }

        const newDefenderArmies = Math.max(0, toState.armies - defLoss);
        const conquered = newDefenderArmies <= 0;

        sounds.playWarCombat(atkLoss, defLoss, conquered);

        if (atkLoss > 0) triggerTerritoryChange(attackPlan.attackerId, -atkLoss, 'loss');
        if (defLoss > 0) triggerTerritoryChange(attackPlan.defenderId, -defLoss, 'loss');

        if (conquered) {
          const remainingAttackerArmies = Math.max(1, fromState.armies - atkLoss);
          const moved = Math.max(1, Math.min(remainingAttackerArmies - 1, Math.max(atkDiceCount, Math.floor(remainingAttackerArmies / 2))));
          sounds.playTroopMovement(moved);

          const updatedTerritories = {
            ...territoriesRef.current,
            [attackPlan.attackerId]: {
              ...territoriesRef.current[attackPlan.attackerId],
              armies: Math.max(1, remainingAttackerArmies - moved)
            },
            [attackPlan.defenderId]: {
              territoryId: attackPlan.defenderId,
              playerId: aiPlayer.id,
              armies: moved
            }
          };
          territoriesRef.current = updatedTerritories;
          setTerritories(updatedTerritories);

          triggerTerritoryChange(attackPlan.defenderId, moved, 'conquer');

          setPlayers(prev => {
            const updated = prev.map(p =>
              p.id === aiPlayer.id ? { ...p, conqueredThisTurn: true } : p
            );
            playersRef.current = updated;
            return updated;
          });

          addLog(`IA ${aiPlayer.name} atacou e CONQUISTOU ${toName}!`, 'conquer', aiPlayer.color);

          checkElimination(attackPlan.defenderId);

          const won = checkVictory(aiPlayer.id);
          if (won) {
            matchWon = true;
            return;
          }
        } else {
          const updatedTerritories = {
            ...territoriesRef.current,
            [attackPlan.attackerId]: {
              ...territoriesRef.current[attackPlan.attackerId],
              armies: Math.max(1, fromState.armies - atkLoss)
            },
            [attackPlan.defenderId]: {
              ...territoriesRef.current[attackPlan.defenderId],
              armies: Math.max(1, newDefenderArmies)
            }
          };
          territoriesRef.current = updatedTerritories;
          setTerritories(updatedTerritories);

          addLog(
            `IA ${aiPlayer.name} atacou ${toName} (Baixas: Atacante -${atkLoss}, Defensor -${defLoss}).`,
            'attack',
            aiPlayer.color
          );
        }

        await new Promise(r => setTimeout(r, 450));
      }

      setSelectedTerritoryId(null);
      setTargetTerritoryId(null);

      // ==========================================
      // 3. FORTIFY PHASE
      // ==========================================
      setCurrentPhase('fortify');
      setAiStatusMessage(`General ${aiPlayer.name} remanejando tropas de retaguarda...`);
      await new Promise(r => setTimeout(r, 400));

      const fortifyPlan = calculateFortification(territoriesRef.current, aiPlayer.id);
      if (fortifyPlan) {
        const fromTerr = territoriesRef.current[fortifyPlan.fromId];
        const toTerr = territoriesRef.current[fortifyPlan.toId];

        if (fromTerr && toTerr && fromTerr.armies > 1) {
          const safeCount = Math.min(fortifyPlan.troopsToMove, fromTerr.armies - 1);
          if (safeCount > 0) {
            const fromName = TERRITORIES_MAP[fortifyPlan.fromId]?.name || fortifyPlan.fromId;
            const toName = TERRITORIES_MAP[fortifyPlan.toId]?.name || fortifyPlan.toId;

            const updatedTerritories = {
              ...territoriesRef.current,
              [fortifyPlan.fromId]: {
                ...territoriesRef.current[fortifyPlan.fromId],
                armies: fromTerr.armies - safeCount
              },
              [fortifyPlan.toId]: {
                ...territoriesRef.current[fortifyPlan.toId],
                armies: toTerr.armies + safeCount
              }
            };
            territoriesRef.current = updatedTerritories;
            setTerritories(updatedTerritories);

            triggerTerritoryChange(fortifyPlan.fromId, -safeCount, 'loss');
            triggerTerritoryChange(fortifyPlan.toId, safeCount, 'gain');

            addLog(
              `IA ${aiPlayer.name} remanejou ${safeCount} tropas de ${fromName} para ${toName}.`,
              'turn',
              aiPlayer.color
            );
            await new Promise(r => setTimeout(r, 350));
          }
        }
      }

      // ==========================================
      // 4. FINISH AI TURN
      // ==========================================
      setAiStatusMessage(`Turno do General ${aiPlayer.name} concluído.`);
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error('Erro na execução do turno da IA:', err);
      addLog(`IA ${aiPlayer.name} encerrou suas movimentações.`, 'system', aiPlayer.color);
    } finally {
      setSelectedTerritoryId(null);
      setTargetTerritoryId(null);
      isAiRunningRef.current = false;

      // Always guarantee turn pass if the game is still active
      if (!matchWon) {
        passTurnToNext();
      } else {
        setIsAiThinking(false);
      }
    }
  };

  

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
          return;
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
          setIsFullscreen(true);
          return;
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
          return;
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
          setIsFullscreen(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Native fullscreen blocked or unavailable, using in-app fullscreen mode:', err);
    }
    setIsFullscreen(prev => !prev);
  };

  const toggleSound = () => {
    sounds.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };



  return {
    addLog, dispatchMilitaryAction, triggerTerritoryChange, recordRoundSnapshot, calculateReinforcements,
    startNewGame, saveGameState, loadGameState, getValidTargets, addXp, toggleCareerMode,
    handleSelectTerritory, handleResolveCombat, handleConquerMove, handleConfirmFortify, handleExchangeCards,
    handleAutoDistributeReinforcements, handleAdvancePhase, passTurnToNext, toggleFullscreen, toggleSound, currentPlayer
  };
};
