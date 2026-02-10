import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Invite, InviteSchema } from '../../schemas/invite.schema';
import { InviteService } from './invite.service';
import { InviteController } from './invite.controller';
import { UsersModule } from '../users/users.module';
import { OrganisationModule } from '../organisation/organisation.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { ActivityModule } from '../activity/activity.module';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Invite.name, schema: InviteSchema }]),
    UsersModule,
    OrganisationModule,
    AuthModule,
    EmailModule,
    ActivityModule,
  ],
  providers: [InviteService],
  controllers: [InviteController],
  exports: [InviteService],
})
export class InviteModule {}
