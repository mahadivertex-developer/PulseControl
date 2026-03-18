import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Buyer } from './entities/buyer.entity';

@Injectable()
export class BuyersService {
  constructor(
    @InjectRepository(Buyer) private readonly buyersRepo: Repository<Buyer>,
    private readonly dataSource: DataSource,
  ) {}

  async createBuyer(companyId: number, code: string, name: string) {
    const normalizedCode = code.trim().toUpperCase();
    const existing = await this.buyersRepo.findOne({ where: { companyId, code: normalizedCode } });
    if (existing) {
      throw new ConflictException('Buyer code already exists for this company');
    }
    const buyer = this.buyersRepo.create({ companyId, code: normalizedCode, name: name.trim() });
    const saved = await this.buyersRepo.save(buyer);
    return { id: saved.id, companyId: saved.companyId, code: saved.code, name: saved.name };
  }

  async checkAvailability(companyId: number, code: string, excludeId?: number) {
    const normalizedCode = (code || '').trim().toUpperCase();
    if (normalizedCode.length < 2) {
      throw new BadRequestException('Code must be at least 2 characters');
    }
    const existing = await this.buyersRepo.findOne({ where: { companyId, code: normalizedCode } });
    const available = !existing || (typeof excludeId === 'number' && existing.id === excludeId);
    return { code: normalizedCode, available };
  }

  async updateBuyer(companyId: number, id: number, code: string, name: string) {
    const buyer = await this.buyersRepo.findOne({ where: { companyId, id } });
    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }

    const normalizedCode = code.trim().toUpperCase();
    const existing = await this.buyersRepo.findOne({ where: { companyId, code: normalizedCode } });
    if (existing && existing.id !== id) {
      throw new ConflictException('Buyer code already exists for this company');
    }

    buyer.code = normalizedCode;
    buyer.name = name.trim();
    const saved = await this.buyersRepo.save(buyer);
    return { id: saved.id, companyId: saved.companyId, code: saved.code, name: saved.name };
  }

  async deleteBuyer(companyId: number, id: number) {
    const buyer = await this.buyersRepo.findOne({ where: { companyId, id } });
    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }
    await this.buyersRepo.remove(buyer);
    return { success: true };
  }

  async listByCompany(companyId: number) {
    const buyers = await this.buyersRepo.find({
      where: { companyId },
      order: { code: 'ASC' },
    });

    return buyers.map((buyer) => ({
      id: buyer.id,
      code: buyer.code,
      name: buyer.name,
    }));
  }
}
