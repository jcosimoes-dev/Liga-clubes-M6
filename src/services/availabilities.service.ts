import { supabase } from '../lib/supabase';
import type { AvailabilityStatus } from '../lib/database.types';

export const AvailabilitiesService = {
  /**
   * Obter todas as disponibilidades
   */
  async getAll() {
    const { data, error } = await supabase
      .from('availabilities')
      .select(`
        *,
        player:players(*)
      `)
      .order('status');

    if (error) throw error;
    return data;
  },

  /**
   * Obter todas as disponibilidades de um jogo
   */
  async getByGame(gameId: string) {
    const { data, error } = await supabase
      .from('availabilities')
      .select(`
        *,
        player:players(*)
      `)
      .eq('game_id', gameId)
      .order('status');

    if (error) throw error;
    return data;
  },

  /**
   * Obter disponibilidade de um jogador num jogo específico
   */
  async getByGameAndPlayer(gameId: string, playerId: string) {
    const { data, error } = await supabase
      .from('availabilities')
      .select('*')
      .eq('game_id', gameId)
      .eq('player_id', playerId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Criar uma nova disponibilidade
   */
  async create(availability: { game_id: string; player_id: string; status: AvailabilityStatus }) {
    const { data, error } = await supabase
      .from('availabilities')
      .insert(availability)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Actualizar disponibilidade (genérico)
   */
  async update(id: string, updates: Partial<{ status: AvailabilityStatus }>) {
    const { data, error } = await supabase
      .from('availabilities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Actualizar estado da disponibilidade
   * (Jogador actualiza a sua própria disponibilidade)
   */
  async updateStatus(id: string, status: AvailabilityStatus) {
    const { data, error } = await supabase
      .from('availabilities')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Actualizar disponibilidade por jogo e jogador
   */
  async updateByGameAndPlayer(
    gameId: string,
    playerId: string,
    status: AvailabilityStatus
  ) {
    const { data, error } = await supabase
      .from('availabilities')
      .update({ status })
      .eq('game_id', gameId)
      .eq('player_id', playerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Obter resumo de disponibilidades de um jogo
   */
  async getSummary(gameId: string) {
    const { data, error } = await supabase
      .from('availabilities')
      .select('status')
      .eq('game_id', gameId);

    if (error) throw error;

    const summary = {
      sem_resposta: 0,
      confirmo: 0,
      nao_posso: 0,
      talvez: 0,
      total: data.length,
    };

    data.forEach((availability) => {
      summary[availability.status]++;
    });

    return summary;
  },

  /**
   * Obter jogadores que confirmaram presença
   */
  async getConfirmedPlayers(gameId: string) {
    const { data, error } = await supabase
      .from('availabilities')
      .select(`
        *,
        player:players(*)
      `)
      .eq('game_id', gameId)
      .eq('status', 'confirmo');

    if (error) throw error;
    return data.map((a) => a.player);
  },

  /**
   * Obter jogadores disponíveis (confirmaram ou talvez)
   */
  async getAvailablePlayers(gameId: string) {
    const { data, error } = await supabase
      .from('availabilities')
      .select(`
        *,
        player:players(*)
      `)
      .eq('game_id', gameId)
      .in('status', ['confirmo', 'talvez']);

    if (error) throw error;
    return data.map((a) => a.player);
  },
};
