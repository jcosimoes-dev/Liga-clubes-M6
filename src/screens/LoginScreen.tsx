import { useState, FormEvent } from 'react';
import { Layout } from '../components/layout/Layout';
import { Input, Button, Card, Toast, ToastType } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { User, Lock } from 'lucide-react';

export function LoginScreen() {
  const { signIn } = useAuth();
  const { navigate } = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate( 'home' );
    } catch (err) {
      setError('Email ou password incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showNav={false}>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">🎾 Equipa M6 APC Nome Patrocínio</h1>
            <p className="text-lg text-gray-600">Gestão da equipa e dos jogos</p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
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
                  autoComplete="current-password"
                  className="text-base"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button type="submit" fullWidth disabled={loading} size="lg">
                {loading ? 'A entrar...' : 'Entrar'}
              </Button>

              <div className="pt-4 space-y-2 text-center border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate({ name: 'register' })}
                  className="block w-full text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Criar conta
                </button>
                <button
                  type="button"
                  onClick={() => showToast('Funcionalidade em desenvolvimento', 'info')}
                  className="block w-full text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Esqueci-me da palavra-passe
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </Layout>
  );
}
