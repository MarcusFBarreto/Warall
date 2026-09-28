import React from 'react';
import { motion } from 'framer-motion';
import { Dices } from 'lucide-react';

interface DiceProps {
  value: number;
  type: 'attack' | 'defense';
  isRolling: boolean;
  lost?: boolean; // Se foi perdido na batalha
}

export function Dice({ value, type, isRolling, lost }: DiceProps) {
  const isAttack = type === 'attack';
  
  // Custom pips rendering based on dice value
  const renderPips = (val: number) => {
    const dotColor = isAttack ? 'bg-white' : 'bg-stone-900';
    switch (val) {
      case 1:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <span className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${dotColor} shadow-inner`} />
          </div>
        );
      case 2:
        return (
          <div className="w-full h-full p-1.5 sm:p-2 flex justify-between">
            <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${dotColor} self-start`} />
            <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${dotColor} self-end`} />
          </div>
        );
      case 3:
        return (
          <div className="w-full h-full p-1.5 sm:p-2 flex justify-between">
            <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${dotColor} self-start`} />
            <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${dotColor} self-center`} />
            <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${dotColor} self-end`} />
          </div>
        );
      case 4:
        return (
          <div className="w-full h-full p-1.5 sm:p-2 grid grid-cols-2 gap-1.5 place-items-center">
            <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${dotColor}`} />
            <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${dotColor}`} />
            <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${dotColor}`} />
            <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${dotColor}`} />
          </div>
        );
      case 5:
        return (
          <div className="w-full h-full p-1.5 sm:p-2 grid grid-cols-3 place-items-center">
            <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${dotColor} col-start-1 row-start-1`} />
            <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${dotColor} col-start-3 row-start-1`} />
            <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${dotColor} col-start-2 row-start-2`} />
            <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${dotColor} col-start-1 row-start-3`} />
            <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${dotColor} col-start-3 row-start-3`} />
          </div>
        );
      case 6:
        return (
          <div className="w-full h-full p-1.5 sm:p-2 grid grid-cols-2 gap-1 place-items-center">
            <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${dotColor}`} />
            <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${dotColor}`} />
            <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${dotColor}`} />
            <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${dotColor}`} />
            <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${dotColor}`} />
            <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${dotColor}`} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className={`relative flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl shadow-xl select-none ${
        isAttack
          ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-800 border-2 border-red-300/80 text-white shadow-red-950/60'
          : 'bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 border-2 border-amber-100 text-stone-900 shadow-amber-950/60'
      } ${lost ? 'opacity-40 grayscale' : ''}`}
      style={{
        boxShadow: lost
          ? 'none'
          : isAttack
          ? 'inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.5), 0 6px 12px rgba(0,0,0,0.5)'
          : 'inset 0 2px 4px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.3), 0 6px 12px rgba(0,0,0,0.5)'
      }}
      // O segredo da física: Keyframes complexos ativados pela prop isRolling
      animate={isRolling ? {
        y: [0, -120, -40, -80, 0], // Quica na bandeja (mais alto na tela)
        rotateX: [0, 180, 360, 540, 720], // Gira no eixo horizontal
        rotateY: [0, -180, -360, -180, 0], // Gira no eixo vertical
        scale: [1, 1.3, 1.1, 1.2, 1] // Dá uma inflada no ar
      } : {
        y: lost ? 4 : 0, 
        rotateX: 0, 
        rotateY: 0, 
        scale: lost ? 0.9 : 1
      }}
      transition={{
        duration: 0.6,
        ease: "easeOut",
        times: [0, 0.3, 0.6, 0.8, 1] // Sincroniza os quiques
      }}
    >
      {/* Se estiver rolando, mostra um ícone genérico. Se parar, mostra o número/face real */}
      <div className="w-full h-full flex items-center justify-center">
        {isRolling ? <Dices className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse text-white/50" /> : renderPips(value)}
      </div>

      {lost && !isRolling && (
        <div className="absolute inset-0 flex items-center justify-center text-red-500 font-bold bg-black/30 rounded-xl sm:rounded-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
      )}

      {/* Numeric Sub-Indicator */}
      {!isRolling && (
        <span
          className={`absolute bottom-0.5 right-1 sm:right-1.5 text-[8px] sm:text-[9px] font-black font-mono ${
            isAttack ? 'text-red-200/80' : 'text-stone-800/80'
          }`}
        >
          {value}
        </span>
      )}
    </motion.div>
  );
}
