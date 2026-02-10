import { Injectable } from '@nestjs/common';
import { UserDocument } from '../../schemas/users.schema';
import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';
import {
  ActivityLog,
  ActivityLogDocument,
} from '../../schemas/activitylog.schema';

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(ActivityLog.name)
    private activityLogModel: Model<ActivityLogDocument>,
  ) {}
  async joinOrganisationActivityLog(user: UserDocument) {
    await this.activityLogModel.create({
      title: 'Joined',
      description: `${user.name} joined the organisation`,
      organisationId: user.organisationId,
    });
  }

  async sendInviteActivityLog(email: string, organisationId: Types.ObjectId) {
    return await this.activityLogModel.create({
      title: 'Invite Sent',
      description: `Invite sent to ${email}`,
      organisationId,
    });
  }

  async resendInviteActivityLog(email: string, organisationId: Types.ObjectId) {
    return await this.activityLogModel.create({
      title: 'Invite Resent',
      description: `Invite resent to ${email}`,
      organisationId,
    });
  }

  async removeFromOrganisationActivityLog(
    user: UserDocument,
    organisationId: Types.ObjectId,
  ) {
    return await this.activityLogModel.create({
      title: 'Remove User',
      description: `${user.name} removed from the organisation`,
      organisationId,
    });
  }

  async makeUserAdminActivityLog(
    user: UserDocument,
    organisationId: Types.ObjectId,
  ) {
    return await this.activityLogModel.create({
      title: 'Role Upgrade',
      description: `${user.name} role changed to Admin `,
      organisationId,
    });
  }

  async getActivityLog(organisationId: string) {
    return this.activityLogModel
      .find({ organisationId: new Types.ObjectId(organisationId) })
      .sort({ createdAt: -1 })
      .exec();
  }
}
