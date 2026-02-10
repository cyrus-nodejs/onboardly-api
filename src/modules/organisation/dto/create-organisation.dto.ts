import { IsEmail, IsNotEmpty } from 'class-validator';
export class CreateOrganisationDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;
}
