import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateConfig } from '../config/validation.config';

import { AuthModule } from './auth/auth.module';
import { DataBaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { JwtTokenModule } from './auth/utils/jwt/jwt.module';

const envFilePath = `.env.${process.env.NODE_ENV}`;

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [envFilePath, '.env'],
            validate: validateConfig,
        }),
        DataBaseModule,
        UsersModule,
        AuthModule,
    ],
})
export class AppModule {}
