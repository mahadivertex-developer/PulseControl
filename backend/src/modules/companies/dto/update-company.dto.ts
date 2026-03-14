import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;
}
