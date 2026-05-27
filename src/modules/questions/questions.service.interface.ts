import { IDataRequestQuestion } from './constants/types';
import { QuestionEntity } from './entities/questions.entity';

export interface IQuestionsService {
    createQuestionWithOptions(data: IDataRequestQuestion): Promise<QuestionEntity>;
}
