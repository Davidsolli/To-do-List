import { UserResponseDTO, UserUpdateDTO } from "../interfaces/user";
import UserRepository from "../repositories/user.repository";
import bcrypt from "bcrypt";

export default class UserService {
  private readonly SALT_ROUNDS = process.env.SALT || 10;

  async getById(id: number): Promise<UserResponseDTO> {
    const user = UserRepository.findById(id);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    return user;
  }

  async getAll(): Promise<UserResponseDTO[]> {
    const users = UserRepository.findAll();

    if (!users) {
      throw new Error("Usuários não encontrados");
    }

    return users;
  }

  async create(userData: any): Promise<UserResponseDTO> {
    const { name, email, password, role } = userData;

    if (!name || !email || !password) {
      throw new Error("Nome, email e senha são obrigatórios");
    }

    // Verifica se o email já existe
    const existingUser = UserRepository.findByEmail(email);
    if (existingUser) {
      throw new Error("Email já cadastrado");
    }

    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    const userId = UserRepository.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
    });

    const newUser = UserRepository.findById(userId);
    if (!newUser) throw new Error("Erro ao buscar usuário criado");

    return newUser;
  }

  async update(id: number, newData: UserUpdateDTO): Promise<UserResponseDTO> {
    const user = UserRepository.findById(id);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const newName = newData.name || user.name;
    const newEmail = newData.email || user.email;
    const newRole = newData.role || user.role;
    let newPassword = user.password; // mantém a senha antiga

    if (newData.password) {
      newPassword = await bcrypt.hash(newData.password, this.SALT_ROUNDS);
    }

    const success = UserRepository.update(id, {
      name: newName,
      email: newEmail,
      password: newPassword,
      role: newRole,
    });

    if (!success) throw new Error("Erro ao atualizar usuário");

    // Retorna o usuário atualizado
    const updatedUser = UserRepository.findById(id);
    if (!updatedUser) throw new Error("Erro ao buscar usuário atualizado");

    return updatedUser;
  }

  async delete(id: number): Promise<boolean> {
    const success = UserRepository.delete(id);
    if (!success) {
      throw new Error("Usuário não encontrado ou já deletado");
    }
    return true;
  }
}
