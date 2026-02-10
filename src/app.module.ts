import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envConfig } from './config/env.config';
import { RateLimiterMiddleware } from './middlewares/RateLimiterMiddleware';
import { RateLimit, RateLimitSchema } from './schemas/rate-limit.schema';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { InviteModule } from './modules/invite/invite.module';
import { OrganisationModule } from './modules/organisation/organisation.module';
import { MessagesModule } from './modules/messages/messages/messages.module';
import { EmailModule } from './modules/email/email.module';
import { ActivityModule } from './modules/activity/activity.module';
import { RedisModule } from './modules/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [envConfig],
      envFilePath: '.env',
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('db.uri'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: RateLimit.name, schema: RateLimitSchema },
    ]),
    UsersModule,
    AuthModule,
    InviteModule,
    OrganisationModule,
    MessagesModule,
    EmailModule,
    ActivityModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimiterMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
