import { supabase } from '../lib/supabase';

export const ResultsService = {
  /**
   * Obter todos os resultados de um jogo
   */
  async getByGame(gameId: string) {
    const { data, error } = await supabase
      .from('results')
      .select(`
        *,
        pair:pairs(*,
          player1:players!pairs_player1_id_fkey(*),
          player2:players!pairs_player2_id_fkey(*)
        )
      `)
      .eq('game_id', gameId);

    if (error) throw error;
    return data;
  },

  /**
   * Obter resultado de uma dupla específica
   */
  async getByPair(pairId: string) {
    const { data, error } = await supabase
      .from('results')
      .select(`
        *,
        pair:pairs(*,
          player1:players!pairs_player1_id_fkey(*),
          player2:players!pairs_player2_id_fkey(*)
        )
      `)
      .eq('pair_id', pairId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Criar novo resultado (apenas capitão)
   */
  async create(result: {
    game_id: string;
    pair_id: string;
    set1_pair_score?: number;
    set1_opponent_score?: number;
    set2_pair_score?: number;
    set2_opponent_score?: number;
    set3_pair_score?: number;
    set3_opponent_score?: number;
    notes?: string;
  }) {
    const { data, error } = await supabase
      .from('results')
      .insert(result)
      .select(`
        *,
        pair:pairs(*,
          player1:players!pairs_player1_id_fkey(*),
          player2:players!pairs_player2_id_fkey(*)
        )
      `)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Actualizar resultado (apenas capitão)
   */
  async update(
    id: string,
    updates: {
      set1_pair_score?: number;
      set1_opponent_score?: number;
      set2_pair_score?: number;
      set2_opponent_score?: number;
      set3_pair_score?: number;
      set3_opponent_score?: number;
      notes?: string;
    }
  ) {
    const { data, error } = await supabase
      .from('results')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        pair:pairs(*,
          player1:players!pairs_player1_id_fkey(*),
          player2:players!pairs_player2_id_fkey(*)
        )
      `)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Eliminar resultado (apenas capitão)
   */
  async delete(id: string) {
    const { error } = await supabase
      .from('results')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Calcular resumo dos resultados de um jogo
   */
  async getGameSummary(gameId: string) {
    const { data, error } = await supabase
      .from('results')
      .select('sets_won, sets_lost')
      .eq('game_id', gameId);

    if (error) throw error;

    const summary = {
      totalSetsWon: 0,
      totalSetsLost: 0,
      pairsWithResults: data.length,
    };

    data.forEach((result) => {
      summary.totalSetsWon += result.sets_won;
      summary.totalSetsLost += result.sets_lost;
    });

    return {
      ...summary,
      outcome: summary.totalSetsWon > summary.totalSetsLost ? 'Vitória' : 'Derrota',
    };
  },

  /**
   * Criar ou actualizar resultado
   */
  async upsert(result: {
    game_id: string;
    pair_id: string;
    sets_won: number;
    sets_lost: number;
    notes?: string;
  }) {
    const { data, error } = await supabase
      .from('results')
      .upsert(result, {
        onConflict: 'pair_id',
      })
      .select(`
        *,
        pair:pairs(*,
          player1:players!pairs_player1_id_fkey(*),
          player2:players!pairs_player2_id_fkey(*)
        )
      `)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Criar múltiplos resultados de uma vez (apenas capitão)
   */
  async createMultiple(results: Array<{
    game_id: string;
    pair_id: string;
    sets_won: number;
    sets_lost: number;
    notes?: string;
  }>) {
    const { data, error } = await supabase
      .from('results')
      .insert(results)
      .select(`
        *,
        pair:pairs(*,
          player1:players!pairs_player1_id_fkey(*),
          player2:players!pairs_player2_id_fkey(*)
        )
      `);

    if (error) throw error;
    return data;
  },
};
