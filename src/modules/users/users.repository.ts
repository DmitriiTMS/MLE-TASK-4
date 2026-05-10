import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { IUsersRepository } from './users.repository.interface';

@Injectable()
export class UsersRepository implements IUsersRepository {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
    ) {}

    async createUser(user: UserEntity): Promise<UserEntity> {
        return await this.userRepository.save(user);
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        return await this.userRepository.findOneBy({ email });
    }

    async findById(id: number): Promise<UserEntity | null> {
        return await this.userRepository.findOneBy({ id });
    }
}
