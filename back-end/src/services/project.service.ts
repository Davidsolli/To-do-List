import { Project, ProjectCreateDTO, ProjectUpdateDTO } from "../interfaces/project";
import { ProjectRepository } from "../repositories/project.repository";
import { ProjectValidation } from "../validations/project.validation";
import { MemberRepository } from "../repositories/member.repository";
import { ProjectRole, AuditAction } from "../interfaces/collaborative";
import { AuditLogService } from "./audit.service";
import { NotificationService } from "./notification.service";
import UserRepository from "../repositories/user.repository";

export class ProjectService {

  static create(projectData: ProjectCreateDTO): Project {

    ProjectValidation.validateProject(projectData);

    const nameExists = ProjectRepository.findByProjectName(projectData.name, projectData.user_id);
    if (nameExists) {
      throw new Error('Você já possui um projeto com este nome.');
    }

    const projectId = ProjectRepository.create(projectData);

    // Add owner as a member with owner role
    MemberRepository.addMember(projectId, projectData.user_id, ProjectRole.OWNER);

    const newProject = ProjectRepository.findById(projectId);

    if (!newProject) {
      throw new Error('Erro ao criar o projeto no banco de dados.');
    }

    return newProject;
  }

  static getByUserId(userId: number): Project[] {
     return ProjectRepository.findAllUserProjects(userId);
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

    AuditLogService.log(
      AuditAction.PROJECT_DELETED, 
      `Projeto "${existingProject.name}" deletado`,
      id,
      existingProject.user_id
    );

    return ProjectRepository.delete(id) > 0;
  }

  static getMembers(projectId: number) {
    return MemberRepository.getMembers(projectId);
  }

  static getMemberTaskCount(projectId: number, userId: number): number {
    return MemberRepository.getTaskAssignmentCount(projectId, userId);
  }

  static removeMember(projectId: number, userId: number, actorId: number) {
    const project = ProjectRepository.findById(projectId);
    if (!project) throw new Error("Projeto não encontrado");

    const user = UserRepository.findById(userId);

    // Remove from tasks first
    MemberRepository.removeUserFromProjectTasks(projectId, userId);

    // Remove membership
    MemberRepository.removeMember(projectId, userId);

    // Send notification
    if (user) {
      NotificationService.notifyRemoved(userId, project.name);
    }

    AuditLogService.log(
      AuditAction.MEMBER_REMOVED,
      JSON.stringify({ member_name: user?.name || 'Membro', member_id: userId }),
      projectId,
      actorId
    );
  }

  static updateMemberRole(projectId: number, userId: number, role: ProjectRole, actorId: number) {
    const project = ProjectRepository.findById(projectId);
    if (!project) throw new Error("Projeto não encontrado");

    MemberRepository.updateRole(projectId, userId, role);

    // Notify user of role change
    if (role === ProjectRole.ADMIN) {
      NotificationService.notifyAdminPromoted(userId, project.name, projectId);
    } else {
      NotificationService.notifyRoleChange(userId, project.name, role, projectId);
    }

    const user = UserRepository.findById(userId);

    AuditLogService.log(
      AuditAction.ROLE_CHANGED,
      JSON.stringify({ member_name: user?.name || 'Membro', member_id: userId, new_role: role }),
      projectId,
      actorId
    );
  }

  static transferOwnership(projectId: number, newOwnerId: number, oldOwnerId: number) {
    const project = ProjectRepository.findById(projectId);
    if (!project) throw new Error("Projeto não encontrado");

    const isMember = MemberRepository.isMember(projectId, newOwnerId);
    if (!isMember) {
      throw new Error("O novo proprietário deve ser membro do projeto.");
    }

    // Update project owner
    ProjectRepository.updateOwner(projectId, newOwnerId);

    // Add old owner as admin member
    MemberRepository.addMember(projectId, oldOwnerId, ProjectRole.ADMIN);
    
    // Remove new owner from members (they're now the owner)
    MemberRepository.removeMember(projectId, newOwnerId);

    // Notify users
    NotificationService.notifyRoleChange(newOwnerId, project.name, "owner", projectId);
    NotificationService.notifyRoleChange(oldOwnerId, project.name, "admin", projectId);

    const newOwner = UserRepository.findById(newOwnerId);

    AuditLogService.log(
      AuditAction.OWNERSHIP_TRANSFERRED,
      JSON.stringify({ new_owner_name: newOwner?.name || 'Novo proprietário', new_owner_id: newOwnerId }),
      projectId,
      oldOwnerId
    );
  }
}


