import { Component } from './Component';

// Tipo que define uma Classe de Componente (o construtor)
export type ViewConstructor = new (containerId: string) => Component;

export interface RouteDefinition {
  path: string;
  view: ViewConstructor;
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

  /**
   * Lógica principal: Descobre a rota atual e renderiza a View correspondente
   */
  public handleRoute(): void {
    const path = window.location.pathname;

    // Procura a rota exata ou usa a primeira como fallback (geralmente Login ou Home)
    const route = this.routes.find((r) => r.path === path) || this.routes[0];

    if (route) {
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