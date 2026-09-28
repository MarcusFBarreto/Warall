import { CareerProfile } from './career';

export interface PlayerProfile {
  id: string; // Um ID simples (pode ser um timestamp)
  nickname: string; // O Nome de Guerra
  email?: string; // Opcional, para o futuro
  enlistedAt: string; // Data em que começou a jogar
  career: CareerProfile; // A carreira fica atrelada ao jogador agora
}
