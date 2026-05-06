import { UserEntity } from './entities/user.entity';

export interface IUsersRepository {
    createUser(user: UserEntity): Promise<UserEntity>;
    findByEmail(email: string): Promise<UserEntity | null>;
}
