import { UserResponseDTO, UserUpdateDTO } from "../interfaces/user";
import UserRepository from "../repositories/user.repository";
import bcrypt from "bcrypt"


export default class UserService {
    private readonly SALT_ROUNDS = process.env.SALT || 10;

    async getById(id: number): Promise<UserResponseDTO> {
        const user = UserRepository.findById(id);

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        return user;
    }

    async getAll(): Promise<UserResponseDTO[]> {
        const users = UserRepository.findAll();

        if (!users) {
            throw new Error('Usuários não encontrados')
        }

        return users;
    }

    async update(id: number, newData: UserUpdateDTO): Promise<boolean> {
        const user = UserRepository.findById(id);

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        const newName = newData.name || user.name;
        const newEmail = newData.email || user.email;
        let newPassword = undefined;

        if (newData.password !== undefined) {
            newPassword = await bcrypt.hash(newData.password, this.SALT_ROUNDS); 
        }

        const success = UserRepository.update(id, newName, newEmail, newPassword);

        if (!success) throw new Error('Erro ao atualizar usuário');

        return success;
    }
    
    async delete(id: number): Promise<boolean> {
        const success = UserRepository.delete(id);
        if (!success) {
            throw new Error('Usuário não encontrado ou já deletado');
        }
        return true;
    }
}