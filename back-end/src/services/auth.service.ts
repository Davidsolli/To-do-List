import { UserCreateDto, UserResponseDTO } from "../interfaces/user";
import { AuthRepository } from "../repositories/auth.repository";
import { AuthValidation } from "../validations/auth.validation";
import bcrypt from "bcrypt"

export class UserService {
    private static readonly SALT_ROUNDS = process.env.SALT || 10;
    static async createUser(userData: UserCreateDto): Promise<UserResponseDTO> {
    // Validações
    if (!AuthValidation.validateName(userData.name)) {
      throw new Error('Nome deve ter pelo menos 3 caracteres');
    }

    if (!AuthValidation.validateEmail(userData.email)) {
      throw new Error('Email inválido');
    }

    const passwordValidation = AuthValidation.validatePassword(userData.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message!);
    }

    // Verificar se email já existe
    if (AuthRepository.exists(userData.email)) {
      throw new Error('Email já cadastrado');
    }

    // Criptografar senha
    const hashedPassword = await bcrypt.hash(userData.password, this.SALT_ROUNDS);

    // Criar usuário
    const userId = AuthRepository.create(userData, hashedPassword);

    // Buscar usuário criado (sem a senha)

    const newUser = AuthRepository.findById(userId);

    if (!newUser) {
      throw new Error('Erro ao criar usuário');
    }

    // Retornar sem a senha
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword as UserResponseDTO;
  }
};