import { Home, Calendar, Users, Settings, LogOut, History } from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';
import { useAuth } from '../../contexts/AuthContext';

export function BottomNav() {
  const { currentRoute, navigate } = useNavigation();
  const { isAdmin, player, signOut } = useAuth();

  console.log('[BottomNav] isAdmin:', isAdmin);
  console.log('[BottomNav] player?.role:', player?.role);
  console.log('[BottomNav] player:', player);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const navItems = [
    { name: 'home' as const, icon: Home, label: 'Início' },
    { name: 'calendar' as const, icon: Calendar, label: 'Calendário' },
    { name: 'history' as const, icon: History, label: 'Histórico' },
    { name: 'team' as const, icon: Users, label: 'Equipa' },
  ];

  if (isAdmin || player?.role === 'admin') {
    navItems.push({ name: 'admin' as const, icon: Settings, label: 'Admin' });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16 max-w-screen-sm mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute.name === item.name;

          return (
            <button
              key={item.name}
              onClick={() => navigate({ name: item.name })}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-1 h-full transition-colors text-gray-600 hover:text-red-600"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-xs mt-1">Sair</span>
        </button>
      </div>
    </nav>
  );
}
