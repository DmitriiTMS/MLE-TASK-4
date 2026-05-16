import { Logger, Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { PollEntity } from './entities/polls.entity';
import { PollsService } from './polls.service';
import { PollsController } from './polls.controller';
import { UsersModule } from '../users/users.module';
import { PollsRepository } from './polls.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([PollEntity]),
        UsersModule
    ],
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
export class PollsModule { }
