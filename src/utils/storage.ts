import { Player, TerritoryState, GamePhase, TerritoryCard, GameLog, RoundHistoryEntry } from '../types/game';
import { CareerProfile } from '../types/career';
import { SECRET_OBJECTIVES } from '../data/objectives';

export const LOCAL_STORAGE_KEY = 'warall_game_state_v1';

export interface SavedPlayer {
  id: string;
  name: string;
  color: string;
  isAi: boolean;
  cards: TerritoryCard[];
  objectiveId: number;
  eliminated: boolean;
  conqueredThisTurn: boolean;
}

export interface SavedGameState {
  version: number;
  savedAt: number;
  turnNumber: number;
  currentPlayerIdx: number;
  currentPhase: GamePhase;
  availableArmiesToPlace: number;
  exchangeCount: number;
  territories: Record<string, TerritoryState>;
  players: SavedPlayer[];
  deck: TerritoryCard[];
  logs: GameLog[];
  roundHistory: RoundHistoryEntry[];
  soundEnabled: boolean;
  winnerId: string | null;
  careerProfile: CareerProfile;
}

export interface HydratedGameState extends Omit<SavedGameState, 'players'> {
  players: Player[];
}

export const saveGameState = (state: SavedGameState): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Não foi possível salvar a partida no localStorage:', err);
  }
};

export const loadGameState = (): HydratedGameState | null => {
  try {
    const savedRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!savedRaw) return null;

    const saved = JSON.parse(savedRaw) as SavedGameState;
    if (
      !saved ||
      !saved.territories ||
      !saved.players ||
      !Array.isArray(saved.players) ||
      saved.players.length === 0
    ) {
      return null;
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

    return {
      ...saved,
      players: hydratedPlayers,
    };
  } catch (err) {
    console.warn('Não foi possível carregar a partida do localStorage:', err);
    return null;
  }
};

export const clearGameState = (): void => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (err) {
    console.warn('Não foi possível limpar o localStorage:', err);
  }
};
