import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ActivityService } from '../activity/activity.service';
import { RedisService } from '../redis/redis.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { CreateAuthDto } from './dto/create-auth.dto';
import * as crypto from 'crypto';

interface RefreshTokenPayload {
  sub: string;
  jti: string;
  typ: 'refresh';
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private readonly activityLogService: ActivityService,
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
  ) {}

  private signAccessToken(payload: any) {
    return this.jwt.sign(payload, { expiresIn: '15m' });
  }
  private signRefreshToken(payload: any) {
    const jti = crypto.randomUUID();
    return {
      token: this.jwt.sign(
        { ...payload, jti, typ: 'refresh' },
        { expiresIn: '7d' },
      ),
      jti,
    };
  }

  async createAccount(dto: CreateAuthDto) {
    const { payload, user } = await this.usersService.createAccount(dto);

    const accessToken = this.signAccessToken(payload);
    const { token: refreshToken, jti } = this.signRefreshToken({
      sub: user[0]._id.toString(),
    });

    await this.redisService.createRefreshSession(
      jti,
      user[0]._id.toString(),
      7 * 24 * 60 * 60,
    );

    this.activityLogService.joinOrganisationActivityLog(user[0]);

    return {
      accessToken,
      refreshToken,
      user: user[0],
    };
  }

  async login(dto: LoginAuthDto) {
    const { payload, user } = await this.usersService.loginUser(dto);

    const accessToken = this.signAccessToken(payload);
    const { token: refreshToken, jti } = this.signRefreshToken({
      sub: user._id.toString(),
    });

    await this.redisService.createRefreshSession(
      jti,
      user._id.toString(),
      7 * 24 * 60 * 60,
    );
    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        isSuperUser: user.isSuperUser,
        organisationId: user.organisationId,
      },
    };
  }

  async validateToken(token: string) {
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }
    try {
      return this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwt.verify<RefreshTokenPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const sessionActive = await this.redisService.isRefreshSessionActive(
      payload.jti,
    );
    if (!sessionActive) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    await this.redisService.revokeRefreshSession(payload.jti);

    const accessToken = this.signAccessToken({ sub: payload.sub });
    const { token: newRefreshToken, jti } = this.signRefreshToken({
      sub: payload.sub,
    });

    await this.redisService.createRefreshSession(
      jti,
      payload.sub,
      7 * 24 * 60 * 60,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }
  async logout(refreshToken: string) {
    if (!refreshToken) {
      return true;
    }

    const payload: RefreshTokenPayload = this.jwt.decode(
      refreshToken,
    ) as RefreshTokenPayload;
    if (payload?.jti) {
      await this.redisService.revokeRefreshSession(payload.jti);
    }

    return true;
  }

  async logoutAllDevices(userId: string) {
    await this.redisService.revokeAllSessionsForUser(userId);
  }
}
