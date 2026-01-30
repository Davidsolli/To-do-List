import { ApiService } from './ApiService';
import { User } from '../models/User';

interface UpdateUserDTO {
    name?: string;
    email?: string;
}

interface ChangePasswordDTO {
    currentPassword: string;
    newPassword: string;
}

export class UserService {
    private endpoint = 'users';

    /**
     * Buscar todos os usuários (somente admin)
     */
    static async getAll(): Promise<User[]> {
        return await ApiService.get<User[]>('users');
    }

    /**
     * Criar novo usuário (somente admin)
     */
    static async create(user: Partial<User>): Promise<User> {
        return await ApiService.post<User>('users', user);
    }

    /**
     * Buscar usuário por ID (método estático do HEAD - necessário para Kanban)
     */
    static async getById(id: number): Promise<User> {
        return await ApiService.get<User>(`users/${id}`);
    }

    /**
     * Buscar usuário por ID (método de instância do develop)
     */
    async getById(userId: number): Promise<User> {
        return await ApiService.get<User>(`${this.endpoint}/${userId}`);
    }

    /**
     * Atualizar informações do usuário (método de instância)
     */
    async update(userId: number, data: UpdateUserDTO): Promise<User> {
        return await ApiService.put<User>(`${this.endpoint}/${userId}`, data);
    }

    /**
     * Atualizar usuário (método estático para admin)
     */
    static async update(userId: number, data: UpdateUserDTO): Promise<User> {
        return await ApiService.put<User>(`users/${userId}`, data);
    }

    /**
     * Alterar senha do usuário
     */
    async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
        const data: ChangePasswordDTO = {
            currentPassword,
            newPassword
        };

        try {
            await ApiService.put<void>(`${this.endpoint}/${userId}/password`, data);
        } catch (error: any) {
            // Tratar erros específicos de senha
            if (error.message.includes('incorreta') || error.message.includes('incorrect')) {
                throw new Error('Senha atual incorreta');
            }
            throw error;
        }
    }

    /**
     * Deletar conta do usuário
     */
    async delete(userId: number): Promise<void> {
        return await ApiService.delete<void>(`${this.endpoint}/${userId}`);
    }

    /**
     * Deletar usuário (método estático para admin)
     */
    static async delete(userId: number): Promise<void> {
        return await ApiService.delete<void>(`users/${userId}`);
    }

    /**
     * Buscar projetos do usuário
     */
    async getUserProjects(userId: number): Promise<any[]> {
        return await ApiService.get<any[]>(`${this.endpoint}/${userId}/projects`);
    }
}
