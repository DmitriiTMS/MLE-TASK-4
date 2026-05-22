import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export type RedisClient = Redis;

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (configService: ConfigService) => {
    return new Redis({
      host: configService.getOrThrow('REDIS_HOST'),
      port: parseInt(configService.getOrThrow('REDIS_PORT')),
      password: configService.getOrThrow('REDIS_PASSWORD'),
    });
  },
  inject: [ConfigService],
};