import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Unit } from './entities/unit.entity';

@Injectable()
export class UnitsService {
  constructor(
    @InjectRepository(Unit) private readonly unitsRepo: Repository<Unit>,
    private readonly dataSource: DataSource,
  ) {}

  async createUnit(companyId: number, code: string, name: string) {
    const normalizedCode = code.trim().toUpperCase();
    const existing = await this.unitsRepo.findOne({ where: { companyId, code: normalizedCode } });
    if (existing) {
      throw new ConflictException('Unit code already exists for this company');
    }
    const unit = this.unitsRepo.create({ companyId, code: normalizedCode, name: name.trim() });
    const saved = await this.unitsRepo.save(unit);
    return { id: saved.id, companyId: saved.companyId, code: saved.code, name: saved.name };
  }

  async checkAvailability(companyId: number, code: string, excludeId?: number) {
    const normalizedCode = (code || '').trim().toUpperCase();
    if (normalizedCode.length < 2) {
      throw new BadRequestException('Code must be at least 2 characters');
    }
    const existing = await this.unitsRepo.findOne({ where: { companyId, code: normalizedCode } });
    const available = !existing || (typeof excludeId === 'number' && existing.id === excludeId);
    return { code: normalizedCode, available };
  }

  async updateUnit(companyId: number, id: number, code: string, name: string) {
    const unit = await this.unitsRepo.findOne({ where: { companyId, id } });
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    const normalizedCode = code.trim().toUpperCase();
    const existing = await this.unitsRepo.findOne({ where: { companyId, code: normalizedCode } });
    if (existing && existing.id !== id) {
      throw new ConflictException('Unit code already exists for this company');
    }

    unit.code = normalizedCode;
    unit.name = name.trim();
    const saved = await this.unitsRepo.save(unit);
    return { id: saved.id, companyId: saved.companyId, code: saved.code, name: saved.name };
  }

  async deleteUnit(companyId: number, id: number) {
    const unit = await this.unitsRepo.findOne({ where: { companyId, id } });
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    // Check for dependent production lines
    const lineCount = await this.dataSource.query(
      'SELECT COUNT(*) as count FROM production_lines WHERE company_id = $1 AND unit_id = $2',
      [companyId, id],
    );
    if (lineCount[0].count > 0) {
      throw new ConflictException(
        `Cannot delete unit "${unit.code}" because it has ${lineCount[0].count} production line(s) assigned to it`,
      );
    }

    // Check for dependent line plans
    const planCount = await this.dataSource.query(
      'SELECT COUNT(*) as count FROM line_plans WHERE company_id = $1 AND unit_id = $2',
      [companyId, id],
    );
    if (planCount[0].count > 0) {
      throw new ConflictException(
        `Cannot delete unit "${unit.code}" because it's used in ${planCount[0].count} production plan(s)`,
      );
    }

    await this.unitsRepo.remove(unit);
    return { success: true };
  }

  async listByCompany(companyId: number) {
    const units = await this.unitsRepo.find({
      where: { companyId },
      order: { code: 'ASC' },
    });
    return units.map((u) => ({ id: u.id, code: u.code, name: u.name }));
  }
}
