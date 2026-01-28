import { UserCreateDto, UserResponseDTO } from "../interfaces/user";
import { AuthRepository } from "../repositories/auth.repository";
import { AuthValidation } from "../validations/auth.validation";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export class UserService {
  private static readonly SALT_ROUNDS = process.env.SALT || 10;
  private static readonly JWT_SECRET =
    process.env.JWT_SECRET || "segredo_super_seguranca";

  static async createUser(userData: UserCreateDto): Promise<UserResponseDTO> {
    // Validações
    if (!AuthValidation.validateName(userData.name)) {
      throw new Error("Nome deve ter pelo menos 3 caracteres");
    }

    if (!AuthValidation.validateEmail(userData.email)) {
      throw new Error("Email inválido");
    }

    const passwordValidation = AuthValidation.validatePassword(
      userData.password,
    );
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message!);
    }

    // Verificar se email já existe
    if (AuthRepository.exists(userData.email)) {
      throw new Error("Email já cadastrado");
    }

    // Criptografar senha
    const hashedPassword = await bcrypt.hash(
      userData.password,
      this.SALT_ROUNDS,
    );

    // Criar usuário
    const userId = AuthRepository.create(userData, hashedPassword);

    // Buscar usuário criado
    const newUser = AuthRepository.findById(userId);

    if (!newUser) {
      throw new Error("Erro ao criar usuário");
    }

    // Retornar sem a senha
    return newUser;
  }

  static async login(
    email: string,
    password: string,
  ): Promise<{ token: string; user: UserResponseDTO }> {
    const user = AuthRepository.findByEmail(email);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new Error("Senha inválida");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      this.JWT_SECRET,
      { expiresIn: "1h" },
    );

    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  }
}
