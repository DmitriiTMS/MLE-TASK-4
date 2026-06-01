import { UserEntity } from './domain/user.entity';

export interface IUsersRepository {
    createUser(user: UserEntity): Promise<UserEntity>;
    findByEmail(email: string): Promise<UserEntity | null>;
    findById(id: number): Promise<UserEntity | null>;
}
