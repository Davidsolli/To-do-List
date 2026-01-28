import { UserRole } from "../enums/userRoles.enums";

export interface User {
    id: number,
    name: string,
    email: string,
    password: string,
    role: UserRole
};

export type UserCreateDto = Omit<User, 'id' | 'role'>;

export type UserUpdateDTO = Partial<Omit<User, "id">>

export type UserResponseDTO = Partial<Omit<User, 'password'>>;