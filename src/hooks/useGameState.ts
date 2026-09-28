import { useState, useEffect } from 'react';
import {
  Player,
  TerritoryState,
  GamePhase,
  GameLog as GameLogType,
  TerritoryCard,
  RoundHistoryEntry
} from '../types/game';
import { PlayerProfile } from '../types/player';
import { CommandDispatch, CareerProfile } from '../types/career';
import { TerritoryChangeIndicator } from '../components/Board';

const PLAYER_PROFILE_KEY = 'warall_player_profile_v1';
const CAREER_PROFILE_KEY = 'warall_career_profile_v1';
const LOCAL_STORAGE_KEY = 'warall_game_state_v1';

const defaultCareerProfile: CareerProfile = {
  xp: 0,
  rankId: 'cadet',
  careerModeActive: true,
  battlesWon: 0,
  territoriesConquered: 0,
  continentsConquered: 0,
  generalsDefeated: 0,
  campaignsWon: 0
};

export const useGameState = () => {
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(() => {
    try {
      const saved = localStorage.getItem(PLAYER_PROFILE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [careerProfile, setCareerProfile] = useState<CareerProfile>(() => {
    if (playerProfile?.career) return playerProfile.career;
    try {
      const saved = localStorage.getItem(CAREER_PROFILE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultCareerProfile;
  });

  const handleEnlist = (profile: PlayerProfile) => {
    setPlayerProfile(profile);
    setCareerProfile(profile.career);
    try {
      localStorage.setItem(PLAYER_PROFILE_KEY, JSON.stringify(profile));
      localStorage.setItem(CAREER_PROFILE_KEY, JSON.stringify(profile.career));
    } catch (e) {}
  };

  useEffect(() => {
    if (playerProfile) {
      setPlayerProfile(prev => {
        if (!prev) return null;
        if (prev.career === careerProfile) return prev;
        const updated: PlayerProfile = { ...prev, career: careerProfile };
        try {
          localStorage.setItem(PLAYER_PROFILE_KEY, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }
  }, [careerProfile]);

  const handleResetProfile = () => {
    if (window.confirm('Tem certeza de que deseja apagar seu perfil e resetar todo o progresso da carreira?')) {
      localStorage.removeItem(PLAYER_PROFILE_KEY);
      localStorage.removeItem(CAREER_PROFILE_KEY);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setPlayerProfile(null);
      setCareerProfile(defaultCareerProfile);
    }
  };

  const [currentDispatch, setCurrentDispatch] = useState<CommandDispatch | null>(null);
  const [lastConqueredTerritory, setLastConqueredTerritory] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState<number>(0);
  const [turnNumber, setTurnNumber] = useState<number>(1);
  const [currentPhase, setCurrentPhase] = useState<GamePhase>('reinforce');
  const [exchangeCount, setExchangeCount] = useState<number>(0);
  const [deck, setDeck] = useState<TerritoryCard[]>([]);
  const [territories, setTerritories] = useState<Record<string, TerritoryState>>({});
  const [recentChanges, setRecentChanges] = useState<Record<string, TerritoryChangeIndicator>>({});
  const [availableArmiesToPlace, setAvailableArmiesToPlace] = useState<number>(0);
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);
  const [targetTerritoryId, setTargetTerritoryId] = useState<string | null>(null);
  
  const [showObjectiveModal, setShowObjectiveModal] = useState<boolean>(false);
  const [showCardsModal, setShowCardsModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showLogDrawer, setShowLogDrawer] = useState<boolean>(false);
  const [showNewGameModal, setShowNewGameModal] = useState<boolean>(false);
  const [showDiceTray, setShowDiceTray] = useState<boolean>(false);
  const [showFortifyModal, setShowFortifyModal] = useState<boolean>(false);
  const [showWarReportModal, setShowWarReportModal] = useState<boolean>(false);
  
  const [winner, setWinner] = useState<Player | null>(null);
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(true);
  const [roundHistory, setRoundHistory] = useState<RoundHistoryEntry[]>([]);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string>('');
  
  const [turnAnnouncement, setTurnAnnouncement] = useState<{
    show: boolean;
    playerName: string;
    playerColor: string;
    isAi: boolean;
    armies: number;
  }>({ show: false, playerName: '', playerColor: '', isAi: false, armies: 0 });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [logs, setLogs] = useState<GameLogType[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  return {
    playerProfile, setPlayerProfile,
    careerProfile, setCareerProfile,
    handleEnlist, handleResetProfile,
    currentDispatch, setCurrentDispatch,
    lastConqueredTerritory, setLastConqueredTerritory,
    players, setPlayers,
    currentPlayerIdx, setCurrentPlayerIdx,
    turnNumber, setTurnNumber,
    currentPhase, setCurrentPhase,
    exchangeCount, setExchangeCount,
    deck, setDeck,
    territories, setTerritories,
    recentChanges, setRecentChanges,
    availableArmiesToPlace, setAvailableArmiesToPlace,
    selectedTerritoryId, setSelectedTerritoryId,
    targetTerritoryId, setTargetTerritoryId,
    showObjectiveModal, setShowObjectiveModal,
    showCardsModal, setShowCardsModal,
    showRulesModal, setShowRulesModal,
    showLogDrawer, setShowLogDrawer,
    showNewGameModal, setShowNewGameModal,
    showDiceTray, setShowDiceTray,
    showFortifyModal, setShowFortifyModal,
    showWarReportModal, setShowWarReportModal,
    winner, setWinner,
    showVictoryModal, setShowVictoryModal,
    roundHistory, setRoundHistory,
    isAiThinking, setIsAiThinking,
    aiStatusMessage, setAiStatusMessage,
    turnAnnouncement, setTurnAnnouncement,
    soundEnabled, setSoundEnabled,
    logs, setLogs,
    isFullscreen, setIsFullscreen
  };
};
