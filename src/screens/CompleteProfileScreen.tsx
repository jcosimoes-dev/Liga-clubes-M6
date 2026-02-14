import { useState } from 'react';
import { Card, Button, Input } from '../components/ui';
import { User, Trophy, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PlayersService } from '../services';
import { supabase } from '../lib/supabase';

export function CompleteProfileScreen() {
  const { player, refreshPlayer } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    phone: '',
    federation_points: 0,
    preferred_side: 'right' as 'left' | 'right' | 'both',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!player?.id) {
        throw new Error('Jogador não encontrado');
      }

      await PlayersService.updateProfile(player.id, {
        ...form,
        name: player.name,
      });

      await supabase
        .from('players')
        .update({ profile_completed: true })
        .eq('id', player.id);

      await refreshPlayer();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar perfil');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo, {player?.name}!
          </h1>
          <p className="text-gray-600">
            Complete o seu perfil para começar
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                  {player?.name}
                </div>
              </div>

              <Input
                label="Telefone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="912345678"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Pontos de Federação
                  </div>
                </label>
                <Input
                  type="number"
                  value={form.federation_points}
                  onChange={(e) => setForm({ ...form, federation_points: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lado Preferencial
                </label>
                <select
                  value={form.preferred_side}
                  onChange={(e) => setForm({ ...form, preferred_side: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="left">Esquerda</option>
                  <option value="right">Direita</option>
                  <option value="both">Ambos os lados</option>
                </select>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'A guardar...' : 'Guardar e Continuar'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
