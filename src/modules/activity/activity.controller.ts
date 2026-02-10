import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { ActivityService } from './activity.service';
import { IsAdmin } from '../../common/decorators/is-admin.decorator';
import { IsSuperUser } from '../../common/decorators/is-super-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('logs')
  @IsAdmin()
  @IsSuperUser()
  async getActivityLogs(@AuthUser() user: JwtUser) {
    const organisationId = user.organisationId;

    const activityLogs =
      await this.activityService.getActivityLog(organisationId);

    return {
      success: true,
      activityLogs: activityLogs,
    };
  }
}
