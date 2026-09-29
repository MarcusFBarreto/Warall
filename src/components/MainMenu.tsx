import React, { useState, useEffect } from 'react';
import { LOCAL_STORAGE_KEY } from '../utils/storage';
import { Swords, Play, RotateCcw } from 'lucide-react';

interface MainMenuProps {
  onNewGame: () => void;
  onResumeGame: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onNewGame, onResumeGame }) => {
  const [canResume, setCanResume] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setCanResume(true);
      }
    } catch (e) {}
  }, []);

  return (
    <div className="w-full h-[100dvh] flex flex-col items-center justify-center bg-stone-950 text-stone-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/50 via-stone-950 to-stone-950"></div>
        <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cartographer.png')]"></div>
      </div>

      <div className="z-10 flex flex-col items-center p-8 bg-stone-900/80 rounded-xl border border-stone-800 shadow-2xl backdrop-blur-sm max-w-md w-full animate-fade-in-up">
        <div className="flex items-center gap-3 mb-2">
          <Swords className="w-10 h-10 text-amber-600" />
          <h1 className="text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-amber-500 to-amber-700 font-serif">
            WARALL
          </h1>
        </div>
        <p className="text-stone-400 text-sm tracking-widest mb-10 uppercase text-center font-semibold">
          Estratégia Geopolítica Global
        </p>

        <div className="flex flex-col gap-4 w-full">
          {canResume && (
            <button
              onClick={onResumeGame}
              className="group relative w-full overflow-hidden rounded bg-amber-700 px-6 py-4 text-amber-50 shadow-lg hover:bg-amber-600 transition-all duration-300 font-bold tracking-wider flex items-center justify-center gap-3 uppercase"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-shimmer"></div>
              <Play className="w-5 h-5 group-hover:scale-125 transition-transform" />
              Continuar Campanha
            </button>
          )}

          <button
            onClick={onNewGame}
            className="w-full rounded bg-stone-800 border border-stone-700 px-6 py-4 text-stone-300 hover:bg-stone-700 hover:text-white transition-colors duration-200 font-bold tracking-wider flex items-center justify-center gap-3 uppercase shadow-inner"
          >
            <RotateCcw className="w-5 h-5" />
            Novo Jogo
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 text-stone-600 text-xs font-mono">
        v1.0.0 - Antigravity AI Engine
      </div>
    </div>
  );
};
