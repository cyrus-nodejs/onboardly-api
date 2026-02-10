import { IsEmail, IsNotEmpty} from 'class-validator';

export class CreateActivityDto {
  @IsNotEmpty()
  title: string;

  @IsEmail()
  description: string;
}
