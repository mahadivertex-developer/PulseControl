import { IsArray, IsEmail, IsIn, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  userId?: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  role: string = 'user';

  @IsOptional()
  @IsInt()
  @Min(1)
  companyId?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  moduleAccess?: string[];

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsIn(['qa', 'general'])
  userCategory?: 'qa' | 'general';

  @IsOptional()
  @IsString()
  generalCategory?: string;

  @IsOptional()
  @IsIn(['executive', 'management'])
  userType?: 'executive' | 'management';
}
