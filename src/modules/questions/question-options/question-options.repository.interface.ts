import { QuestionOptionEntity } from './domain/question-options.entity';

export interface IQuestionOptionsRepository {
    createOption(questionOption: {
        questionId: number;
        text: string;
        orderNum: number;
    }): Promise<QuestionOptionEntity>;
    deleteOption(optionId: number): Promise<void>;
    findOptionById(optionId: number): Promise<QuestionOptionEntity | null>;
}
