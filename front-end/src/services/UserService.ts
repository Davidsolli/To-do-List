import { ApiService } from './ApiService';
import { User } from '../models/User';

export class UserService {
    private static readonly ENDPOINT = 'users';

    /**
     * Busca todos os usuários
     */
    static async getAll(): Promise<User[]> {
        return ApiService.get<User[]>(this.ENDPOINT);
    }

    /**
     * Busca um usuário pelo ID
     */
    static async getById(id: number): Promise<User> {
        return ApiService.get<User>(`${this.ENDPOINT}/${id}`);
    }

    /**
     * Cria um novo usuário
     */
    static async create(user: Partial<User>): Promise<User> {
        return ApiService.post<User>(this.ENDPOINT, user);
    }

    /**
     * Atualiza um usuário existente
     */
    static async update(id: number, user: Partial<User>): Promise<User> {
        return ApiService.put<User>(`${this.ENDPOINT}/${id}`, user);
    }

    /**
     * Remove um usuário
     */
    static async delete(id: number): Promise<void> {
        return ApiService.delete<void>(`${this.ENDPOINT}/${id}`);
    }
}
