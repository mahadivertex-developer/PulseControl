import {
  Body,
  Controller,
  DefaultValuePipe,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantContextGuard } from '../auth/guards/tenant-context.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('api/companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin')
  @Permissions('companies.write')
  async createCompany(@Body() body: CreateCompanyDto) {
    return this.companiesService.createCompany(body.code, body.name, body.validityDate);
  }

  @Get()
  @UseGuards(JwtAuthGuard, TenantContextGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'manager', 'user')
  @Permissions('companies.read')
  async listCompanies(
    @CurrentUser() user: AuthenticatedUser,
    @Query('search', new DefaultValuePipe('')) search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('sortBy', new DefaultValuePipe('id')) sortBy?: string,
    @Query('sortOrder', new DefaultValuePipe('asc')) sortOrder?: string,
  ) {
    return this.companiesService.listCompanies({
      search: search || '',
      page: page || 1,
      limit: limit || 10,
      sortBy: sortBy || 'id',
      sortOrder: sortOrder || 'asc',
      actorRole: user.role,
      actorCompanyId: user.companyId,
    });
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin')
  @Permissions('companies.write')
  async deactivateCompany(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.setCompanyActive(id, false);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin')
  @Permissions('companies.write')
  async activateCompany(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.setCompanyActive(id, true);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin')
  @Permissions('companies.write')
  async updateCompany(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateCompanyDto) {
    return this.companiesService.updateCompany(id, body);
  }

  @Patch('my')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin')
  @Permissions('company-data.write')
  async updateMyCompany(@CurrentUser() user: AuthenticatedUser, @Body() body: UpdateCompanyDto) {
    if (!user.companyId) {
      throw new ForbiddenException('No company associated with this account');
    }
    return this.companiesService.updateCompany(user.companyId, body);
  }
}
