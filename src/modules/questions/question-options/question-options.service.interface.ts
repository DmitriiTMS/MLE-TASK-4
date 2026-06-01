import { ICreateOptioData, IDeleteOptionData } from './constants/types';
import { QuestionOptionEntity } from './domain/question-options.entity';

export interface IQuestionOptionsService {
    createOption(data: ICreateOptioData): Promise<QuestionOptionEntity>;
    deleteOption(data: IDeleteOptionData): Promise<void>;
}
