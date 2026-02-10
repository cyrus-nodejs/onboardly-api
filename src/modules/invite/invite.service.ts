import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';

import { CreateInviteDto } from './dto/create-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { ActivityService } from '../activity/activity.service';
import { UsersService } from '../users/users.service';
import { Invite, InviteDocument } from '../../schemas/invite.schema';
import { OrganisationService } from '../organisation/organisation.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class InviteService {
  constructor(
    @InjectModel(Invite.name)
    private readonly inviteModel: Model<InviteDocument>,
    private readonly activityLogService: ActivityService,
    private readonly emailService: EmailService,
    private readonly organisationService: OrganisationService,
    private readonly userService: UsersService,
  ) {}

  private getExpiryDays(): number {
    return Number(process.env.INVITE_EXPIRY_DAYS || 7);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private validateObjectId(id: string, name: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${name}`);
    }
  }

  private buildInviteEmail(
    name: string,
    organisationName: string,
    link: string,
    expiresAt: Date,
    subjectPrefix = "You're invited to join",
  ) {
    const expiryDate = expiresAt.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return {
      subject: `${subjectPrefix} ${organisationName}`,
      body: `
Hello ${name},

You have been invited to join ${organisationName}.

Accept the invite here:
${link}

This link expires on ${expiryDate}
`.trim(),
    };
  }

  async sendUserInvite(
    invitedBy: string,
    organisationId: string,
    dto: CreateInviteDto,
  ) {
    this.validateObjectId(invitedBy, 'invitedBy');
    this.validateObjectId(organisationId, 'organisationId');

    const email = this.normalizeEmail(dto.email);
    const organisationObjectId = new Types.ObjectId(organisationId);

    const token = crypto.randomUUID();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const expiresAt = new Date(
      Date.now() + this.getExpiryDays() * 24 * 60 * 60 * 1000,
    );

    const session = await this.inviteModel.db.startSession();
    session.startTransaction();

    try {
      const existingInvite = await this.inviteModel.findOne(
        {
          email,
          organisationId: organisationObjectId,
          used: false,
          expiresAt: { $gt: new Date() },
        },
        null,
        { session },
      );

      if (existingInvite) {
        throw new BadRequestException('Active invite already exists');
      }

      const invite = await this.inviteModel.create(
        [
          {
            invitedBy: new Types.ObjectId(invitedBy),
            organisationId: organisationObjectId,
            name: dto.name,
            email,
            tokenHash,
            expiresAt,
            used: false,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      this.activityLogService.sendInviteActivityLog(
        email,
        organisationObjectId,
      );
      const organisation =
        await this.organisationService.findById(organisationId);
      if (!organisation) {
        throw new NotFoundException('Organisation not found');
      }

      const link = `${
        process.env.FRONTEND_URL || 'http://localhost:3000'
      }/invitation/accept/?token=${token}`;

      try {
        const { subject, body } = this.buildInviteEmail(
          dto.name,
          organisation.name,
          link,
          invite[0].expiresAt,
        );

        await this.emailService.sendMail(dto.email, subject, body);
      } catch (err) {
        throw new InternalServerErrorException('Failed to send invite email');
      }

      return {
        inviteId: invite[0]._id,
        expiresAt,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findInviteByToken(token: string) {
    if (!token) {
      return null;
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const invite = await this.inviteModel.findOne({
      tokenHash,
    });
    if (!invite) {
      throw new NotFoundException('not_found');
    }

    if (invite.used) {
      throw new BadRequestException('used');
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new ConflictException('used');
    }

    return invite;
  }

  async markUsedInvite(inviteId: string, organisationId: string) {
    this.validateObjectId(inviteId, 'inviteId');
    this.validateObjectId(organisationId, 'organisationId');

    const updated = await this.inviteModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(inviteId),
        used: false,
        organisationId: new Types.ObjectId(organisationId),
        expiresAt: { $gt: new Date() },
      },
      {
        used: true,
      },
      {
        new: true,
      },
    );

    if (!updated) {
      throw new BadRequestException(
        'Invite is invalid, expired, or already used',
      );
    }

    return updated;
  }

  async acceptInvite(token: string, dto: AcceptInviteDto) {
    const invite = await this.findInviteByToken(token);
    try {
      const user = await this.userService.createNewEmployee(
        dto,
        invite.organisationId,
      );

      if (user) {
        await this.markUsedInvite(
          invite._id.toString(),
          invite.organisationId.toString(),
        );
        return user;
      }
    } catch (error) {
      throw new InternalServerErrorException('Failed to accept invite');
    }
  }

  async resendInvite(inviteId: string, organisationId: string) {
    this.validateObjectId(inviteId, 'inviteId');

    const invite = await this.inviteModel.findById(inviteId);

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.used) {
      throw new BadRequestException('Invite already used');
    }

    const token = crypto.randomUUID();
    invite.tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    invite.expiresAt = new Date(
      Date.now() + this.getExpiryDays() * 24 * 60 * 60 * 1000,
    );

    await invite.save();
    const organisation =
      await this.organisationService.findById(organisationId);
    if (!organisation) {
      throw new NotFoundException('Organisation not found');
    }
    const link = `${
      process.env.FRONTEND_URL || 'http://localhost:3000'
    }/invitation/accept/?token=${token}`;

    try {
      const { subject, body } = this.buildInviteEmail(
        invite.name,
        organisation.name,
        link,
        invite.expiresAt,
        'Your invitation has been resent to join',
      );

      await this.emailService.sendMail(invite.email, subject, body);
    } catch (err) {
      throw new InternalServerErrorException('Failed to resend invite email');
    }

    this.activityLogService.resendInviteActivityLog(
      invite.email,
      invite.organisationId,
    );

    return {
      inviteId: invite._id,
      email: invite.email,
      name: invite.name,
      expiresAt: invite.expiresAt,
    };
  }

  async pendingInvites(organisationId: string) {
    this.validateObjectId(organisationId, 'organisationId');
    return this.inviteModel.find({
      organisationId: new Types.ObjectId(organisationId),
      used: false,
      expiresAt: { $gt: new Date() },
    });
  }

  async acceptedInvites(organisationId: string) {
    this.validateObjectId(organisationId, 'organisationId');

    return this.inviteModel.find({
      organisationId: new Types.ObjectId(organisationId),
      used: true,
    });
  }
}
