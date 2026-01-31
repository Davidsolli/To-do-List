import { InviteRepository } from "../repositories/invite.repository";
import { MemberRepository } from "../repositories/member.repository";
import { ProjectRepository } from "../repositories/project.repository";
import UserRepository from "../repositories/user.repository";
import { ProjectInvite, ProjectRole, AuditAction } from "../interfaces/collaborative";
import { NotificationService } from "./notification.service";
import { AuditLogService } from "./audit.service";

export class InviteService {

    static async inviteUser(projectId: number, inviterId: number, email: string): Promise<ProjectInvite> {
        // 1. Check if project exists
        const project = ProjectRepository.findById(projectId);
        if (!project) {
            throw new Error("Projeto não encontrado");
        }

        // 2. Check if inviter has permission (owner or admin)
        const isOwner = project.user_id === inviterId;
        const inviterRole = MemberRepository.getMemberRole(projectId, inviterId);
        
        if (!isOwner && inviterRole !== ProjectRole.ADMIN) {
            throw new Error("Sem permissão para convidar usuários");
        }

        // 3. Check if user exists in the system
        const existingUser = UserRepository.findByEmail(email);
        if (!existingUser) {
            throw new Error("Usuário não encontrado. Só é possível convidar usuários cadastrados no sistema.");
        }

        // 4. Check if user is already owner or member
        if (existingUser.id === project.user_id) {
            throw new Error("Este usuário já é o dono do projeto");
        }
        if (MemberRepository.isMember(projectId, existingUser.id)) {
            throw new Error("Este usuário já é membro do projeto");
        }

        // 5. Check if there's already a pending invite
        const existingInvite = InviteRepository.findByProjectAndEmail(projectId, email);
        if (existingInvite) {
            throw new Error("Já existe um convite pendente para este email");
        }

        // 6. Create invite
        const inviteId = InviteRepository.create({
            project_id: projectId,
            inviter_id: inviterId,
            email
        });

        // 7. Get inviter info
        const inviter = UserRepository.findById(inviterId);

        // 8. Send notification to the user
        if (inviter) {
            NotificationService.notifyInvite(
                existingUser.id,
                project.name,
                inviter.name,
                inviteId,
                projectId
            );
        }

        // 9. Log audit
        AuditLogService.log(
            AuditAction.INVITE_SENT,
            `Convite enviado para ${email}`,
            projectId,
            inviterId
        );

        return InviteRepository.findById(inviteId)!;
    }

    static acceptInvite(inviteId: number, userId: number): void {
        // 1. Get invite
        const invite = InviteRepository.findById(inviteId);
        if (!invite) {
            throw new Error("Convite não encontrado");
        }

        // 2. Check if invite is pending and not expired
        if (invite.status !== 'pending') {
            throw new Error("Este convite já foi processado");
        }
        if (new Date(invite.expires_at) < new Date()) {
            throw new Error("Este convite expirou");
        }

        // 3. Verify user email matches invite
        const user = UserRepository.findById(userId);
        if (!user || user.email !== invite.email) {
            throw new Error("Este convite não pertence a você");
        }

        // 4. Add user as member
        MemberRepository.addMember(invite.project_id, userId, ProjectRole.MEMBER);

        // 5. Delete invite
        InviteRepository.delete(inviteId);

        // 6. Log audit
        AuditLogService.log(
            AuditAction.INVITE_ACCEPTED,
            JSON.stringify({ project_id: invite.project_id }),
            invite.project_id,
            userId
        );
    }

    static declineInvite(inviteId: number, userId: number): void {
        // 1. Get invite
        const invite = InviteRepository.findById(inviteId);
        if (!invite) {
            throw new Error("Convite não encontrado");
        }

        // 2. Verify user email matches invite
        const user = UserRepository.findById(userId);
        if (!user || user.email !== invite.email) {
            throw new Error("Este convite não pertence a você");
        }

        // 3. Update status to declined
        InviteRepository.updateStatus(inviteId, 'declined');

        // 4. Log audit
        AuditLogService.log(
            AuditAction.INVITE_DECLINED,
            JSON.stringify({ project_id: invite.project_id }),
            invite.project_id,
            userId
        );
    }

    static getPendingInvitesByEmail(email: string): ProjectInvite[] {
        return InviteRepository.findPendingByEmail(email);
    }

    static getProjectInvites(projectId: number): ProjectInvite[] {
        return InviteRepository.findByProjectId(projectId);
    }

    static cancelInvite(inviteId: number, userId: number): void {
        const invite = InviteRepository.findById(inviteId);
        if (!invite) {
            throw new Error("Convite não encontrado");
        }

        // Check if user has permission (owner or admin of project or the inviter)
        const project = ProjectRepository.findById(invite.project_id);
        if (!project) {
            throw new Error("Projeto não encontrado");
        }

        const isOwner = project.user_id === userId;
        const isAdmin = MemberRepository.getMemberRole(invite.project_id, userId) === ProjectRole.ADMIN;
        const isInviter = invite.inviter_id === userId;

        if (!isOwner && !isAdmin && !isInviter) {
            throw new Error("Sem permissão para cancelar este convite");
        }

        InviteRepository.delete(inviteId);
    }

    static getById(id: number): ProjectInvite | undefined {
        return InviteRepository.findById(id);
    }
}
