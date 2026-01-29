import { Component } from '../../core/Component';
import template from './DashboardView.html';
import './DashboardView.css';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import { ProjectService } from '../../services/ProjectService';
import { Project } from '../../models/Project';
import { app } from '../../App';

// Interface simples para o Mock de tarefas
interface Task {
    id: number;
    title: string;
    project_name: string;
    priority: 'Alta' | 'Média' | 'Baixa';
    status: 'Pendente' | 'Em andamento' | 'Concluída';
    due_date: string;
}

export class DashboardView extends Component {
    
    getTemplate(): string {
        // 1. Criar o Input de Busca
        const searchInput = new Input({
            id: 'search-projects',
            type: 'text',
            placeholder: 'Buscar projetos...',
            icon: 'fa-solid fa-magnifying-glass'
        });

        // 2. Criar o Botão "Novo"
        const newBtn = new Button({
            text: 'Novo',
            variant: 'primary',
            icon: 'fa-solid fa-plus',
            action: 'create-project'
        });

        // 3. Substituir no HTML
        return template
            .replace('{{search_component}}', searchInput.render())
            .replace('{{new_project_btn}}', newBtn.render());
    }

    protected afterRender(): void {
        // Ao carregar a tela, dispara as funções de busca
        this.loadProjects();
        this.loadRecentTasks(); // <--- AQUI CHAMAMOS OS MOCKS
        this.bindEvents();
    }

    private bindEvents(): void {
        // Botão Novo Projeto
        const btn = this.container.querySelector('[data-action="create-project"]');
        btn?.addEventListener('click', () => {
            const name = prompt("Nome do novo projeto:");
            if(name) {
                ProjectService.createProject(name)
                    .then(() => {
                        if (window.toast) window.toast.success("Projeto criado!");
                        this.loadProjects(); // Recarrega a lista
                    })
                    .catch(err => {
                        if (window.toast) window.toast.error("Erro ao criar projeto");
                    });
            }
        });
    }

    // --- Lógica de Projetos (API Real) ---

    private async loadProjects() {
        const grid = this.container.querySelector('#projects-grid');
        if (!grid) return;

        try {
            const projects = await ProjectService.getUserProjects();

            if (projects.length === 0) {
                grid.innerHTML = '<p class="text-secondary">Nenhum projeto encontrado.</p>';
                return;
            }

            // Gera o HTML de cada cartão
            grid.innerHTML = projects.map(p => this.createProjectCard(p)).join('');

            // Adiciona eventos de clique nos links dos cards
            this.bindProjectCardEvents();

        } catch (error) {
            console.error(error);
            grid.innerHTML = '<p class="form-error">Erro ao carregar projetos.</p>';
        }
    }

    private createProjectCard(project: Project): string {
        const initial = project.name.charAt(0).toUpperCase();

        return `
            <div class="project-card">
                <div class="project-card__header">
                    <div class="project-icon">${initial}</div>
                    <div class="card-actions">
                        <button class="btn--ghost" style="padding: 4px;" title="Configurações">
                            <i class="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                    </div>
                </div>
                <h3 class="project-card__title">${project.name}</h3>
                <p class="project-card__desc">${project.description || 'Sem descrição definida.'}</p>
                
                <div class="project-card__footer">
                    <a href="/projetos/${project.id}" class="link-access" data-link>
                        Acessar projeto <i class="fa-solid fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        `;
    }

    private bindProjectCardEvents() {
        const links = this.container.querySelectorAll('a[data-link]');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href) app.navigate(href);
            });
        });
    }

    // --- Lógica de Tarefas (MOCK / DADOS FALSOS) ---

    private loadRecentTasks() {
        const tbody = this.container.querySelector('#tasks-table-body');
        if (!tbody) return;

        // 👇 AQUI ESTÃO SEUS DADOS FALSOS 👇
        const tasks: Task[] = [
            { id: 1, title: 'Refatorar componentes de card', project_name: 'Design System', priority: 'Alta', status: 'Pendente', due_date: '10/12/2025' },
            { id: 2, title: 'Aprovar designs de email', project_name: 'Campanha 2024', priority: 'Média', status: 'Pendente', due_date: '12/12/2025' },
            { id: 3, title: 'Reunião de alinhamento', project_name: 'Meu projeto', priority: 'Baixa', status: 'Concluída', due_date: '08/12/2025' },
            { id: 4, title: 'Configurar Webhooks', project_name: 'Meu projeto', priority: 'Alta', status: 'Em andamento', due_date: '15/12/2025' },
        ];

        // Injeta as linhas na tabela
        tbody.innerHTML = tasks.map(t => `
            <tr>
                <td><strong>${t.title}</strong></td>
                <td class="text-secondary">${t.project_name}</td>
                <td>${this.getPriorityBadge(t.priority)}</td>
                <td>${this.getStatusBadge(t.status)}</td>
                <td class="text-secondary">${t.due_date}</td>
            </tr>
        `).join('');
    }

    // Helpers para gerar as badges coloridas
    private getPriorityBadge(priority: string): string {
        const map: any = { 'Alta': 'high', 'Média': 'medium', 'Baixa': 'low' };
        const type = map[priority] || 'low';
        // Nota: As classes badge--high etc devem estar no seu CSS (DashboardView.css ou main.css)
        // Se não tiver, ele vai ficar sem cor, mas o texto aparece.
        return `<span class="badge badge--${type}">${priority}</span>`;
    }

    private getStatusBadge(status: string): string {
        const map: any = { 'Pendente': 'pending', 'Em andamento': 'doing', 'Concluída': 'done' };
        const type = map[status] || 'pending';
        return `<span class="badge badge--${type}">${status}</span>`;
    }
}