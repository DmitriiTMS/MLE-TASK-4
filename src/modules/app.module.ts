import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ThrottlerModule } from '@nestjs/throttler';
import { validateConfig } from '../config/validation.config';

import { AuthModule } from './auth/auth.module';
import { DataBaseModule } from './database/database.module';
import { PollsModule } from './polls/polls.module';
import { UsersModule } from './users/users.module';
import { RedisModule } from './redis/redis.module';
import { QuestionsModule } from './questions/questions.module';

const envFilePath = `.env.${process.env.NODE_ENV}`;

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [envFilePath, '.env'],
            validate: validateConfig,
        }),
        ThrottlerModule.forRoot({
            throttlers: [
                {
                    ttl: 60000,
                    limit: 5,
                },
            ],
        }),
        DataBaseModule,
        RedisModule,
        UsersModule,
        AuthModule,
        PollsModule,
        QuestionsModule
    ],
})
export class AppModule {}
