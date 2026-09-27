/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, X, Shield, Swords, Dices, Flag, Layers, CheckCircle2 } from 'lucide-react';
import { CONTINENTS } from '../data/continents';

interface RulebookModalProps {
  onClose: () => void;
}

export const RulebookModal: React.FC<RulebookModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-stone-900 border-2 border-stone-800 rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col text-stone-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-stone-950 px-6 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base uppercase tracking-wider text-white font-serif">
              Manual de Instruções e Regras Oficiais – Warall
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-sm leading-relaxed text-stone-300">
          {/* Objective of the Game */}
          <section className="space-y-2">
            <h4 className="font-bold text-amber-400 text-base flex items-center gap-2">
              <Flag className="w-4 h-4 text-amber-400" />
              1. Objetivo do Jogo
            </h4>
            <p>
              Em <strong>Warall</strong>, cada jogador recebe no início da partida uma <strong>Carta de Missão Secreta</strong> sorteada entre os 14 objetivos clássicos. O jogador que cumprir seu objetivo primeiro é imediatamente declarado o vencedor.
            </p>
          </section>

          {/* Turn Phases */}
          <section className="space-y-3">
            <h4 className="font-bold text-amber-400 text-base flex items-center gap-2">
              <Swords className="w-4 h-4 text-red-400" />
              2. Fases de Cada Turno
            </h4>

            <div className="p-4 bg-stone-950/60 rounded-2xl border border-stone-800 space-y-2">
              <h5 className="font-bold text-white text-xs uppercase tracking-wider">
                Fase 1: Recebimento e Alocação de Tropas (Reforço)
              </h5>
              <p className="text-xs text-stone-400">
                No início da sua vez, você recebe exércitos equivalentes à metade do total de territórios que possui (arredondado para baixo, mínimo de 3). Caso domine continentes inteiros, recebe bônus adicionais. Você também pode trocar combinações de 3 cartas por tropas extras.
              </p>
            </div>

            <div className="p-4 bg-stone-950/60 rounded-2xl border border-stone-800 space-y-2">
              <h5 className="font-bold text-white text-xs uppercase tracking-wider">
                Fase 2: Ataques Contíguos
              </h5>
              <p className="text-xs text-stone-400">
                Você pode atacar territórios vizinhos inimigos a partir de territórios seus com pelo menos 2 exércitos (pois 1 exército deve sempre permanecer como guarnição de ocupação).
              </p>
              <ul className="text-xs text-stone-400 list-disc list-inside space-y-1">
                <li>O atacante pode rolar até <strong>3 dados vermelhos</strong> (número de exércitos - 1).</li>
                <li>O defensor pode rolar até <strong>3 dados amarelos</strong> (número de exércitos que possui no território).</li>
                <li>Os dados são ordenados do maior para o menor e comparados par a par.</li>
                <li><strong className="text-amber-300">Regra de Ouro:</strong> O empate sempre favorece a <strong>Defesa</strong>!</li>
                <li>Se todas as tropas defensoras forem eliminadas, o território é conquistado e você move tropas para ocupá-lo.</li>
              </ul>
            </div>

            <div className="p-4 bg-stone-950/60 rounded-2xl border border-stone-800 space-y-2">
              <h5 className="font-bold text-white text-xs uppercase tracking-wider">
                Fase 3: Remanejamento de Tropas (Fortificação)
              </h5>
              <p className="text-xs text-stone-400">
                Após terminar seus ataques, você pode deslocar tropas entre territórios vizinhos seus para reforçar fronteiras estratégicas (deixando pelo menos 1 tropa em cada território de origem).
              </p>
            </div>
          </section>

          {/* Continents Table */}
          <section className="space-y-2">
            <h4 className="font-bold text-amber-400 text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              3. Bônus de Continentes
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.values(CONTINENTS).map(c => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="font-medium text-stone-200">{c.name}</span>
                  </div>
                  <span className="font-bold text-amber-400 font-mono">+{c.bonus}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Cards & Exchanges */}
          <section className="space-y-2">
            <h4 className="font-bold text-amber-400 text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              4. Cartas de Território & Trocas
            </h4>
            <p className="text-xs text-stone-400">
              Se você conquistar ao menos um território na sua rodada, ganha 1 carta ao final do turno. Uma combinação de 3 cartas (3 símbolos iguais, 3 diferentes ou com curinga) concede reforços crescentes (4, 6, 8, 10, 12, 15, 20, 25, 30... tropas). Se você possuir o território impresso na carta trocada, ganha +2 tropas extras naquele território!
            </p>
          </section>
        </div>

        <div className="p-4 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider transition"
          >
            Entendido, Voltar ao Jogo
          </button>
        </div>
      </div>
    </div>
  );
};
