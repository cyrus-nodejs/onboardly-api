import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: Types.ObjectId, ref: 'Organisation' })
  organisationId: Types.ObjectId;

  @Prop({ default: false })
  isAdmin: boolean;

  @Prop({ default: false })
  isSuperUser: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
