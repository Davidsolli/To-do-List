export interface User {
    id: number,
    name: string,
    email: string,
    password: string,
};

export type UserCreateDto = Omit<User, 'id'>;

export type UserUpdateDTO = Partial<Omit<User, "id">>

export type UserResponseDTO = Partial<Omit<User, 'password'>>;