import { CreateAuthDto } from '../auth/dto/create-auth.dto';
import { LoginAuthDto } from '../auth/dto/login-auth.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from '../../schemas/users.schema';

import { ActivityService } from '../activity/activity.service';
import { OrganisationService } from '../organisation/organisation.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly activityLogService: ActivityService,
    private readonly organisationService: OrganisationService,
  ) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async startSession() {
    return this.userModel.db.startSession();
  }

  async createNewEmployee(dto: CreateUserDto, organisationId: Types.ObjectId) {
    const email = this.normalizeEmail(dto.email);

    const existing = await this.userModel.findOne({ email });
    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(dto.password, salt);
    const user = await this.userModel.create({
      name: dto.name,
      email: dto.email,
      password: hash,
      organisationId: organisationId,
    });

    if (!user) {
      throw new InternalServerErrorException('User not created');
    }

    this.activityLogService.joinOrganisationActivityLog(user);

    return user;
  }

  async createAccount(dto: CreateAuthDto) {
    const SALT_ROUNDS = 10;
    const session = await this.startSession();
    session.startTransaction();

    try {
      const email = this.normalizeEmail(dto.email);

      const exist = await this.userModel.findOne({ email }).session(session);
      if (exist) {
        throw new ConflictException('Email already exists');
      }

      const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS);

      const user = await this.userModel.create(
        [
          {
            name: dto.name,
            email,
            password: hashed,
            isAdmin: true,
            isSuperUser: true,
          },
        ],
        { session },
      );

      const organisation = await this.organisationService.createOrganisation(
        dto,
        user[0],
        session,
      );

      user[0].organisationId = organisation[0]._id;
      await user[0].save({ session });

      await session.commitTransaction();
      const payload = {
        sub: user[0]._id.toString(),
        email: user[0].email,
        name: user[0].name,
        isAdmin: user[0].isAdmin,
        isSuperUser: user[0].isSuperUser,
        organisationId: user[0].organisationId?.toString(),
      };

      return { payload, user };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async loginUser(dto: LoginAuthDto) {
    const user = await this.userModel
      .findOne({ email: dto.email })
      .select('+password')
      .exec();
    if (!user) {
      throw new UnauthorizedException('Unregistered User');
    }

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isAdmin && !user.isSuperUser) {
      throw new ForbiddenException(
        'You do not have sufficient permissions to log in',
      );
    }
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      isSuperUser: user.isSuperUser,
      organisationId: user.organisationId.toString(),
    };

    return { payload, user };
  }
  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async getTotalEmployees(organisationId: string) {
    const count = await this.userModel.countDocuments({
      organisationId: new Types.ObjectId(organisationId),
    });

    return count;
  }

  async getAllEmployees(organisationId: string) {
    const allEmployees = await this.userModel.find({
      organisationId: new Types.ObjectId(organisationId),
    });

    return allEmployees;
  }

  async changePassword(
    dto: ChangePasswordDto,
    userId: string,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId).select('+password');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const isSamePassword = await bcrypt.compare(dto.newPassword, user.password);

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    user.password = hashedPassword;
    user.save();

    return {
      message: 'Password updated successfully',
    };
  }

  async deleteEmployee(id: string) {
    const employee = await this.userModel.findByIdAndDelete(id);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    this.activityLogService.removeFromOrganisationActivityLog(
      employee,
      employee.organisationId,
    );
    return employee;
  }

  async upgradeToAdmin(id: string) {
    const employee = await this.userModel.findById(id);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    employee.isAdmin = true;
    this.activityLogService.makeUserAdminActivityLog(
      employee,
      employee.organisationId,
    );
    return employee.save();
  }
}
