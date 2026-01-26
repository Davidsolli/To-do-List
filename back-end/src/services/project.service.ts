import { Project, ProjectCreateDto } from "../interfaces/project";
import { ProjectRepository } from "../repositories/project.repository";
import { ProjectValidation } from "../validations/project.validation";

export class ProjectService {
  
  static create(projectData: ProjectCreateDto): Project {

    if (!ProjectValidation.validateName(projectData.name)) {
      throw new Error('O nome do projeto deve ter pelo menos 3 caracteres.');
    }

    if (!ProjectValidation.validateDescription(projectData.description)) {
      throw new Error('A descrição deve ter pelo menos 5 caracteres.');
    }

    if (!ProjectValidation.validateUserId(projectData.user_id)) {
      throw new Error('ID do usuário inválido.');
    }

    const nameExists = ProjectRepository.findByProjectName(projectData.name, projectData.user_id);
    if (nameExists) {
      throw new Error('Você já possui um projeto com este nome.');
    }

    const projectId = ProjectRepository.create(projectData);

    const newProject = ProjectRepository.findById(projectId);

    if (!newProject) {
      throw new Error('Erro ao criar o projeto no banco de dados.');
    }

    return newProject;
  }

  static getById(id: number): Project {
    const project = ProjectRepository.findById(id);
    if (!project) {
      throw new Error('Projeto não encontrado.');
    }
    return project;
  }
}


