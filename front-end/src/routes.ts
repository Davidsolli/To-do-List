import { RouteDefinition } from './core/Router';
// Importaremos as Views reais aqui depois. Por enquanto usamos o Placeholder.
import { Placeholder } from './views/Placeholder'; 

export const routes: RouteDefinition[] = [
  { path: '/', view: Placeholder },         // Será LoginView
  { path: '/login', view: Placeholder },    // Será LoginView
  { path: '/register', view: Placeholder }, // Será RegisterView
  { path: '/dashboard', view: Placeholder } // Será DashboardView
];