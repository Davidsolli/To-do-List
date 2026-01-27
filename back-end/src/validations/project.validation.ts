import { ProjectCreateDTO } from "../interfaces/project";

export class ProjectValidation {
  static validateProject(project: ProjectCreateDTO) {
    if (!project.name || project.name.trim().length < 3) {
      throw new Error('O nome do projeto deve ter pelo menos 3 caracteres.');
    }

    if (!project.description || project.description.trim().length < 5) {
      throw new Error('A descrição deve ter pelo menos 5 caracteres.');
    }

    if (!project.user_id || project.user_id <= 0) {
      throw new Error('ID do usuário inválido.');
    }
  }

  static validateName(name: string) {
    if (!name || name.trim().length < 3) {
      throw new Error('O nome do projeto deve ter pelo menos 3 caracteres.');
    }
  }

  static validateDescription(description: string) {
    if (!description || description.trim().length < 5) {
      throw new Error('A descrição deve ter pelo menos 5 caracteres.');
    }
  }
}
