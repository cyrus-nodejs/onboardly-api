import { IsEmail, IsNotEmpty } from 'class-validator';
export class CreateInviteDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;
}
