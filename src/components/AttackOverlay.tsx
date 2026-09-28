import React from 'react';
import { motion } from 'framer-motion';

interface AttackOverlayProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  onAnimationComplete?: () => void;
}

export function AttackOverlay({ startX, startY, endX, endY, onAnimationComplete }: AttackOverlayProps) {
  // Calcula um ponto de controle para criar um arco parabólico (curva de Bézier)
  const controlX = (startX + endX) / 2;
  const controlY = Math.min(startY, endY) - 150; // Curva sempre para cima

  const pathDefinition = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible">
      <motion.path
        d={pathDefinition}
        fill="transparent"
        stroke="rgba(239, 68, 68, 0.8)" // Vermelho alerta
        strokeWidth="4"
        strokeDasharray="10 10" // Linha tracejada tática
        strokeLinecap="round"
        // Anima o pathLength de 0 a 1 (desenha a linha) e a opacidade (esmaece no final)
        initial={{ pathLength: 0, opacity: 1 }}
        animate={{ pathLength: 1, opacity: 0 }}
        transition={{
          pathLength: { duration: 0.4, ease: "easeOut" },
          opacity: { duration: 0.2, delay: 0.3 }
        }}
        onAnimationComplete={onAnimationComplete}
      />
      
      {/* Pinga um radar no destino para focar a atenção */}
      <motion.circle
        cx={endX}
        cy={endY}
        r="20"
        fill="none"
        stroke="rgba(239, 68, 68, 0.8)"
        strokeWidth="2"
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
    </svg>
  );
}
