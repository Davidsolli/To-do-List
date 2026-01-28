import { Component } from './Component';
import { AuthService } from '../services/AuthService';


// Tipo que define uma Classe de Componente (o construtor)
export type ViewConstructor = new (containerId: string) => Component;

export interface RouteDefinition {
    path: string;
    view: ViewConstructor;
    protected?: boolean; // Novo flag
    roles?: string[]; // Role required
}



export class Router {
    private routes: RouteDefinition[] = [];

    constructor(private rootId: string) {
        // Escuta a navegação pelos botões "Voltar" e "Avançar" do navegador
        window.addEventListener('popstate', () => this.handleRoute());
    }

    /**
     * Registra a lista de rotas da aplicação
     */
    public register(routes: RouteDefinition[]): void {
        this.routes = routes;
    }

    /**
     * Navega para uma nova URL via código (ex: após login)
     */
    public navigate(path: string): void {
        window.history.pushState({}, '', path);
        this.handleRoute();
    }

    // Flag para saber se já tentamos restaurar a sessão ao carregar a página
    private sessionChecked = false;

    /**
     * Lógica principal: Descobre a rota atual e renderiza a View correspondente
     */
    public async handleRoute(): Promise<void> {
        const path = window.location.pathname;

        // Se é a primeira carga, tenta validar o cookie de sessão antes de qualquer coisa
        if (!this.sessionChecked) {
            await AuthService.verifySession();
            this.sessionChecked = true;
        }

        // Procura a rota exata ou usa a primeira como fallback (geralmente Login ou Home)
        const route = this.routes.find((r) => r.path === path) || this.routes[0];

        if (route) {
            const isAuth = AuthService.isAuthenticated();

            // 1. Verifica se a rota é protegida
            if (route.protected && !isAuth) {
                this.navigate('/login');
                return;
            }

            // 2. Verifica RBAC (Role Based Access Control)
            if (route.roles && route.roles.length > 0) {
                const user = AuthService.user;
                const hasRole = user && route.roles.includes(user.role);

                if (!hasRole) {
                    window.toast.error('Acesso negado: privilégios insuficientes.');
                    if (path !== '/dashboard') this.navigate('/dashboard');
                    return;
                }
            }

            // 1. Limpa o container principal
            const root = document.getElementById(this.rootId);
            if (root) root.innerHTML = '';

            // 2. Instancia a nova View
            const viewInstance = new route.view(this.rootId);

            // 3. Renderiza
            viewInstance.render();
        } else {

            console.error('Nenhuma rota encontrada para:', path);
        }
    }

}