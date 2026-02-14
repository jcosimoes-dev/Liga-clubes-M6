import { useState, useEffect, FormEvent } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card, Input, Button, Badge, PasswordModal, Toast, ToastType, Header } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { GamesService, PlayersService } from '../services';
import { supabase } from '../lib/supabase';
import { Plus, Crown, Users, Trash2, AlertTriangle, Shield, KeyRound, ChevronDown, ChevronUp } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Player = Database['public']['Tables']['players']['Row'];

export function AdminScreen() {
  const { player, isAdmin, canManageTeam } = useAuth();
  const { navigate } = useNavigation();
  const [roundType, setRoundType] = useState<'jornada' | 'treino' | 'torneio'>('jornada');
  const [roundNumber, setRoundNumber] = useState('1');
  const [gameDate, setGameDate] = useState('');
  const [opponent, setOpponent] = useState('');
  const [location, setLocation] = useState('');
  const [phase, setPhase] = useState('Liga de Clubes');
  const [loading, setLoading] = useState(false);
  const [gameError, setGameError] = useState('');

  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'jogador' | 'capitao' | 'coordenador' | 'admin'>('jogador');
  const [promotingRole, setPromotingRole] = useState(false);
  const [promotionSuccess, setPromotionSuccess] = useState('');
  const [roleError, setRoleError] = useState('');

  const [creatingTestUsers, setCreatingTestUsers] = useState(false);
  const [testUsersResult, setTestUsersResult] = useState<{
    users: Array<{ email: string; password: string; role: string; name: string; status: string }>;
    password: string;
  } | null>(null);
  const [testUsersError, setTestUsersError] = useState('');

  const [resettingData, setResettingData] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmed, setResetConfirmed] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetDataError, setResetDataError] = useState('');

  const [selectedPlayerForReset, setSelectedPlayerForReset] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [passwordResetResult, setPasswordResetResult] = useState<{ playerName: string; temporaryPassword: string } | null>(null);
  const [passwordResetError, setPasswordResetError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [showAdminOptions, setShowAdminOptions] = useState(false);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  const getPhaseOptions = () => {
    if (roundType === 'treino') {
      return [{ value: 'Treino', label: 'Treino' }];
    }
    if (roundType === 'torneio') {
      return [
        { value: 'Torneio', label: 'Torneio' },
        { value: 'Quartos de Final', label: 'Quartos de Final' },
        { value: 'Meia Final', label: 'Meia Final' },
        { value: 'Final', label: 'Final' },
      ];
    }
    return [{ value: 'Liga de Clubes', label: 'Liga de Clubes' }];
  };

  useEffect(() => {
    if (isAdmin) {
      loadPlayers();
    }
  }, [isAdmin]);

  const loadPlayers = async () => {
    try {
      const teamPlayers = await PlayersService.getTeamPlayersForAdmin();
      setPlayers(teamPlayers);
    } catch (err) {
      console.error('Erro ao carregar jogadores:', err);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedPlayerId) {
      return;
    }

    setPromotingRole(true);
    setPromotionSuccess('');
    setRoleError('');

    try {
      await PlayersService.updateRole(selectedPlayerId, selectedRole);
      const updatedPlayer = players.find(p => p.id === selectedPlayerId);
      const roleNames = {
        jogador: 'Jogador',
        capitao: 'Capitão',
        coordenador: 'Coordenador',
        admin: 'Administrador',
      };
      const roleName = roleNames[selectedRole];
      setPromotionSuccess(`${updatedPlayer?.name} foi atualizado para ${roleName} com sucesso!`);
      setSelectedPlayerId('');
      await loadPlayers();

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar role';
      setRoleError(errorMessage);
    } finally {
      setPromotingRole(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedPlayerForReset) {
      return;
    }

    setResettingPassword(true);
    setPasswordResetError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setPasswordResetError('Sessão não encontrada');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-player-password`;

      console.log('Chamando edge function para reset password, playerId:', selectedPlayerForReset);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: selectedPlayerForReset,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const result = await response.json();
      console.log('Response result:', result);

      if (!response.ok) {
        const errorMsg = result.error || `Erro ${response.status}: ${JSON.stringify(result)}`;
        console.error('Erro ao redefinir password:', errorMsg);
        throw new Error(errorMsg);
      }

      setPasswordResetResult({
        playerName: result.playerName,
        temporaryPassword: result.temporaryPassword,
      });
      setSelectedPlayerForReset('');
      showToast('Password redefinida com sucesso', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao redefinir password';
      setPasswordResetError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setResettingPassword(false);
    }
  };


  const handleCreateTestUsers = async () => {
    setCreatingTestUsers(true);
    setTestUsersError('');
    setTestUsersResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setTestUsersError('Sessão não encontrada');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-test-users`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_id: player?.team_id || '00000000-0000-0000-0000-000000000001',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar utilizadores de teste');
      }

      if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors.map((e: any) => {
          let msg = `${e.email}: ${e.error}`;
          if (e.details) msg += `\n  Detalhes: ${e.details}`;
          if (e.hint) msg += `\n  Dica: ${e.hint}`;
          if (e.code) msg += `\n  Código: ${e.code}`;
          return msg;
        }).join('\n\n');
        throw new Error(`Erros ao criar alguns utilizadores:\n\n${errorMessages}`);
      }

      setTestUsersResult({
        users: result.users,
        password: result.password,
      });

      await loadPlayers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar utilizadores de teste';
      setTestUsersError(errorMessage);
    } finally {
      setCreatingTestUsers(false);
    }
  };

  const handleResetTestData = async () => {
    if (!showResetConfirm) {
      setShowResetConfirm(true);
      return;
    }

    if (!resetConfirmed) {
      setResetConfirmed(true);
      return;
    }

    setResettingData(true);
    setResetDataError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setResetDataError('Sessão não encontrada');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-test-data`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao apagar dados de teste');
      }

      setResetSuccess(true);

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao apagar dados de teste';
      setResetDataError(errorMessage);
      setShowResetConfirm(false);
      setResetConfirmed(false);
    } finally {
      setResettingData(false);
    }
  };

  const handleCancelReset = () => {
    setShowResetConfirm(false);
    setResetConfirmed(false);
  };

  if (!canManageTeam) {
    return (
      <Layout>
        <Header title="Administração" />
        <div className="max-w-screen-sm mx-auto px-4 pt-4">
          <Card>
            <p className="text-center text-gray-600">Acesso restrito a administradores e capitães</p>
          </Card>
        </div>
      </Layout>
    );
  }

  const handleCreateGame = async (e: FormEvent) => {
    e.preventDefault();
    setGameError('');

    if (!player?.team_id) {
      setGameError('Erro: Utilizador sem equipa associada');
      return;
    }

    setLoading(true);

    try {
      let finalRoundNumber: number;
      if (roundType === 'treino') {
        finalRoundNumber = 0;
      } else if (roundType === 'torneio') {
        finalRoundNumber = 999;
      } else {
        finalRoundNumber = parseInt(roundNumber);
      }

      console.log('[AdminScreen] Criando jogo com dados:', {
        round_number: finalRoundNumber,
        game_date: new Date(gameDate).toISOString(),
        opponent,
        location,
        phase,
        team_id: player.team_id,
        created_by: player.id,
      });

      const game = await GamesService.create({
        round_number: finalRoundNumber,
        game_date: new Date(gameDate).toISOString(),
        opponent,
        location,
        phase,
        team_id: player.team_id,
        created_by: player.id,
      });

      console.log('[AdminScreen] Jogo criado:', game);

      await GamesService.openCall(game.id);

      console.log('[AdminScreen] Convocatória aberta');

      setRoundType('jornada');
      setRoundNumber('1');
      setGameDate('');
      setOpponent('');
      setLocation('');
      setPhase('Liga de Clubes');

      navigate({ name: 'game', params: { id: game.id } });
    } catch (err: unknown) {
      console.error('[AdminScreen] Erro ao criar jogo:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar jogo';
      const errorDetails = err instanceof Error && err.stack ? `\n${err.stack}` : '';
      setGameError(`${errorMessage}${errorDetails}`);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = () => {
    if (isAdmin) {
      return <Badge variant="danger">Administrador</Badge>;
    }
    if (player?.role === 'capitao') {
      return <Badge variant="warning">Capitão</Badge>;
    }
    if (player?.role === 'coordenador') {
      return <Badge variant="info">Coordenador</Badge>;
    }
    return <Badge variant="default">Jogador</Badge>;
  };

  return (
    <Layout>
      <Header title="Administração" />
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-6">
        <div className="mb-4">
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {player?.name}
                  </h3>
                  <p className="text-xs text-gray-600">
                    Role actual
                  </p>
                </div>
              </div>
              {getRoleBadge()}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Criar Novo Jogo
          </h2>

          <form onSubmit={handleCreateGame} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Evento</label>
              <select
                value={roundType}
                onChange={(e) => {
                  const newType = e.target.value as 'jornada' | 'treino' | 'torneio';
                  setRoundType(newType);
                  if (newType !== 'jornada') {
                    setRoundNumber('1');
                  }
                  if (newType === 'treino') {
                    setPhase('Treino');
                  } else if (newType === 'torneio') {
                    setPhase('Torneio');
                  } else {
                    setPhase('Liga de Clubes');
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="jornada">Jornada</option>
                <option value="treino">Treino</option>
                <option value="torneio">Torneios</option>
              </select>
            </div>

            {roundType === 'jornada' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número da Jornada</label>
                <select
                  value={roundNumber}
                  onChange={(e) => setRoundNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num.toString()}>
                      Jornada {num}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Input
              type="datetime-local"
              label="Data e Hora"
              value={gameDate}
              onChange={(e) => setGameDate(e.target.value)}
              required
            />

            <Input
              type="text"
              label="Adversário"
              placeholder="Nome da equipa adversária"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              required
            />

            <Input
              type="text"
              label="Local"
              placeholder="Clube ou pavilhão"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fase/Competição</label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              >
                {getPhaseOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {roundType === 'jornada' && (
                <p className="text-xs text-gray-500 mt-1">Liga de Clubes: Vitória = 3 pts, Derrota = 1 pt</p>
              )}
              {roundType === 'torneio' && (
                <p className="text-xs text-gray-500 mt-1">Torneio: Pontos inseridos manualmente</p>
              )}
              {roundType === 'treino' && (
                <p className="text-xs text-gray-500 mt-1">Treino: Não atribui pontos</p>
              )}
            </div>

            {gameError && <p className="text-sm text-red-600">{gameError}</p>}

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'A criar...' : 'Criar e Abrir Convocatória'}
            </Button>
          </form>
        </Card>

          {isAdmin && (
          <Card className="lg:col-span-2">
            <Button
              fullWidth
              variant="secondary"
              onClick={() => setShowAdminOptions(!showAdminOptions)}
              className="flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" />
              {showAdminOptions ? 'Ocultar Opções de Administração' : 'Mostrar Opções de Administração'}
              {showAdminOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </Card>
          )}

          {isAdmin && showAdminOptions && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Gerir Funções (Roles)
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selecionar Jogador
                </label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={promotingRole}
                >
                  <option value="">Escolha um jogador...</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'jogador' | 'capitao' | 'coordenador' | 'admin')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={promotingRole}
                >
                  <option value="jogador">Jogador</option>
                  <option value="capitao">Capitão</option>
                  <option value="coordenador">Coordenador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {promotionSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">{promotionSuccess}</p>
                </div>
              )}

              {roleError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 whitespace-pre-wrap font-mono">{roleError}</p>
                </div>
              )}

              <Button
                onClick={handleUpdateRole}
                disabled={!selectedPlayerId || promotingRole}
                fullWidth
              >
                {promotingRole ? 'A guardar...' : 'Guardar Role'}
              </Button>

              <p className="text-xs text-gray-500">
                {selectedRole === 'admin' && 'Administradores têm acesso total a todas as equipas e utilizadores.'}
                {selectedRole === 'capitao' && 'Capitães podem gerir jogos, duplas e resultados da sua equipa.'}
                {selectedRole === 'coordenador' && 'Coordenadores têm acesso de leitura à sua equipa (não jogam).'}
                {selectedRole === 'jogador' && 'Jogadores podem ver e gerir as suas próprias informações.'}
              </p>
            </div>
          </Card>
          )}

          {isAdmin && showAdminOptions && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Redefinir Password de Jogador
            </h2>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Se um jogador esquecer a sua password, pode redefinir e gerar uma password temporária.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selecionar Jogador
                </label>
                <select
                  value={selectedPlayerForReset}
                  onChange={(e) => setSelectedPlayerForReset(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={resettingPassword}
                >
                  <option value="">Escolha um jogador...</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {passwordResetError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{passwordResetError}</p>
                </div>
              )}

              <Button
                onClick={handleResetPassword}
                disabled={!selectedPlayerForReset || resettingPassword}
                fullWidth
                variant="secondary"
              >
                {resettingPassword ? 'A redefinir password...' : 'Redefinir Password'}
              </Button>

              <p className="text-xs text-gray-500">
                Será gerada uma password temporária que deve ser entregue ao jogador de forma segura.
              </p>
            </div>
          </Card>
          )}

          {isAdmin && showAdminOptions && (
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Criar Utilizadores de Teste
            </h2>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Criar automaticamente 7 utilizadores de teste (5 jogadores + 1 capitão + 1 coordenador) para facilitar os testes da aplicação.
              </p>

              {testUsersError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 whitespace-pre-wrap font-mono">{testUsersError}</p>
                </div>
              )}

              <Button
                onClick={handleCreateTestUsers}
                disabled={creatingTestUsers}
                fullWidth
                variant="secondary"
              >
                {creatingTestUsers ? 'A criar utilizadores...' : 'Criar Utilizadores de Teste'}
              </Button>

              {testUsersResult && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-3">
                    Utilizadores criados com sucesso!
                  </h3>
                  <p className="text-sm text-green-800 mb-3">
                    <strong>Password padrão:</strong> {testUsersResult.password}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-green-300">
                          <th className="text-left py-2 text-green-900">Nome</th>
                          <th className="text-left py-2 text-green-900">Email</th>
                          <th className="text-left py-2 text-green-900">Role</th>
                          <th className="text-left py-2 text-green-900">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testUsersResult.users.map((user, idx) => (
                          <tr key={idx} className="border-b border-green-200">
                            <td className="py-2 text-green-800">{user.name}</td>
                            <td className="py-2 text-green-800">{user.email}</td>
                            <td className="py-2 text-green-800">
                              {user.role === 'admin' ? 'Admin' :
                               user.role === 'capitao' ? 'Capitão' :
                               user.role === 'coordenador' ? 'Coordenador' :
                               'Jogador'}
                            </td>
                            <td className="py-2">
                              <span className={user.status === 'criado' ? 'text-green-700' : 'text-yellow-700'}>
                                {user.status === 'criado' ? 'Criado' : 'Já existe'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500">
                Esta funcionalidade só está disponível para administradores. Os utilizadores são idempotentes (podem ser executados múltiplas vezes sem duplicar).
              </p>
            </div>
          </Card>
          )}

          {isAdmin && showAdminOptions && (
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Reset Dados de Teste
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900 mb-1">
                      Atenção: Ação irreversível!
                    </p>
                    <p className="text-sm text-red-800">
                      Esta ação irá apagar todos os resultados, duplas, disponibilidades e jogos.
                      Os jogadores e equipas não serão removidos.
                    </p>
                  </div>
                </div>
              </div>

              {!showResetConfirm && (
                <Button
                  onClick={handleResetTestData}
                  disabled={resettingData}
                  fullWidth
                  variant="secondary"
                  className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                >
                  Apagar Dados de Teste
                </Button>
              )}

              {showResetConfirm && !resetConfirmed && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900">
                    Tem a certeza que deseja apagar todos os dados de teste?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCancelReset}
                      fullWidth
                      variant="secondary"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleResetTestData}
                      fullWidth
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Sim, tenho a certeza
                    </Button>
                  </div>
                </div>
              )}

              {resetConfirmed && !resetSuccess && (
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-semibold text-yellow-900 mb-1">
                      Última confirmação!
                    </p>
                    <p className="text-sm text-yellow-800">
                      Clique novamente para confirmar definitivamente a remoção de todos os dados.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCancelReset}
                      fullWidth
                      variant="secondary"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleResetTestData}
                      disabled={resettingData}
                      fullWidth
                      className="bg-red-700 hover:bg-red-800 text-white"
                    >
                      {resettingData ? 'A apagar...' : 'Confirmar e Apagar'}
                    </Button>
                  </div>
                </div>
              )}

              {resetSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-semibold">
                    Dados apagados com sucesso! A recarregar...
                  </p>
                </div>
              )}

              {resetDataError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{resetDataError}</p>
                </div>
              )}

              <p className="text-xs text-gray-500">
                Esta funcionalidade só está disponível para administradores e requer confirmação dupla.
              </p>
            </div>
          </Card>
          )}
        </div>

        <PasswordModal
          isOpen={!!passwordResetResult}
          playerName={passwordResetResult?.playerName || ''}
          temporaryPassword={passwordResetResult?.temporaryPassword || ''}
          onClose={() => setPasswordResetResult(null)}
        />

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
