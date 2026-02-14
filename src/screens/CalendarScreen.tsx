import { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card, Badge, Loading, Button, Header, Toast, ToastType } from '../components/ui';
import { useNavigation } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import { GamesService, AvailabilitiesService } from '../services';
import { Calendar, MapPin, Users, Plus, CheckCircle, HelpCircle, XCircle, Clock } from 'lucide-react';

export function CalendarScreen() {
  const { navigate } = useNavigation();
  const { player, canManageTeam } = useAuth();
  const [games, setGames] = useState<any[]>([]);
  const [filteredGames, setFilteredGames] = useState<any[]>([]);
  const [availabilities, setAvailabilities] = useState<Record<string, any>>({});
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [games, statusFilter, phaseFilter]);

  const loadData = async () => {
    try {
      const gamesData = await GamesService.getAll();
      const notCompleted = gamesData.filter(game => game.status !== 'concluido');
      const sorted = notCompleted.sort(
        (a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime()
      );
      setGames(sorted);

      const availsData = await AvailabilitiesService.getAll();
      const availsMap: Record<string, any> = {};
      availsData.forEach((avail) => {
        const key = `${avail.game_id}-${avail.player_id}`;
        availsMap[key] = avail;
      });
      setAvailabilities(availsMap);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...games];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((g) => g.status === statusFilter);
    }

    if (phaseFilter !== 'all') {
      filtered = filtered.filter((g) => g.phase === phaseFilter);
    }

    setFilteredGames(filtered);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-PT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysUntilGame = (gameDate: string): number => {
    const now = new Date();
    const game = new Date(gameDate);
    const diffTime = game.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getConfirmedCount = (gameId: string): number => {
    return Object.values(availabilities).filter(
      (avail) => avail.game_id === gameId && avail.status === 'confirmo'
    ).length;
  };

  const getMyAvailability = (gameId: string) => {
    if (!player) return null;
    return availabilities[`${gameId}-${player.id}`];
  };

  const handleAvailability = async (gameId: string, status: 'confirmo' | 'talvez' | 'nao_posso') => {
    if (!player) {
      console.error('No player found');
      showToast('Erro: Jogador não encontrado', 'error');
      return;
    }

    const existing = getMyAvailability(gameId);

    console.log('Updating availability in CalendarScreen:', {
      gameId,
      playerId: player.id,
      existingAvailability: existing,
      newStatus: status
    });

    try {
      if (existing) {
        console.log('Updating existing availability:', existing.id);
        await AvailabilitiesService.update(existing.id, { status });
      } else {
        console.log('Creating new availability');
        await AvailabilitiesService.create({
          game_id: gameId,
          player_id: player.id,
          status,
        });
      }
      await loadData();
      showToast('Disponibilidade atualizada com sucesso', 'success');
    } catch (error: any) {
      console.error('Erro ao actualizar disponibilidade:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      showToast(`Erro ao atualizar disponibilidade: ${error.message || 'Erro desconhecido'}`, 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { variant: 'default' as const, label: 'Rascunho' },
      convocatoria_aberta: { variant: 'success' as const, label: 'Aberta' },
      convocatoria_fechada: { variant: 'info' as const, label: 'Convocatória' },
      concluido: { variant: 'default' as const, label: 'Concluído' },
      cancelado: { variant: 'danger' as const, label: 'Cancelado' },
    };
    const badge = badges[status as keyof typeof badges] || badges.draft;
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  const upcomingGames = filteredGames.filter(
    (game) => new Date(game.game_date) >= new Date()
  );
  const pastGames = filteredGames.filter(
    (game) => new Date(game.game_date) < new Date()
  );

  if (loading) {
    return (
      <Layout>
        <Header title="Calendário" />
        <div className="max-w-screen-sm mx-auto px-4 pt-4">
          <Loading text="A carregar jogos..." />
        </div>
      </Layout>
    );
  }

  const renderGameCard = (game: any) => {
    const myAvail = getMyAvailability(game.id);
    const confirmedCount = getConfirmedCount(game.id);
    const daysUntil = getDaysUntilGame(game.game_date);
    const isUpcoming = daysUntil >= 0;

    return (
      <Card key={game.id} className="hover:shadow-lg transition-all">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {GamesService.formatRoundName(game.round_number)}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <Badge variant="default" size="sm">
                {game.phase}
              </Badge>
            </div>
            {getStatusBadge(game.status)}
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-lg font-bold text-gray-900">{formatDate(game.game_date)}</div>
                <div className="text-sm text-gray-600">{formatTime(game.game_date)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 py-2">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <span className="text-lg font-bold text-gray-900">vs {game.opponent}</span>
            </div>

            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{game.location}</span>
            </div>
          </div>

          {isUpcoming && game.status === 'convocatoria_aberta' && (
            <div className="pt-3 border-t border-gray-200 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAvailability(game.id, 'confirmo');
                  }}
                  className={`flex flex-col items-center py-2 px-1 rounded-lg border-2 transition-all ${
                    myAvail?.status === 'confirmo'
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-green-300'
                  }`}
                >
                  <CheckCircle className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">Confirmo</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAvailability(game.id, 'talvez');
                  }}
                  className={`flex flex-col items-center py-2 px-1 rounded-lg border-2 transition-all ${
                    myAvail?.status === 'talvez'
                      ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-yellow-300'
                  }`}
                >
                  <HelpCircle className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">Talvez</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAvailability(game.id, 'nao_posso');
                  }}
                  className={`flex flex-col items-center py-2 px-1 rounded-lg border-2 transition-all ${
                    myAvail?.status === 'nao_posso'
                      ? 'bg-red-50 border-red-500 text-red-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-red-300'
                  }`}
                >
                  <XCircle className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">Não posso</span>
                </button>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{confirmedCount} confirmados</span>
            </div>
            {isUpcoming && daysUntil > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {daysUntil === 0 ? 'Hoje' : daysUntil === 1 ? 'Amanhã' : `${daysUntil} dias`}
                </span>
              </div>
            )}
          </div>

          <Button
            fullWidth
            variant="secondary"
            size="sm"
            onClick={() => navigate({ name: 'game', params: { id: game.id } })}
          >
            Ver detalhes
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <Layout>
      <Header title="Calendário" />
      <div className="max-w-screen-lg mx-auto px-4 pt-4 space-y-6">
        {canManageTeam && (
          <Button
            fullWidth
            onClick={() => navigate({ name: 'admin' })}
            className="flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Criar Jogo
          </Button>
        )}

        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('convocatoria_aberta')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === 'convocatoria_aberta'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Abertos
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            <button
              onClick={() => setPhaseFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                phaseFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas as fases
            </button>
            <button
              onClick={() => setPhaseFilter('Qualificação')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                phaseFilter === 'Qualificação'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Qualificação
            </button>
            <button
              onClick={() => setPhaseFilter('Regionais')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                phaseFilter === 'Regionais'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Regionais
            </button>
            <button
              onClick={() => setPhaseFilter('Nacionais')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                phaseFilter === 'Nacionais'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Nacionais
            </button>
          </div>
        </div>

        {upcomingGames.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Próximos Jogos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingGames.map(renderGameCard)}
            </div>
          </div>
        )}

        {pastGames.length > 0 && (
          <div className="space-y-3 pt-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              Jogos Passados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastGames.map(renderGameCard)}
            </div>
          </div>
        )}

        {filteredGames.length === 0 && (
          <Card>
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Sem jogos</p>
              <p className="text-sm text-gray-500 mt-1">Nenhum jogo corresponde aos filtros</p>
            </div>
          </Card>
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </Layout>
  );
}
