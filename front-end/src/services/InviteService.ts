import { ApiService } from './ApiService';
import { ProjectInvite } from '../models/Collaboration';

export class InviteService {

    // Get pending invites for current user
    static async getPendingInvites(): Promise<ProjectInvite[]> {
        return await ApiService.get<ProjectInvite[]>('invites');
    }

    // Get invite by ID
    static async getById(id: number): Promise<ProjectInvite> {
        return await ApiService.get<ProjectInvite>(`invites/${id}`);
    }

    // Accept invite
    static async accept(id: number): Promise<void> {
        await ApiService.post(`invites/${id}/accept`, {});
    }

    // Decline invite
    static async decline(id: number): Promise<void> {
        await ApiService.post(`invites/${id}/decline`, {});
    }

    // Cancel invite (by admin/owner)
    static async cancel(id: number): Promise<void> {
        await ApiService.delete(`invites/${id}`);
    }

    // Send invite to project (called from ProjectService)
    static async sendInvite(projectId: number, email: string): Promise<ProjectInvite> {
        const response = await ApiService.post<{ message: string, invite: ProjectInvite }>(
            `projects/${projectId}/invite`, 
            { email }
        );
        return response.invite;
    }

    // Get project invites
    static async getProjectInvites(projectId: number): Promise<ProjectInvite[]> {
        return await ApiService.get<ProjectInvite[]>(`projects/${projectId}/invites`);
    }
}
