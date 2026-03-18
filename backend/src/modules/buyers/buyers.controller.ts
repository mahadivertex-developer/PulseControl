import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { BuyersService } from './buyers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { isSystemRole } from '../auth/permissions/role-permissions';

class CreateBuyerDto {
  @IsString()
  @MinLength(2)
  code!: string;

  @IsString()
  @MinLength(1)
  name!: string;
}

class UpdateBuyerDto {
  @IsString()
  @MinLength(2)
  code!: string;

  @IsString()
  @MinLength(1)
  name!: string;
}

@Controller('api/buyers')
export class BuyersController {
  constructor(private readonly buyersService: BuyersService) {}

  private resolveCompanyId(user: AuthenticatedUser, companyId?: string): number {
    if (user.companyId) {
      return user.companyId;
    }

    const parsedCompanyId = companyId ? Number(companyId) : NaN;
    if (isSystemRole(user.role) && !Number.isNaN(parsedCompanyId) && parsedCompanyId > 0) {
      return parsedCompanyId;
    }

    throw new ForbiddenException('No company associated with this account');
  }

  @Get('availability')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin', 'manager', 'user')
  @Permissions('company-data.read')
  async checkAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Query('code') code?: string,
    @Query('excludeId') excludeId?: string,
    @Query('companyId') companyId?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);
    return this.buyersService.checkAvailability(resolvedCompanyId, code || '', excludeId ? Number(excludeId) : undefined);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin', 'manager', 'user')
  @Permissions('company-data.read')
  async listBuyers(@CurrentUser() user: AuthenticatedUser, @Query('companyId') companyId?: string) {
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);
    const items = await this.buyersService.listByCompany(resolvedCompanyId);
    return { items };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin')
  @Permissions('company-data.write')
  async createBuyer(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateBuyerDto,
    @Query('companyId') companyId?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);
    return this.buyersService.createBuyer(resolvedCompanyId, body.code, body.name);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin')
  @Permissions('company-data.write')
  async updateBuyer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateBuyerDto,
    @Query('companyId') companyId?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);
    return this.buyersService.updateBuyer(resolvedCompanyId, id, body.code, body.name);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin')
  @Permissions('company-data.write')
  async deleteBuyer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('companyId') companyId?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);
    return this.buyersService.deleteBuyer(resolvedCompanyId, id);
  }
}
