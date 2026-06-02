import { PollEntity } from '../../polls/domain/polls.entity';
import { QuestionOptionEntity } from '../question-options/domain/question-options.entity';

import { QuestionEntity } from './domain/questions.entity';

export interface IQuestionsRepository {
    createQuestion(
        question: QuestionEntity,
        questionOptions: QuestionOptionEntity[],
    ): Promise<QuestionEntity>;
    findPollWithQuestions(pollId: number, isOwner: boolean): Promise<PollEntity | null>;
    findQuestion(pollId: number, questionId: number): Promise<QuestionEntity | null>;
    deleteQuestionWithOptions(pollId: number, questionId: number): Promise<void>;
    updateQuestionWithOptions(question: QuestionEntity): Promise<QuestionEntity>;
    findOneQuestion(questionId: number): Promise<QuestionEntity | null>;
}
