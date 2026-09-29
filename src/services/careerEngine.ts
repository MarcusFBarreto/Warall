import { MilitaryRankId, CareerProfile, CommandDispatch, MILITARY_RANKS, SubordinateOutcome, CampaignMission } from '../types/career';
import { Player, TerritoryState, GamePhase, CombatResult } from '../types/game';
import { TERRITORIES_MAP } from '../data/territories';

// Definição dos limiares de XP
export const RANK_THRESHOLDS: Record<MilitaryRankId, number> = {
  cadet: 0,
  captain: 500,
  major: 1500,
  marshal: 3000
};

// Nomes de exibição
export const RANK_NAMES: Record<MilitaryRankId, string> = {
  cadet: 'Cadete',
  captain: 'Capitão',
  major: 'Major-General',
  marshal: 'Marechal'
};

export type ActionType = 
  | 'TERRITORY_CONQUERED' 
  | 'CONTINENT_SECURED' 
  | 'GENERAL_DEFEATED' 
  | 'CAMPAIGN_WON';

// Quanto vale cada ação
const XP_AWARDS: Record<ActionType, number> = {
  TERRITORY_CONQUERED: 10,
  CONTINENT_SECURED: 50,
  GENERAL_DEFEATED: 150,
  CAMPAIGN_WON: 500
};

/**
 * Retorna a patente correta com base no XP total.
 */
export const evaluateRank = (xp: number): MilitaryRankId => {
  if (xp >= RANK_THRESHOLDS.marshal) return 'marshal';
  if (xp >= RANK_THRESHOLDS.major) return 'major';
  if (xp >= RANK_THRESHOLDS.captain) return 'captain';
  return 'cadet';
};

/**
 * Processa um evento militar e retorna o Perfil atualizado com XP e estatísticas computadas.
 */
export const processMilitaryAction = (
  currentProfile: CareerProfile, 
  action: ActionType
): CareerProfile => {
  
  const xpGained = XP_AWARDS[action];
  const newXp = currentProfile.xp + xpGained;
  const newRank = evaluateRank(newXp);

  return {
    ...currentProfile,
    xp: newXp,
    rankId: newRank,
    battlesWon: action === 'TERRITORY_CONQUERED' ? currentProfile.battlesWon + 1 : currentProfile.battlesWon,
    territoriesConquered: action === 'TERRITORY_CONQUERED' ? currentProfile.territoriesConquered + 1 : currentProfile.territoriesConquered,
    continentsConquered: action === 'CONTINENT_SECURED' ? currentProfile.continentsConquered + 1 : currentProfile.continentsConquered,
    generalsDefeated: action === 'GENERAL_DEFEATED' ? currentProfile.generalsDefeated + 1 : currentProfile.generalsDefeated,
    campaignsWon: action === 'CAMPAIGN_WON' ? currentProfile.campaignsWon + 1 : currentProfile.campaignsWon
  };
};

const ADVISORS = [
  { name: 'Gen. Bradley', role: 'Chefe do Estado-Maior Aliado' },
  { name: 'Mal. Zhukov', role: 'Comandante de Operações Táticas' },
  { name: 'Gen. Marshall', role: 'Conselheiro de Inteligência Militar' }
];

export function generateCommandDispatch(
  player: Player,
  players: Player[],
  territories: Record<string, TerritoryState>,
  currentPhase: GamePhase,
  turnNumber: number,
  rankId: MilitaryRankId,
  availableArmies: number,
  lastConqueredTerritory?: string | null
): CommandDispatch {
  const advisor = ADVISORS[turnNumber % ADVISORS.length];
  const rank = MILITARY_RANKS[rankId];

  // 1. Identify player territories and frontline territories
  const playerTerritories = Object.entries(territories).filter(
    ([, state]) => state.playerId === player.id
  );

  const frontlineTerritories = playerTerritories.filter(([id]) => {
    const terr = TERRITORIES_MAP[id];
    if (!terr) return false;
    return terr.neighbors.some(nId => territories[nId] && territories[nId].playerId !== player.id);
  });

  // Calculate most vulnerable frontlines (frontlines with low armies facing high enemy armies)
  const vulnerableFrontlines = frontlineTerritories
    .map(([id, state]) => {
      const terr = TERRITORIES_MAP[id];
      const maxEnemyArmy = terr
        ? Math.max(
            ...terr.neighbors
              .filter(nId => territories[nId] && territories[nId].playerId !== player.id)
              .map(nId => territories[nId]?.armies || 0)
          )
        : 0;
      return { id, armies: state.armies, maxEnemyArmy, risk: maxEnemyArmy - state.armies };
    })
    .sort((a, b) => b.risk - a.risk);

  // 2. Identify best attack opportunities (player armies > enemy armies)
  const attackOpportunities: {
    sourceId: string;
    targetId: string;
    sourceArmies: number;
    targetArmies: number;
    advantage: number;
    targetOwnerName: string;
  }[] = [];

  frontlineTerritories.forEach(([sourceId, state]) => {
    if (state.armies <= 1) return;
    const terr = TERRITORIES_MAP[sourceId];
    if (!terr) return;

    terr.neighbors.forEach(nId => {
      const enemyState = territories[nId];
      if (enemyState && enemyState.playerId !== player.id) {
        const enemyPlayer = players.find(p => p.id === enemyState.playerId);
        attackOpportunities.push({
          sourceId,
          targetId: nId,
          sourceArmies: state.armies,
          targetArmies: enemyState.armies,
          advantage: state.armies - enemyState.armies,
          targetOwnerName: enemyPlayer?.name || 'Inimigo'
        });
      }
    });
  });

  attackOpportunities.sort((a, b) => b.advantage - a.advantage);

  // 3. Post-Combat Feedback if a territory was just conquered
  if (lastConqueredTerritory) {
    const conqueredTerr = TERRITORIES_MAP[lastConqueredTerritory];
    return {
      id: `dispatch_conq_${Date.now()}`,
      turnNumber,
      phase: 'post-combat',
      title: 'Despacho Especial: Posição Inimiga Rompida!',
      message: `Excelente manobra! As forças de vanguarda tomaram ${conqueredTerr?.name || 'a posição'}. Agora, na fase de remanejamento, redistribua o excesso de tropas para fortificar este novo ponto de controle.`,
      advisorName: advisor.name,
      advisorRole: advisor.role,
      highlightTerritories: [lastConqueredTerritory],
      urgency: 'priority'
    };
  }

  // 4. Phase: REINFORCE
  if (currentPhase === 'reinforce') {
    if (availableArmies === 0) {
      return {
        id: `dispatch_reinf_done_${Date.now()}`,
        turnNumber,
        phase: 'reinforce',
        title: 'Divisões Posicionadas e Prontas',
        message: 'Todas as divisões de infantaria foram distribuídas nas frentes de batalha. Solicito autorização para iniciar a Fase de Ataque.',
        advisorName: advisor.name,
        advisorRole: advisor.role,
        highlightTerritories: [],
        urgency: 'routine'
      };
    }

    const priorityTarget = vulnerableFrontlines[0];
    const secondaryTarget = vulnerableFrontlines[1] || vulnerableFrontlines[0];

    if (rank.guidanceLevel === 'strict') {
      // Cadet: strict order with exact allocations
      const topName = priorityTarget ? TERRITORIES_MAP[priorityTarget.id]?.name : 'sua fronteira';
      return {
        id: `dispatch_reinf_cadet_${Date.now()}`,
        turnNumber,
        phase: 'reinforce',
        title: `Ordem do Comando: Reforçar ${topName}`,
        message: `Cadete, identificamos pressão nas linhas de ${topName}. Aloque reforços primários aqui para garantir o perímetro e evitar infiltrações inimigas.`,
        advisorName: advisor.name,
        advisorRole: advisor.role,
        highlightTerritories: priorityTarget ? [priorityTarget.id] : [],
        suggestedArmies: availableArmies,
        urgency: 'urgent'
      };
    } else if (rank.guidanceLevel === 'guided') {
      // Captain: suggested allocation
      const topName = priorityTarget ? TERRITORIES_MAP[priorityTarget.id]?.name : 'as fronteiras';
      return {
        id: `dispatch_reinf_capt_${Date.now()}`,
        turnNumber,
        phase: 'reinforce',
        title: `Recomendação Estratégica: Alocação em ${topName}`,
        message: `Capitão, nossos analistas apontam ${topName} como setor crítico. Recomendamos reforçar este flanco antes de desfechar ofensivas.`,
        advisorName: advisor.name,
        advisorRole: advisor.role,
        highlightTerritories: [priorityTarget?.id, secondaryTarget?.id].filter(Boolean) as string[],
        suggestedArmies: availableArmies,
        urgency: 'priority'
      };
    } else {
      // Major / Marshal: tactical intel briefing
      return {
        id: `dispatch_reinf_major_${Date.now()}`,
        turnNumber,
        phase: 'reinforce',
        title: 'Relatório Tático de Efetivo',
        message: `Comandante, dispomos de +${availableArmies} tropas no escalão de reserva. As defesas mais expostas situam-se em ${priorityTarget ? TERRITORIES_MAP[priorityTarget.id]?.name : 'fronteira'}. O comando de alocação está sob sua autoridade.`,
        advisorName: advisor.name,
        advisorRole: advisor.role,
        highlightTerritories: [priorityTarget?.id].filter(Boolean) as string[],
        suggestedArmies: availableArmies,
        urgency: 'routine'
      };
    }
  }

  // 5. Phase: ATTACK
  if (currentPhase === 'attack') {
    const bestAttack = attackOpportunities[0];

    if (!bestAttack) {
      return {
        id: `dispatch_atk_def_${Date.now()}`,
        turnNumber,
        phase: 'attack',
        title: 'Postura Defensiva Recomendada',
        message: 'Nenhum dos seus setores de vanguarda possui superioridade de combate clara neste momento. O Comando sugere avançar de fase para preservar divisões.',
        advisorName: advisor.name,
        advisorRole: advisor.role,
        highlightTerritories: [],
        urgency: 'routine'
      };
    }

    const sourceName = TERRITORIES_MAP[bestAttack.sourceId]?.name;
    const targetName = TERRITORIES_MAP[bestAttack.targetId]?.name;

    if (rank.guidanceLevel === 'strict') {
      // Cadet: Direct strike order
      return {
        id: `dispatch_atk_cadet_${Date.now()}`,
        turnNumber,
        phase: 'attack',
        title: `Ordem de Ofensiva: ${sourceName} → ${targetName}`,
        message: `Cadete, ordem do Estado-Maior: O regimento em ${sourceName} (${bestAttack.sourceArmies} tropas) deve investir contra ${targetName} (${bestAttack.targetArmies} tropas do ${bestAttack.targetOwnerName}). Vantagem numérica favorável!`,
        advisorName: advisor.name,
        advisorRole: advisor.role,
        highlightTerritories: [bestAttack.sourceId],
        targetTerritories: [bestAttack.targetId],
        urgency: 'urgent'
      };
    } else if (rank.guidanceLevel === 'guided') {
      // Captain: suggested target with autonomy
      return {
        id: `dispatch_atk_capt_${Date.now()}`,
        turnNumber,
        phase: 'attack',
        title: `Alvo de Oportunidade: ${targetName}`,
        message: `Capitão, identificamos vulnerabilidade em ${targetName}. Uma investida partindo de ${sourceName} oferece alta probabilidade de ruptura da linha.`,
        advisorName: advisor.name,
        advisorRole: advisor.role,
        highlightTerritories: [bestAttack.sourceId],
        targetTerritories: [bestAttack.targetId],
        urgency: 'priority'
      };
    } else {
      // Major / Marshal: Intelligence on enemy lines
      return {
        id: `dispatch_atk_major_${Date.now()}`,
        turnNumber,
        phase: 'attack',
        title: 'Reconhecimento Aéreo de Alvos',
        message: `Relatório de satélite: Posição de ${targetName} (${bestAttack.targetOwnerName}) está vulnerável a investida de ${sourceName}. Vantagem tática de +${bestAttack.advantage} divisões.`,
        advisorName: advisor.name,
        advisorRole: advisor.role,
        highlightTerritories: [bestAttack.sourceId],
        targetTerritories: [bestAttack.targetId],
        urgency: 'priority'
      };
    }
  }

  // 6. Phase: FORTIFY
  const interiorWithExcess = playerTerritories.find(([id, state]) => {
    if (state.armies <= 1) return false;
    const terr = TERRITORIES_MAP[id];
    // Territory whose all neighbors are allies
    return terr?.neighbors.every(nId => territories[nId]?.playerId === player.id);
  });

  if (interiorWithExcess && frontlineTerritories.length > 0) {
    const fromName = TERRITORIES_MAP[interiorWithExcess[0]]?.name;
    const toFront = frontlineTerritories[0][0];
    const toName = TERRITORIES_MAP[toFront]?.name;

    return {
      id: `dispatch_fort_move_${Date.now()}`,
      turnNumber,
      phase: 'fortify',
      title: 'Remanejamento da Retaguarda',
      message: `Divisões ociosas foram localizadas em ${fromName} sem contato direto com o inimigo. Desloque este efetivo para o posto avançado de ${toName} para blindar as fronteiras.`,
      advisorName: advisor.name,
      advisorRole: advisor.role,
      highlightTerritories: [interiorWithExcess[0], toFront],
      urgency: 'priority'
    };
  }

  return {
    id: `dispatch_fort_std_${Date.now()}`,
    turnNumber,
    phase: 'fortify',
    title: 'Consolidação de Posições',
    message: 'Avalie se há necessidade de deslocar tropas entre setores vizinhos antes de passar a vez ao próximo comando. Caso esteja satisfeito, finalize a rodada.',
    advisorName: advisor.name,
    advisorRole: advisor.role,
    highlightTerritories: [],
    urgency: 'routine'
  };
}

export function calculateNewRank(currentXp: number): MilitaryRankId {
  if (currentXp >= MILITARY_RANKS.marshal.minXp) return 'marshal';
  if (currentXp >= MILITARY_RANKS.major.minXp) return 'major';
  if (currentXp >= MILITARY_RANKS.captain.minXp) return 'captain';
  return 'cadet';
}

export function createReinforcementStepDispatch(
  player: Player,
  territoryId: string,
  remainingArmies: number,
  turnNumber: number,
  rankId: MilitaryRankId,
  wasOrderedTerritory: boolean,
  orderedTerritoryId?: string
): CommandDispatch {
  const advisor = ADVISORS[turnNumber % ADVISORS.length];
  const terrName = TERRITORIES_MAP[territoryId]?.name || 'a posição';
  const orderedName = orderedTerritoryId ? TERRITORIES_MAP[orderedTerritoryId]?.name : null;

  if (remainingArmies === 0) {
    return {
      id: `reinf_step_done_${Date.now()}`,
      turnNumber,
      phase: 'reinforce',
      title: '✅ Recomposição de Linhas Concluída',
      message: `Todas as divisões de reserva foram posicionadas. Nossas forças estão em alerta de prontidão operacional. Avance a etapa para a Fase de Ataque para iniciar as operações.`,
      advisorName: advisor.name,
      advisorRole: advisor.role,
      highlightTerritories: [],
      urgency: 'priority',
      badgeText: '✅ ETAPA CONCLUÍDA'
    };
  }

  if (wasOrderedTerritory) {
    return {
      id: `reinf_step_${Date.now()}`,
      turnNumber,
      phase: 'reinforce',
      title: `✅ Diretiva Cumprida: ${terrName}`,
      message: `Excelente disciplina. O setor de ${terrName} recebeu reforço de infantaria conforme solicitado pelo Estado-Maior. Restam +${remainingArmies} divisões na reserva para mobilizar.`,
      advisorName: advisor.name,
      advisorRole: advisor.role,
      highlightTerritories: [territoryId],
      suggestedArmies: remainingArmies,
      urgency: 'priority',
      badgeText: '★ DIRETIVA EM EXECUÇÃO'
    };
  } else {
    return {
      id: `reinf_step_alt_${Date.now()}`,
      turnNumber,
      phase: 'reinforce',
      title: `📋 Reforço em Setor Secundário: ${terrName}`,
      message: `Tropas alocadas em ${terrName}. O Estado-Maior toma nota da escolha do General, mas relembra que ${orderedName ? orderedName : 'a linha de frente principal'} ainda possui maior vulnerabilidade. Restam +${remainingArmies} tropas.`,
      advisorName: advisor.name,
      advisorRole: advisor.role,
      highlightTerritories: orderedTerritoryId ? [orderedTerritoryId] : [territoryId],
      suggestedArmies: remainingArmies,
      urgency: 'routine',
      badgeText: '📋 ALOCAÇÃO ALTERNATIVA'
    };
  }
}

export interface CombatEvaluationResult {
  dispatch: CommandDispatch;
  xpDelta: number;
  logMessage: string;
  outcomeType: SubordinateOutcome;
}

export function evaluateSubordinateCombat(
  player: Player,
  fromTerritoryId: string,
  toTerritoryId: string,
  result: CombatResult,
  currentDispatch: CommandDispatch | null,
  turnNumber: number,
  rankId: MilitaryRankId
): CombatEvaluationResult {
  const advisor = ADVISORS[turnNumber % ADVISORS.length];
  const fromName = TERRITORIES_MAP[fromTerritoryId]?.name || 'Origem';
  const toName = TERRITORIES_MAP[toTerritoryId]?.name || 'Alvo';

  const orderedTargets = currentDispatch?.targetTerritories || [];
  const wasOrderedTarget = orderedTargets.includes(toTerritoryId);

  // CASE A: Subordinate followed the High Command's requested target!
  if (wasOrderedTarget) {
    if (result.conquered) {
      return {
        dispatch: {
          id: `combat_eval_followed_win_${Date.now()}`,
          turnNumber,
          phase: 'attack',
          title: `🎯 Ordem Cumprida: ${toName} Dominado!`,
          message: `Execução exemplar das ordens do Alto Comando! A 1ª Divisão partiu de ${fromName} e conquistou ${toName} conforme a diretriz operacional traçada pelo Estado-Maior. Prossiga avançando tropas ou explore novas brechas.`,
          advisorName: advisor.name,
          advisorRole: advisor.role,
          highlightTerritories: [toTerritoryId],
          urgency: 'victory',
          outcomeType: 'followed_success',
          xpDelta: 15,
          badgeText: '🎯 ORDEM CUMPRIDA (+15 XP)',
          actionTakenText: `Ataque coordenado contra o alvo designado (${toName}).`
        },
        xpDelta: 15,
        logMessage: `🎯 [ORDEM CUMPRIDA] General ${player.name} seguiu a diretriz do Comando e conquistou ${toName} com disciplina operacional (+15 XP de Bônus de Comando)!`,
        outcomeType: 'followed_success'
      };
    } else {
      // In combat against ordered target, not yet conquered
      return {
        dispatch: {
          id: `combat_eval_followed_atk_${Date.now()}`,
          turnNumber,
          phase: 'attack',
          title: `⚔️ Investida em Andamento: ${fromName} → ${toName}`,
          message: `Suas forças engajaram o alvo designado pelo Comando em ${toName}. Baixas do turno: -${result.attackerLosses} atacantes vs -${result.defenderLosses} defensores. O cerco deve continuar se houver superioridade numérica.`,
          advisorName: advisor.name,
          advisorRole: advisor.role,
          highlightTerritories: [fromTerritoryId],
          targetTerritories: [toTerritoryId],
          urgency: 'priority',
          outcomeType: 'followed_struggle',
          xpDelta: 0,
          badgeText: '⚔️ ORDEM EM ANDAMENTO',
          actionTakenText: `Combate travado contra o alvo designado (${toName}).`
        },
        xpDelta: 0,
        logMessage: `[ESTADO-MAIOR] Investida sob ordens contra ${toName}: -${result.attackerLosses} baixas aliadas vs -${result.defenderLosses} inimigas.`,
        outcomeType: 'followed_struggle'
      };
    }
  }

  // CASE B: Subordinate did NOT follow the High Command's requested target!
  const isDisaster = !result.conquered && (
    result.attackerLosses > result.defenderLosses ||
    (result.attackerLosses >= 2 && result.defenderLosses === 0) ||
    result.attackerLosses >= 2
  );

  const isHeroic = result.conquered || (result.defenderLosses >= 2 && result.attackerLosses <= 1);

  if (isHeroic) {
    return {
      dispatch: {
        id: `combat_eval_heroic_${Date.now()}`,
        turnNumber,
        phase: 'attack',
        title: `🎖️ Despacho Especial: Audácia e Iniciativa Tática!`,
        message: `Iniciativa brilhante, General! O subordinado ignorou o alvo convencional prescrito pelo Comando e desfechou um golpe cirúrgico em ${toName}, alcançando um desfecho superior ao previsto pelo Estado-Maior! A audácia compensou e o dispositivo inimigo foi rompido!`,
        advisorName: advisor.name,
        advisorRole: advisor.role,
        highlightTerritories: [toTerritoryId],
        urgency: 'victory',
        outcomeType: 'deviated_heroic',
        xpDelta: 35,
        badgeText: '🎖️ AUDÁCIA HEROICA (+35 XP)',
        actionTakenText: `Manobra independente vitoriosa em ${toName}.`
      },
      xpDelta: 35,
      logMessage: `🎖️ [INICIATIVA HEROICA] O General ${player.name} ousou divergir da ordem do Comando e conquistou uma vitória brilhante em ${toName}! Condecorado pelo Estado-Maior (+35 XP de Audácia)!`,
      outcomeType: 'deviated_heroic'
    };
  }

  if (isDisaster) {
    return {
      dispatch: {
        id: `combat_eval_disaster_${Date.now()}`,
        turnNumber,
        phase: 'attack',
        title: `⚠️ Advertência Disciplinar: Insubordinação com Revés`,
        message: `O General ignorou a rota ordenada pelo Estado-Maior e lançou uma investida precipitada contra ${toName}. O resultado foi desastroso: perdas pesadas (-${result.attackerLosses} tropas) sem quebra da linha inimiga. O Alto Comando exige disciplina tática rigorosa!`,
        advisorName: advisor.name,
        advisorRole: advisor.role,
        highlightTerritories: [fromTerritoryId],
        urgency: 'urgent',
        outcomeType: 'deviated_disaster',
        xpDelta: -10,
        badgeText: '⚠️ ADVERTÊNCIA DISCIPLINAR (-10 XP)',
        actionTakenText: `Investida não autorizada com revés em ${toName}.`
      },
      xpDelta: -10,
      logMessage: `⚠️ [ADVERTÊNCIA DISCIPLINAR] General ${player.name} ignorou as ordens do Comando e sofreu pesadas baixas em ${toName} sem conquistar o setor (-10 XP)!`,
      outcomeType: 'deviated_disaster'
    };
  }

  return {
    dispatch: {
      id: `combat_eval_neutral_${Date.now()}`,
      turnNumber,
      phase: 'attack',
      title: `📋 Observação Tática: Manobra Secundária Inconclusiva`,
      message: `A investida em ${toName} divergiu do plano principal do Estado-Maior. O atrito mútuo (-${result.attackerLosses} aliadas vs -${result.defenderLosses} inimigas) não abriu brecha decisiva nem causou colapso nas linhas. Evite dispersar forças fora da frente prioritária.`,
      advisorName: advisor.name,
      advisorRole: advisor.role,
      highlightTerritories: [fromTerritoryId],
      urgency: 'routine',
      outcomeType: 'deviated_neutral',
      xpDelta: 0,
      badgeText: '📋 DESVIO NEUTRO (0 XP)',
      actionTakenText: `Ataque divergente com empate tático em ${toName}.`
    },
    xpDelta: 0,
    logMessage: `📋 [ESTADO-MAIOR] A investida em ${toName} divergiu da diretriz do Comando e resultou em atrito neutro.`,
    outcomeType: 'deviated_neutral'
  };
}

// ==========================================
// MISSÕES ESPECÍFICAS DE CAMPANHA MILITAR
// ==========================================
export function generateInitialCampaignMissions(
  player: Player,
  territories: Record<string, TerritoryState>
): CampaignMission[] {
  const owned = Object.values(territories).filter(t => t.playerId === player.id);
  const baseTerritory = owned.reduce((best, curr) => (curr.armies > (best?.armies || 0) ? curr : best), owned[0]);
  const baseId = baseTerritory?.territoryId || 'brazil';
  const baseName = TERRITORIES_MAP[baseId]?.name || 'Base de Operações';

  return [
    {
      id: 'mission_hold_base',
      title: `Operação Sentinela: Manter ${baseName}`,
      description: `Mantenha sob controle sua principal base de comando (${baseName}) por 5 rodadas consecutivas sem deixá-la cair nas mãos inimigas.`,
      icon: '🛡️',
      category: 'hold_base',
      xpReward: 120,
      targetCount: 5,
      currentCount: 0,
      completed: false,
      metadata: {
        baseTerritoryId: baseId,
        turnsRequired: 5,
        turnsSurvived: 0
      }
    },
    {
      id: 'mission_blitzkrieg',
      title: 'Blitzkrieg: Ofensiva Relâmpago',
      description: 'Conquiste pelo menos 3 territórios inimigos ao longo da campanha.',
      icon: '⚡',
      category: 'blitzkrieg',
      xpReward: 100,
      targetCount: 3,
      currentCount: 0,
      completed: false
    },
    {
      id: 'mission_iron_defense',
      title: 'Muralha de Ferro: Bastião com 5+ Tropas',
      description: 'Fortifique qualquer território com pelo menos 5 exércitos estacionados para criar uma fortaleza inexpugnável.',
      icon: '🏰',
      category: 'iron_defense',
      xpReward: 80,
      targetCount: 1,
      currentCount: 0,
      completed: false
    }
  ];
}

export function evaluateCampaignMissions(
  missions: CampaignMission[],
  player: Player,
  territories: Record<string, TerritoryState>,
  events: {
    roundCompleted?: boolean;
    conqueredThisTurn?: boolean;
    conqueredTotal?: number;
  }
): { updatedMissions: CampaignMission[]; completedMissions: CampaignMission[]; totalXpAwarded: number } {
  let totalXpAwarded = 0;
  const completedMissions: CampaignMission[] = [];

  const updatedMissions = missions.map(mission => {
    if (mission.completed) return mission;

    const updated = { ...mission };

    // 1. Missão: Segurar Base por X rodadas
    if (mission.category === 'hold_base' && events.roundCompleted) {
      const baseId = mission.metadata?.baseTerritoryId;
      const holdsBase = baseId && territories[baseId]?.playerId === player.id;
      if (holdsBase) {
        const nextCount = (mission.currentCount || 0) + 1;
        updated.currentCount = nextCount;
        if (nextCount >= mission.targetCount) {
          updated.completed = true;
          updated.completedAt = new Date().toISOString();
          totalXpAwarded += mission.xpReward;
          completedMissions.push(updated);
        }
      } else {
        updated.currentCount = 0;
      }
    }

    // 2. Missão: Blitzkrieg (conquista de territórios)
    if (mission.category === 'blitzkrieg' && events.conqueredTotal !== undefined) {
      updated.currentCount = events.conqueredTotal;
      if (updated.currentCount >= mission.targetCount) {
        updated.completed = true;
        updated.completedAt = new Date().toISOString();
        totalXpAwarded += mission.xpReward;
        completedMissions.push(updated);
      }
    }

    // 3. Missão: Muralha de Ferro (ao menos 1 território com 5+ tropas)
    if (mission.category === 'iron_defense') {
      const hasFortress = Object.values(territories).some(
        t => t.playerId === player.id && t.armies >= 5
      );
      if (hasFortress) {
        updated.currentCount = 1;
        updated.completed = true;
        updated.completedAt = new Date().toISOString();
        totalXpAwarded += mission.xpReward;
        completedMissions.push(updated);
      }
    }

    return updated;
  });

  return { updatedMissions, completedMissions, totalXpAwarded };
}
