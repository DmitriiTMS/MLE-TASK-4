import { QuestionOptionEntity } from './entities/question-options.entity';
import { QuestionEntity } from './entities/questions.entity';

export interface IQuestionsRepository {
    createQuestion(
        question: QuestionEntity,
        questionOptions: QuestionOptionEntity[],
    ): Promise<QuestionEntity>;
}
