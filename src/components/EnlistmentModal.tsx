import React, { useState } from 'react';
import { User, ChevronRight, Shield } from 'lucide-react';
import { PlayerProfile } from '../types/player';
import { CareerProfile } from '../types/career';

interface Props {
  onEnlist: (profile: PlayerProfile) => void;
}

export function EnlistmentModal({ onEnlist }: Props) {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');

  const handleEnlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    // Cria a carreira zerada (Cadete)
    const startingCareer: CareerProfile = {
      xp: 0,
      rankId: 'cadet',
      careerModeActive: true,
      battlesWon: 0,
      territoriesConquered: 0,
      continentsConquered: 0,
      generalsDefeated: 0,
      campaignsWon: 0
    };

    // Cria o perfil do jogador
    const newPlayer: PlayerProfile = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      nickname: nickname.trim(),
      email: email.trim(),
      enlistedAt: new Date().toISOString(),
      career: startingCareer
    };

    onEnlist(newPlayer);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-700 p-8 rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-amber-500" />
          <h2 className="text-2xl font-bold text-stone-100 uppercase tracking-wider">Alistamento</h2>
        </div>
        
        <p className="text-stone-400 mb-6 text-sm">
          Apresente-se ao Alto Comando. Identifique-se para registrar seu histórico de campanhas e patentes.
        </p>

        <form onSubmit={handleEnlist} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Nome de Guerra *</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-5 h-5 text-stone-500" />
              <input
                type="text"
                required
                maxLength={15}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ex: General Marcus"
                className="w-full bg-stone-800 border border-stone-600 rounded-lg py-2 pl-10 pr-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">E-mail (Opcional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Para backup futuro de carreira"
              className="w-full bg-stone-800 border border-stone-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!nickname.trim()}
            className="w-full mt-4 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 text-stone-900 disabled:text-stone-500 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            CONFIRMAR ALISTAMENTO
            <ChevronRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
