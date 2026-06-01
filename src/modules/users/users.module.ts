import { Logger, Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { USERS_INJECTION_TOKENS } from './constants/users-injection-tokens';
import { UserModel } from './models/user.model';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
    imports: [TypeOrmModule.forFeature([UserModel])],
    providers: [
        Logger,
        {
            provide: USERS_INJECTION_TOKENS.IUSERS_SERVICE,
            useClass: UsersService,
        },
        {
            provide: USERS_INJECTION_TOKENS.IUSERS_REPOSITORY,
            useClass: UsersRepository,
        },
    ],
    exports: [USERS_INJECTION_TOKENS.IUSERS_SERVICE, USERS_INJECTION_TOKENS.IUSERS_REPOSITORY],
})
export class UsersModule {}
