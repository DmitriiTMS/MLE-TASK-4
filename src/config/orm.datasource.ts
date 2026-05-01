import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

import migrations from '../modules/database/migrations';
import { UserEntity } from '../modules/users/entities/user.entity';

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
    entities: [UserEntity],
    migrations,
    migrationsTableName: process.env.DB_MIGRATIONS_TABLE_NAME,
});
