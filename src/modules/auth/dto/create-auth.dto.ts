import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
export class CreateAuthDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsNotEmpty()
  organisationName: string;

  @IsEmail()
  organisationEmail: string;
}
