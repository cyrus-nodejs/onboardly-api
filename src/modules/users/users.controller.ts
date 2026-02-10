import {
  Controller,
  Get,
  UseGuards,
  Delete,
  Patch,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsAdmin } from '../../common/decorators/is-admin.decorator';
import { IsSuperUser } from '../../common/decorators/is-super-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get('employees/total')
  @IsAdmin()
  @IsSuperUser()
  async getTotalEmployees(@AuthUser() user: JwtUser) {
    const organisationId = user.organisationId;

    const totalEmployees =
      await this.usersService.getTotalEmployees(organisationId);

    return {
      success: true,
      totalEmployees,
    };
  }

  @Get('employees/all')
  @IsAdmin()
  @IsSuperUser()
  async getAllEmployees(@AuthUser() user: JwtUser) {
    const organisationId = user.organisationId;
    const allEmployees =
      await this.usersService.getAllEmployees(organisationId);
    return {
      success: true,
      allEmployees,
    };
  }
  @Delete('employees/:id/delete')
  @IsSuperUser()
  async deleteEmployee(@Param('id') id: string) {
    return this.usersService.deleteEmployee(id);
  }

  @Patch('employees/:id/role')
  @IsSuperUser()
  @IsAdmin()
  async upgradeToAdmin(@Param('id') id: string) {
    return this.usersService.upgradeToAdmin(id);
  }
}
