import { ApiService } from './ApiService';
import { User } from '../models/User';


interface AuthResponse {
    message: string;
    user: User;
}

// Estado do usuário em memória (já que não vamos usar localStorage)
let currentUser: User | null = null;

export class AuthService {
    static get user(): User | null {
        return currentUser;
    }

    static async login(email: string, password: string): Promise<User> {
        const response = await ApiService.post<AuthResponse>('auth/login', { email, password });
        currentUser = response.user;
        return response.user;
    }

    static async register(name: string, email: string, password: string): Promise<User> {
        const response = await ApiService.post<AuthResponse>('auth/register', { name, email, password });
        return response.user;
    }

    static async logout(): Promise<void> {
        await ApiService.post<void>('auth/logout', {});
        currentUser = null;
    }

    /**
     * Verifica se o usuário está logado batendo no backend.
     * Deve ser chamado ao carregar a SPA
     */
    static async verifySession(): Promise<boolean> {
        try {
            // Assume que existe um endpoint que retorna o usuário se o cookie for válido
            const response = await ApiService.get<{ user: User }>('auth/me');
            currentUser = response.user;
            return true;
        } catch (error) {
            currentUser = null;
            return false;
        }
    }

    static isAuthenticated(): boolean {
        return !!currentUser;
    }

    static isAdmin(): boolean {
        return currentUser?.role === 'admin';
    }
}

