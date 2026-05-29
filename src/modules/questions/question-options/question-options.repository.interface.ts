import { QuestionOptionEntity } from './entities/question-options.entity';

export interface IQuestionOptionsRepository {
    createOption(questionOption: {
        questionId: number;
        text: string;
        orderNum: number;
    }): Promise<QuestionOptionEntity>;
    findMany(questionId: number): Promise<QuestionOptionEntity[]>;
}
