import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.client = createClient({
      username: this.configService.get('REDIS_USERNAME') || 'default',
      password: this.configService.get('REDIS_PASSWORD'),
      socket: {
        host: this.configService.get('REDIS_HOST'),
        port: Number(this.configService.get('REDIS_PORT')),
      },
    });

    this.client.on('connect', () => console.log('[Redis] Connected'));
    this.client.on('error', (err) => console.error('[Redis] Error:', err));

    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) {
      await this.client.set(key, value, { EX: ttlSeconds });
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async del(key: string) {
    return this.client.del(key);
  }

  async exists(key: string) {
    return (await this.client.exists(key)) === 1;
  }

  getClient() {
    return this.client;
  }

  async getKeys(pattern: string) {
    return this.client.keys(pattern);
  }

  async keys(pattern: string) {
    return this.client.keys(pattern);
  }
  async createRefreshSession(jti: string, userId: string, ttlSeconds: number) {
    await this.set(`refresh:${jti}`, userId, ttlSeconds);
  }

  async isRefreshSessionActive(jti: string) {
    return await this.exists(`refresh:${jti}`);
  }

  async revokeRefreshSession(jti: string) {
    await this.del(`refresh:${jti}`);
  }

  async revokeAllSessionsForUser(userId: string) {
    const keys = await this.keys(`refresh:*:${userId}`);
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => this.del(key)));
    }
  }
}
