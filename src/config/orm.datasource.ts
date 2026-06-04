import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

import migrations from '../modules/database/migrations';
import { PollModel } from '../modules/polls/models/polls.model';
import { QuestionOptionModel } from '../modules/questions/question-options/models/question-options.model';
import { QuestionModel } from '../modules/questions/questions-variant/models/questions.model';
import { UserModel } from '../modules/users/models/user.model';
import { UsersAnswersModel } from '../modules/users-answers/models/users-answers.model';

const envFilePath = `.env.${process.env.NODE_ENV}`;
dotenv.config({ path: envFilePath });

export default new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT),
    synchronize: false,
    entities: [UserModel, PollModel, QuestionModel, QuestionOptionModel, UsersAnswersModel],
    migrations,
    migrationsTableName: process.env.DB_MIGRATIONS_TABLE_NAME,
});
