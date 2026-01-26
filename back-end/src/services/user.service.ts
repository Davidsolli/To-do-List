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
}