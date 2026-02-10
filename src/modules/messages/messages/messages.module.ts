import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { EmailModule } from '../../email/email.module';
import { AuthModule } from '../../auth/auth.module';
@Module({
  imports: [EmailModule, AuthModule], // 👈
  providers: [MessagesService],
  controllers: [MessagesController],
})
export class MessagesModule {}
