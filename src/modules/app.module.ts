import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateConfig } from '../config/validation.config';
import { UsersModule } from './users/users.module';
import { DataBaseModule } from './database/database.module';

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
  ],
})
export class AppModule {}
