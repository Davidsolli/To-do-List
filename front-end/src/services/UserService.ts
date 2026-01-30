import { User } from '../models/User';
import { ApiService } from './ApiService';

export class UserService {
    static async getById(id: number): Promise<User> {
        return await ApiService.get<User>(`users/${id}`);
    }
}
