import { PollEntity } from '../../polls/domain/polls.entity';
import { UserModel } from '../models/user.model';

export class UserEntity {
    id: number;
    name: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
    polls: PollEntity[];

    static createInstance(name: string, email: string, passwordHash: string): UserEntity {
        const user = new UserEntity();
        user.name = name;
        user.email = email;
        user.passwordHash = passwordHash;
        return user;
    }

    static toEntity(data: UserModel): UserEntity {
        const user = new UserEntity();
        user.id = data.id;
        user.email = data.email;
        user.name = data.name;
        user.passwordHash = data.passwordHash;
        return user;
    }
}
