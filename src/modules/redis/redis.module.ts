import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { REDIS_CLIENT, redisProvider } from '../../config/redis.config';

@Global()
@Module({
  providers: [redisProvider, RedisService],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}