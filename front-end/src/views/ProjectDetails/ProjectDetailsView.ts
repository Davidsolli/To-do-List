import { Component } from '../../core/Component';
import template from './ProjectDetailsView.html';
import './ProjectDetailsView.css';
import { Router } from '../../core/Router';

export class ProjectDetailsView extends Component {
    constructor(private projectId: string) {
        super('');
    }

    getTemplate(): string {
        return template;
    }

    protected afterRender(): void {
        this.bindData();
        this.bindEvents();
    }

    private bindData(): void {
        const nameEl = this.container.querySelector('[data-bind="name"]');
        const idEl = this.container.querySelector('[data-bind="id"]');

        if (nameEl) {
            nameEl.textContent = 'Projeto selecionado';
        }

        if (idEl) {
            idEl.textContent = this.projectId;
        }
    }

    private bindEvents(): void {
        const backBtn = this.container.querySelector('[data-action="back"]');

        backBtn?.addEventListener('click', () => {
            window.history.back();
        });
    }
}
