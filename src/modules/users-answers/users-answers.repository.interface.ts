import { UsersAnswersEntity } from "./domain/users-answers.entity";

export interface IUsersAnswersRepository {
    // createMultipleAnswers(answerEntities: UsersAnswersEntity[]): Promise<UsersAnswersEntity[]>
    createMultipleAnswers(answerEntities: UsersAnswersEntity[]): Promise<void>
    findByUserAndQuestion(userId: number, pollId: number, questionId: number, questionOptionIds: number[]): Promise<UsersAnswersEntity[]>
}
