import { Get, Body, Patch, Controller, UseGuards } from '@nestjs/common';
import { OrganisationService } from './organisation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsAdmin } from '../../common/decorators/is-admin.decorator';
import { IsSuperUser } from '../../common/decorators/is-super-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('organisations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganisationController {
  constructor(private organisationService: OrganisationService) {}

  @Get('current')
  @IsAdmin()
  @IsSuperUser()
  async getCurrentOrganisation(@AuthUser() user: JwtUser) {
    const organisationId = user.organisationId;
    const currentOrganisation =
      await this.organisationService.getCurrentOrganisation(organisationId);
    return {
      success: true,
      currentOrganisation,
    };
  }

  @Patch('update')
  @IsSuperUser()
  async updateOrganisation(
    @AuthUser() user: JwtUser,
    @Body() body: { email: string; name: string },
  ) {
    const organisationId = user.organisationId;
    await this.organisationService.updateOrganisation(organisationId, body);
    return {
      success: true,
      message: 'Organisation updated successfully!',
    };
  }
}
