import { Inject, Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity } from './entities/user.entity';
import { IUsersService } from './users.service.interface';
import type { IUsersRepository } from './users.repository.interface';

@Injectable()
export class UsersService implements IUsersService {
    private readonly context = UsersService.name;
    private readonly operationCreate = 'create';

    constructor(
        private readonly logger: Logger,
        @Inject('IUsersRepository') private readonly userRepository: IUsersRepository,
    ) {}

    async create(createUserDto: CreateUserDto): Promise<UserEntity> {
        const user = UserEntity.createInstance(
            createUserDto.name,
            createUserDto.email,
            createUserDto.hashPassword,
        );
        try {
            this.logger.log(
                `[${this.context}] - [${this.operationCreate}] - ${createUserDto.name} - ${createUserDto.email}`,
            );
            return await this.userRepository.createUser(user);
        } catch (error: any) {
            this.logger.log(`[${this.context}] - [${this.operationCreate}] - ${error.message}`);
            throw new Error('Пользователь не сохранился в БД');
        }
    }
}
