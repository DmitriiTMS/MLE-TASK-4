import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { PostgresConnectionCredentialsOptions } from "typeorm/driver/postgres/PostgresConnectionCredentialsOptions.js";
import migrations from "./migrations";

export const databaseOptions = (config: ConfigService): TypeOrmModuleOptions & PostgresConnectionCredentialsOptions => ({
    type: <any>config.getOrThrow('DB_TYPE'),
    host: config.getOrThrow('DB_HOST'),
    port: Number(config.getOrThrow('DB_PORT')),
    username: config.getOrThrow('DB_USERNAME'),
    password: config.getOrThrow('DB_PASSWORD'),
    database: config.getOrThrow('DB_DATABASE'),
    logging: config.getOrThrow('DB_LOGGING') == true,
    synchronize: false,
    migrationsTableName: config.getOrThrow('DB_MIGRATIONS_TABLE_NAME'),
    migrations,
    autoLoadEntities: true
})