/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerColor } from '../types/game';

interface Particle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  type: 'circle' | 'rect' | 'star' | 'strip';
  rotation: number;
  delay: number;
  duration: number;
}

interface ConquestExplosionProps {
  playerColor: PlayerColor;
  id: string | number;
}

const PLAYER_PARTICLE_PALETTES: Record<PlayerColor, string[]> = {
  red: ['#ef4444', '#dc2626', '#f87171', '#b91c1c', '#f59e0b', '#ffffff'],
  blue: ['#3b82f6', '#2563eb', '#60a5fa', '#1d4ed8', '#38bdf8', '#ffffff'],
  yellow: ['#eab308', '#f59e0b', '#fde047', '#d97706', '#fbbf24', '#ffffff'],
  green: ['#10b981', '#059669', '#34d399', '#047857', '#6ee7b7', '#ffffff'],
  white: ['#f8fafc', '#e2e8f0', '#cbd5e1', '#38bdf8', '#fbbf24', '#ffffff'],
  black: ['#475569', '#334155', '#1e293b', '#94a3b8', '#f59e0b', '#ffffff']
};

export const ConquestExplosion: React.FC<ConquestExplosionProps> = ({ playerColor, id }) => {
  const palette = PLAYER_PARTICLE_PALETTES[playerColor] || PLAYER_PARTICLE_PALETTES.blue;
  const primaryColor = palette[0];
  const secondaryColor = palette[2] || palette[1];

  // Procedural deterministic particle swarm based on id
  const particles = useMemo<Particle[]>(() => {
    const list: Particle[] = [];
    const count = 32;

    for (let i = 0; i < count; i++) {
      // Uniform spread around circle with jitter
      const baseAngle = (i / count) * 360;
      const angleJitter = (Math.sin(i * 99) * 15);
      const angle = (baseAngle + angleJitter) * (Math.PI / 180);

      // Random distance burst
      const distance = 35 + ((Math.abs(Math.sin(i * 123))) * 55);

      // Particle type mix
      const typeMod = i % 4;
      const type: Particle['type'] =
        typeMod === 0 ? 'rect' : typeMod === 1 ? 'star' : typeMod === 2 ? 'strip' : 'circle';

      const color = palette[i % palette.length];
      const size = type === 'strip' ? 3 + (i % 3) : 3 + (i % 4);
      const rotation = (Math.cos(i * 47) * 720);
      const delay = (i % 6) * 0.012;
      const duration = 0.75 + (Math.abs(Math.sin(i * 31)) * 0.45);

      list.push({
        id: i,
        angle,
        distance,
        size,
        color,
        type,
        rotation,
        delay,
        duration
      });
    }

    return list;
  }, [palette]);

  return (
    <g className="pointer-events-none select-none z-50">
      {/* 1. Primary Shockwave Expanding Wave */}
      <motion.circle
        key={`shockwave_1_${id}`}
        cx="0"
        cy="0"
        initial={{ r: 10, strokeWidth: 4, opacity: 0.95 }}
        animate={{
          r: [10, 68],
          strokeWidth: [4, 0.5],
          opacity: [0.95, 0]
        }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
        fill="none"
        stroke={primaryColor}
      />

      {/* 2. Secondary Fast Ripple */}
      <motion.circle
        key={`shockwave_2_${id}`}
        cx="0"
        cy="0"
        initial={{ r: 6, strokeWidth: 3, opacity: 0.8 }}
        animate={{
          r: [6, 48],
          strokeWidth: [3, 0.2],
          opacity: [0.8, 0]
        }}
        transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
        fill="none"
        stroke={secondaryColor}
      />

      {/* 3. Central Flash Star Flare */}
      <motion.g
        key={`flare_${id}`}
        initial={{ scale: 0, opacity: 1, rotate: 0 }}
        animate={{
          scale: [0, 1.4, 0],
          opacity: [1, 0.9, 0],
          rotate: [0, 45]
        }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <circle cx="0" cy="0" r="18" fill="url(#conquest-flash-gradient)" />
        {/* 4-point golden/player spark */}
        <path
          d="M 0,-24 L 3,-6 L 24,0 L 3,6 L 0,24 L -3,6 L -24,0 L -3,-6 Z"
          fill={palette[palette.length - 1] === '#ffffff' ? '#ffffff' : primaryColor}
          opacity="0.9"
        />
      </motion.g>

      {/* 4. Confetti and Sparkle Swarm */}
      {particles.map(p => {
        const destX = Math.cos(p.angle) * p.distance;
        const destY = Math.sin(p.angle) * p.distance;

        return (
          <motion.g
            key={`p_${id}_${p.id}`}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
            animate={{
              x: destX,
              y: destY,
              scale: [0, 1.3, 0.2],
              opacity: [1, 1, 0],
              rotate: [0, p.rotation]
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: [0.15, 0.85, 0.35, 1]
            }}
          >
            {p.type === 'circle' && (
              <circle cx="0" cy="0" r={p.size} fill={p.color} />
            )}

            {p.type === 'rect' && (
              <rect
                x={-p.size}
                y={-p.size}
                width={p.size * 2}
                height={p.size * 1.5}
                rx="1"
                fill={p.color}
              />
            )}

            {p.type === 'strip' && (
              <rect
                x={-p.size * 1.5}
                y={-p.size * 0.5}
                width={p.size * 3}
                height={p.size * 0.9}
                rx="0.5"
                fill={p.color}
              />
            )}

            {p.type === 'star' && (
              <path
                d={`M 0,${-p.size * 1.4} L ${p.size * 0.4},${-p.size * 0.4} L ${p.size * 1.4},0 L ${p.size * 0.4},${p.size * 0.4} L 0,${p.size * 1.4} L ${-p.size * 0.4},${p.size * 0.4} L ${-p.size * 1.4},0 L ${-p.size * 0.4},${-p.size * 0.4} Z`}
                fill={p.color}
              />
            )}
          </motion.g>
        );
      })}

      {/* 5. Conquered Victory Banner Badge */}
      <motion.g
        key={`banner_${id}`}
        initial={{ y: -8, scale: 0.3, opacity: 0 }}
        animate={{
          y: [-8, -32, -38],
          scale: [0.3, 1.2, 1],
          opacity: [0, 1, 1, 0]
        }}
        transition={{
          duration: 1.25,
          times: [0, 0.25, 0.75, 1],
          ease: 'easeOut'
        }}
      >
        <rect
          x="-34"
          y="-9"
          width="68"
          height="18"
          rx="9"
          fill={primaryColor}
          stroke="#ffffff"
          strokeWidth="1.5"
          filter="drop-shadow(0px 2px 6px rgba(0,0,0,0.6))"
        />
        <text
          x="0"
          y="3.5"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="8.5"
          fontWeight="900"
          fontFamily="monospace"
          letterSpacing="0.5px"
        >
          ★ DOMINADO
        </text>
      </motion.g>
    </g>
  );
};
