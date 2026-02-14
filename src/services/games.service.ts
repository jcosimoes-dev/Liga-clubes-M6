import { supabase } from '../lib/supabase';
import type { Game, GameStatus } from '../lib/database.types';

export const GamesService = {
  /**
   * Obter todos os jogos
   */
  async getAll() {
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        created_by_player:players!games_created_by_fkey(*)
      `)
      .order('game_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Obter jogos por estado
   */
  async getByStatus(status: GameStatus) {
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        created_by_player:players!games_created_by_fkey(*)
      `)
      .eq('status', status)
      .order('game_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Obter jogo por ID com todas as relações
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        created_by_player:players!games_created_by_fkey(*),
        availabilities(*,
          player:players(*)
        ),
        pairs(*,
          player1:players!pairs_player1_id_fkey(*),
          player2:players!pairs_player2_id_fkey(*),
          results(*)
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Criar novo jogo (apenas capitão/admin)
   * Nota: As availabilities são criadas automaticamente pelo trigger
   */
  async create(game: {
    round_number: number;
    game_date: string;
    opponent: string;
    location: string;
    phase: string;
    team_id: string;
    created_by: string;
  }) {
    const { data, error } = await supabase
      .from('games')
      .insert({
        ...game,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Actualizar jogo (apenas capitão)
   */
  async update(id: string, updates: Partial<Game>) {
    const { data, error } = await supabase
      .from('games')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Abrir convocatória (apenas capitão)
   */
  async openCall(id: string) {
    return this.update(id, { status: 'convocatoria_aberta' });
  },

  /**
   * Fechar convocatória (apenas capitão)
   */
  async closeCall(id: string) {
    return this.update(id, { status: 'convocatoria_fechada' });
  },

  /**
   * Marcar jogo como concluído (apenas capitão)
   */
  async complete(id: string) {
    return this.update(id, { status: 'concluido' });
  },

  /**
   * Cancelar jogo (apenas capitão)
   */
  async cancel(id: string) {
    return this.update(id, { status: 'cancelado' });
  },

  /**
   * Eliminar jogo (apenas capitão)
   */
  async delete(id: string) {
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Formatar o nome da jornada baseado no round_number
   */
  formatRoundName(roundNumber: number): string {
    if (roundNumber === 0) {
      return 'Treino';
    } else if (roundNumber === 999) {
      return 'Torneios';
    } else {
      return `Jornada ${roundNumber}`;
    }
  },

  /**
   * Gerar texto para partilhar no WhatsApp
   */
  formatForWhatsApp(game: Game, includeDetails = true) {
    const date = new Date(game.game_date);
    const dateStr = date.toLocaleDateString('pt-PT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const roundName = this.formatRoundName(game.round_number);
    let message = `🎾 *Equipa M6 APC Nome Patrocínio - ${roundName}*\n\n`;
    message += `📅 ${dateStr}\n`;
    message += `⏰ ${timeStr}\n`;
    message += `🏟️ ${game.location}\n`;
    message += `🆚 ${game.opponent}\n`;

    if (includeDetails) {
      message += `📊 Fase: ${game.phase}\n`;
    }

    return message;
  },
};
