/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Territory, TerritoryState, Player, GamePhase, PlayerColor } from '../types/game';
import { TERRITORIES, TERRITORIES_MAP } from '../data/territories';
import { CONTINENTS } from '../data/continents';
import { Shield, Crosshair, MoveRight, ZoomIn, ZoomOut, RotateCcw, Sparkles, Hand, Maximize2, Minimize2 } from 'lucide-react';
import { WorldMapContours } from './WorldMapContours';
import { ConquestExplosion } from './ConquestExplosion';
import { AttackOverlay } from './AttackOverlay';

export interface TerritoryChangeIndicator {
  delta: number;
  type: 'gain' | 'loss' | 'conquer';
  id: number;
}

interface BoardProps {
  territories: Record<string, TerritoryState>;
  players: Player[];
  currentPlayer: Player;
  currentPhase: GamePhase;
  selectedTerritoryId: string | null;
  targetTerritoryId: string | null;
  onSelectTerritory: (territoryId: string) => void;
  validTargets: string[];
  recentChanges?: Record<string, TerritoryChangeIndicator>;
  commandHighlights?: string[];
  commandTargets?: string[];
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const PLAYER_COLORS_BG: Record<PlayerColor, { bg: string; text: string; border: string; glow: string; stroke: string }> = {
  red: { bg: 'bg-red-700', text: 'text-white', border: 'border-red-400', glow: 'shadow-red-600/50', stroke: '#dc2626' },
  blue: { bg: 'bg-blue-700', text: 'text-white', border: 'border-blue-400', glow: 'shadow-blue-600/50', stroke: '#2563eb' },
  yellow: { bg: 'bg-amber-400', text: 'text-stone-950', border: 'border-amber-200', glow: 'shadow-amber-400/50', stroke: '#eab308' },
  green: { bg: 'bg-emerald-700', text: 'text-white', border: 'border-emerald-300', glow: 'shadow-emerald-600/50', stroke: '#16a34a' },
  white: { bg: 'bg-stone-100', text: 'text-stone-900', border: 'border-stone-400', glow: 'shadow-white/50', stroke: '#f8fafc' },
  black: { bg: 'bg-stone-900', text: 'text-stone-100', border: 'border-stone-500', glow: 'shadow-stone-800/80', stroke: '#334155' }
};

export const Board: React.FC<BoardProps> = ({
  territories,
  players,
  currentPlayer,
  currentPhase,
  selectedTerritoryId,
  targetTerritoryId,
  onSelectTerritory,
  validTargets,
  recentChanges = {},
  commandHighlights = [],
  commandTargets = [],
  isFullscreen,
  onToggleFullscreen
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredTerritory, setHoveredTerritory] = useState<Territory | null>(null);

  // Dragging & Touch Pan Support
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragDistanceRef = useRef<number>(0);

  // Pinch to Zoom with 2 fingers
  const isPinchingRef = useRef<boolean>(false);
  const initialPinchDistanceRef = useRef<number>(0);
  const initialPinchZoomRef = useRef<number>(1);
  const initialPinchMidpointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPanOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const getTouchDistance = (t1: React.Touch, t2: React.Touch): number => {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  const getTouchMidpoint = (t1: React.Touch, t2: React.Touch): { x: number; y: number } => {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2
    };
  };

  const getPlayer = (playerId: string): Player | undefined => {
    return players.find(p => p.id === playerId);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on left click
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    dragDistanceRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    dragDistanceRef.current += Math.hypot(e.movementX, e.movementY);
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Start 2-finger pinch-to-zoom
      isPinchingRef.current = true;
      setIsDragging(false);
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      initialPinchDistanceRef.current = dist > 0 ? dist : 1;
      initialPinchZoomRef.current = zoomLevel;
      initialPinchMidpointRef.current = getTouchMidpoint(e.touches[0], e.touches[1]);
      initialPanOffsetRef.current = { ...panOffset };
      dragDistanceRef.current = 100; // prevent territory tap on finger release
    } else if (e.touches.length === 1 && !isPinchingRef.current) {
      // 1-finger pan
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
      });
      dragDistanceRef.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Handle 2-finger pinch zoom and midpoint pan
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      if (initialPinchDistanceRef.current > 5) {
        const scaleFactor = dist / initialPinchDistanceRef.current;
        const newZoom = Math.min(2.8, Math.max(0.6, Number((initialPinchZoomRef.current * scaleFactor).toFixed(2))));
        setZoomLevel(newZoom);

        // Smooth translation following midpoint of fingers
        const currentMidpoint = getTouchMidpoint(e.touches[0], e.touches[1]);
        const deltaX = currentMidpoint.x - initialPinchMidpointRef.current.x;
        const deltaY = currentMidpoint.y - initialPinchMidpointRef.current.y;
        setPanOffset({
          x: initialPanOffsetRef.current.x + deltaX,
          y: initialPanOffsetRef.current.y + deltaY
        });
        dragDistanceRef.current = 100;
      }
    } else if (e.touches.length === 1 && isDragging && !isPinchingRef.current) {
      dragDistanceRef.current += 1;
      setPanOffset({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      isPinchingRef.current = false;
      initialPinchDistanceRef.current = 0;
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
    }
  };

  // Wheel zoom with mouse or laptop trackpad
  const handleWheel = (e: React.WheelEvent) => {
    const zoomStep = e.deltaY < 0 ? 0.15 : -0.15;
    setZoomLevel(prev => Math.min(2.8, Math.max(0.6, Number((prev + zoomStep).toFixed(2)))));
  };

  // Render maritime/land connection lines
  const renderConnectionLines = () => {
    const renderedPairs = new Set<string>();
    const lines: React.ReactNode[] = [];

    TERRITORIES.forEach(source => {
      source.neighbors.forEach(targetId => {
        const target = TERRITORIES_MAP[targetId];
        if (!target) return;

        const pairKey = [source.id, target.id].sort().join('-');
        if (renderedPairs.has(pairKey)) return;
        renderedPairs.add(pairKey);

        const isTransoceanic =
          (source.id === 'alaska' && target.id === 'vladivostok') ||
          (source.id === 'vladivostok' && target.id === 'alaska') ||
          (source.id === 'brazil' && target.id === 'algeria') ||
          (source.id === 'algeria' && target.id === 'brazil') ||
          (source.id === 'greenland' && target.id === 'iceland') ||
          (source.id === 'iceland' && target.id === 'greenland') ||
          (source.id === 'france' && (target.id === 'algeria' || target.id === 'egypt')) ||
          (source.id === 'india' && target.id === 'sumatra') ||
          (source.id === 'sumatra' && target.id === 'india') ||
          (source.id === 'vietnam' && target.id === 'borneo') ||
          (source.id === 'borneo' && target.id === 'vietnam');

        // Special curve for Alaska <-> Vladivostok wrapped edges
        if ((source.id === 'alaska' && target.id === 'vladivostok') || (source.id === 'vladivostok' && target.id === 'alaska')) {
          lines.push(
            <g key={pairKey}>
              {/* Left segment from Alaska */}
              <path
                d="M 85 110 L 0 110"
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="4 3"
                className="opacity-70"
              />
              {/* Right segment into Vladivostok */}
              <path
                d="M 1000 125 L 890 125"
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="4 3"
                className="opacity-70"
              />
            </g>
          );
          return;
        }

        const isHighlighted =
          (selectedTerritoryId === source.id && targetTerritoryId === target.id) ||
          (selectedTerritoryId === target.id && targetTerritoryId === source.id) ||
          (selectedTerritoryId === source.id && validTargets.includes(target.id)) ||
          (selectedTerritoryId === target.id && validTargets.includes(source.id));

        lines.push(
          <line
            key={pairKey}
            x1={source.x}
            y1={source.y}
            x2={target.x}
            y2={target.y}
            stroke={isHighlighted ? '#f59e0b' : isTransoceanic ? '#0284c7' : '#475569'}
            strokeWidth={isHighlighted ? 3 : isTransoceanic ? 2 : 1.5}
            strokeDasharray={isTransoceanic ? '4 3' : undefined}
            strokeOpacity={isHighlighted ? 0.9 : 0.5}
            className="transition-colors duration-200"
          />
        );
      });
    });

    return lines;
  };

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(2.8, Math.max(0.6, Math.round((prev + delta) * 100) / 100)));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div
      className="relative w-full h-full flex-1 min-h-0 overflow-hidden rounded-xl border border-stone-800/80 bg-stone-900 shadow-2xl select-none flex flex-col justify-center items-center cursor-grab active:cursor-grabbing touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Antique War Map Texture & Deep Ocean Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#091e36] via-[#0b2440] to-[#071629] pointer-events-none" />

      {/* Grid Coordinates Overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, #38bdf8 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px, 100px 100px, 100px 100px'
        }}
      />

      {/* Compass Rose Decoration */}
      <div className="absolute top-3 right-3 pointer-events-none opacity-30 hidden sm:flex flex-col items-center">
        <div className="w-14 h-14 rounded-full border border-amber-400/40 flex items-center justify-center relative">
          <span className="text-[9px] font-bold text-amber-300 absolute -top-2.5">N</span>
          <span className="text-[9px] font-bold text-amber-300 absolute -bottom-2.5">S</span>
          <span className="text-[9px] font-bold text-amber-300 absolute -left-2.5">O</span>
          <span className="text-[9px] font-bold text-amber-300 absolute -right-2.5">L</span>
          <div className="w-6 h-6 rotate-45 border-t-2 border-r-2 border-amber-400/60" />
        </div>
        <span className="text-[8px] uppercase tracking-widest text-amber-300/60 mt-0.5 font-mono">
          Warall Chart
        </span>
      </div>

      {/* Continental Legend Bar */}
      <div className="absolute top-2.5 left-2.5 z-10 hidden md:flex items-center gap-2 bg-stone-950/85 backdrop-blur-md px-3 py-1 rounded-xl border border-stone-800 text-[11px] shadow-md">
        <span className="text-stone-400 font-semibold uppercase tracking-wider text-[10px]">
          Bônus:
        </span>
        {Object.values(CONTINENTS).map(c => (
          <div key={c.id} className="flex items-center gap-1 text-stone-300">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: c.color }}
            />
            <span className="font-medium">{c.name.split(' ')[0]}</span>
            <span className="text-amber-400 font-bold font-mono">+{c.bonus}</span>
          </div>
        ))}
      </div>

      {/* Zoom / Pan Controls (Bottom Right) */}
      <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1 bg-stone-950/90 backdrop-blur border border-stone-800 p-1 rounded-xl shadow-lg">
        <button
          onClick={e => {
            e.stopPropagation();
            handleZoom(0.2);
          }}
          className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white transition"
          title="Aumentar Zoom"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-[10px] font-mono text-stone-400 px-1 select-none">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          onClick={e => {
            e.stopPropagation();
            handleZoom(-0.2);
          }}
          className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white transition"
          title="Diminuir Zoom"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={e => {
            e.stopPropagation();
            handleResetZoom();
          }}
          className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white transition"
          title="Centralizar e Redefinir Zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {onToggleFullscreen && (
          <button
            onClick={e => {
              e.stopPropagation();
              onToggleFullscreen();
            }}
            className={`p-1.5 rounded-lg transition border ${
              isFullscreen
                ? 'bg-amber-600/30 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border-transparent'
            }`}
            title={isFullscreen ? 'Sair da Tela Cheia' : 'Modo Tela Cheia (F11)'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-amber-300" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        )}

        <div
          className="hidden sm:flex items-center gap-1 pl-1.5 pr-0.5 border-l border-stone-800 text-[10px] text-stone-400 select-none"
          title="Toque com 2 dedos na tela para ampliar ou reduzir o mapa"
        >
          <Hand className="w-3 h-3 text-amber-400/80" />
          <span className="text-[9px] font-mono">2 Dedos</span>
        </div>
      </div>

      {/* Main SVG Map Canvas */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-75 pointer-events-auto"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: 'center center'
        }}
      >
        <svg
          viewBox="0 0 1000 620"
          className="w-full h-full max-w-[1300px] max-h-[85vh] object-contain overflow-visible"
        >
          <defs>
            <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-frontier" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="conquest-flash-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="35%" stopColor="#fef08a" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Continental Atmospheric Clusters */}
          <ellipse cx="200" cy="180" rx="140" ry="110" fill="#ca8a04" opacity="0.08" />
          <ellipse cx="260" cy="460" rx="75" ry="115" fill="#10b981" opacity="0.08" />
          <ellipse cx="480" cy="180" rx="100" ry="75" fill="#3b82f6" opacity="0.08" />
          <ellipse cx="510" cy="420" rx="90" ry="115" fill="#f43f5e" opacity="0.08" />
          <ellipse cx="760" cy="210" rx="180" ry="140" fill="#f97316" opacity="0.08" />
          <ellipse cx="830" cy="480" rx="95" ry="85" fill="#a855f7" opacity="0.08" />

          {/* Real World Cartographic Map Landmasses & Tactical Grid */}
          <WorldMapContours />

          {/* Adjacency Lines */}
          <g className="connections">{renderConnectionLines()}</g>

          {/* Interactive Territory Nodes */}
          {TERRITORIES.map(territory => {
            const state = territories[territory.id];
            if (!state) return null;

            const owner = getPlayer(state.playerId);
            const isSelected = selectedTerritoryId === territory.id;
            const isTarget = targetTerritoryId === territory.id;
            const isValidTarget = validTargets.includes(territory.id);
            const continent = CONTINENTS[territory.continentId];

            // Change indicator for army updates (loss/gain/conquer)
            const change = recentChanges[territory.id];

            // Frontline detection: territories bordering opponents
            const isCurrentPlayerTerritory = state.playerId === currentPlayer.id;
            const bordersOpponent = territory.neighbors.some(neighborId => {
              const nState = territories[neighborId];
              return nState && nState.playerId !== currentPlayer.id;
            });
            const isAttackFrontier = currentPhase === 'attack' && isCurrentPlayerTerritory && bordersOpponent;
            const canLaunchAttackFromHere = isAttackFrontier && state.armies > 1;

            // Career Mode High Command Tactical Order & Target Beacons
            const isCommandHighlight = commandHighlights.includes(territory.id);
            const isCommandTarget = commandTargets.includes(territory.id);

            return (
              <g
                key={territory.id}
                transform={`translate(${territory.x}, ${territory.y})`}
                className="cursor-pointer group"
                onClick={e => {
                  e.stopPropagation();
                  if (dragDistanceRef.current < 6) {
                    onSelectTerritory(territory.id);
                  }
                }}
                onMouseEnter={() => {
                  if (hoveredTerritory?.id !== territory.id) setHoveredTerritory(territory);
                }}
                onMouseLeave={() => {
                  setHoveredTerritory(prev => prev?.id === territory.id ? null : prev);
                }}
              >
                {/* Conquer Shockwave Ripple */}
                {change && change.type === 'conquer' && (
                  <circle
                    key={`ripple_${change.id}`}
                    cx="0"
                    cy="0"
                    r="16"
                    fill="none"
                    stroke={owner ? PLAYER_COLORS_BG[owner.color].stroke : '#eab308'}
                    className="animate-conquer-ripple pointer-events-none"
                  />
                )}

                {/* High Command Tactical Order Beacon (Pulsing Emerald Radar) */}
                {isCommandHighlight && !isSelected && (
                  <g className="pointer-events-none">
                    <circle
                      r="28"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      className="animate-ping opacity-60"
                      style={{ animationDuration: '1.8s' }}
                    />
                    <circle
                      r="24"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                      className="animate-spin opacity-90"
                      style={{ animationDuration: '4s' }}
                    />
                    <g transform="translate(-16, -26)">
                      <rect x="0" y="0" width="32" height="11" rx="3" fill="#064e3b" stroke="#34d399" strokeWidth="0.8" />
                      <text x="16" y="8" textAnchor="middle" fill="#ecfdf5" fontSize="7" fontWeight="bold" fontFamily="monospace">
                        ★ ORDEM
                      </text>
                    </g>
                  </g>
                )}

                {/* High Command Target Objective Beacon (Pulsing Crimson Radar) */}
                {isCommandTarget && !isTarget && (
                  <g className="pointer-events-none">
                    <circle
                      r="27"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      className="animate-ping opacity-55"
                      style={{ animationDuration: '2s' }}
                    />
                    <circle
                      r="23"
                      fill="none"
                      stroke="#f87171"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                      className="animate-spin opacity-85"
                      style={{ animationDuration: '5s' }}
                    />
                    <g transform="translate(-15, -26)">
                      <rect x="0" y="0" width="30" height="11" rx="3" fill="#881337" stroke="#f43f5e" strokeWidth="0.8" />
                      <text x="15" y="8" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold" fontFamily="monospace">
                        🎯 ALVO
                      </text>
                    </g>
                  </g>
                )}

                {/* Selection Rings */}
                {isSelected && (
                  <circle
                    r="24"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="3.5"
                    className="animate-ping opacity-60"
                  />
                )}
                {isSelected && (
                  <circle
                    r="22"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    filter="url(#glow-gold)"
                  />
                )}

                {/* Valid Target Ring */}
                {isValidTarget && (
                  <circle
                    r="22"
                    fill="none"
                    stroke={currentPhase === 'attack' ? '#ef4444' : '#38bdf8'}
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    className="animate-spin opacity-80"
                    style={{ animationDuration: '6s' }}
                  />
                )}

                {/* Reinforcement Action Beacon for human player's territories */}
                {currentPhase === 'reinforce' && !currentPlayer.isAi && state.playerId === currentPlayer.id && (
                  <circle
                    r="21"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    className="animate-spin opacity-85 pointer-events-none"
                    style={{ animationDuration: '5s' }}
                  />
                )}

                {/* Target Chosen Ring */}
                {isTarget && (
                  <circle
                    r="23"
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="3"
                    filter="url(#glow-red)"
                  />
                )}

                {/* Frontline Attack Highlight (Glow & Pulsing Border) */}
                {isAttackFrontier && !isSelected && (
                  <g className="pointer-events-none">
                    {canLaunchAttackFromHere ? (
                      <>
                        {/* Outer Pulsing Glow Aura */}
                        <circle
                          r="22"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          filter="url(#glow-frontier)"
                          className="animate-frontier-pulse"
                        />
                        {/* Secondary Pulsing Radar Sweep */}
                        <circle
                          r="25"
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="1.5"
                          strokeDasharray="4 2"
                          className="animate-pulse opacity-75"
                          style={{ animationDuration: '1.5s' }}
                        />
                      </>
                    ) : (
                      /* Defensive border (1 army, borders enemy but cannot attack) */
                      <circle
                        r="21"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        className="animate-pulse opacity-50"
                        style={{ animationDuration: '2.5s' }}
                      />
                    )}
                  </g>
                )}

                {/* Outer Base Plaque with army count pop animation */}
                <g className={change ? 'animate-count-pop' : ''} key={change ? change.id : 'static'}>
                  <circle
                    r="16"
                    className="transition-colors duration-300"
                    fill={
                      owner?.color === 'red'
                        ? '#b91c1c'
                        : owner?.color === 'blue'
                        ? '#1d4ed8'
                        : owner?.color === 'yellow'
                        ? '#f59e0b'
                        : owner?.color === 'green'
                        ? '#047857'
                        : owner?.color === 'white'
                        ? '#f1f5f9'
                        : '#1c1917'
                    }
                    stroke={
                      isSelected
                        ? '#f59e0b'
                        : isTarget
                        ? '#ef4444'
                        : canLaunchAttackFromHere
                        ? '#f59e0b'
                        : currentPhase === 'reinforce' && !currentPlayer.isAi && state.playerId === currentPlayer.id
                        ? '#fbbf24'
                        : '#0f172a'
                    }
                    strokeWidth={
                      isSelected ||
                      isTarget ||
                      canLaunchAttackFromHere ||
                      (currentPhase === 'reinforce' && !currentPlayer.isAi && state.playerId === currentPlayer.id)
                        ? '3'
                        : '2.5'
                    }
                  />

                  {/* Inner Embossed Ring */}
                  <circle
                    r="12"
                    fill="none"
                    stroke={owner?.color === 'white' ? '#94a3b8' : 'rgba(255,255,255,0.25)'}
                    strokeWidth="1"
                  />

                  {/* Army Count Number */}
                  <text
                    textAnchor="middle"
                    dy="5"
                    className="font-black text-sm select-none pointer-events-none"
                    fill={owner?.color === 'white' || owner?.color === 'yellow' ? '#0f172a' : '#ffffff'}
                    style={{ fontFamily: 'Cinzel, sans-serif' }}
                  >
                    {state.armies}
                  </text>

                  {/* Frontline Attack-Ready Crossed Swords Badge */}
                  {canLaunchAttackFromHere && !isSelected && (
                    <g transform="translate(10, -11)" className="pointer-events-none">
                      <circle r="5.5" fill="#f59e0b" stroke="#78350f" strokeWidth="1" className="animate-pulse" />
                      {/* Crossed Swords glyph */}
                      <path
                        d="M-2.5,-2.5 L2.5,2.5 M2.5,-2.5 L-2.5,2.5"
                        stroke="#78350f"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    </g>
                  )}

                  {/* Big Army Star / Badge if >= 10 */}
                  {state.armies >= 10 && (
                    <g transform="translate(9, -12)">
                      <circle r="6" fill="#eab308" stroke="#78350f" strokeWidth="1" />
                      <text
                        textAnchor="middle"
                        dy="3"
                        fontSize="8"
                        fontWeight="bold"
                        fill="#000"
                      >
                        ★
                      </text>
                    </g>
                  )}

                  {/* Plus Badge during Reinforce Phase */}
                  {currentPhase === 'reinforce' && !currentPlayer.isAi && state.playerId === currentPlayer.id && (
                    <g transform="translate(10, -11)">
                      <circle r="5" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
                      <text
                        textAnchor="middle"
                        dy="3.5"
                        fontSize="8"
                        fontWeight="black"
                        fill="#000"
                      >
                        +
                      </text>
                    </g>
                  )}
                </g>

                {/* Floating Feedback Badge (+N or -N) */}
                {change && (
                  <g
                    key={`badge_${change.id}`}
                    transform="translate(0, -18)"
                    className="animate-float-badge pointer-events-none select-none z-30"
                  >
                    <rect
                      x="-18"
                      y="-10"
                      width="36"
                      height="18"
                      rx="9"
                      fill={
                        change.type === 'loss'
                          ? '#dc2626'
                          : change.type === 'conquer'
                          ? '#d97706'
                          : '#059669'
                      }
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="shadow-lg"
                    />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      className="text-[10px] font-black fill-white tracking-wider"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {change.type === 'loss'
                        ? `-${Math.abs(change.delta)}`
                        : change.type === 'conquer'
                        ? '★ CONQ'
                        : `+${change.delta}`}
                    </text>
                  </g>
                )}

                {/* Territory Name Label Pill */}
                <g transform="translate(0, 24)">
                  <rect
                    x="-42"
                    y="-8"
                    width="84"
                    height="16"
                    rx="4"
                    fill="rgba(15, 23, 42, 0.85)"
                    stroke={continent.color}
                    strokeWidth="1"
                    className="shadow-sm"
                  />
                  <text
                    textAnchor="middle"
                    dy="3.5"
                    className="text-[9.5px] font-bold fill-stone-100 select-none tracking-tight pointer-events-none"
                  >
                    {territory.name}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Territory Conquest Explosions & Confetti Layer (Framer Motion) */}
          <g className="conquest-explosions-layer pointer-events-none">
            {TERRITORIES.map(territory => {
              const change = recentChanges[territory.id];
              if (!change || change.type !== 'conquer') return null;
              const state = territories[territory.id];
              const owner = state ? getPlayer(state.playerId) : undefined;
              const color = owner?.color || 'yellow';

              return (
                <g
                  key={`conquest_explosion_${territory.id}_${change.id}`}
                  transform={`translate(${territory.x}, ${territory.y})`}
                >
                  <ConquestExplosion playerColor={color} id={change.id} />
                </g>
              );
            })}
          </g>

          {/* Attack Trajectory Overlay */}
          {currentPhase === 'attack' && selectedTerritoryId && targetTerritoryId && TERRITORIES_MAP[selectedTerritoryId] && TERRITORIES_MAP[targetTerritoryId] && (
            <AttackOverlay
              startX={TERRITORIES_MAP[selectedTerritoryId].x}
              startY={TERRITORIES_MAP[selectedTerritoryId].y}
              endX={TERRITORIES_MAP[targetTerritoryId].x}
              endY={TERRITORIES_MAP[targetTerritoryId].y}
            />
          )}
        </svg>
      </div>

      {/* Hover Info Tooltip Bar */}
      {hoveredTerritory && (
        <div className="absolute bottom-2.5 left-2.5 z-20 bg-stone-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-800 shadow-xl flex items-center gap-2.5 text-xs max-w-[280px] sm:max-w-none">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: CONTINENTS[hoveredTerritory.continentId].color }}
          />
          <div className="min-w-0">
            <div className="font-bold text-stone-100 flex items-center gap-1.5 truncate">
              <span>{hoveredTerritory.name}</span>
              <span className="text-[10px] text-stone-400 font-normal">
                ({CONTINENTS[hoveredTerritory.continentId].name})
              </span>
            </div>
            <div className="text-[10px] text-stone-400 flex items-center gap-1.5 truncate">
              <span>
                Comandante:{' '}
                <strong className="text-amber-300 font-semibold">
                  {getPlayer(territories[hoveredTerritory.id]?.playerId)?.name || 'Neutro'}
                </strong>
              </span>
              <span>·</span>
              <span>
                Tropas: <strong>{territories[hoveredTerritory.id]?.armies}</strong>
              </span>
              {commandHighlights.includes(hoveredTerritory.id) && (
                <span className="font-bold ml-1 text-emerald-400">
                  · ★ Ordem do Comando
                </span>
              )}
              {commandTargets.includes(hoveredTerritory.id) && (
                <span className="font-bold ml-1 text-rose-400">
                  · 🎯 Alvo Recomendado
                </span>
              )}
              {currentPhase === 'attack' &&
                territories[hoveredTerritory.id]?.playerId === currentPlayer.id &&
                hoveredTerritory.neighbors.some(
                  nId => territories[nId] && territories[nId].playerId !== currentPlayer.id
                ) && (
                  <span
                    className={`font-bold ml-1 ${
                      (territories[hoveredTerritory.id]?.armies || 0) > 1
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    · {(territories[hoveredTerritory.id]?.armies || 0) > 1 ? '⚔ Pronto para atacar' : '🛡 Fronteira (1 tropa)'}
                  </span>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
