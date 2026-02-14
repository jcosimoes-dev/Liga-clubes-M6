import { useState, FormEvent } from 'react';
import { Layout } from '../components/layout/Layout';
import { Input, Button, Card } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { ArrowLeft, User, Mail, Lock, Star, Phone } from 'lucide-react';

export function RegisterScreen() {
  const { signUp } = useAuth();
  const { navigate } = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [preferredSide, setPreferredSide] = useState('both');
  const [federationPoints, setFederationPoints] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Por favor insira o seu nome');
      return;
    }

    if (password.length < 8) {
      setError('Password deve ter pelo menos 8 caracteres');
      return;
    }

    const points = parseInt(federationPoints) || 0;
    if (points < 0) {
      setError('Pontos não podem ser negativos');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(email, password, name.trim(), phone.trim(), preferredSide, points);

      if (result.error) {
        const errorMsg = result.error.message;
        if (errorMsg.includes('User already registered') || errorMsg.includes('user_already_exists')) {
          setError('Este email já está registado. Tente fazer login.');
        } else if (errorMsg.includes('Password should be at least') || errorMsg.includes('weak password')) {
          setError('Password muito fraca. Use pelo menos 8 caracteres com letras, números e símbolos.');
        } else if (errorMsg.includes('breach') || errorMsg.includes('violated') || errorMsg.includes('compromised')) {
          setError('Esta password foi comprometida em violações de dados. Por favor escolha outra password.');
        } else if (errorMsg.includes('email')) {
          setError('Email inválido. Verifique o endereço de email.');
        } else {
          setError(errorMsg);
        }
      } else {
        navigate({ name: 'home' });
      }
    } catch (err: unknown) {
      console.error('Erro ao criar conta:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar conta';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showNav={false}>
      <div className="flex flex-col min-h-[calc(100vh-8rem)] px-4">
        <button
          onClick={() => navigate({ name: 'login' })}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 mt-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar Conta</h1>
              <p className="text-gray-600">Junte-se à 🎾 Equipa M6 APC Nome Patrocínio</p>
            </div>

            <Card>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Nome</span>
                    </div>
                  </label>
                  <Input
                    type="text"
                    placeholder="João Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    className="text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>Email</span>
                    </div>
                  </label>
                  <Input
                    type="email"
                    placeholder="exemplo@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>Telemóvel</span>
                    </div>
                  </label>
                  <Input
                    type="tel"
                    placeholder="912345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    autoComplete="tel"
                    className="text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      <span>Palavra-passe</span>
                    </div>
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="text-base"
                  />
                  <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres. Use uma password forte e única.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lado Preferido
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="preferred_side"
                        value="right"
                        checked={preferredSide === 'right'}
                        onChange={(e) => setPreferredSide(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-700">Jogador Direita</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="preferred_side"
                        value="left"
                        checked={preferredSide === 'left'}
                        onChange={(e) => setPreferredSide(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-700">Jogador Esquerda</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="preferred_side"
                        value="both"
                        checked={preferredSide === 'both'}
                        onChange={(e) => setPreferredSide(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-700">Ambos os Lados</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span>Pontos Actuais</span>
                    </div>
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={federationPoints}
                    onChange={(e) => setFederationPoints(e.target.value)}
                    min="0"
                    required
                    className="text-base"
                  />
                  <p className="text-xs text-gray-500 mt-1">Pontos de Federação</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <Button type="submit" fullWidth disabled={loading} size="lg">
                  {loading ? 'A criar conta...' : 'Criar Conta'}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
