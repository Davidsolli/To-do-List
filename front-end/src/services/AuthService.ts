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

        // SALVANDO NO STORAGE PARA PERSISTÊNCIA VISUAL (UI)
        // Segurança: O usuário pode alterar isso manualmente no navegador? SIM.
        // Porém, isso afeta apenas o que ele VÊ no frontend. Se ele tentar acessar 
        // uma rota protegida de admin, o BACKEND validará o TOKEN (cookie) real 
        // e bloqueará a requisição de qualquer forma.
        localStorage.setItem('user_data', JSON.stringify(currentUser));

        return response.user;
    }


    static async register(name: string, email: string, password: string): Promise<User> {
        const response = await ApiService.post<AuthResponse>('auth/register', { name, email, password });
        return response.user;
    }

    static async logout(): Promise<void> {
        await ApiService.post<void>('auth/logout', {});
        currentUser = null;
        localStorage.removeItem('user_data');
    }


    /**
     * Verifica se o usuário está logado batendo no backend.
     * Deve ser chamado ao carregar a SPA
     */
    static async verifySession(): Promise<boolean> {
        // Como não temos endpoint auth/me, confiamos na persistência visual do localStorage.
        // O token HttpOnly continua no browser. Se estiver inválido, as requisições de API falharão (401).
        const stored = localStorage.getItem('user_data');
        if (stored) {
            currentUser = JSON.parse(stored);
            return true;
        }

        currentUser = null;
        return false;
    }


    static isAuthenticated(): boolean {
        return !!currentUser;
    }

    static isAdmin(): boolean {
        return currentUser?.role === 'admin';
    }
}

