import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
export type InviteDocument = HydratedDocument<Invite>;

@Schema({ timestamps: true })
export class Invite {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  invitedBy: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  tokenHash: string;

  @Prop({ type: Types.ObjectId, ref: 'Organisation', required: true })
  organisationId: Types.ObjectId;

  @Prop({ default: false })
  used: boolean;

  @Prop({ type: Date, default: null })
  expiresAt: Date;
}

export const InviteSchema = SchemaFactory.createForClass(Invite);

InviteSchema.index(
  { email: 1, organisationId: 1, used: 1 },
  { unique: true, partialFilterExpression: { used: false } },
);

// Auto-delete expired invites
InviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Fast token lookup
InviteSchema.index({ tokenHash: 1 });
