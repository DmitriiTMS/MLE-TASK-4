import { Logger, Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { POLL_INJECTION_TOKENS } from './constants/poll-injection-tokens';
import { PollModel } from './models/polls.model';
import { PollsController } from './polls.controller';
import { PollsRepository } from './polls.repository';
import { PollsService } from './polls.service';

@Module({
    imports: [TypeOrmModule.forFeature([PollModel]), UsersModule],
    controllers: [PollsController],
    providers: [
        Logger,
        {
            provide: POLL_INJECTION_TOKENS.IPOLL_SERVICE,
            useClass: PollsService,
        },
        {
            provide: POLL_INJECTION_TOKENS.IPOLL_REPOSITORY,
            useClass: PollsRepository,
        },
    ],
    exports: [POLL_INJECTION_TOKENS.IPOLL_REPOSITORY],
})
export class PollsModule {}
