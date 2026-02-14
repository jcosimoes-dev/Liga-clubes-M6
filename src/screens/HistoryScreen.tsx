import { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card, Badge, Loading } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { GamesService, ResultsService } from '../services';
import { Calendar, MapPin, Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Game = Database['public']['Tables']['games']['Row'];

interface GameSummary {
  totalSetsWon: number;
  totalSetsLost: number;
  pairsWithResults: number;
  outcome: 'Vitória' | 'Derrota';
}

interface GameWithResult extends Game {
  result?: GameSummary;
}

export function HistoryScreen() {
  const { player } = useAuth();
  const { navigate } = useNavigation();
  const [games, setGames] = useState<GameWithResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ wins: 0, losses: 0, total: 0 });

  useEffect(() => {
    loadHistory();
  }, [player]);

  const loadHistory = async () => {
    if (!player) return;

    try {
      setLoading(true);
      const allGames = await GamesService.getAll();

      const completedGames = allGames.filter(game => game.status === 'concluido');

      const gamesWithResults = await Promise.all(
        completedGames.map(async (game) => {
          try {
            const result = await ResultsService.getGameSummary(game.id);
            return { ...game, result };
          } catch (error) {
            console.error('Erro ao carregar resultado:', error);
            return game;
          }
        })
      );

      gamesWithResults.sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime());

      const wins = gamesWithResults.filter(g => g.result && g.result.outcome === 'Vitória').length;
      const losses = gamesWithResults.filter(g => g.result && g.result.outcome === 'Derrota').length;

      setStats({ wins, losses, total: gamesWithResults.filter(g => g.result).length });
      setGames(gamesWithResults);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getResultBadge = (game: GameWithResult) => {
    if (!game.result) {
      return <Badge variant="gray">Sem resultado</Badge>;
    }

    const { outcome } = game.result;

    if (outcome === 'Vitória') {
      return (
        <Badge variant="green" className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          Vitória
        </Badge>
      );
    } else {
      return (
        <Badge variant="red" className="flex items-center gap-1">
          <TrendingDown className="w-3 h-3" />
          Derrota
        </Badge>
      );
    }
  };

  const getScoreDisplay = (game: GameWithResult) => {
    if (!game.result) return null;

    const { totalSetsWon, totalSetsLost } = game.result;
    return (
      <div className="flex items-center gap-3">
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">{totalSetsWon}</div>
          <div className="text-xs text-gray-600 mt-1">Sets ganhos</div>
        </div>
        <div className="text-2xl font-bold text-gray-400">-</div>
        <div className="text-center">
          <div className="text-3xl font-bold text-red-600">{totalSetsLost}</div>
          <div className="text-xs text-gray-600 mt-1">Sets perdidos</div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout title="Histórico">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading text="A carregar histórico..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Histórico">
      <div className="space-y-4">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900">Estatísticas da Época</h2>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600 mt-1">Total</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{stats.wins}</div>
              <div className="text-sm text-gray-600 mt-1">Vitórias</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{stats.losses}</div>
              <div className="text-sm text-gray-600 mt-1">Derrotas</div>
            </div>
          </div>

          {stats.total > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Taxa de vitórias: <span className="font-semibold text-gray-900">
                  {((stats.wins / stats.total) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-3">
          {games.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Ainda não há jogos realizados</p>
              </div>
            </Card>
          ) : (
            games.map((game) => (
              <Card
                key={game.id}
                onClick={() => navigate({ name: 'game', params: { id: game.id } })}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="blue">
                          {GamesService.formatRoundName(game.round_number)}
                        </Badge>
                        {game.phase && game.phase !== 'Qualificação' && (
                          <Badge variant="purple">{game.phase}</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        vs {game.opponent}
                      </h3>
                    </div>
                    {getResultBadge(game)}
                  </div>

                  {game.result && (
                    <div className="flex items-center justify-center py-2">
                      {getScoreDisplay(game)}
                    </div>
                  )}

                  {game.team_points !== null && game.team_points !== undefined && (
                    <div className="flex items-center justify-center py-2">
                      <div className="px-4 py-2 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-900">
                            {game.team_points} {game.team_points === 1 ? 'ponto' : 'pontos'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(game.game_date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{game.location}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
