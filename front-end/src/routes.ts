import { RouteDefinition } from './core/Router';
// Importaremos as Views reais aqui depois. Por enquanto usamos o Placeholder.
import { Placeholder } from './views/Placeholder'; 
import { LoginView } from './views/Auth/LoginView'; 
import { RegisterView } from './views/Auth/RegisterView';

export const routes: RouteDefinition[] = [
  { path: '/', view: LoginView },         
  { path: '/login', view: LoginView },    
  { path: '/register', view: RegisterView },
  { path: '/dashboard', view: Placeholder } 
];