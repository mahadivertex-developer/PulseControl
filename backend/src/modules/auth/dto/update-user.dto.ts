import { IsArray, IsEmail, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  companyId?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  moduleAccess?: string[];
}
