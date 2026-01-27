// Interface genérica para respostas da API (ajuste conforme seu Backend)
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export class ApiService {
  // Pegue a URL do .env ou use localhost como fallback
  private static baseUrl = process.env.API_URL || 'http://localhost:3000';

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
      });

      // Tenta fazer o parse do JSON
      const data = await response.json();

      if (!response.ok) {
        // Se a API retornar erro (400, 401, 500), lança exceção com a mensagem
        throw new Error(data.message || `Erro na requisição: ${response.status}`);
      }

      return data as T;
    } catch (error) {
      console.error(`Erro na API [${endpoint}]:`, error);
      throw error;
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
}