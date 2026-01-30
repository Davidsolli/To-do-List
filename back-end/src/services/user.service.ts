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

  async update(id: number, newData: UserUpdateDTO): Promise<boolean> {
    const user = UserRepository.findById(id);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const newName = newData.name || user.name;
    const newEmail = newData.email || user.email;
    let newPassword = user.password; // mantém a senha antiga

    if (newData.password) {
      newPassword = await bcrypt.hash(newData.password, this.SALT_ROUNDS);
    }

    const success = UserRepository.update(id, {
      name: newName,
      email: newEmail,
      password: newPassword,
    });

    if (!success) throw new Error("Erro ao atualizar usuário");

    return success;
  }

  async delete(id: number): Promise<boolean> {
    const success = UserRepository.delete(id);
    if (!success) {
      throw new Error("Usuário não encontrado ou já deletado");
    }
    return true;
  }

  async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    const user = UserRepository.findById(id);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Buscar a senha com hash do repositório (versão completa)
    const userWithPassword = UserRepository.findByIdWithPassword(id);
    if (!userWithPassword) {
      throw new Error("Usuário não encontrado");
    }

    // Verificar se a senha atual está correta
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      userWithPassword.password
    );

    if (!isPasswordValid) {
      throw new Error("Senha atual incorreta");
    }

    // Hash da nova senha
    const newPasswordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Atualizar apenas a senha
    const success = UserRepository.update(id, {
      name: user.name,
      email: user.email,
      password: newPasswordHash,
    });

    if (!success) {
      throw new Error("Erro ao alterar senha");
    }

    return true;
  }
}
