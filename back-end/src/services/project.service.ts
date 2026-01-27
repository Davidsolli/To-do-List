import { Project, ProjectCreateDTO, ProjectUpdateDTO } from "../interfaces/project";
import { ProjectRepository } from "../repositories/project.repository";
import { ProjectValidation } from "../validations/project.validation";

export class ProjectService {
  
  static create(projectData: ProjectCreateDTO): Project {

    ProjectValidation.validateProject(projectData);

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

  static getByUserId(userId: number): Project[] {
     return ProjectRepository.findByUserId(userId);
  }

  static getById(id: number): Project {
    const project = ProjectRepository.findById(id);
    if (!project) {
      throw new Error('Projeto não encontrado.');
    }
    return project;
  }

  static update(id: number, projectData: ProjectUpdateDTO): Project {
    const existingProject = ProjectRepository.findById(id);

    if (!existingProject) {
      throw new Error('Projeto não encontrado para atualização.');
    }

    const newName = projectData.name || existingProject.name;
    const newDescription = projectData.description || existingProject.description;

    if (projectData.name && projectData.name !== existingProject.name) {
       const duplicateProject = ProjectRepository.findByProjectName(projectData.name, existingProject.user_id);
       
       if (duplicateProject) {
         throw new Error('Você já possui outro projeto com este nome.');
       }
    }

    ProjectValidation.validateName(newName);
    ProjectValidation.validateDescription(newDescription);

    const finalProjectData: ProjectCreateDTO = {
      name: newName,
      description: newDescription,
      user_id: existingProject.user_id
    };

    ProjectRepository.update(id, finalProjectData);

    return ProjectRepository.findById(id)!; 
  }

  static delete(id: number): boolean {
    const existingProject = ProjectRepository.findById(id);
    if (!existingProject) {
      throw new Error('Projeto não encontrado para exclusão.');
    }

    return ProjectRepository.delete(id) > 0;
  }
}


