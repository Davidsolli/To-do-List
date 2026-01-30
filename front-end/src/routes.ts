import { RouteDefinition } from './core/Router';
// Importaremos as Views reais aqui depois. Por enquanto usamos o Placeholder.
import { Placeholder } from './views/Placeholder';
import { LoginView } from './views/Auth/LoginView';
import { RegisterView } from './views/Auth/RegisterView';
import { ProjectView } from './views/Project/ProjectView'; // Lista de projetos
import { KanbanView } from './views/Project/KanbanView';

//roles possíveis: admin e user (padrão)
//protected - precisa de autenticação
export const routes: RouteDefinition[] = [
    { path: '/', view: Placeholder, protected: true },
    { path: '/login', view: LoginView },
    { path: '/register', view: RegisterView },
    { path: '/admin', view: Placeholder, protected: true, roles: ['admin'] },
    { path: '/projects', view: ProjectView, protected: true },
    { path: '/project', view: KanbanView, protected: true },
];