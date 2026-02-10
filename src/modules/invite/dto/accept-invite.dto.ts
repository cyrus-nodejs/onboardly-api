import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
export class AcceptInviteDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;
}
