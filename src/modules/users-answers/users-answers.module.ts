import { Logger, Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersAnswersModel } from './models/users-answers.model';
import { UsersAnswersController } from './users-answers.controller';
import { USERS_ANSWERS_INJECTION_TOKENS } from './constants/users-answers-injection-tokens';
import { UsersAnswersService } from './users-answers.service';
import { UsersAnswersRepository } from './users-answers.repository';
import { QuestionsModule } from '../questions/questions.module';
import { PollsModule } from '../polls/polls.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([UsersAnswersModel]),
        PollsModule,
        QuestionsModule
    ],
    controllers: [UsersAnswersController],
    providers: [
        Logger,
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
