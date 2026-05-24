import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { REDIS_CLIENT, type RedisClient } from '../../config/redis.config';


@Injectable()
export class RedisService implements OnModuleDestroy {

  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClient) { }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length) {
      await this.redis.del(...keys);
    }
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  onModuleDestroy() {
    this.redis.quit();
  }
}