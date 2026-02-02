import { Component } from '../core/Component';
import template from './Sidebar.html';
import './sidebar.css';
import { AuthService } from '../services/AuthService';
import { ProjectService } from '../services/ProjectService';
import { NotificationService } from '../services/NotificationService';
import { NotificationPopup } from './NotificationPopup/NotificationPopup';
import { app } from '../App';


export class Sidebar extends Component {
  private isDarkMode: boolean;
  private isProjectsExpanded = false;
  private notificationPopup: NotificationPopup | null = null;
  private notificationPollInterval: number | null = null;

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
    this.setupNotifications();
  }

  /**
   * Configura o sistema de notificações
   */
  private setupNotifications(): void {
    // Criar o popup de notificações
    const popupContainer = this.container.querySelector('#notification-popup-container');
    if (popupContainer) {
      this.notificationPopup = new NotificationPopup(popupContainer as HTMLElement);
    }

    // Bind click handlers para abrir o popup
    const notificationBtn = this.container.querySelector('#notificationToggle');
    notificationBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleNotificationPopup();
    });

    const mobileNotificationBtn = this.container.querySelector('#mobileNotificationToggle');
    mobileNotificationBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleNotificationPopup();
    });

    // O NotificationPopup já cuida de atualizar os badges via polling

    // Fechar popup ao clicar fora
    document.addEventListener('click', (e) => {
      if (this.notificationPopup?.isVisible()) {
        const target = e.target as HTMLElement;
        if (!target.closest('.notification-popup') && !target.closest('#notificationToggle') && !target.closest('#mobileNotificationToggle')) {
          this.notificationPopup.hide();
        }
      }
    });
  }

  private toggleNotificationPopup(): void {
    if (this.notificationPopup) {
      if (this.notificationPopup.isVisible()) {
        this.notificationPopup.hide();
      } else {
        this.notificationPopup.show();
      }
    }
  }

  /**
   * Método público para atualizar as notificações manualmente
   */
  public refreshNotifications(): void {
    if (this.notificationPopup) {
      this.notificationPopup.refresh();
    }
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

    // Logo click -> go home
    const logoEls = this.container.querySelectorAll('[data-action="go-home"]');
    logoEls.forEach(el => {
      el.addEventListener('click', () => {
        app.navigate('/');
        // Mobile handling
        if (window.innerWidth < 1024) {
          const sidebar = this.container.querySelector('#sidebar');
          const overlay = this.container.querySelector('#sidebarOverlay');
          sidebar?.classList.remove('sidebar-open');
          overlay?.classList.remove('sidebar-overlay-active');
        }
      });
    });
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
      item.addEventListener('click', (e) => {
        if (window.innerWidth < 1024) {
          // Se for o toggle de projetos, verificar se foi na setinha
          // Isso permite expandir o menu sem fechar a sidebar
          if (item.getAttribute('data-action') === 'toggle-projects') {
            return;
          }

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
  /**
   * Configura os dados do usuário na sidebar (nome, email, avatar)
   */
  private setupUser(): void {
    if (!this.currentUser) return;

    // Nome
    const userNameEl = this.container.querySelector('[data-bind="user-name"]');
    if (userNameEl) {
      userNameEl.textContent = this.currentUser.name;
    }

    // Email
    const userEmailEl = this.container.querySelector('[data-bind="user-email"]');
    if (userEmailEl) {
      userEmailEl.textContent = this.currentUser.email;
    }

    // Avatar (Inicial)
    const userInitialEl = this.container.querySelector('[data-bind="user-initial"]');
    if (userInitialEl) {
      const initial = this.currentUser.name.charAt(0).toUpperCase();
      userInitialEl.textContent = initial;
    }
  }

  /**
   * Mostra/esconde item "Usuários" baseado se o usuário é admin
   * e esconde outros itens quando é admin do sistema
   */
  private setupUsersMenuVisibility(): void {
    const isAdmin = AuthService.isAdmin();
    
    const usersItem = this.container.querySelector('[data-route="usuarios"]');
    if (usersItem) {
      if (!isAdmin) {
        usersItem.classList.add('sidebar-item-hidden');
      } else {
        usersItem.classList.remove('sidebar-item-hidden');
      }
    }

    // Se for admin do sistema, esconder itens não relevantes
    if (isAdmin) {
      // Ocultar itens do menu
      const dashboardItem = this.container.querySelector('[data-route=""]');
      const myTasksItem = this.container.querySelector('[data-route="minhas-tarefas"]');
      const notificationsItem = this.container.querySelector('[data-route="notificacoes"]');
      const projectsSection = this.container.querySelector('.sidebar-projects');
      
      if (dashboardItem) dashboardItem.classList.add('sidebar-item-hidden');
      if (myTasksItem) myTasksItem.classList.add('sidebar-item-hidden');
      if (notificationsItem) notificationsItem.classList.add('sidebar-item-hidden');
      if (projectsSection) (projectsSection as HTMLElement).style.display = 'none';

      // Ocultar botões de notificação (desktop e mobile)
      const notificationBtn = this.container.querySelector('#notificationToggle');
      const mobileNotificationBtn = this.container.querySelector('#mobileNotificationToggle');
      
      if (notificationBtn) (notificationBtn as HTMLElement).style.display = 'none';
      if (mobileNotificationBtn) (mobileNotificationBtn as HTMLElement).style.display = 'none';
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
   * Alterna a expansão/colapso da lista de projetos OU navega para /projetos
   */
  private handleToggleProjects(e: Event): void {
    e.preventDefault();

    const target = e.target as HTMLElement;
    const projectsBtn = e.currentTarget as HTMLElement;
    const projectsList = this.container.querySelector('#projects-list') as HTMLElement;
    const chevron = projectsBtn.querySelector('.sidebar-chevron') as HTMLElement;

    // Se clicou na seta (chevron ou seu container), apenas toggle
    const isChevronClick = target.classList.contains('sidebar-chevron') ||
      target.classList.contains('sidebar-chevron-container') ||
      target.closest('.sidebar-chevron-container');

    if (isChevronClick) {
      // Apenas expande/colapsa
      this.isProjectsExpanded = !this.isProjectsExpanded;

      if (this.isProjectsExpanded) {
        projectsList.style.display = 'block';
        chevron.textContent = 'expand_less';
        this.populateProjectsList();
      } else {
        projectsList.style.display = 'none';
        chevron.textContent = 'expand_more';
      }
    } else {
      // Clicou no texto/ícone - navega para /projetos
      app.navigate('/projetos');

      // Fechar sidebar no mobile
      if (window.innerWidth < 1024) {
        const sidebar = this.container.querySelector('#sidebar');
        const overlay = this.container.querySelector('#sidebarOverlay');
        sidebar?.classList.remove('sidebar-open');
        overlay?.classList.remove('sidebar-overlay-active');
      }
    }
  }

  /**
   * Popula a lista de projetos do usuário
   * TODO: Integrar com API para buscar projetos reais
   */
  /**
   * Popula a lista de projetos do usuário
   */
  private async populateProjectsList(): Promise<void> {
    const projectsList = this.container.querySelector('#projects-list') as HTMLElement;

    try {
      projectsList.innerHTML = '<div style="padding: 10px; color: var(--text-tertiary);">Carregando...</div>';

      const projects = await ProjectService.getUserProjects();

      // Se não houver projetos, mostrar mensagem não clicável
      if (projects.length === 0) {
        projectsList.innerHTML = `
            <span class="sidebar-project-name" style="font-style: italic;">Nenhum projeto</span>
        `;

        // Adicionar event listener para criar projeto (agora embaixo da mensagem)
        projectsList.querySelector('[data-action="create-project"]')?.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleCreateProject();
        });

      } else {
        projectsList.innerHTML = projects
          .map(project => `
            <a href="#" class="sidebar-project-item" data-project-id="${project.id}">
              <span class="sidebar-project-name">${project.name}</span>
            </a>
          `)
          .join('');

        // Adicionar event listeners aos projetos
        projectsList.querySelectorAll('.sidebar-project-item[data-project-id]').forEach(item => {
          item.addEventListener('click', (e) => {
            e.preventDefault();
            const projectId = (e.currentTarget as HTMLElement).getAttribute('data-project-id');
            console.log('[Sidebar] Clicked project. ID:', projectId);
            if (projectId) {
              const navUrl = `/projetos/${projectId}`;
              console.log('[Sidebar] Navigating to:', navUrl);
              app.navigate(navUrl);
            } else {
              console.error('[Sidebar] Project ID missing in click!');
            }
          });
        });
      }
    } catch (error) {
      console.error(error);
      projectsList.innerHTML = '<div style="padding: 10px; color: red;">Erro ao carregar.</div>';
    }
  }

  /**
   * Método público para recarregar a lista de projetos
   * Usado quando criar/editar/excluir um projeto
   */
  public async refreshProjectsList(): Promise<void> {
    // Se a lista estiver expandida, recarrega
    if (this.isProjectsExpanded) {
      await this.populateProjectsList();
    }
  }

  private async handleCreateProject(): Promise<void> {
    const name = prompt('Nome do novo projeto:');
    if (name) {
      try {
        await ProjectService.createProject(name);
        window.toast.success('Projeto criado!');
        this.populateProjectsList(); // Recarrega a lista
      } catch (err) {
        window.toast.error('Erro ao criar projeto.');
      }
    }
  }


  /**
   * Trata cliques nos itens do menu (Usuários)
   */
  private handleMenuClick(e: Event): void {
    e.preventDefault();

    const target = e.currentTarget as HTMLElement;
    const route = target.getAttribute('data-route');

    // Verificar se route é null/undefined (não apenas vazio, pois "" é válido para Dashboard)
    if (route === null) return;

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
      app.navigate(`/perfil`);
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
    const allItems = this.container.querySelectorAll('[data-action="menu-item"], [data-action="toggle-projects"]');
    let foundMainItem = false;

    // Remover active de todos os itens primeiro
    allItems.forEach(item => item.classList.remove('sidebar-item-active'));

    // Remover active de todos os projetos do submenu
    const projectItems = this.container.querySelectorAll('.sidebar-project-item');
    projectItems.forEach(item => item.classList.remove('sidebar-project-item-active'));

    // Verificar se é uma rota de projeto individual
    if (route.startsWith('projetos/')) {
      const parts = route.split('/');
      const projectId = parts[1];
      if (projectId) {
        this.expandAndHighlightProject(projectId);
        return;
      }
    }

    // Para outras rotas, buscar o item correspondente
    allItems.forEach(item => {
      const itemRoute = item.getAttribute('data-route');
      if (itemRoute === route) {
        item.classList.add('sidebar-item-active');
        foundMainItem = true;
      }
    });
  }

  /**
   * Expande a lista de projetos e destaca o projeto atual
   */
  private async expandAndHighlightProject(projectId: string): Promise<void> {
    // 1. Garantir que a lista esteja expandida e carregada
    if (!this.isProjectsExpanded) {
      this.isProjectsExpanded = true;

      const projectsList = this.container.querySelector('#projects-list') as HTMLElement;
      const chevron = this.container.querySelector('.sidebar-chevron') as HTMLElement;

      if (projectsList) projectsList.style.display = 'block';
      if (chevron) chevron.textContent = 'expand_less';

      // Carrega a lista se necessário
      await this.populateProjectsList();
    }

    // 2. Destacar o item do projeto
    const projectItems = this.container.querySelectorAll('.sidebar-project-item');
    projectItems.forEach(item => {
      const id = item.getAttribute('data-project-id');
      if (id === projectId) {
        item.classList.add('sidebar-project-item-active');
      } else {
        item.classList.remove('sidebar-project-item-active');
      }
    });

    // 3. Destacar ou manter estilo no pai "Projetos"
    // Opcional: manter o menu "Projetos" com estilo ativo também
    const projectsToggle = this.container.querySelector('[data-action="toggle-projects"]');
    if (projectsToggle) {
      projectsToggle.classList.add('sidebar-item-active');
    }
  }
}
