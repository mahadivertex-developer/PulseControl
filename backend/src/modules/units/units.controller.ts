import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Delete,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { UnitsService } from './units.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { isSystemRole } from '../auth/permissions/role-permissions';

class CreateUnitDto {
  @IsString()
  @MinLength(2)
  code!: string;

  @IsString()
  @MinLength(1)
  name!: string;
}

class UpdateUnitDto {
  @IsString()
  @MinLength(2)
  code!: string;

  @IsString()
  @MinLength(1)
  name!: string;
}

@Controller('api/units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

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
    return this.unitsService.checkAvailability(resolvedCompanyId, code || '', excludeId ? Number(excludeId) : undefined);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin', 'manager', 'user')
  @Permissions('company-data.read')
  async listUnits(@CurrentUser() user: AuthenticatedUser, @Query('companyId') companyId?: string) {
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);
    const items = await this.unitsService.listByCompany(resolvedCompanyId);
    return { items };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin')
  @Permissions('company-data.write')
  async createUnit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateUnitDto,
    @Query('companyId') companyId?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);
    return this.unitsService.createUnit(resolvedCompanyId, body.code, body.name);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin')
  @Permissions('company-data.write')
  async updateUnit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUnitDto,
    @Query('companyId') companyId?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);
    return this.unitsService.updateUnit(resolvedCompanyId, id, body.code, body.name);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin')
  @Permissions('company-data.write')
  async deleteUnit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('companyId') companyId?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);
    return this.unitsService.deleteUnit(resolvedCompanyId, id);
  }
}
