import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PollEntity } from '../polls/entities/polls.entity';
import { PollsModule } from '../polls/polls.module';
import { OPTIONS_INJECTION_TOKENS } from './question-options/constants/option-injection-tokens';
import { QuestionOptionEntity } from './question-options/entities/question-options.entity';
import { QuestionOptionsController } from './question-options/question-options.controller';
import { QuestionOptionsRepository } from './question-options/question-options.repository';
import { QuestionOptionsService } from './question-options/question-options.service';
import { QUESTIONS_INJECTION_TOKENS } from './questions-variant/constants/questions-injection-tokens';
import { QuestionEntity } from './questions-variant/entities/questions.entity';
import { QuestionsController } from './questions-variant/questions.controller';
import { QuestionsRepository } from './questions-variant/questions.repository';
import { QuestionsService } from './questions-variant/questions.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([PollEntity, QuestionEntity, QuestionOptionEntity]),
        PollsModule,
    ],
    controllers: [QuestionsController, QuestionOptionsController],
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
        {
            provide: OPTIONS_INJECTION_TOKENS.IOPTIONS_SERVICE,
            useClass: QuestionOptionsService,
        },
        {
            provide: OPTIONS_INJECTION_TOKENS.IOPTIONS_REPOSITORY,
            useClass: QuestionOptionsRepository,
        },
    ],
})
export class QuestionsModule {}
