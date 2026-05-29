import { PollEntity } from '../polls/entities/polls.entity';
import { IDataRequestQuestion } from './constants/types';
import { QuestionEntity, QuestionType } from './entities/questions.entity';

export interface IQuestionsService {
    createQuestionWithOptions(data: IDataRequestQuestion): Promise<QuestionEntity>;
    findPollWithAllQuestions(userId: number, pollId: number): Promise<PollEntity>
    findQuestion(data: { userId: number, pollId: number, questionId: number }): Promise<QuestionEntity>
    deleteQuestionWithOptions(data: { userId: number, pollId: number, questionId: number }): Promise<void>
    updateQuestion(
        data: {
            userId: number;
            pollId: number;
            questionId: number;
            updateData: {
                text: string;
                type: QuestionType;
                orderNum: number;
                options: {
                    id?: number;
                    text: string;
                    orderNum: number;
                }[];
            };
        }
    ): Promise<QuestionEntity>
}
