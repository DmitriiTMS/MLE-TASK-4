import { ResultsWithNamesRaw } from "./constants/types";
import { UsersAnswersEntity } from "./domain/users-answers.entity";

export interface IUsersAnswersRepository {
    createMultipleAnswers(answerEntities: UsersAnswersEntity[]): Promise<{ userAnswerSave: boolean }>
    findByUserAndQuestion(userId: number, pollId: number, questionId: number, questionOptionIds: number[]): Promise<UsersAnswersEntity[]>
    findOneResults(pollId: number): Promise<ResultsWithNamesRaw[]>
}
