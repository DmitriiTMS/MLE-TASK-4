import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PollsModule } from '../polls/polls.module';
import { QUESTIONS_INJECTION_TOKENS } from './constants/questions-injection-tokens';
import { QuestionOptionEntity } from './entities/question-options.entity';
import { QuestionEntity } from './entities/questions.entity';
import { QuestionsController } from './questions.controller';
import { QuestionsRepository } from './questions.repository';
import { QuestionsService } from './questions.service';
import { PollEntity } from '../polls/entities/polls.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            PollEntity,
            QuestionEntity,
            QuestionOptionEntity
        ]),
        PollsModule
    ],
    controllers: [QuestionsController],
    providers: [
        Logger,
        {
            provide: QUESTIONS_INJECTION_TOKENS.IQUESTIONS_SERVICE,
            useClass: QuestionsService,
        },
        {
            provide: QUESTIONS_INJECTION_TOKENS.IQUESTIONS_REPOSITORY,
            useClass: QuestionsRepository,
        },
    ],
})
export class QuestionsModule { }
