import { Logger, Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { PollEntity } from './entities/polls.entity';

@Module({
    imports: [TypeOrmModule.forFeature([PollEntity])],
    controllers: [],
    providers: [
        Logger,
    ],

})
export class PollsModule {}
