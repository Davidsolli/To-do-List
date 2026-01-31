import template from './ProjectCard.html';
import './ProjectCard.css';
import { Button } from '../Button/Button';
import { Project } from '../../models/Project';
import { ProjectRole } from '../../models/Collaboration';

export class ProjectCard {
    constructor(private project: Project) {}

    private getRoleLabel(role?: ProjectRole | null): string {
        const roleLabels: Record<ProjectRole, string> = {
            [ProjectRole.OWNER]: 'Proprietário',
            [ProjectRole.ADMIN]: 'Administrador',
            [ProjectRole.MEMBER]: 'Membro'
        };
        return role ? roleLabels[role] : 'Membro';
    }

    private getRoleClass(role?: ProjectRole | null): string {
        const roleClasses: Record<ProjectRole, string> = {
            [ProjectRole.OWNER]: 'role-owner',
            [ProjectRole.ADMIN]: 'role-admin',
            [ProjectRole.MEMBER]: 'role-member'
        };
        return role ? roleClasses[role] : 'role-member';
    }

    render(): string {
        const initial = this.project.name.charAt(0).toUpperCase();
        const description = this.project.description || 'Sem descrição.';
        
        const roleLabel = this.getRoleLabel(this.project.role);
        const roleClass = this.getRoleClass(this.project.role);
        
        const completed = this.project.taskStats?.completed || 0;
        const total = this.project.taskStats?.total || 0;
        const taskProgress = `${completed}/${total}`;

        const btnAccess = new Button({
            text: 'Acessar projeto',
            variant: 'ghost',
            icon: 'fa-solid fa-arrow-right',
            action: `access-project`,
        });

        return template
            .replace('{{initial}}', initial)
            .replace('{{id}}', this.project.id.toString())
            .replace('{{name}}', this.project.name)
            .replace('{{description}}', description)
            .replace('{{role_label}}', roleLabel)
            .replace('{{role_class}}', roleClass)
            .replace('{{task_progress}}', taskProgress)
            .replace('{{btn_access}}', btnAccess.render());
    }
}
