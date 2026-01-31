// Interface genérica para respostas da API (ajuste conforme seu Backend)
export interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    message?: string;
}

export class ApiService {
    // Pegue a URL do .env ou use localhost como fallback
    private static baseUrl = process.env.API_URL || '/api/';

    private static getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        // Se tiver token salvo, injeta automaticamente
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    // Wrapper genérico para fetch
    private static async request<T>(endpoint: string, options: RequestInit): Promise<T> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: this.getHeaders(),
                credentials: 'include', // Importante para enviar Cookies (Session)
            });

            // Tenta fazer o parse do JSON
            let data: any = null;
            try {
                data = await response.json();
            } catch (e) {
                // Se nao retornar JSON (ex: 204 No Content), data fica null
            }

            if (!response.ok) {
                // Se o token expirou ou é inválido (401), fazer logout e redirecionar
                if (response.status === 401 && !endpoint.includes('auth/login')) {
                    this.handleUnauthorized();
                    throw new Error('Sessão expirada. Faça login novamente.');
                }

                // Se a API retornar erro (400, 401, 500)
                // O backend retorna { error: "mensagem" } ou { message: "mensagem" }
                const errorMessage = data?.error || data?.message || `Erro na requisição: ${response.status}`;
                throw new Error(errorMessage);
            }

            return data as T;
        } catch (error) {
            console.error(`Erro na API [${endpoint}]:`, error);
            throw error;
        }
    }

    // Método para lidar com token expirado/inválido
    private static handleUnauthorized(): void {
        // Limpa dados do usuário do localStorage
        localStorage.removeItem('user_data');
        localStorage.removeItem('token');
        
        // Redireciona para login se não estiver já na página de login
        if (!window.location.hash.includes('/login') && !window.location.hash.includes('/register')) {
            window.location.hash = '#/login';
            // Força reload para limpar estado da aplicação
            window.location.reload();
        }
    }

    // --- Métodos Públicos (GET, POST, PUT, DELETE) ---

    public static async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    public static async post<T>(endpoint: string, body: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    public static async put<T>(endpoint: string, body: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    public static async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    // Método PATCH necessário para updateStatus no Kanban (HEAD)
    public static async patch<T>(endpoint: string, body: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    }
}
