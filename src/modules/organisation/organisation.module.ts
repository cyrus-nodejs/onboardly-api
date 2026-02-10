import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';

import {
  Organisation,
  OrganisationSchema,
} from '../../schemas/organisation.schema';
import { OrganisationService } from './organisation.service';
import { OrganisationController } from './organisation.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organisation.name, schema: OrganisationSchema },
    ]),
    AuthModule,
  ],
  providers: [OrganisationService],
  controllers: [OrganisationController],
  exports: [OrganisationService],
})
export class OrganisationModule {}
