import { IsArray, IsIn, IsObject, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsIn(['draft', 'review'])
  status!: 'draft' | 'review';

  @IsObject()
  orderInfo!: Record<string, unknown>;

  @IsObject()
  masterTarget!: Record<string, number>;

  @IsArray()
  deliveries!: unknown[];

  @IsOptional()
  companyId?: number;
}
