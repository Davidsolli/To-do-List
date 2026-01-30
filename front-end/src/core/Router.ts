import { Component } from './Component';
import { AuthService } from '../services/AuthService';
import { Sidebar } from '../components/Sidebar';


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
    private sidebarInstance: Sidebar | null = null;

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
                    if (path !== '/dashboard') this.navigate('/');
                    return;
                }
            }

            // 1. Limpa o container principal
            const root = document.getElementById(this.rootId);
            if (root) root.innerHTML = '';

            // 2. Renderiza sidebar se for rota protegida
            if (route.protected && !['/login', '/register'].includes(path)) {
                this.renderSidebar();
            } else {
                // Remove sidebar se não é rota protegida
                this.removeSidebar();
            }

            // 3. Instancia a nova View
            const viewInstance = new route.view(this.rootId);

            // 4. Renderiza
            viewInstance.render();

            // 5. Sincroniza o sidebar com a rota atual
            if (this.sidebarInstance) {
                const routeName = path.substring(1) || 'projetos'; // Remove a barra inicial
                this.sidebarInstance.setActiveMenuItem(routeName);
            }
        } else {

            console.error('Nenhuma rota encontrada para:', path);
        }
    }

    private resizeListener: (() => void) | null = null;

    /**
     * Renderiza a sidebar
     */
    private renderSidebar(): void {
        // Usa o container que já existe no index.html
        let sidebarContainer = document.getElementById('sidebar-container');
        if (!sidebarContainer) {
            sidebarContainer = document.createElement('div');
            sidebarContainer.id = 'sidebar-container';
            document.body.insertBefore(sidebarContainer, document.body.firstChild);
        }

        // Se já existe uma instância, não renderiza novamente (evita duplicação)
        if (this.sidebarInstance) {
            return;
        }

        // Limpar listener anterior se existir (segurança)
        if (this.resizeListener) {
            window.removeEventListener('resize', this.resizeListener);
            this.resizeListener = null;
        }

        // Renderiza nova instância da sidebar
        this.sidebarInstance = new Sidebar('sidebar-container');
        this.sidebarInstance.render();

        // Adiciona padding ao app container para não sobrepor com a sidebar
        const appRoot = document.getElementById(this.rootId);
        if (appRoot) {
            appRoot.style.marginLeft = '16rem'; // Corresponde à largura da sidebar
        }

        // Responsividade: remover margin em telas pequenas e adicionar margin top
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                if (appRoot) {
                    appRoot.style.marginLeft = '0';
                    appRoot.style.marginTop = '4rem'; // Altura do header mobile
                }
            } else {
                if (appRoot) {
                    appRoot.style.marginLeft = '16rem';
                    appRoot.style.marginTop = '0';
                }
            }
        };

        this.resizeListener = handleResize;
        window.addEventListener('resize', handleResize);
        handleResize(); // Chamar uma vez ao renderizar
    }

    /**
     * Remove a sidebar e limpa os eventos
     */
    private removeSidebar(): void {
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) {
            sidebarContainer.innerHTML = '';
        }

        // Remover listener de resize para não afetar outras páginas (ex: Login)
        if (this.resizeListener) {
            window.removeEventListener('resize', this.resizeListener);
            this.resizeListener = null;
        }

        const appRoot = document.getElementById(this.rootId);
        if (appRoot) {
            appRoot.style.marginLeft = '';
            appRoot.style.marginTop = '';
        }

        this.sidebarInstance = null;
    }

    /**
     * Retorna a instância atual da sidebar
     */
    public get sidebar(): Sidebar | null {
        return this.sidebarInstance;
    }

}