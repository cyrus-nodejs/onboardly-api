import { Injectable } from '@nestjs/common';
import { Types, ClientSession } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { CreateAuthDto } from '../auth/dto/create-auth.dto';
import { UserDocument } from '../../schemas/users.schema';

import {
  Organisation,
  OrganisationDocument,
} from '../../schemas/organisation.schema';

@Injectable()
export class OrganisationService {
  constructor(
    @InjectModel(Organisation.name)
    private organisationModel: Model<OrganisationDocument>,
  ) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async createOrganisation(
    dto: CreateAuthDto,
    user: UserDocument,
    session: ClientSession,
  ) {
    return this.organisationModel.create(
      [
        {
          name: dto.organisationName,
          createdBy: user._id,
          email: this.normalizeEmail(dto.organisationEmail),
        },
      ],
      { session },
    );
  }

  async findById(id: string) {
    return this.organisationModel
      .findById(id)
      .populate('createdBy', 'name email')
      .exec();
  }

  async getCurrentOrganisation(organisationId: string) {
    return this.organisationModel
      .findOne({ _id: new Types.ObjectId(organisationId) })
      .exec();
  }

  async updateOrganisation(organisationId: string, dto: UpdateOrganisationDto) {
    const filter = { _id: organisationId };
    const update = { $set: { name: dto.name, email: dto.email } };
    return await this.organisationModel.findOneAndUpdate(filter, update, {
      new: true,
    });
  }
}
