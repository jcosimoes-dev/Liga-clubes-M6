import { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card, Badge, Loading, Button, Toast, ToastType, Header } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import {
  GamesService,
  AvailabilitiesService,
  PairsService,
  ResultsService,
} from '../services';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  HelpCircle,
  Shield,
  Trophy,
  ArrowLeft,
} from 'lucide-react';

interface GameDetailScreenProps {
  gameId: string;
}

export function GameDetailScreen({ gameId }: GameDetailScreenProps) {
  const { player, canManageTeam } = useAuth();
  const { navigate } = useNavigation();
  const [game, setGame] = useState<any>(null);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [myAvailability, setMyAvailability] = useState<any>(null);
  const [pairs, setPairs] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCaptainArea, setShowCaptainArea] = useState(false);
  const [showPairsForm, setShowPairsForm] = useState(false);
  const [showResultsForm, setShowResultsForm] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [pairCompositions, setPairCompositions] = useState<{
    pairA: { player1: string; player2: string };
    pairB: { player1: string; player2: string };
    pairC: { player1: string; player2: string };
  }>({
    pairA: { player1: '', player2: '' },
    pairB: { player1: '', player2: '' },
    pairC: { player1: '', player2: '' },
  });
  const [showPairsPreview, setShowPairsPreview] = useState(false);
  const [pairResults, setPairResults] = useState<Record<string, {
    set1PairScore: number | '';
    set1OpponentScore: number | '';
    set2PairScore: number | '';
    set2OpponentScore: number | '';
    set3PairScore: number | '';
    set3OpponentScore: number | '';
    notes: string;
  }>>({});
  const [noShow, setNoShow] = useState(false);
  const [manualPoints, setManualPoints] = useState<number>(0);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    loadData();
  }, [gameId, player]);

  const loadData = async () => {
    try {
      const [gameData, availData, pairsData, resultsData] = await Promise.all([
        GamesService.getById(gameId),
        AvailabilitiesService.getByGame(gameId),
        PairsService.getByGame(gameId),
        ResultsService.getByGame(gameId),
      ]);

      setGame(gameData);
      setAvailabilities(availData);
      setPairs(pairsData);
      setResults(resultsData);

      if (player) {
        const myAvail = availData.find((a: any) => a.player_id === player.id);
        setMyAvailability(myAvail);
      }
    } catch (error) {
      console.error('Erro ao carregar jogo:', error);
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

    console.log('Updating availability:', {
      id: myAvailability.id,
      playerId: myAvailability.player_id,
      currentStatus: myAvailability.status,
      newStatus: status,
      currentUser: player
    });

    try {
      await AvailabilitiesService.updateStatus(myAvailability.id, status);
      setMyAvailability({ ...myAvailability, status });
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

  const handleCloseCall = async () => {
    if (!game) return;
    try {
      await GamesService.closeCall(game.id);
      await loadData();
    } catch (error) {
      console.error('Erro ao fechar convocatória:', error);
    }
  };

  const handleTogglePlayer = (playerId: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  const updatePairComposition = (
    pair: 'pairA' | 'pairB' | 'pairC',
    position: 'player1' | 'player2',
    playerId: string
  ) => {
    setPairCompositions((prev) => ({
      ...prev,
      [pair]: {
        ...prev[pair],
        [position]: playerId,
      },
    }));
  };

  const validatePairCompositions = () => {
    const allPlayers: string[] = [];
    const pairs = [pairCompositions.pairA, pairCompositions.pairB, pairCompositions.pairC];
    let completePairs = 0;

    for (const pair of pairs) {
      if (pair.player1 && pair.player2) {
        completePairs++;
        allPlayers.push(pair.player1, pair.player2);
      } else if (pair.player1 || pair.player2) {
        return { valid: false, message: 'Todas as duplas devem ter 2 jogadores ou estar vazias' };
      }
    }

    if (completePairs < 2) {
      return { valid: false, message: 'Defina pelo menos 2 duplas completas' };
    }

    if (completePairs > 3) {
      return { valid: false, message: 'Máximo de 3 duplas' };
    }

    const uniquePlayers = new Set(allPlayers);
    if (uniquePlayers.size !== allPlayers.length) {
      return { valid: false, message: 'Não pode repetir jogadores em duplas diferentes' };
    }

    return { valid: true, message: '' };
  };

  const calculatePairPoints = (player1Id: string, player2Id: string) => {
    const player1 = confirmedPlayers.find((p) => p.player_id === player1Id);
    const player2 = confirmedPlayers.find((p) => p.player_id === player2Id);
    return (player1?.player?.federation_points || 0) + (player2?.player?.federation_points || 0);
  };

  const getOrderedPairs = () => {
    const pairs = [
      {
        name: 'A',
        player1: pairCompositions.pairA.player1,
        player2: pairCompositions.pairA.player2,
        points: 0,
      },
      {
        name: 'B',
        player1: pairCompositions.pairB.player1,
        player2: pairCompositions.pairB.player2,
        points: 0,
      },
      {
        name: 'C',
        player1: pairCompositions.pairC.player1,
        player2: pairCompositions.pairC.player2,
        points: 0,
      },
    ].filter((pair) => pair.player1 && pair.player2);

    pairs.forEach((pair) => {
      pair.points = calculatePairPoints(pair.player1, pair.player2);
    });

    return pairs.sort((a, b) => b.points - a.points);
  };

  const handlePreviewPairs = () => {
    const validation = validatePairCompositions();
    if (!validation.valid) {
      showToast(validation.message, 'error');
      return;
    }
    setShowPairsPreview(true);
  };

  const handleCreatePairs = async () => {
    const validation = validatePairCompositions();
    if (!validation.valid) {
      showToast(validation.message, 'error');
      return;
    }

    try {
      const orderedPairs = getOrderedPairs();

      if (pairs.length > 0) {
        for (const pair of pairs) {
          await PairsService.delete(pair.id);
        }
      }

      for (let i = 0; i < orderedPairs.length; i++) {
        await PairsService.create({
          game_id: gameId,
          player1_id: orderedPairs[i].player1,
          player2_id: orderedPairs[i].player2,
        });
      }

      setShowPairsForm(false);
      setShowPairsPreview(false);
      setPairCompositions({
        pairA: { player1: '', player2: '' },
        pairB: { player1: '', player2: '' },
        pairC: { player1: '', player2: '' },
      });
      await loadData();
      showToast('Duplas criadas com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao criar duplas:', error);
      const message = error.message || 'Erro ao criar duplas';
      showToast(message, 'error');
    }
  };

  const validateTennisSet = (score1: number | '', score2: number | ''): boolean => {
    if (score1 === '' || score2 === '' || score1 < 0 || score2 < 0) return false;
    if (score1 < 6 && score2 < 6) return false;

    if (score1 === 6) return score2 >= 0 && score2 <= 4;
    if (score1 === 7) return score2 === 5 || score2 === 6;
    if (score2 === 6) return score1 >= 0 && score1 <= 4;
    if (score2 === 7) return score1 === 5 || score1 === 6;

    return false;
  };

  const calculateSetsFromPartials = (result: any) => {
    const s1 = typeof result.set1PairScore === 'number' ? result.set1PairScore : null;
    const s1o = typeof result.set1OpponentScore === 'number' ? result.set1OpponentScore : null;
    const s2 = typeof result.set2PairScore === 'number' ? result.set2PairScore : null;
    const s2o = typeof result.set2OpponentScore === 'number' ? result.set2OpponentScore : null;
    const s3 = typeof result.set3PairScore === 'number' ? result.set3PairScore : null;
    const s3o = typeof result.set3OpponentScore === 'number' ? result.set3OpponentScore : null;

    if (s1 === null || s1o === null || s2 === null || s2o === null) {
      throw new Error('Sets 1 e 2 são obrigatórios');
    }

    const set1Won = s1 > s1o;
    const set2Won = s2 > s2o;
    let setsWon = (set1Won ? 1 : 0) + (set2Won ? 1 : 0);
    let setsLost = (set1Won ? 0 : 1) + (set2Won ? 0 : 1);

    if (setsWon === 2 || setsLost === 2) {
      if (s3 !== null || s3o !== null) {
        throw new Error('Set 3 não deve ser jogado quando o resultado já é 2-0');
      }
    } else {
      if (s3 === null || s3o === null) {
        throw new Error('Set 3 é obrigatório quando o resultado está 1-1');
      }
      const set3Won = s3 > s3o;
      setsWon += set3Won ? 1 : 0;
      setsLost += set3Won ? 0 : 1;
    }

    return { setsWon, setsLost };
  };

  const handleRegisterResults = async () => {
    try {
      if (results.length > 0) {
        showToast('Resultados já foram registados para este jogo', 'error');
        return;
      }

      let totalSetsWon = 0;
      let totalSetsLost = 0;

      for (const pair of pairs) {
        const result = pairResults[pair.id];
        if (!result) continue;

        if (!validateTennisSet(result.set1PairScore, result.set1OpponentScore)) {
          showToast(`Dupla ${pair.pair_order}: Set 1 tem um resultado inválido`, 'error');
          return;
        }

        if (!validateTennisSet(result.set2PairScore, result.set2OpponentScore)) {
          showToast(`Dupla ${pair.pair_order}: Set 2 tem um resultado inválido`, 'error');
          return;
        }

        const s1 = typeof result.set1PairScore === 'number' ? result.set1PairScore : 0;
        const s1o = typeof result.set1OpponentScore === 'number' ? result.set1OpponentScore : 0;
        const s2 = typeof result.set2PairScore === 'number' ? result.set2PairScore : 0;
        const s2o = typeof result.set2OpponentScore === 'number' ? result.set2OpponentScore : 0;

        const set1Won = s1 > s1o;
        const set2Won = s2 > s2o;
        const setsAfterTwo = (set1Won ? 1 : 0) + (set2Won ? 1 : 0);

        if (setsAfterTwo === 2 || setsAfterTwo === 0) {
          if (result.set3PairScore !== '' || result.set3OpponentScore !== '') {
            showToast(`Dupla ${pair.pair_order}: Set 3 não deve ser jogado quando o resultado já é 2-0`, 'error');
            return;
          }
        } else {
          if (result.set3PairScore === '' || result.set3OpponentScore === '') {
            showToast(`Dupla ${pair.pair_order}: Set 3 é obrigatório quando o resultado está 1-1`, 'error');
            return;
          }
          if (!validateTennisSet(result.set3PairScore, result.set3OpponentScore)) {
            showToast(`Dupla ${pair.pair_order}: Set 3 tem um resultado inválido`, 'error');
            return;
          }
        }

        try {
          const { setsWon, setsLost } = calculateSetsFromPartials(result);

          await ResultsService.create({
            game_id: gameId,
            pair_id: pair.id,
            set1_pair_score: typeof result.set1PairScore === 'number' ? result.set1PairScore : undefined,
            set1_opponent_score: typeof result.set1OpponentScore === 'number' ? result.set1OpponentScore : undefined,
            set2_pair_score: typeof result.set2PairScore === 'number' ? result.set2PairScore : undefined,
            set2_opponent_score: typeof result.set2OpponentScore === 'number' ? result.set2OpponentScore : undefined,
            set3_pair_score: typeof result.set3PairScore === 'number' ? result.set3PairScore : undefined,
            set3_opponent_score: typeof result.set3OpponentScore === 'number' ? result.set3OpponentScore : undefined,
            notes: result.notes || undefined,
          });

          totalSetsWon += setsWon;
          totalSetsLost += setsLost;
        } catch (err: any) {
          showToast(`Dupla ${pair.pair_order}: ${err.message}`, 'error');
          return;
        }
      }

      let teamPoints: number | null = null;

      if (game.phase === 'Liga de Clubes') {
        if (noShow) {
          teamPoints = 0;
        } else if (totalSetsWon > totalSetsLost) {
          teamPoints = 3;
        } else {
          teamPoints = 1;
        }
      } else if (game.phase === 'Torneio') {
        teamPoints = manualPoints;
      }

      await GamesService.update(gameId, {
        status: 'concluido',
        team_points: teamPoints,
        no_show: noShow,
      });

      setShowResultsForm(false);
      setPairResults({});
      setNoShow(false);
      setManualPoints(0);
      await loadData();
      showToast('Resultados guardados e pontos atualizados com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao registar resultados:', error);
      showToast(`Erro ao registar resultados: ${error.message || 'Erro desconhecido'}`, 'error');
    }
  };

  const updatePairResult = (
    pairId: string,
    field: 'set1PairScore' | 'set1OpponentScore' | 'set2PairScore' | 'set2OpponentScore' | 'set3PairScore' | 'set3OpponentScore' | 'notes',
    value: number | string
  ) => {
    setPairResults((prev) => ({
      ...prev,
      [pairId]: {
        ...(prev[pairId] || {
          set1PairScore: '',
          set1OpponentScore: '',
          set2PairScore: '',
          set2OpponentScore: '',
          set3PairScore: '',
          set3OpponentScore: '',
          notes: ''
        }),
        [field]: value,
      },
    }));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
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

  const getAvailabilityIcon = (status: string) => {
    switch (status) {
      case 'confirmo':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'nao_posso':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'talvez':
        return <HelpCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getAvailabilityLabel = (status: string) => {
    const labels = {
      confirmo: 'Confirma',
      nao_posso: 'Não pode',
      talvez: 'Talvez',
      sem_resposta: 'Sem resposta',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const confirmedPlayers = availabilities.filter((a) => a.status === 'confirmo');

  if (loading) {
    return (
      <Layout>
        <Header title="Jogo" />
        <div className="max-w-screen-sm mx-auto px-4 pt-4">
          <Loading text="A carregar jogo..." />
        </div>
      </Layout>
    );
  }

  if (!game) {
    return (
      <Layout>
        <Header title="Jogo" />
        <div className="max-w-screen-sm mx-auto px-4 pt-4">
          <Card>
            <p className="text-center text-gray-600">Jogo não encontrado</p>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNav={false}>
      <Header title="Detalhes do Jogo" />
      <div className="max-w-screen-sm mx-auto px-4 pt-4">
        <button
          onClick={() => navigate({ name: 'calendar' })}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="space-y-4 pb-4">
        <Card>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">{GamesService.formatRoundName(game.round_number)}</h1>
              {getStatusBadge(game.status)}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(game.game_date)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Users className="w-4 h-4" />
                <span className="font-medium">vs {game.opponent}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4" />
                <span>{game.location}</span>
              </div>
            </div>

            <Badge variant="default">{game.phase}</Badge>

            {game.status === 'concluido' && game.team_points !== null && game.team_points !== undefined && (
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Pontos da Equipa</span>
                  </div>
                  <Badge
                    variant={game.team_points >= 3 ? 'success' : game.team_points > 0 ? 'warning' : 'danger'}
                    size="sm"
                  >
                    {game.team_points} {game.team_points === 1 ? 'ponto' : 'pontos'}
                  </Badge>
                </div>
                {game.no_show && (
                  <p className="text-xs text-red-600 mt-2 text-center">
                    Falta de comparência
                  </p>
                )}
              </div>
            )}

            {game.status === 'concluido' && game.phase === 'Treino' && (
              <div className="pt-3 border-t border-gray-200">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <span className="text-sm text-gray-600">
                    Treino concluído (sem pontuação)
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {myAvailability && game.status === 'convocatoria_aberta' && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">A sua disponibilidade</h2>
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant={myAvailability.status === 'confirmo' ? 'success' : 'secondary'}
                onClick={() => handleAvailability('confirmo')}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Confirmo
              </Button>
              <Button
                size="sm"
                variant={myAvailability.status === 'talvez' ? 'success' : 'secondary'}
                onClick={() => handleAvailability('talvez')}
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                Talvez
              </Button>
              <Button
                size="sm"
                variant={myAvailability.status === 'nao_posso' ? 'danger' : 'secondary'}
                onClick={() => handleAvailability('nao_posso')}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Não posso
              </Button>
            </div>
          </Card>
        )}

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Disponibilidades ({availabilities.length})
          </h2>
          <div className="space-y-2">
            {availabilities.map((avail) => (
              <div key={avail.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  {getAvailabilityIcon(avail.status)}
                  <span className="text-sm font-medium text-gray-900">
                    {avail.player?.name || 'N/A'}
                  </span>
                </div>
                <span className="text-xs text-gray-600">
                  {getAvailabilityLabel(avail.status)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Confirmados:</span>
              <span className="font-medium text-green-600">{confirmedPlayers.length}</span>
            </div>
          </div>
        </Card>

        {pairs.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Duplas ({pairs.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pairs.map((pair) => (
                <div key={pair.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Dupla {pair.pair_order}
                    </span>
                    <Badge variant="default" size="sm">
                      {pair.total_points} pts
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div>
                      {pair.player1?.name} ({pair.player1?.federation_points} pts)
                    </div>
                    <div>
                      {pair.player2?.name} ({pair.player2?.federation_points} pts)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {results.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Resultados do Jogo
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map((result) => {
                const pair = pairs.find((p) => p.id === result.pair_id);
                return (
                  <div key={result.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <Badge variant="default" size="sm" className="mb-2">
                          Dupla {pair?.pair_order || '?'}
                        </Badge>
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{pair?.player1?.name || '?'}</div>
                          <div className="font-medium text-gray-900">{pair?.player2?.name || '?'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-600 mb-1">Resultado</div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700 font-bold">
                            {result.sets_won}
                          </span>
                          <span className="text-gray-400">-</span>
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-700 font-bold">
                            {result.sets_lost}
                          </span>
                        </div>
                      </div>
                    </div>

                    {(result.set1_pair_score !== null || result.set2_pair_score !== null) && (
                      <div className="pt-3 border-t border-gray-200">
                        <div className="text-xs font-semibold text-gray-600 mb-2">Parciais</div>
                        <div className="flex gap-2">
                          {result.set1_pair_score !== null && result.set1_opponent_score !== null && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-white rounded border border-gray-200">
                              <span className={`font-bold ${result.set1_pair_score > result.set1_opponent_score ? 'text-green-600' : 'text-gray-900'}`}>
                                {result.set1_pair_score}
                              </span>
                              <span className="text-gray-400">-</span>
                              <span className={`font-bold ${result.set1_opponent_score > result.set1_pair_score ? 'text-red-600' : 'text-gray-900'}`}>
                                {result.set1_opponent_score}
                              </span>
                            </div>
                          )}
                          {result.set2_pair_score !== null && result.set2_opponent_score !== null && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-white rounded border border-gray-200">
                              <span className={`font-bold ${result.set2_pair_score > result.set2_opponent_score ? 'text-green-600' : 'text-gray-900'}`}>
                                {result.set2_pair_score}
                              </span>
                              <span className="text-gray-400">-</span>
                              <span className={`font-bold ${result.set2_opponent_score > result.set2_pair_score ? 'text-red-600' : 'text-gray-900'}`}>
                                {result.set2_opponent_score}
                              </span>
                            </div>
                          )}
                          {result.set3_pair_score !== null && result.set3_opponent_score !== null && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-white rounded border border-gray-200">
                              <span className={`font-bold ${result.set3_pair_score > result.set3_opponent_score ? 'text-green-600' : 'text-gray-900'}`}>
                                {result.set3_pair_score}
                              </span>
                              <span className="text-gray-400">-</span>
                              <span className={`font-bold ${result.set3_opponent_score > result.set3_pair_score ? 'text-red-600' : 'text-gray-900'}`}>
                                {result.set3_opponent_score}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {result.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600">{result.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">TOTAL</span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-600 text-white font-bold">
                      {results.reduce((sum, r) => sum + r.sets_won, 0)}
                    </span>
                    <span className="text-gray-400">-</span>
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-600 text-white font-bold">
                      {results.reduce((sum, r) => sum + r.sets_lost, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {canManageTeam && (
          <Card>
            <Button
              fullWidth
              variant="primary"
              onClick={() => setShowCaptainArea(!showCaptainArea)}
              className="flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" />
              {showCaptainArea ? 'Ocultar Área de Gestão' : 'Mostrar Área de Gestão'}
            </Button>

            {showCaptainArea && (
              <div className="mt-4 space-y-3 pt-4 border-t border-gray-200">
                {game.status === 'convocatoria_aberta' && (
                  <Button fullWidth variant="warning" onClick={handleCloseCall}>
                    Fechar Convocatória
                  </Button>
                )}

                {game.status === 'convocatoria_fechada' && results.length === 0 && (
                  <Button fullWidth onClick={() => setShowPairsForm(!showPairsForm)}>
                    {showPairsForm ? 'Ocultar' : pairs.length > 0 ? 'Editar Duplas' : 'Definir Duplas'}
                  </Button>
                )}

                {pairs.length > 0 && game.status !== 'concluido' && results.length === 0 && (
                  <Button fullWidth variant="success" onClick={() => setShowResultsForm(!showResultsForm)}>
                    {showResultsForm ? 'Ocultar' : 'Registar Resultados'}
                  </Button>
                )}
              </div>
            )}
          </Card>
        )}

        {canManageTeam && showPairsForm && game.status === 'convocatoria_fechada' && !showPairsPreview && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Definir Duplas Manualmente</h2>
            <p className="text-sm text-gray-600 mb-4">
              Escolha os jogadores para cada dupla. O sistema ordenará automaticamente por pontos.
            </p>

            <div className="space-y-4 mb-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Dupla A</h3>
                <div className="space-y-2">
                  <select
                    value={pairCompositions.pairA.player1}
                    onChange={(e) => updatePairComposition('pairA', 'player1', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="">Selecione Jogador 1</option>
                    {confirmedPlayers.map((avail) => (
                      <option key={avail.player_id} value={avail.player_id}>
                        {avail.player?.name} ({avail.player?.federation_points} pts)
                      </option>
                    ))}
                  </select>
                  <select
                    value={pairCompositions.pairA.player2}
                    onChange={(e) => updatePairComposition('pairA', 'player2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="">Selecione Jogador 2</option>
                    {confirmedPlayers.map((avail) => (
                      <option key={avail.player_id} value={avail.player_id}>
                        {avail.player?.name} ({avail.player?.federation_points} pts)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Dupla B</h3>
                <div className="space-y-2">
                  <select
                    value={pairCompositions.pairB.player1}
                    onChange={(e) => updatePairComposition('pairB', 'player1', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="">Selecione Jogador 1</option>
                    {confirmedPlayers.map((avail) => (
                      <option key={avail.player_id} value={avail.player_id}>
                        {avail.player?.name} ({avail.player?.federation_points} pts)
                      </option>
                    ))}
                  </select>
                  <select
                    value={pairCompositions.pairB.player2}
                    onChange={(e) => updatePairComposition('pairB', 'player2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="">Selecione Jogador 2</option>
                    {confirmedPlayers.map((avail) => (
                      <option key={avail.player_id} value={avail.player_id}>
                        {avail.player?.name} ({avail.player?.federation_points} pts)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Dupla C (opcional)</h3>
                <div className="space-y-2">
                  <select
                    value={pairCompositions.pairC.player1}
                    onChange={(e) => updatePairComposition('pairC', 'player1', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="">Selecione Jogador 1</option>
                    {confirmedPlayers.map((avail) => (
                      <option key={avail.player_id} value={avail.player_id}>
                        {avail.player?.name} ({avail.player?.federation_points} pts)
                      </option>
                    ))}
                  </select>
                  <select
                    value={pairCompositions.pairC.player2}
                    onChange={(e) => updatePairComposition('pairC', 'player2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="">Selecione Jogador 2</option>
                    {confirmedPlayers.map((avail) => (
                      <option key={avail.player_id} value={avail.player_id}>
                        {avail.player?.name} ({avail.player?.federation_points} pts)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                fullWidth
                variant="secondary"
                onClick={() => {
                  setShowPairsForm(false);
                  setPairCompositions({
                    pairA: { player1: '', player2: '' },
                    pairB: { player1: '', player2: '' },
                    pairC: { player1: '', player2: '' },
                  });
                }}
              >
                Cancelar
              </Button>
              <Button fullWidth onClick={handlePreviewPairs}>
                Ver Preview
              </Button>
            </div>
          </Card>
        )}

        {canManageTeam && showPairsPreview && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Preview das Duplas Ordenadas</h2>
            <p className="text-sm text-gray-600 mb-4">
              As duplas foram ordenadas automaticamente por pontos (maior para menor):
            </p>

            <div className="space-y-3 mb-4">
              {getOrderedPairs().map((pair, index) => {
                const player1 = confirmedPlayers.find((p) => p.player_id === pair.player1);
                const player2 = confirmedPlayers.find((p) => p.player_id === pair.player2);
                return (
                  <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900">Dupla {index + 1}</h3>
                      <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-semibold">
                        {pair.points} pontos
                      </span>
                    </div>
                    <div className="text-gray-700">
                      <div className="font-medium">{player1?.player?.name} ({player1?.player?.federation_points} pts)</div>
                      <div className="font-medium">{player2?.player?.name} ({player2?.player?.federation_points} pts)</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Dupla original: {pair.name}</div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button
                fullWidth
                variant="secondary"
                onClick={() => setShowPairsPreview(false)}
              >
                Voltar
              </Button>
              <Button fullWidth variant="success" onClick={handleCreatePairs}>
                Confirmar Duplas
              </Button>
            </div>
          </Card>
        )}

        {canManageTeam && showResultsForm && pairs.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Registar Resultados</h2>
            <p className="text-sm text-gray-600 mb-4">
              Insira os parciais de cada set. O sistema calculará automaticamente o vencedor e atualizará os pontos.
            </p>
            <div className="space-y-4 mb-4">
              {pairs.map((pair) => {
                const result = pairResults[pair.id] || {
                  set1PairScore: '',
                  set1OpponentScore: '',
                  set2PairScore: '',
                  set2OpponentScore: '',
                  set3PairScore: '',
                  set3OpponentScore: '',
                  notes: ''
                };
                const s1 = typeof result.set1PairScore === 'number' ? result.set1PairScore : 0;
                const s1o = typeof result.set1OpponentScore === 'number' ? result.set1OpponentScore : 0;
                const s2 = typeof result.set2PairScore === 'number' ? result.set2PairScore : 0;
                const s2o = typeof result.set2OpponentScore === 'number' ? result.set2OpponentScore : 0;
                const set1Won = s1 > s1o;
                const set2Won = s2 > s2o;
                const setsAfterTwo = (set1Won ? 1 : 0) + (set2Won ? 1 : 0);
                const needsSet3 = setsAfterTwo === 1 && result.set1PairScore !== '' && result.set1OpponentScore !== '' && result.set2PairScore !== '' && result.set2OpponentScore !== '';

                return (
                  <div key={pair.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                    <div className="font-medium text-gray-900">
                      Dupla {pair.pair_order}
                      <div className="text-sm text-gray-600 mt-1">
                        {pair.player1?.name} + {pair.player2?.name}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Set 1
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="7"
                            placeholder="0"
                            value={result.set1PairScore}
                            onChange={(e) =>
                              updatePairResult(pair.id, 'set1PairScore', e.target.value === '' ? '' : parseInt(e.target.value))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold"
                          />
                          <span className="text-gray-500 font-bold">-</span>
                          <input
                            type="number"
                            min="0"
                            max="7"
                            placeholder="0"
                            value={result.set1OpponentScore}
                            onChange={(e) =>
                              updatePairResult(pair.id, 'set1OpponentScore', e.target.value === '' ? '' : parseInt(e.target.value))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Set 2
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="7"
                            placeholder="0"
                            value={result.set2PairScore}
                            onChange={(e) =>
                              updatePairResult(pair.id, 'set2PairScore', e.target.value === '' ? '' : parseInt(e.target.value))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold"
                          />
                          <span className="text-gray-500 font-bold">-</span>
                          <input
                            type="number"
                            min="0"
                            max="7"
                            placeholder="0"
                            value={result.set2OpponentScore}
                            onChange={(e) =>
                              updatePairResult(pair.id, 'set2OpponentScore', e.target.value === '' ? '' : parseInt(e.target.value))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Set 3 {needsSet3 ? '(obrigatório)' : '(opcional)'}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="7"
                            placeholder="0"
                            value={result.set3PairScore}
                            onChange={(e) =>
                              updatePairResult(pair.id, 'set3PairScore', e.target.value === '' ? '' : parseInt(e.target.value))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold"
                            disabled={!needsSet3 && setsAfterTwo === 2}
                          />
                          <span className="text-gray-500 font-bold">-</span>
                          <input
                            type="number"
                            min="0"
                            max="7"
                            placeholder="0"
                            value={result.set3OpponentScore}
                            onChange={(e) =>
                              updatePairResult(pair.id, 'set3OpponentScore', e.target.value === '' ? '' : parseInt(e.target.value))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold"
                            disabled={!needsSet3 && setsAfterTwo === 2}
                          />
                        </div>
                        {!needsSet3 && setsAfterTwo === 2 && (
                          <p className="text-xs text-gray-500 mt-1">Set 3 não necessário (resultado já decidido 2-0)</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Notas (opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Excelente jogo!"
                        value={result.notes}
                        onChange={(e) => updatePairResult(pair.id, 'notes', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                );
              })}

              {game.phase === 'Liga de Clubes' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noShow}
                      onChange={(e) => setNoShow(e.target.checked)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-blue-900">
                      Falta de comparência (0 pontos)
                    </span>
                  </label>
                  <p className="text-xs text-blue-700 mt-2">
                    {noShow
                      ? 'Equipa receberá 0 pontos'
                      : 'Pontos: Vitória = 3 pts | Derrota = 1 pt'}
                  </p>
                </div>
              )}

              {game.phase === 'Torneio' && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <label className="block text-sm font-medium text-purple-900 mb-2">
                    Pontos da Equipa
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={manualPoints}
                    onChange={(e) => setManualPoints(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-purple-300 rounded-lg"
                    placeholder="Insira os pontos"
                  />
                  <p className="text-xs text-purple-700 mt-2">
                    Insira manualmente os pontos da equipa neste torneio
                  </p>
                </div>
              )}

              {game.phase === 'Treino' && (
                <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg">
                  <p className="text-sm text-gray-600 text-center">
                    Treinos não atribuem pontos de classificação
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button fullWidth variant="secondary" onClick={() => setShowResultsForm(false)}>
                Cancelar
              </Button>
              <Button fullWidth variant="success" onClick={handleRegisterResults}>
                Guardar e Concluir Jogo
              </Button>
            </div>
          </Card>
        )}
      </div>

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
