# PulseControlERP - Backend Implementation Guide

## Technology Stack Recommendation
- **Runtime**: Node.js 18+ / TypeScript 5+
- **Framework**: NestJS (modular, decorators, built-in guards/interceptors)
- **Database**: PostgreSQL 14+
- **ORM**: TypeORM or Prisma
- **Authentication**: JWT (passport-jwt)
- **Validation**: class-validator
- **Documentation**: Swagger (from OpenAPI spec)

## Project Structure
```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── companies/
│   │   ├── users/
│   │   ├── orders/
│   │   ├── sub-po/
│   │   ├── planning/
│   │   ├── grn/
│   │   ├── store/
│   │   ├── qa/
│   │   ├── cutting/
│   │   ├── sewing/
│   │   ├── washing/
│   │   ├── finishing/
│   │   ├── packing/
│   │   ├── shipment/
│   │   └── commercial/
│   ├── common/
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── tenant.guard.ts
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── tenant-scope.decorator.ts
│   │   ├── interceptors/
│   │   │   ├── tenant.interceptor.ts
│   │   │   └── audit-log.interceptor.ts
│   │   ├── entities/
│   │   └── dto/
│   ├── config/
│   └── main.ts
├── migrations/
├── package.json
└── tsconfig.json
```

## 1. Authentication Guard (jwt-auth.guard.ts)
```typescript
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw new UnauthorizedException('Not authenticated');
    }
    return user;
  }
}
```

## 2. Tenant Guard (tenant.guard.ts)
**CRITICAL**: Apply this to every controller except login/public endpoints.

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // System admin bypasses all tenant checks
    if (user.roleCode === 'SYSTEM_ADMIN') {
      return true;
    }

    // All other users must have companyId
    if (!user.companyId) {
      throw new ForbiddenException('User has no company assignment');
    }

    // Attach tenant filter to request for service layer
    request.tenantFilter = { companyId: user.companyId };
    return true;
  }
}
```

## 3. Tenant Interceptor (tenant.interceptor.ts)
Auto-inject `companyId` into create/update DTOs.

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // For POST/PUT/PATCH, auto-inject companyId if not system admin
    if (['POST', 'PUT', 'PATCH'].includes(request.method) && user.roleCode !== 'SYSTEM_ADMIN') {
      if (request.body) {
        // Prevent user from specifying different companyId
        if (request.body.companyId && request.body.companyId !== user.companyId) {
          throw new ForbiddenException('Cannot create/modify data for another company');
        }
        request.body.companyId = user.companyId;
      }
    }

    return next.handle();
  }
}
```

## 4. Audit Log Interceptor (audit-log.interceptor.ts)
```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from '../services/audit-log.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;
    const url = request.url;

    // Log sensitive actions
    const shouldAudit = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    return next.handle().pipe(
      tap((response) => {
        if (shouldAudit) {
          this.auditLogService.log({
            userId: user.id,
            companyId: user.companyId,
            action: `${method} ${url}`,
            entityType: this.extractEntityType(url),
            oldData: request.body?.oldData,
            newData: response,
          });
        }
      }),
    );
  }

  private extractEntityType(url: string): string {
    // Extract entity from URL pattern /api/v1/orders/123 => 'orders'
    const parts = url.split('/').filter(Boolean);
    return parts[2] || 'unknown';
  }
}
```

## 5. Current User Decorator (current-user.decorator.ts)
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

## 6. Example Service with Tenant Scope (orders.service.ts)
```typescript
import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterOrder } from './entities/master-order.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(MasterOrder)
    private ordersRepo: Repository<MasterOrder>,
  ) {}

  async findAll(user: User, filters?: any) {
    const query = this.ordersRepo.createQueryBuilder('order');

    // System admin sees all
    if (user.roleCode !== 'SYSTEM_ADMIN') {
      query.where('order.companyId = :companyId', { companyId: user.companyId });
    }

    if (filters?.buyerOrderNo) {
      query.andWhere('order.buyerOrderNo LIKE :buyerOrderNo', {
        buyerOrderNo: `%${filters.buyerOrderNo}%`,
      });
    }

    return query.getMany();
  }

  async findOne(id: number, user: User) {
    const order = await this.ordersRepo.findOne({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Tenant check
    if (user.roleCode !== 'SYSTEM_ADMIN' && order.companyId !== user.companyId) {
      throw new ForbiddenException('Access denied to this order');
    }

    return order;
  }

  async create(dto: CreateMasterOrderDto, user: User) {
    const order = this.ordersRepo.create({
      ...dto,
      companyId: user.companyId, // Auto-injected by interceptor, but explicit here
      createdBy: user.id,
    });

    return this.ordersRepo.save(order);
  }
}
```

## 7. Example Controller with Guards (orders.controller.ts)
```typescript
import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateMasterOrderDto } from './dto/create-master-order.dto';
import { User } from '../users/entities/user.entity';

@ApiTags('Merchandising')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard, TenantGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query() filters: any) {
    return this.ordersService.findAll(user, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: number, @CurrentUser() user: User) {
    return this.ordersService.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateMasterOrderDto, @CurrentUser() user: User) {
    return this.ordersService.create(dto, user);
  }
}
```

## 8. Notification Service Pattern
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

export enum NotificationEvent {
  MATERIAL_TRANSFER = 'MATERIAL_TRANSFER',
  LINE_REALLOCATION = 'LINE_REALLOCATION',
  APPROVAL_SUBMITTED = 'APPROVAL_SUBMITTED',
  APPROVAL_APPROVED = 'APPROVAL_APPROVED',
  APPROVAL_REJECTED = 'APPROVAL_REJECTED',
  INSPECTION_FAILED = 'INSPECTION_FAILED',
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepo: Repository<Notification>,
  ) {}

  async create(params: {
    companyId: number;
    eventType: NotificationEvent;
    entityType: string;
    entityId: number;
    message: string;
  }) {
    const notification = this.notificationsRepo.create(params);
    await this.notificationsRepo.save(notification);

    // Optional: emit via WebSocket or push notification
    // this.eventEmitter.emit('notification.created', notification);

    return notification;
  }

  async getUserNotifications(userId: number, companyId: number, limit = 20) {
    return this.notificationsRepo.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
```

## 9. Material Transfer with Notification Example
```typescript
async transferMaterial(dto: TransferMaterialDto, user: User) {
  const fromBalance = await this.inventoryRepo.findOne({
    where: {
      companyId: user.companyId,
      itemId: dto.itemId,
      masterOrderId: dto.fromOrderId,
    },
  });

  if (!fromBalance || fromBalance.onHandQty < dto.qty) {
    throw new BadRequestException('Insufficient inventory');
  }

  // Deduct from source
  fromBalance.onHandQty -= dto.qty;

  // Add to target
  let toBalance = await this.inventoryRepo.findOne({
    where: {
      companyId: user.companyId,
      itemId: dto.itemId,
      masterOrderId: dto.toOrderId,
    },
  });

  if (!toBalance) {
    toBalance = this.inventoryRepo.create({
      companyId: user.companyId,
      itemId: dto.itemId,
      masterOrderId: dto.toOrderId,
      onHandQty: 0,
      reservedQty: 0,
    });
  }

  toBalance.onHandQty += dto.qty;

  await this.inventoryRepo.save([fromBalance, toBalance]);

  // Generate notification
  await this.notificationService.create({
    companyId: user.companyId,
    eventType: NotificationEvent.MATERIAL_TRANSFER,
    entityType: 'INVENTORY',
    entityId: dto.itemId,
    message: `Transferred ${dto.qty} units from Order ${dto.fromOrderId} to Order ${dto.toOrderId}`,
  });

  return { success: true };
}
```

## 10. Database Migration Pattern (TypeORM)
Use the baseline schema from `db/schema.sql` to generate initial migration:

```bash
npm run typeorm migration:generate -- -n InitialSchema
npm run typeorm migration:run
```

## 11. Environment Variables (.env)
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=pulse_erp_user
DATABASE_PASSWORD=secure_password
DATABASE_NAME=pulse_erp_db

JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRATION=8h

APP_PORT=3000
NODE_ENV=development
```

## 12. Global App Setup (main.ts)
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  });

  // Swagger from OpenAPI spec
  const openapiYaml = readFileSync('./api/openapi.yaml', 'utf8');
  const openapiDoc = parse(openapiYaml);
  SwaggerModule.setup('api/docs', app, openapiDoc);

  await app.listen(process.env.APP_PORT || 3000);
}
bootstrap();
```

## 13. Approval Workflow Pattern
```typescript
async submitSubPOForApproval(id: number, user: User) {
  const subPO = await this.findOne(id, user);

  if (subPO.status !== 'DRAFT') {
    throw new BadRequestException('Only draft sub-PO can be submitted');
  }

  subPO.status = 'SUBMITTED';
  await this.subPORepo.save(subPO);

  await this.notificationService.create({
    companyId: user.companyId,
    eventType: NotificationEvent.APPROVAL_SUBMITTED,
    entityType: 'SUB_PO',
    entityId: subPO.id,
    message: `Sub-PO ${subPO.subPoNo} submitted for approval`,
  });

  return subPO;
}

async approveSubPO(id: number, user: User) {
  const subPO = await this.findOne(id, user);

  if (subPO.status !== 'SUBMITTED') {
    throw new BadRequestException('Sub-PO not in submitted status');
  }

  subPO.status = 'APPROVED';
  subPO.approvedBy = user.id;
  subPO.approvedAt = new Date();

  await this.subPORepo.save(subPO);

  await this.notificationService.create({
    companyId: user.companyId,
    eventType: NotificationEvent.APPROVAL_APPROVED,
    entityType: 'SUB_PO',
    entityId: subPO.id,
    message: `Sub-PO ${subPO.subPoNo} approved by ${user.fullName}`,
  });

  return subPO;
}
```

## 14. Testing Strategy
- **Unit tests**: Service layer with mocked repositories
- **Integration tests**: Controller + Service with test database
- **E2E tests**: Full API flow with tenant isolation verification

Example tenant isolation test:
```typescript
it('should prevent Company A user from viewing Company B orders', async () => {
  const companyAUser = await createUser({ companyId: 1 });
  const companyBOrder = await createOrder({ companyId: 2 });

  const response = await request(app.getHttpServer())
    .get(`/orders/${companyBOrder.id}`)
    .set('Authorization', `Bearer ${companyAUser.token}`)
    .expect(403);

  expect(response.body.message).toContain('Access denied');
});
```

## 15. Key Implementation Checklist
- [ ] Apply `JwtAuthGuard` + `TenantGuard` to all protected controllers
- [ ] System admin role check bypasses tenant filter
- [ ] Logged-out users get 401 on any protected endpoint
- [ ] All create/update operations validate `companyId` matches current user
- [ ] Material transfer generates notification
- [ ] Planning reallocation generates notification
- [ ] Approval submit/approve/reject generates notification
- [ ] Shipment inspection failure generates notification
- [ ] Audit log records for sensitive actions
- [ ] Database indexes on `companyId` columns for performance
- [ ] Row-level security (RLS) optional for defense-in-depth
