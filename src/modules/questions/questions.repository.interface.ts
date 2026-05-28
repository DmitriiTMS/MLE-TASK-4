import { PollEntity } from '../polls/entities/polls.entity';
import { QuestionOptionEntity } from './entities/question-options.entity';
import { QuestionEntity } from './entities/questions.entity';

export interface IQuestionsRepository {
    createQuestion(
        question: QuestionEntity,
        questionOptions: QuestionOptionEntity[],
    ): Promise<QuestionEntity>;
    findPollWithQuestions(pollId: number, isOwner: boolean): Promise<PollEntity | null>
}
