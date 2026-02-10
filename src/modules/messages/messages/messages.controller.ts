import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { EmailService } from '../../email/email.service';
import { SendEmailDto } from '../dto/send-email.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { IsAdmin } from '../../../common/decorators/is-admin.decorator';
import { IsSuperUser } from '../../../common/decorators/is-super-user.decorator';
@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @IsAdmin()
  @IsSuperUser()
  sendEmail(@Body() dto: SendEmailDto) {
    return this.emailService.sendMail(dto.to, dto.subject, dto.message);
  }
}
