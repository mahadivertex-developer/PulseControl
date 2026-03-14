import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantContextGuard } from '../auth/guards/tenant-context.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, TenantContextGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin', 'manager', 'user')
  @Permissions('session.read')
  async createOrder(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateOrderDto) {
    return this.ordersService.createOrder(body, user.sub, user.role, user.companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, TenantContextGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin', 'manager', 'user')
  @Permissions('session.read')
  async listOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.listOrders(user.role, user.companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'system_admin', 'company_admin', 'manager', 'user')
  @Permissions('session.read')
  async getOrderById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.getOrderById(id, user.role, user.companyId);
  }
}
