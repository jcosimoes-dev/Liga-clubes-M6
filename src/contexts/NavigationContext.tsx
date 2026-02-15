import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Route =
  | { name: 'login' }
  | { name: 'register' }
  | { name: 'bootstrap' }
  | { name: 'complete-profile' }
  | { name: 'home' }
  | { name: 'calendar' }
  | { name: 'history' }
  | { name: 'game'; params: { id: string } }
  | { name: 'team' }
  | { name: 'admin' };

interface NavigationContextType {
  currentRoute: Route;
  navigate: (route: Route) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

function parseHash(hash: string): Route {
  if (!hash || hash === '#') return { name: 'home' };

  const path = hash.startsWith('#') ? hash.substring(1) : hash;
  const [routeName, ...params] = path.split('/');

  switch (routeName) {
    case 'login':
      return { name: 'login' };
    case 'register':
      return { name: 'register' };
    case 'bootstrap':
      return { name: 'bootstrap' };
    case 'complete-profile':
      return { name: 'complete-profile' };
    case 'home':
      return { name: 'home' };
    case 'calendar':
      return { name: 'calendar' };
    case 'history':
      return { name: 'history' };
    case 'game':
      return { name: 'game', params: { id: params[0] || '' } };
    case 'team':
      return { name: 'team' };
    case 'admin':
      return { name: 'admin' };
    default:
      return { name: 'home' };
  }
}

function routeToHash(route: Route): string {
  switch (route.name) {
    case 'login':
      return '#login';
    case 'register':
      return '#register';
    case 'bootstrap':
      return '#bootstrap';
    case 'complete-profile':
      return '#complete-profile';
    case 'home':
      return '#home';
    case 'calendar':
      return '#calendar';
    case 'history':
      return '#history';
    case 'game':
      return `#game/${route.params.id}`;
    case 'team':
      return '#team';
    case 'admin':
      return '#admin';
    default:
      return '#home';
  }
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentRoute, setCurrentRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(parseHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (route: Route) => {
    const hash = routeToHash(route);
    window.location.hash = hash;
  };

  return (
    <NavigationContext.Provider value={{ currentRoute, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useNavigation must be used within NavigationProvider');
  return context;
}