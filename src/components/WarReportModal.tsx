/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Player, PlayerColor, RoundHistoryEntry, TerritoryState } from '../types/game';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Shield,
  MapPin,
  Users,
  Trophy,
  X,
  Swords,
  Crown,
  AlertTriangle,
  Flame,
  BarChart3,
  Activity
} from 'lucide-react';

interface WarReportModalProps {
  players: Player[];
  territories: Record<string, TerritoryState>;
  currentRound: number;
  history: RoundHistoryEntry[];
  onClose: () => void;
}

const PLAYER_HEX_COLORS: Record<PlayerColor, { stroke: string; fill: string; bg: string; text: string }> = {
  red: { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.2)', bg: 'bg-red-500', text: 'text-red-400' },
  blue: { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.2)', bg: 'bg-blue-500', text: 'text-blue-400' },
  yellow: { stroke: '#eab308', fill: 'rgba(234, 179, 8, 0.2)', bg: 'bg-amber-400', text: 'text-amber-400' },
  green: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.2)', bg: 'bg-emerald-500', text: 'text-emerald-400' },
  white: { stroke: '#e2e8f0', fill: 'rgba(226, 232, 240, 0.2)', bg: 'bg-slate-200', text: 'text-slate-200' },
  black: { stroke: '#94a3b8', fill: 'rgba(148, 163, 184, 0.2)', bg: 'bg-stone-500', text: 'text-stone-300' }
};

export const WarReportModal: React.FC<WarReportModalProps> = ({
  players,
  territories,
  currentRound,
  history,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'armies' | 'territories' | 'balance'>('armies');

  // Compute live stats for current state to ensure data is 100% up to the second
  const livePlayerStats = useMemo(() => {
    return players.map(p => {
      const ownedTerritories = Object.values(territories).filter(t => t.playerId === p.id);
      const totalArmies = ownedTerritories.reduce((acc, curr) => acc + curr.armies, 0);
      const isEliminated = p.eliminated || ownedTerritories.length === 0;

      // Calculate delta from previous round if history exists
      let previousArmies = totalArmies;
      let previousTerritories = ownedTerritories.length;
      if (history.length > 1) {
        const prevEntry = history[history.length - 2]?.stats[p.id];
        if (prevEntry) {
          previousArmies = prevEntry.armies;
          previousTerritories = prevEntry.territories;
        }
      }

      return {
        ...p,
        totalArmies,
        territoriesCount: ownedTerritories.length,
        percentageMap: ((ownedTerritories.length / 42) * 100).toFixed(1),
        armiesDelta: totalArmies - previousArmies,
        territoriesDelta: ownedTerritories.length - previousTerritories,
        isEliminated
      };
    });
  }, [players, territories, history]);

  // Sort by military strength for leaderboard
  const rankedPlayers = useMemo(() => {
    return [...livePlayerStats].sort((a, b) => {
      if (a.isEliminated && !b.isEliminated) return 1;
      if (!a.isEliminated && b.isEliminated) return -1;
      if (b.territoriesCount !== a.territoriesCount) {
        return b.territoriesCount - a.territoriesCount;
      }
      return b.totalArmies - a.totalArmies;
    });
  }, [livePlayerStats]);

  // Prepare chart-ready data from history, ensuring current state is represented
  const chartData = useMemo(() => {
    if (!history || history.length === 0) {
      // Synthesize starting data point if history is empty
      const initialEntry: Record<string, string | number> = {
        roundLabel: 'Rodada 1 (Atual)',
        round: 1
      };
      livePlayerStats.forEach(p => {
        initialEntry[`armies_${p.id}`] = p.totalArmies;
        initialEntry[`territories_${p.id}`] = p.territoriesCount;
      });
      return [initialEntry];
    }

    // Map existing history entries
    const mapped = history.map(entry => {
      const row: Record<string, string | number> = {
        roundLabel: `Rodada ${entry.round}`,
        round: entry.round
      };

      players.forEach(p => {
        const playerStat = entry.stats[p.id];
        row[`armies_${p.id}`] = playerStat ? playerStat.armies : 0;
        row[`territories_${p.id}`] = playerStat ? playerStat.territories : 0;
      });

      return row;
    });

    // If currentRound hasn't been appended to history yet or is the active round,
    // update or append the current snapshot so charts reflect up-to-the-minute combat!
    const lastEntry = mapped[mapped.length - 1];
    if (lastEntry && Number(lastEntry.round) === currentRound) {
      livePlayerStats.forEach(p => {
        lastEntry[`armies_${p.id}`] = p.totalArmies;
        lastEntry[`territories_${p.id}`] = p.territoriesCount;
      });
    } else {
      const currentEntry: Record<string, string | number> = {
        roundLabel: `Rodada ${currentRound} (Atual)`,
        round: currentRound
      };
      livePlayerStats.forEach(p => {
        currentEntry[`armies_${p.id}`] = p.totalArmies;
        currentEntry[`territories_${p.id}`] = p.territoriesCount;
      });
      mapped.push(currentEntry);
    }

    return mapped;
  }, [history, currentRound, players, livePlayerStats]);

  // Comparative data for the "balance" bar chart view
  const comparativeData = useMemo(() => {
    return livePlayerStats.map(p => ({
      name: p.name.split(' ')[0],
      fullName: p.name,
      armies: p.totalArmies,
      territories: p.territoriesCount,
      color: PLAYER_HEX_COLORS[p.color]?.stroke || '#fff',
      eliminated: p.isEliminated
    }));
  }, [livePlayerStats]);

  // Tactical summary insights
  const leader = rankedPlayers[0];
  const totalWorldArmies = useMemo(() => {
    return livePlayerStats.reduce((sum, p) => sum + p.totalArmies, 0);
  }, [livePlayerStats]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92dvh] bg-stone-900 border-2 border-stone-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-stone-100">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 px-4 sm:px-6 py-3.5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-black text-base sm:text-xl text-white tracking-wide">
                  Relatório de Guerra
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-stone-800 text-amber-300 border border-stone-700">
                  Rodada {currentRound}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Análise histórica e evolução do poder militar de todos os generais
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1.5 rounded-xl hover:bg-stone-800 transition"
            title="Fechar Relatório"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="shrink-0 bg-stone-950/70 px-4 sm:px-6 py-2 border-b border-stone-800/80 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('armies')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'armies'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Tropas Totais</span>
            </button>

            <button
              onClick={() => setActiveTab('territories')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'territories'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Territórios Controlados</span>
            </button>

            <button
              onClick={() => setActiveTab('balance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'balance'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Balanço de Forças</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-stone-400 font-mono">
            <span>Mobilização Global:</span>
            <strong className="text-amber-400 font-bold">{totalWorldArmies} exércitos</strong>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Main Visual Chart Container */}
          <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h4 className="text-sm font-bold text-stone-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  {activeTab === 'armies' && 'Evolução do Número Total de Tropas'}
                  {activeTab === 'territories' && 'Evolução de Territórios Dominados (Total: 42)'}
                  {activeTab === 'balance' && 'Comparativo Atual de Forças Militares'}
                </h4>
                <p className="text-xs text-stone-400">
                  {activeTab === 'armies' && 'Total de exércitos sob comando de cada jogador em cada rodada.'}
                  {activeTab === 'territories' && 'Número de territórios ocupados ao longo da campanha mundial.'}
                  {activeTab === 'balance' && 'Contraste direto de tropas e posições territoriais dos comandantes.'}
                </p>
              </div>

              {/* Player Color Indicator Legend */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {players.map(p => {
                  const style = PLAYER_HEX_COLORS[p.color] || PLAYER_HEX_COLORS.blue;
                  return (
                    <div key={p.id} className="flex items-center gap-1.5 text-stone-300">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: style.stroke }} />
                      <span className="font-medium text-[11px] truncate max-w-[90px]">{p.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recharts Area */}
            <div className="h-64 sm:h-72 w-full pt-2">
              {activeTab === 'armies' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                    <XAxis
                      dataKey="roundLabel"
                      stroke="#78716c"
                      tick={{ fill: '#a8a29e', fontSize: 11 }}
                      tickLine={{ stroke: '#44403c' }}
                    />
                    <YAxis
                      stroke="#78716c"
                      tick={{ fill: '#a8a29e', fontSize: 11 }}
                      tickLine={{ stroke: '#44403c' }}
                      domain={[0, 'auto']}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-stone-900/95 border border-stone-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs">
                              <div className="font-bold text-amber-300 border-b border-stone-800 pb-1 mb-2 font-mono">
                                {label}
                              </div>
                              <div className="space-y-1">
                                {payload.map((entry, idx) => {
                                  const pId = String(entry.dataKey).replace('armies_', '');
                                  const pl = players.find(p => p.id === pId);
                                  return (
                                    <div key={idx} className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className="w-2 h-2 rounded-full"
                                          style={{ backgroundColor: entry.color }}
                                        />
                                        <span className="text-stone-300 font-medium">
                                          {pl?.name || entry.name}:
                                        </span>
                                      </div>
                                      <span className="font-bold font-mono text-white">
                                        {entry.value} tropas
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {players.map(p => {
                      const color = PLAYER_HEX_COLORS[p.color]?.stroke || '#3b82f6';
                      return (
                        <Line
                          key={p.id}
                          type="monotone"
                          dataKey={`armies_${p.id}`}
                          name={p.name}
                          stroke={color}
                          strokeWidth={2.5}
                          dot={{ r: 4, stroke: color, strokeWidth: 1.5, fill: '#1c1917' }}
                          activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                          isAnimationActive={true}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              )}

              {activeTab === 'territories' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                    <defs>
                      {players.map(p => {
                        const style = PLAYER_HEX_COLORS[p.color] || PLAYER_HEX_COLORS.blue;
                        return (
                          <linearGradient key={p.id} id={`grad_${p.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={style.stroke} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={style.stroke} stopOpacity={0.0} />
                          </linearGradient>
                        );
                      })}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                    <XAxis
                      dataKey="roundLabel"
                      stroke="#78716c"
                      tick={{ fill: '#a8a29e', fontSize: 11 }}
                      tickLine={{ stroke: '#44403c' }}
                    />
                    <YAxis
                      stroke="#78716c"
                      tick={{ fill: '#a8a29e', fontSize: 11 }}
                      tickLine={{ stroke: '#44403c' }}
                      domain={[0, 42]}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-stone-900/95 border border-stone-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs">
                              <div className="font-bold text-amber-300 border-b border-stone-800 pb-1 mb-2 font-mono">
                                {label}
                              </div>
                              <div className="space-y-1">
                                {payload.map((entry, idx) => {
                                  const pId = String(entry.dataKey).replace('territories_', '');
                                  const pl = players.find(p => p.id === pId);
                                  const val = Number(entry.value) || 0;
                                  const pct = ((val / 42) * 100).toFixed(0);
                                  return (
                                    <div key={idx} className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className="w-2 h-2 rounded-full"
                                          style={{ backgroundColor: entry.color }}
                                        />
                                        <span className="text-stone-300 font-medium">
                                          {pl?.name || entry.name}:
                                        </span>
                                      </div>
                                      <span className="font-bold font-mono text-white">
                                        {val} de 42 ({pct}%)
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {players.map(p => {
                      const color = PLAYER_HEX_COLORS[p.color]?.stroke || '#3b82f6';
                      return (
                        <Area
                          key={p.id}
                          type="monotone"
                          dataKey={`territories_${p.id}`}
                          name={p.name}
                          stroke={color}
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill={`url(#grad_${p.id})`}
                          dot={{ r: 4, stroke: color, strokeWidth: 1.5, fill: '#1c1917' }}
                          activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                          isAnimationActive={true}
                        />
                      );
                    })}
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {activeTab === 'balance' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparativeData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#78716c"
                      tick={{ fill: '#a8a29e', fontSize: 11 }}
                      tickLine={{ stroke: '#44403c' }}
                    />
                    <YAxis
                      stroke="#78716c"
                      tick={{ fill: '#a8a29e', fontSize: 11 }}
                      tickLine={{ stroke: '#44403c' }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0]?.payload;
                          return (
                            <div className="bg-stone-900/95 border border-stone-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs">
                              <div className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                <span>{item.fullName}</span>
                              </div>
                              <div className="space-y-1 font-mono">
                                <div className="text-amber-400">Tropas Totais: <strong>{item.armies}</strong></div>
                                <div className="text-emerald-400">Territórios: <strong>{item.territories} / 42</strong></div>
                                {item.eliminated && <div className="text-red-400 font-bold">Comando Eliminado</div>}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ fontSize: '11px', color: '#a8a29e' }}
                    />
                    <Bar
                      dataKey="armies"
                      name="Tropas Totais"
                      fill="#eab308"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                    />
                    <Bar
                      dataKey="territories"
                      name="Territórios Ocupados"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Commander Status Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Quadro de Forças e Classificação Tática</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {rankedPlayers.map((p, rankIdx) => {
                const colorConfig = PLAYER_HEX_COLORS[p.color] || PLAYER_HEX_COLORS.blue;
                const isLeader = rankIdx === 0 && !p.isEliminated;

                return (
                  <div
                    key={p.id}
                    className={`rounded-xl p-3.5 border transition ${
                      p.isEliminated
                        ? 'bg-stone-950/40 border-stone-850 opacity-60'
                        : isLeader
                        ? 'bg-gradient-to-b from-stone-900 via-amber-950/20 to-stone-900 border-amber-500/50 shadow-md'
                        : 'bg-stone-950/70 border-stone-800'
                    }`}
                  >
                    {/* Top Row: Name and Badges */}
                    <div className="flex items-center justify-between gap-1.5 mb-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: colorConfig.stroke }}
                        />
                        <span className="font-bold text-xs sm:text-sm text-white truncate">
                          {p.name}
                        </span>
                      </div>

                      {p.isEliminated ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-red-950/60 text-red-400 border border-red-800/40 shrink-0">
                          Eliminado
                        </span>
                      ) : isLeader ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5 shrink-0">
                          <Crown className="w-2.5 h-2.5 text-amber-400" />
                          <span>Líder</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-stone-500">
                          #{rankIdx + 1}
                        </span>
                      )}
                    </div>

                    {/* Stats Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-stone-800/70">
                      <div>
                        <div className="text-[10px] text-stone-400">Tropas Totais</div>
                        <div className="font-mono font-bold text-white text-sm flex items-center gap-1">
                          <span>{p.totalArmies}</span>
                          {p.armiesDelta !== 0 && (
                            <span
                              className={`text-[10px] font-mono ${
                                p.armiesDelta > 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {p.armiesDelta > 0 ? `+${p.armiesDelta}` : p.armiesDelta}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-stone-400">Territórios</div>
                        <div className="font-mono font-bold text-amber-300 text-sm flex items-center gap-1">
                          <span>{p.territoriesCount}</span>
                          <span className="text-[10px] text-stone-400">({p.percentageMap}%)</span>
                        </div>
                      </div>
                    </div>

                    {/* Ratio / Health Bar */}
                    <div className="mt-2.5 pt-2 border-t border-stone-850">
                      <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
                        <span>Domínio do Mapa</span>
                        <span className="font-mono text-stone-300">{p.territoriesCount}/42</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-stone-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(p.territoriesCount / 42) * 100}%`,
                            backgroundColor: colorConfig.stroke
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* High Command Strategic Assessment */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-stone-950/80 border border-stone-800 flex items-start gap-3 text-xs text-stone-300">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <Swords className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-amber-200 uppercase tracking-wider text-[11px]">
                Boletim de Inteligência do Estado-Maior
              </div>
              <p className="leading-relaxed text-stone-300">
                {leader && !leader.isEliminated ? (
                  <>
                    <strong className="text-white">{leader.name}</strong> lidera as operações bélicas com{' '}
                    <strong className="text-amber-300">{leader.territoriesCount} territórios</strong> ({leader.percentageMap}% do planeta) e um contingente de{' '}
                    <strong className="text-white">{leader.totalArmies} exércitos</strong>.
                  </>
                ) : (
                  'As forças globais continuam em disputa equilibrada pelos continentes.'
                )}
                {' '}
                Total de {totalWorldArmies} exércitos ativos em campanha. Mantenha suas fronteiras fortificadas e controle de continentes para maximizar reforços a cada rodada.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-stone-950 px-4 sm:px-6 py-3 border-t border-stone-800 flex items-center justify-between">
          <div className="text-[11px] text-stone-400 font-mono hidden sm:block">
            Dados atualizados em tempo real conforme as rodadas avançam
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 ml-auto"
          >
            Fechar Relatório
          </button>
        </div>
      </div>
    </div>
  );
};
