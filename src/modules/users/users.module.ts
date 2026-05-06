import { Logger, Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity])],
    providers: [
        Logger,
        {
            provide: 'IUsersService',
            useClass: UsersService,
        },
        {
            provide: 'IUsersRepository',
            useClass: UsersRepository,
        },
    ],
    exports: ['IUsersService', 'IUsersRepository'],
})
export class UsersModule {}
