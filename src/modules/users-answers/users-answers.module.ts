import { Logger, Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersAnswersModel } from './models/users-answers.model';

@Module({
    imports: [TypeOrmModule.forFeature([UsersAnswersModel])],
    controllers: [],
    providers: [
        Logger,
        // {
        //     provide: POLL_INJECTION_TOKENS.IPOLL_SERVICE,
        //     useClass: PollsService,
        // },
        // {
        //     provide: POLL_INJECTION_TOKENS.IPOLL_REPOSITORY,
        //     useClass: PollsRepository,
        // },
    ],

})
export class UsersAnswersModule {}
