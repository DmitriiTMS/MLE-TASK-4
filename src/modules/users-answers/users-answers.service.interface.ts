import { IDataCreateAnswer } from "./constants/types";

export interface IUsersAnswersService {
  createAnswer(data: IDataCreateAnswer): Promise<any>
}
