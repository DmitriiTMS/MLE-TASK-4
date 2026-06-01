import { QuestionOptionEntity } from "./domain/question-options.entity";


export interface IQuestionOptionsRepository {
    createOption(questionOption: {
        questionId: number;
        text: string;
        orderNum: number;
    }): Promise<QuestionOptionEntity>;
}
