import { Module,  } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionEntity } from './entities/questions.entity';
import { QuestionOptionEntity } from './entities/question-options.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([QuestionEntity, QuestionOptionEntity]),
    ],
})
export class QuestionsModule {}