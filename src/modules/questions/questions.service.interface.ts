import { PollEntity } from '../polls/entities/polls.entity';
import { IDataRequestQuestion } from './constants/types';
import { QuestionEntity } from './entities/questions.entity';

export interface IQuestionsService {
    createQuestionWithOptions(data: IDataRequestQuestion): Promise<QuestionEntity>;
    findPollWithAllQuestions(userId: number, pollId: number): Promise<PollEntity>
    findQuestion(data: {userId: number,pollId: number,questionId: number }): Promise<QuestionEntity>
}
