
import { PollEntity } from '../../polls/domain/polls.entity';
import { DataRequestQuestionDto } from './constants/types';
import { QuestionEntity } from './domain/questions.entity';
import {  QuestionType } from './models/questions.model';

export interface IQuestionsService {
    createQuestionWithOptions(data: DataRequestQuestionDto): Promise<QuestionEntity>;
    findPollWithAllQuestions(userId: number, pollId: number): Promise<PollEntity>;
    findQuestion(data: {
        userId: number;
        pollId: number;
        questionId: number;
    }): Promise<QuestionEntity>;
    deleteQuestionWithOptions(data: {
        userId: number;
        pollId: number;
        questionId: number;
    }): Promise<void>;
    updateQuestion(data: {
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
    }): Promise<QuestionEntity>;
}
