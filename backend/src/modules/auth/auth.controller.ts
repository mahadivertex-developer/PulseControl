import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { TenantContextGuard } from './guards/tenant-context.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { Roles } from './decorators/roles.decorator';
import { Permissions } from './decorators/permissions.decorator';
import { isSystemRole } from './permissions/role-permissions';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    return {
      id: user.sub,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      permissions: user.permissions,
      moduleAccess: user.moduleAccess,
    };
  }

  @Get('session-context')
  @UseGuards(JwtAuthGuard, TenantContextGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin', 'manager', 'user')
  @Permissions('session.read')
  getSessionContext(@CurrentUser() user: AuthenticatedUser) {
    const normalizedRole = user.role.toLowerCase();
    const userIsSystemRole = isSystemRole(normalizedRole);

    return {
      userId: user.sub,
      email: user.email,
      role: normalizedRole,
      scope: userIsSystemRole ? 'system' : 'tenant',
      companyId: user.companyId,
      permissions: user.permissions,
      moduleAccess: user.moduleAccess,
    };
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin')
  @Permissions('users.write')
  async register(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateUserDto) {
    return this.authService.createUser(body, user.role, user.companyId);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, TenantContextGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin', 'manager')
  @Permissions('users.read')
  async listUsers(
    @CurrentUser() user: AuthenticatedUser,
    @Query('search', new DefaultValuePipe('')) search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('sortBy', new DefaultValuePipe('id')) sortBy?: string,
    @Query('sortOrder', new DefaultValuePipe('asc')) sortOrder?: string,
    @Query('companyId') companyId?: string,
  ) {
    const parsedCompanyId = companyId ? Number(companyId) : undefined;
    return this.authService.listUsers({
      search: search || '',
      page: page || 1,
      limit: limit || 10,
      sortBy: sortBy || 'id',
      sortOrder: sortOrder || 'asc',
      companyId: Number.isNaN(parsedCompanyId) ? undefined : parsedCompanyId,
      actorRole: user.role,
      actorCompanyId: user.companyId,
    });
  }

  @Patch('users/:id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin')
  @Permissions('users.write')
  async deactivateUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.authService.setUserActive(id, false, user.email, user.role, user.companyId);
  }

  @Patch('users/:id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin')
  @Permissions('users.write')
  async activateUser(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    return this.authService.setUserActive(id, true, user.email, user.role, user.companyId);
  }

  @Patch('users/:id/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin')
  @Permissions('users.write')
  async resetUserPassword(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ResetPasswordDto,
  ) {
    return this.authService.resetUserPassword(id, body.newPassword, user.role, user.companyId);
  }

  @Patch('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin')
  @Permissions('users.write')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateUserDto,
  ) {
    return this.authService.updateUser(id, body, user.role, user.companyId);
  }
}
