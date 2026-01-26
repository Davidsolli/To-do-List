import { Router } from './core/Router';
import { routes } from './routes';

export class App {
  private router: Router;

  constructor() {
    // Inicializa o Router apontando para <div id="app"> no index.html
    this.router = new Router('app');
    
    // Carrega o mapa de rotas
    this.router.register(routes);
  }

  public start(): void {
    // Inicia a aplicação processando a URL atual
    this.router.handleRoute();
  }
}

// Singleton: Instância global exportada para usar router.navigate() em outros lugares
export const app = new App();