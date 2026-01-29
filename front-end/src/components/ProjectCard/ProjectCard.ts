import template from './ProjectCard.html';
import './ProjectCard.css';
import { Button } from '../Button/Button';
import { Project } from '../../models/Project';

export class ProjectCard {
    constructor(private project: Project) {}

    render(): string {
        const initial = this.project.name.charAt(0).toUpperCase();
        const description = this.project.description || 'Sem descrição.';

        const btnAccess = new Button({
            text: 'Acessar projeto',
            variant: 'link',
            icon: 'fa-solid fa-arrow-right',
            action: `access-project`,
        });
        
        return template
            .replace('{{initial}}', initial)
            .replace('{{id}}', this.project.id.toString())
            .replace('{{name}}', this.project.name)
            .replace('{{description}}', description)
            .replace('{{btn_access}}', btnAccess.render());
    }
}