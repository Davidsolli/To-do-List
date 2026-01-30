import { RouteDefinition } from './core/Router';
import { Placeholder } from './views/Placeholder';
import { LoginView } from './views/Auth/LoginView';
import { RegisterView } from './views/Auth/RegisterView';
import { ProfileView } from './views/Profile/ProfileView';
import { DashboardView } from './views/Dashboard/DashboardView';
import { ProjectsView } from './views/Projects/ProjectsView';
import { ProjectDetailsView } from './views/ProjectDetails/ProjectDetailsView';

//roles possíveis: admin e user (padrão)
//protected - precisa de autenticação
export const routes: RouteDefinition[] = [
    { path: '/', view: DashboardView, protected: true },
    { path: '/login', view: LoginView },
    { path: '/register', view: RegisterView },
    { path: '/perfil', view: ProfileView, protected: true },
    { path: '/projetos', view: ProjectsView, protected: true },
    { path: '/projetos/:id', view: ProjectDetailsView, protected: true },
    { path: '/admin', view: Placeholder, protected: true, roles: ['admin'] },
];
