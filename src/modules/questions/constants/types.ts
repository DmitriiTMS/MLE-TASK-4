import { CreateQuestionWithOptionsDto } from '../dto/create-question-with-options.dto';

export enum QuestionType {
    SINGLE = 'single',
    MULTIPLE = 'multiple',
}

export interface IDataRequestQuestion {
    userId: number;
    pollId: number;
    createQuestionDto: CreateQuestionWithOptionsDto;
}

export interface IResponseQuestionOptions {
    id?: number;
    questionId?: number;
    text: string;
    orderNum: number;
}

export interface IResponseQuestion {
    id: number;
    pollId: number;
    text: string;
    type: string;
    orderNum: number;
    questionOptions: IResponseQuestionOptions[];
}
