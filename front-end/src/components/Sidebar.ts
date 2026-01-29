import { Component } from '../core/Component';
import template from './Sidebar.html';
import './sidebar.css';
import { AuthService } from '../services/AuthService';
import { app } from '../App';

export class Sidebar extends Component {
  private isDarkMode: boolean;
  private isProjectsExpanded = false;

  constructor(containerId: string) {
    super(containerId);
    // Carregar preferência de dark mode do localStorage
    this.isDarkMode = localStorage.getItem('darkMode') === 'true';
    this.applyDarkMode();
  }

  /**
   * Getter para obter usuário atual do AuthService (sempre atualizado)
   */
  private get currentUser() {
    return AuthService.user;
  }

  getTemplate(): string {
    return template;
  }

  protected afterRender(): void {
    this.bindEvents();
    this.setupUser();
    this.setupUsersMenuVisibility();
    this.initializeDarkMode();
    this.setupMobileToggle();
  }

  /**
   * Configura os event listeners dos botões e itens do menu
   */
  private bindEvents(): void {
    // Projects toggle
    const toggleProjectsBtn = this.container.querySelector('[data-action="toggle-projects"]');
    toggleProjectsBtn?.addEventListener('click', (e) => this.handleToggleProjects(e));

    // Menu items (Usuários)
    const menuItems = this.container.querySelectorAll('[data-action="menu-item"]');
    menuItems.forEach(item => {
      item.addEventListener('click', (e) => this.handleMenuClick(e));
    });

    // User name click -> goto profile
    const userNameEl = this.container.querySelector('[data-action="goto-profile"]');
    userNameEl?.addEventListener('click', () => this.handleGoToProfile());

    // Dark mode toggle
    const darkModeBtn = this.container.querySelector('[data-action="toggle-dark-mode"]');
    darkModeBtn?.addEventListener('click', () => this.handleDarkModeToggle());

    // Logout button
    const logoutBtn = this.container.querySelector('[data-action="logout"]');
    logoutBtn?.addEventListener('click', () => this.handleLogout());
  }

  /**
   * Configura o toggle de mobile (abrir/fechar sidebar)
   */
  private setupMobileToggle(): void {
    const toggleBtn = this.container.querySelector('#sidebarToggle');
    const overlay = this.container.querySelector('#sidebarOverlay');
    const sidebar = this.container.querySelector('#sidebar');
    const menuItems = this.container.querySelectorAll('[data-action="menu-item"], [data-action="toggle-projects"]');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        sidebar?.classList.toggle('sidebar-open');
        overlay?.classList.toggle('sidebar-overlay-active');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar?.classList.remove('sidebar-open');
        overlay.classList.remove('sidebar-overlay-active');
      });
    }

    // Fechar sidebar ao clicar em um item (mobile)
    menuItems.forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth < 1024) {
          sidebar?.classList.remove('sidebar-open');
          overlay?.classList.remove('sidebar-overlay-active');
        }
      });
    });

    // Fechar ao redimensionar para desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) {
        sidebar?.classList.remove('sidebar-open');
        overlay?.classList.remove('sidebar-overlay-active');
      }
    });
  }

  /**
   * Configura o nome do usuário na sidebar
   */
  private setupUser(): void {
    const userNameEl = this.container.querySelector('[data-bind="user-name"]');
    if (userNameEl && this.currentUser) {
      userNameEl.textContent = this.currentUser.name;
    }
  }

  /**
   * Mostra/esconde item "Usuários" baseado se o usuário é admin
   */
  private setupUsersMenuVisibility(): void {
    const usersItem = this.container.querySelector('[data-route="usuarios"]');
    if (usersItem) {
      // Verificar se o usuário é admin
      const isAdmin = AuthService.isAdmin();
      if (!isAdmin) {
        usersItem.classList.add('sidebar-item-hidden');
      } else {
        usersItem.classList.remove('sidebar-item-hidden');
      }
    }
  }

  /**
   * Inicializa o ícone do dark mode baseado no estado atual
   */
  private initializeDarkMode(): void {
    const darkModeBtn = this.container.querySelector('[data-action="toggle-dark-mode"]') as HTMLElement;
    if (darkModeBtn) {
      const icon = darkModeBtn.querySelector('.material-icons-outlined');
      if (icon) {
        icon.textContent = this.isDarkMode ? 'light_mode' : 'dark_mode';
      }
    }
  }

  /**
   * Alterna entre modo claro e escuro
   */
  private handleDarkModeToggle(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', String(this.isDarkMode));
    this.applyDarkMode();
    this.initializeDarkMode();
  }

  /**
   * Aplica ou remove a classe dark-mode ao HTML
   */
  private applyDarkMode(): void {
    const htmlElement = document.documentElement;
    if (this.isDarkMode) {
      htmlElement.classList.add('dark-mode');
    } else {
      htmlElement.classList.remove('dark-mode');
    }
  }

  /**
   * Alterna a expansão/colapso da lista de projetos
   */
  private handleToggleProjects(e: Event): void {
    e.preventDefault();
    
    const projectsBtn = e.currentTarget as HTMLElement;
    const projectsList = this.container.querySelector('#projects-list') as HTMLElement;
    const chevron = projectsBtn.querySelector('.sidebar-chevron') as HTMLElement;

    this.isProjectsExpanded = !this.isProjectsExpanded;

    if (this.isProjectsExpanded) {
      projectsList.style.display = 'block';
      chevron.textContent = 'expand_less';
      projectsBtn.classList.add('sidebar-item-active');
      this.populateProjectsList();
    } else {
      projectsList.style.display = 'none';
      chevron.textContent = 'expand_more';
      projectsBtn.classList.remove('sidebar-item-active');
    }
  }

  /**
   * Popula a lista de projetos do usuário
   * TODO: Integrar com API para buscar projetos reais
   */
  private populateProjectsList(): void {
    const projectsList = this.container.querySelector('#projects-list') as HTMLElement;
    
    // Placeholder - será integrado com API após pronto
    const mockProjects = [];

    // Se não houver projetos, mostrar opção de criar projeto
    if (mockProjects.length === 0) {
      projectsList.innerHTML = `
        <a href="#" class="sidebar-project-item" data-action="create-project">
          <span class="sidebar-project-name">Criar um Projeto</span>
        </a>
      `;

      // Adicionar event listener para criar projeto
      projectsList.querySelector('[data-action="create-project"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        app.navigate('/projetos/novo');
      });
    } else {
      projectsList.innerHTML = mockProjects
        .map(project => `
          <a href="#" class="sidebar-project-item" data-project-id="${project.id}">
            <span class="sidebar-project-name">${project.name}</span>
          </a>
        `)
        .join('');

      // Adicionar event listeners aos projetos
      projectsList.querySelectorAll('.sidebar-project-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const projectId = (e.currentTarget as HTMLElement).getAttribute('data-project-id');
          app.navigate(`/projetos/${projectId}`);
        });
      });
    }
  }

  /**
   * Trata cliques nos itens do menu (Usuários)
   */
  private handleMenuClick(e: Event): void {
    e.preventDefault();
    
    const target = e.currentTarget as HTMLElement;
    const route = target.getAttribute('data-route');

    if (!route) return;

    // Remover classe ativa de todos os itens
    const allItems = this.container.querySelectorAll('[data-action="menu-item"]');
    allItems.forEach(item => item.classList.remove('sidebar-item-active'));

    // Adicionar classe ativa ao item clicado
    target.classList.add('sidebar-item-active');

    // Navegar para a rota
    app.navigate(`/${route}`);
  }

  /**
   * Navega para a página de perfil do usuário
   */
  private handleGoToProfile(): void {
    if (this.currentUser) {
      app.navigate(`/perfil/${this.currentUser.id}`);
    }
  }

  /**
   * Faz logout do usuário
   */
  private async handleLogout(): Promise<void> {
    try {
      await AuthService.logout();
      localStorage.removeItem('user_data');
      app.navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

  /**
   * Define qual item do menu está ativo (usado para sincronizar com navegação)
   */
  public setActiveMenuItem(route: string): void {
    const allItems = this.container.querySelectorAll('[data-action="menu-item"]');
    allItems.forEach(item => {
      const itemRoute = item.getAttribute('data-route');
      if (itemRoute === route) {
        item.classList.add('sidebar-item-active');
      } else {
        item.classList.remove('sidebar-item-active');
      }
    });
  }
}
