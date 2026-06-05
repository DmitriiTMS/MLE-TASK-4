import { Logger, Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersAnswersModel } from './models/users-answers.model';
import { UsersAnswersController } from './users-answers.controller';
import { USERS_ANSWERS_INJECTION_TOKENS } from './constants/users-answers-injection-tokens';
import { UsersAnswersService } from './users-answers.service';
import { UsersAnswersRepository } from './users-answers.repository';
import { QuestionsModule } from '../questions/questions.module';
import { PollsModule } from '../polls/polls.module';
import { UsersAnswersGateway } from './users-answers.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';


@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('JWT_ACCESS_SECRET'),
                signOptions: { expiresIn: configService.getOrThrow('JWT_ACCESS_EXPIRES_IN') },
            }),
            inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([UsersAnswersModel]),
        PollsModule,
        QuestionsModule
    ],
    controllers: [UsersAnswersController],
    providers: [
        Logger,
        UsersAnswersGateway,
        {
            provide: USERS_ANSWERS_INJECTION_TOKENS.IUSERS_ANSWERS_SERVICE,
            useClass: UsersAnswersService,
        },
        {
            provide: USERS_ANSWERS_INJECTION_TOKENS.IUSERS_ANSWERS_REPOSITORY,
            useClass: UsersAnswersRepository,
        },
    ],
})
export class UsersAnswersModule { }
