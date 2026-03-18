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
import { IsInt, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { LinesService } from './lines.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { isSystemRole } from '../auth/permissions/role-permissions';

class CreateLineDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  unitId!: number;

  @IsString()
  @MinLength(2)
  code!: string;

  @IsString()
  @MinLength(1)
  name!: string;
}

class UpdateLineDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  unitId!: number;

  @IsString()
  @MinLength(2)
  code!: string;

  @IsString()
  @MinLength(1)
  name!: string;
}

@Controller('api/lines')
export class LinesController {
  constructor(private readonly linesService: LinesService) {}

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
    return this.linesService.checkAvailability(resolvedCompanyId, code || '', excludeId ? Number(excludeId) : undefined);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin', 'manager', 'user')
  @Permissions('company-data.read')
  async listLines(@CurrentUser() user: AuthenticatedUser, @Query('companyId') companyId?: string) {
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);
    const items = await this.linesService.listByCompany(resolvedCompanyId);
    return { items };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin')
  @Permissions('company-data.write')
  async createLine(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateLineDto,
    @Query('companyId') companyId?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);
    return this.linesService.createLine(resolvedCompanyId, body.unitId, body.code, body.name);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin')
  @Permissions('company-data.write')
  async updateLine(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateLineDto,
    @Query('companyId') companyId?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);
    return this.linesService.updateLine(resolvedCompanyId, id, body.unitId, body.code, body.name);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin')
  @Permissions('company-data.write')
  async deleteLine(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('companyId') companyId?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);
    return this.linesService.deleteLine(resolvedCompanyId, id);
  }
}
