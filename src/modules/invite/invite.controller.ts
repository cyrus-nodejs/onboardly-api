import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InviteService } from './invite.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsAdmin } from '../../common/decorators/is-admin.decorator';
import { IsSuperUser } from '../../common/decorators/is-super-user.decorator';
import { Public } from '../../common/decorators/is-public.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';


@Controller('invites')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Post('send')
  @IsAdmin()
  @IsSuperUser()
  async sendUserInvite(
    @AuthUser() user: JwtUser,
    @Body() body: { email: string; name: string },
  ) {
    const organisationId = user.organisationId;

    const invite = await this.inviteService.sendUserInvite(
      user.sub,
      organisationId,
      body,
    );

    return {
      success: true,
      inviteId: invite.inviteId,
      expiresAt: invite.expiresAt,
    };
  }

  @Get('pending')
  @IsAdmin()
  @IsSuperUser()
  async getPendingInvite(@AuthUser() user: JwtUser) {
    const organisationId = user.organisationId;
    const pendingInvite =
      await this.inviteService.pendingInvites(organisationId);

    return {
      success: true,
      pendingInvite,
    };
  }

  @Get('accepted')
  @IsAdmin()
  @IsSuperUser()
  async getAcceptedInvite(@AuthUser() user: JwtUser) {
    const organisationId = user.organisationId;
    const acceptedInvite =
      await this.inviteService.acceptedInvites(organisationId);

    return {
      success: true,
      acceptedInvite,
    };
  }
  @Get(':inviteId')
  @Public()
  async findInviteByToken(@Param('inviteId') inviteId: string) {
    console.log(inviteId);
    const invite = await this.inviteService.findInviteByToken(inviteId);

    return {
      success: true,
      name: invite.name,
      email: invite.email,
      organisationId: invite.organisationId,
    };
  }

  @Post(':inviteId/accept')
  @Public()
  async acceptInvite(
    @Param('inviteId') inviteId: string,
    @Body() body: { name: string; email: string; password: string },
  ) {
    const user = await this.inviteService.acceptInvite(inviteId, body);
    return {
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        organisationId: user.organisationId,
      },
    };
  }
  @Patch(':id/resend')
  @IsAdmin()
  @IsSuperUser()
  async resendInvite(@Param('id') inviteId: string, @AuthUser() user: JwtUser) {
    const organisationId = user.organisationId;

    const invite = await this.inviteService.resendInvite(
      inviteId,
      organisationId,
    );

    return {
      success: true,
      inviteId: invite.inviteId,
      expiresAt: invite.expiresAt,
    };
  }
}
