import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './domain/user.entity';
import { UserModel } from './models/user.model';
import { IUsersRepository } from './users.repository.interface';

@Injectable()
export class UsersRepository implements IUsersRepository {
    constructor(
        @InjectRepository(UserModel)
        private readonly userRepository: Repository<UserModel>,
    ) {}

    async createUser(user: UserEntity): Promise<UserEntity> {
        const userDb = await this.userRepository.save(user);
        return UserEntity.toEntity(userDb);
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        const userDb = await this.userRepository.findOneBy({ email });
        if (!userDb) {
            return null;
        }
        return UserEntity.toEntity(userDb);
    }

    async findById(id: number): Promise<UserEntity | null> {
        const userDb = await this.userRepository.findOneBy({ id });
        if (!userDb) {
            return null;
        }
        return UserEntity.toEntity(userDb);
    }
}
