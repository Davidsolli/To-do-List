import { Component } from './Component';
import { AuthService } from '../services/AuthService';
import { Sidebar } from '../components/Sidebar';


// Tipo que define uma Classe de Componente (o construtor)
export type ViewConstructor = new (containerId: string, params?: Record<string, string>) => Component;

export interface RouteDefinition {
    path: string;
    view: ViewConstructor;
    protected?: boolean; // Novo flag
    roles?: string[]; // Role required
}

// Interface para resultado do matching de rota
interface RouteMatch {
    route: RouteDefinition;
    params: Record<string, string>;
}



export class Router {
    private routes: RouteDefinition[] = [];
    private sidebarInstance: Sidebar | null = null;
    private basePath: string = '/server02'; // Base path para deployment em subdiretório

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
        // Adiciona o basePath ao path para manter o prefixo /server02
        const fullPath = this.basePath + path;
        window.history.pushState({}, '', fullPath);
        this.handleRoute();
    }

    // Flag para saber se já tentamos restaurar a sessão ao carregar a página
    private sessionChecked = false;

    /**
     * Verifica se um path corresponde a um padrão de rota e extrai parâmetros
     */
    private matchRoute(pattern: string, path: string): RouteMatch | null {
        // Escapar caracteres especiais e converter :param em grupo de captura
        const regexPattern = pattern
            .replace(/\//g, '\\/') // Escapar barras
            .replace(/:([^\/]+)/g, '([^/]+)'); // Converter :param em grupo de captura

        const regex = new RegExp(`^${regexPattern}$`);
        const match = path.match(regex);

        if (!match) return null;

        // Extrair nomes dos parâmetros
        const paramNames: string[] = [];
        const paramRegex = /:([^\/]+)/g;
        let paramMatch;
        while ((paramMatch = paramRegex.exec(pattern)) !== null) {
            paramNames.push(paramMatch[1]);
        }

        // Construir objeto de parâmetros
        const params: Record<string, string> = {};
        paramNames.forEach((name, index) => {
            params[name] = match[index + 1];
        });

        return { route: this.routes.find(r => r.path === pattern)!, params };
    }

    /**
     * Lógica principal: Descobre a rota atual e renderiza a View correspondente
     */
    public async handleRoute(): Promise<void> {
        let path = window.location.pathname;
        
        // Remove o basePath para fazer o matching com as rotas definidas
        if (this.basePath && path.startsWith(this.basePath)) {
            path = path.substring(this.basePath.length) || '/';
        }

        // Se é a primeira carga, tenta validar o cookie de sessão antes de qualquer coisa
        if (!this.sessionChecked) {
            await AuthService.verifySession();
            this.sessionChecked = true;
        }

        // Procura a rota (com suporte a parâmetros dinâmicos)
        let routeMatch: RouteMatch | null = null;

        for (const routeDef of this.routes) {
            const match = this.matchRoute(routeDef.path, path);
            if (match) {
                routeMatch = match;
                break;
            }
        }

        // Se não encontrou, usa a primeira rota como fallback
        if (!routeMatch) {
            routeMatch = { route: this.routes[0], params: {} };
        }

        const route = routeMatch.route;
        const params = routeMatch.params;

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

            // 3. Instancia a nova View passando os parâmetros
            const viewInstance = new route.view(this.rootId, params);

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