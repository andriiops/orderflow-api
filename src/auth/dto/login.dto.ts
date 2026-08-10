import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'customer@orderflow.dev' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Customer123!' })
  @IsString()
  @MinLength(8)
  password!: string;
}
