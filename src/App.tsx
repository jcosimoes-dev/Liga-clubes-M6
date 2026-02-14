import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { HomeScreen } from './screens/HomeScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { GameDetailScreen } from './screens/GameDetailScreen';
import { TeamScreen } from './screens/TeamScreen';
import { AdminScreen } from './screens/AdminScreen';
import { BootstrapScreen } from './screens/BootstrapScreen';
import { CompleteProfileScreen } from './screens/CompleteProfileScreen';
import { Loading } from './components/ui';

function AppRouter() {
  const { user, player, loading } = useAuth();
  const { currentRoute, navigate } = useNavigation();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (currentRoute.name !== 'login' && currentRoute.name !== 'register') {
        navigate({ name: 'login' });
      }
    } else {
      if (player && player.profile_completed === false && currentRoute.name !== 'complete-profile') {
        navigate({ name: 'complete-profile' });
      } else if (currentRoute.name === 'login' || currentRoute.name === 'register') {
        navigate({ name: 'home' });
      }
    }
  }, [user, player, loading, currentRoute, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading text="A carregar..." />
      </div>
    );
  }

  console.log('[App] Rota actual:', currentRoute.name);

  switch (currentRoute.name) {
    case 'login':
      return <LoginScreen />;
    case 'register':
      return <RegisterScreen />;
    case 'bootstrap':
      console.log('[App] Renderizando BootstrapScreen');
      return <BootstrapScreen />;
    case 'complete-profile':
      return <CompleteProfileScreen />;
    case 'home':
      return <HomeScreen />;
    case 'calendar':
      return <CalendarScreen />;
    case 'history':
      return <HistoryScreen />;
    case 'game':
      return <GameDetailScreen gameId={currentRoute.params.id} />;
    case 'team':
      return <TeamScreen />;
    case 'admin':
      return <AdminScreen />;
    default:
      return <HomeScreen />;
  }
}

function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <AppRouter />
      </NavigationProvider>
    </AuthProvider>
  );
}

export default App;
