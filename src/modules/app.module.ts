import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ThrottlerModule } from '@nestjs/throttler';
import { validateConfig } from '../config/validation.config';

import { AuthModule } from './auth/auth.module';
import { DataBaseModule } from './database/database.module';
import { PollsModule } from './polls/polls.module';

import { QuestionsModule } from './questions/questions.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';
import { UsersAnswersModule } from './users-answers/users-answers.module';

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
        QuestionsModule,
        UsersAnswersModule
    ],
})
export class AppModule {}
