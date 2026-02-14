import { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card, Button, Badge, Loading, Header, Toast, ToastType } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { GamesService, AvailabilitiesService } from '../services';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, Users, CheckCircle, XCircle, HelpCircle, Shield, Trophy, UserCircle } from 'lucide-react';

export function HomeScreen() {
  const { player, isAdmin } = useAuth();
  const { navigate } = useNavigation();
  const [nextGame, setNextGame] = useState<any>(null);
  const [lastGame, setLastGame] = useState<any>(null);
  const [myAvailability, setMyAvailability] = useState<any>(null);
  const [gamesPlayed, setGamesPlayed] = useState<number>(0);
  const [availabilityUpdated, setAvailabilityUpdated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasAdmins, setHasAdmins] = useState<boolean>(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    loadData();
  }, [player]);

  const loadData = async () => {
    if (!player) return;

    try {
      const { data: hasAdminResult, error: hasAdminError } = await supabase
        .rpc('has_admin');

      if (hasAdminError) {
        console.error('Erro ao verificar admins:', hasAdminError);
        setHasAdmins(true);
      } else {
        setHasAdmins(hasAdminResult || false);
      }

      const games = await GamesService.getAll();
      const now = new Date();

      const upcoming = games
        .filter((g) => new Date(g.game_date) > now)
        .sort((a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime())[0];

      const past = games
        .filter((g) => new Date(g.game_date) <= now)
        .sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime())[0];

      setNextGame(upcoming);
      setLastGame(past);

      if (upcoming) {
        const avail = await AvailabilitiesService.getByGameAndPlayer(upcoming.id, player.id);
        setMyAvailability(avail);
      }

      const { data: pairs } = await supabase
        .from('pairs')
        .select('game_id, games!inner(status)')
        .or(`player1_id.eq.${player.id},player2_id.eq.${player.id}`);

      const completedGames = pairs?.filter((p: any) => p.games.status === 'concluido') || [];
      setGamesPlayed(completedGames.length);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvailability = async (status: 'confirmo' | 'nao_posso' | 'talvez') => {
    if (!myAvailability) {
      console.error('No availability found');
      showToast('Erro: Disponibilidade não encontrada', 'error');
      return;
    }

    console.log('Updating availability in HomeScreen:', {
      id: myAvailability.id,
      playerId: myAvailability.player_id,
      currentStatus: myAvailability.status,
      newStatus: status,
      currentUser: player
    });

    try {
      await AvailabilitiesService.updateStatus(myAvailability.id, status);
      setMyAvailability({ ...myAvailability, status });
      setAvailabilityUpdated(true);
      setTimeout(() => setAvailabilityUpdated(false), 3000);
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { variant: 'default' as const, label: 'Rascunho' },
      convocatoria_aberta: { variant: 'info' as const, label: 'Aberta' },
      convocatoria_fechada: { variant: 'warning' as const, label: 'Fechada' },
      concluido: { variant: 'success' as const, label: 'Concluído' },
      cancelado: { variant: 'danger' as const, label: 'Cancelado' },
    };
    const badge = badges[status as keyof typeof badges] || badges.draft;
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  if (loading) {
    return (
      <Layout>
        <Header title="Início" />
        <div className="max-w-screen-sm mx-auto px-4 pt-4">
          <Loading text="A carregar..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header title="Início" />
      <div className="max-w-screen-sm mx-auto px-4 pt-4 space-y-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg">
                <UserCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">{player?.name || 'Jogador'}</h2>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-semibold text-gray-700">{player?.federation_points || 0} pts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">{gamesPlayed} jogos</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {isAdmin && (
          <Card>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Painel de Administração
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  Aceda ao painel de administração para gerir equipas, jogos e utilizadores.
                </p>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    console.log('[HomeScreen] Botão "Ir para Admin" clicado');
                    navigate({ name: 'admin' });
                  }}
                >
                  Ir para Admin
                </Button>
              </div>
            </div>
          </Card>
        )}

        {!isAdmin && !hasAdmins && (
          <Card>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Configuração Inicial
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  Promova-se a Administrador para gerir equipas, jogos e utilizadores.
                </p>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    console.log('[HomeScreen] Botão "Configurar Sistema" clicado');
                    console.log('[HomeScreen] A navegar para: bootstrap');
                    navigate({ name: 'bootstrap' });
                  }}
                >
                  Configurar Sistema
                </Button>
              </div>
            </div>
          </Card>
        )}

        {nextGame ? (
          <Card>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-3 shadow-lg min-w-[70px]">
                    <div className="text-center text-white">
                      <div className="text-2xl font-bold leading-none">
                        {new Date(nextGame.game_date).getDate()}
                      </div>
                      <div className="text-xs uppercase font-medium mt-1 opacity-90">
                        {new Date(nextGame.game_date).toLocaleDateString('pt-PT', { month: 'short' })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-lg font-semibold text-gray-900">Próximo Jogo</h2>
                    {nextGame.status === 'convocatoria_aberta' && (
                      <Badge variant="success">Aberta</Badge>
                    )}
                    {nextGame.status !== 'convocatoria_aberta' && getStatusBadge(nextGame.status)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium">
                        {new Date(nextGame.game_date).toLocaleDateString('pt-PT', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-900 font-semibold">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-gray-600" />
                      </div>
                      <span>vs {nextGame.opponent}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{nextGame.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {myAvailability && nextGame.status === 'convocatoria_aberta' && (
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <p className="text-sm font-semibold text-gray-900">A sua disponibilidade:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      size="sm"
                      variant={myAvailability.status === 'confirmo' ? 'success' : 'secondary'}
                      onClick={() => handleAvailability('confirmo')}
                      className="flex-col h-auto py-3"
                    >
                      <CheckCircle className="w-5 h-5 mb-1" />
                      <span className="text-xs font-medium">Confirmo</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={myAvailability.status === 'talvez' ? 'warning' : 'secondary'}
                      onClick={() => handleAvailability('talvez')}
                      className="flex-col h-auto py-3"
                    >
                      <HelpCircle className="w-5 h-5 mb-1" />
                      <span className="text-xs font-medium">Talvez</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={myAvailability.status === 'nao_posso' ? 'danger' : 'secondary'}
                      onClick={() => handleAvailability('nao_posso')}
                      className="flex-col h-auto py-3"
                    >
                      <XCircle className="w-5 h-5 mb-1" />
                      <span className="text-xs font-medium">Não posso</span>
                    </Button>
                  </div>
                  {availabilityUpdated && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                      <p className="text-xs text-green-700 font-medium">Disponibilidade registada</p>
                    </div>
                  )}
                </div>
              )}

              <Button
                fullWidth
                variant="primary"
                onClick={() => navigate({ name: 'game', params: { id: nextGame.id } })}
                className="mt-2"
              >
                Ver detalhes do jogo
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Sem jogos agendados</p>
              <p className="text-sm text-gray-500 mt-1">Novos jogos aparecerão aqui</p>
            </div>
          </Card>
        )}

        {lastGame && (
          <Card>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Último Jogo</h2>
                {getStatusBadge(lastGame.status)}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(lastGame.game_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Users className="w-4 h-4" />
                  <span>vs {lastGame.opponent}</span>
                </div>
              </div>

              <Button
                fullWidth
                variant="ghost"
                onClick={() => navigate({ name: 'game', params: { id: lastGame.id } })}
              >
                Ver detalhes
              </Button>
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
