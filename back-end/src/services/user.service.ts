import UserController from "../controllers/user.controller";
import UserRepository from "../repositories/user.repository";


export default class UserService {
    async getById(id: number) {
        const user = UserRepository.findById(id);
        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async getAll() {
        const users = UserRepository.findAll();

        const safeUsers = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });

        return safeUsers;
    }

    async update(id: number, dadosParciais: { name?: string, email?: string }) {
        const usuarioAtual = UserRepository.findById(id);

        if (!usuarioAtual) {
            throw new Error('Usuário não encontrado');
        }

        const novoNome = dadosParciais.name || usuarioAtual.name;
        const novoEmail = dadosParciais.email || usuarioAtual.email;
        const success = UserRepository.update(id, novoNome, novoEmail);

        if (!success) throw new Error('Erro ao atualizar usuário');

        return { id, name: novoNome, email: novoEmail };
    }
    
    async delete(id: number) {
        const success = UserRepository.delete(id);
        if (!success) {
            throw new Error('Usuário não encontrado ou já deletado');
        }
        return true;
    }
}