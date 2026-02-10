import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from './interfaces/jwt-user.interface';
import { IsAdmin } from '../../common/decorators/is-admin.decorator';
import { IsSuperUser } from '../../common/decorators/is-super-user.decorator';
import { LoginAuthDto } from './dto/login-auth.dto';
import { CreateAuthDto } from './dto/create-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
  ) {}

  @Post('account/create')
  async createAccount(
    @Res({ passthrough: true }) res: Response,
    @Body() body: CreateAuthDto,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.createAccount(body);

    return { accessToken, refreshToken, user };
  }

  @Post('login')
  async login(@Body() body: LoginAuthDto) {
    const { accessToken, refreshToken, user } =
      await this.authService.login(body);

    return { accessToken, refreshToken, user };
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshToken(refreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  }

  @Post('logout')
  async logout(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) {
      return { message: 'Already logged out' };
    }
    await this.authService.logout(refreshToken);

    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@AuthUser() user: JwtUser) {
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Post('password/change')
  @IsAdmin()
  @IsSuperUser()
  async changePassword(
    @Body() body: { currentPassword: string; newPassword: string },
    @AuthUser() user: JwtUser,
  ) {
    await this.userService.changePassword(body, user.sub);
    return { success: true, message: 'Password updated successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout/all')
  async logoutAll(@AuthUser() user: JwtUser) {
    await this.authService.logoutAllDevices(user.sub);
    return { message: 'Logged out of all devices successfully' };
  }
}
