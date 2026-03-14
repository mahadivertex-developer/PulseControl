import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import { isSystemRole } from '../auth/permissions/role-permissions';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';

type NormalizedColorEntry = {
  color: string;
  unitPrice: number;
  sizeQuantities: Record<string, number>;
};

type NormalizedDelivery = {
  deliveryDate: string;
  countryCodes: string;
  sizes: string[];
  colorEntries: NormalizedColorEntry[];
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly ordersRepository: Repository<Order>,
    @InjectRepository(Company) private readonly companiesRepository: Repository<Company>,
  ) {}

  private normalizeMasterTarget(masterTarget: Record<string, number>): Record<string, number> {
    return Object.entries(masterTarget || {}).reduce<Record<string, number>>((acc, [size, qty]) => {
      acc[String(size)] = Number(qty) || 0;
      return acc;
    }, {});
  }

  private normalizeDeliveries(deliveries: unknown[]): NormalizedDelivery[] {
    if (!Array.isArray(deliveries) || deliveries.length === 0) {
      throw new BadRequestException('At least one delivery split is required');
    }

    return deliveries.map((delivery) => {
      const candidate = (delivery ?? {}) as Record<string, unknown>;
      const sizes = Array.isArray(candidate.sizes)
        ? candidate.sizes.map((size) => String(size).trim()).filter((size) => size.length > 0)
        : [];

      const colorEntriesRaw = Array.isArray(candidate.colorEntries) ? candidate.colorEntries : [];
      const colorEntries = colorEntriesRaw.map((entry) => {
        const row = (entry ?? {}) as Record<string, unknown>;
        const sizeQuantitiesRaw = (row.sizeQuantities ?? {}) as Record<string, unknown>;
        const sizeQuantities = Object.entries(sizeQuantitiesRaw).reduce<Record<string, number>>(
          (acc, [size, qty]) => {
            acc[size] = Number(qty) || 0;
            return acc;
          },
          {},
        );

        return {
          color: String(row.color ?? '').trim(),
          unitPrice: Number(row.unitPrice) || 0,
          sizeQuantities,
        };
      });

      return {
        deliveryDate: String(candidate.deliveryDate ?? ''),
        countryCodes: String(candidate.countryCodes ?? ''),
        sizes,
        colorEntries,
      };
    });
  }

  private calculateActualBySize(deliveries: NormalizedDelivery[]): Record<string, number> {
    return deliveries.reduce<Record<string, number>>((acc, delivery) => {
      delivery.colorEntries.forEach((entry) => {
        Object.entries(entry.sizeQuantities).forEach(([size, qty]) => {
          acc[size] = (acc[size] || 0) + (Number(qty) || 0);
        });
      });
      return acc;
    }, {});
  }

  private calculateTotalAmount(deliveries: NormalizedDelivery[]): number {
    return deliveries.reduce((total, delivery) => {
      const deliveryAmount = delivery.colorEntries.reduce((entryTotal, entry) => {
        const qty = Object.values(entry.sizeQuantities).reduce((sum, value) => sum + (Number(value) || 0), 0);
        return entryTotal + qty * (Number(entry.unitPrice) || 0);
      }, 0);
      return total + deliveryAmount;
    }, 0);
  }

  async createOrder(
    payload: CreateOrderDto,
    actorUserId: number,
    actorRole: string,
    actorCompanyId?: number | null,
  ) {
    const normalizedMasterTarget = this.normalizeMasterTarget(payload.masterTarget || {});
    const normalizedDeliveries = this.normalizeDeliveries(payload.deliveries || []);
    const actualBySize = this.calculateActualBySize(normalizedDeliveries);

    const targetTotal = Object.values(normalizedMasterTarget).reduce((sum, value) => sum + (Number(value) || 0), 0);
    const actualTotal = Object.values(actualBySize).reduce((sum, value) => sum + (Number(value) || 0), 0);
    const totalAmount = this.calculateTotalAmount(normalizedDeliveries);

    const allSizes = new Set([...Object.keys(normalizedMasterTarget), ...Object.keys(actualBySize)]);
    const hasMismatch = [...allSizes].some(
      (size) => (Number(normalizedMasterTarget[size]) || 0) !== (Number(actualBySize[size]) || 0),
    );

    if (payload.status === 'review' && hasMismatch) {
      throw new BadRequestException('Target and Actual quantities do not match. Review cannot be submitted.');
    }

    const actorIsSystemRole = isSystemRole(actorRole);
    const resolvedCompanyId = actorIsSystemRole ? payload.companyId ?? null : actorCompanyId ?? null;

    if (!actorIsSystemRole && !resolvedCompanyId) {
      throw new BadRequestException('Tenant user must belong to a company');
    }

    if (resolvedCompanyId) {
      const company = await this.companiesRepository.findOne({ where: { id: resolvedCompanyId } });
      if (!company) {
        throw new NotFoundException('Company not found');
      }
    }

    const order = this.ordersRepository.create({
      companyId: resolvedCompanyId,
      createdBy: actorUserId,
      status: payload.status,
      orderInfo: payload.orderInfo || {},
      masterTarget: normalizedMasterTarget,
      deliveries: normalizedDeliveries,
      targetTotal,
      actualTotal,
      totalAmount: totalAmount.toFixed(2),
    });

    const saved = await this.ordersRepository.save(order);

    return {
      id: saved.id,
      companyId: saved.companyId,
      status: saved.status,
      targetTotal: saved.targetTotal,
      actualTotal: saved.actualTotal,
      totalAmount: Number(saved.totalAmount),
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  async listOrders(actorRole: string, actorCompanyId?: number | null) {
    const queryBuilder = this.ordersRepository
      .createQueryBuilder('order')
      .orderBy('order.createdAt', 'DESC')
      .addOrderBy('order.id', 'DESC');

    if (!isSystemRole(actorRole)) {
      queryBuilder.andWhere('order.companyId = :companyId', { companyId: actorCompanyId ?? 0 });
    }

    const orders = await queryBuilder.getMany();
    return orders.map((order) => ({
      id: order.id,
      companyId: order.companyId,
      status: order.status,
      targetTotal: order.targetTotal,
      actualTotal: order.actualTotal,
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));
  }

  async getOrderById(orderId: number, actorRole: string, actorCompanyId?: number | null) {
    const order = await this.ordersRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!isSystemRole(actorRole) && order.companyId !== (actorCompanyId ?? null)) {
      throw new ForbiddenException('You can only access orders in your company');
    }

    return {
      id: order.id,
      companyId: order.companyId,
      status: order.status,
      orderInfo: order.orderInfo,
      masterTarget: order.masterTarget,
      deliveries: order.deliveries,
      targetTotal: order.targetTotal,
      actualTotal: order.actualTotal,
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
