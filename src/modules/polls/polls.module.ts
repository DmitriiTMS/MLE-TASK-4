import { Logger, Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { PollEntity } from './entities/polls.entity';
import { PollsController } from './polls.controller';
import { PollsRepository } from './polls.repository';
import { PollsService } from './polls.service';

@Module({
    imports: [TypeOrmModule.forFeature([PollEntity]), UsersModule],
    controllers: [PollsController],
    providers: [
        Logger,
        {
            provide: 'IPollsService',
            useClass: PollsService,
        },
        {
            provide: 'IPollsRepository',
            useClass: PollsRepository,
        },
    ],
})
export class PollsModule {}
