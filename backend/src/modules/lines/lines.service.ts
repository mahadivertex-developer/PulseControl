import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProductionLine } from './entities/production-line.entity';

@Injectable()
export class LinesService {
  constructor(
    @InjectRepository(ProductionLine)
    private readonly linesRepo: Repository<ProductionLine>,
    private readonly dataSource: DataSource,
  ) {}

  async createLine(companyId: number, unitId: number, code: string, name: string) {
    const normalizedCode = code.trim().toUpperCase();
    const existing = await this.linesRepo.findOne({ where: { companyId, code: normalizedCode } });
    if (existing) {
      throw new ConflictException('Line code already exists for this company');
    }
    const line = this.linesRepo.create({
      companyId,
      unitId,
      code: normalizedCode,
      name: name.trim(),
    });
    const saved = await this.linesRepo.save(line);
    return {
      id: saved.id,
      companyId: saved.companyId,
      unitId: saved.unitId,
      code: saved.code,
      name: saved.name,
    };
  }

  async checkAvailability(companyId: number, code: string, excludeId?: number) {
    const normalizedCode = (code || '').trim().toUpperCase();
    if (normalizedCode.length < 2) {
      throw new BadRequestException('Code must be at least 2 characters');
    }
    const existing = await this.linesRepo.findOne({ where: { companyId, code: normalizedCode } });
    const available = !existing || (typeof excludeId === 'number' && existing.id === excludeId);
    return { code: normalizedCode, available };
  }

  async updateLine(companyId: number, id: number, unitId: number, code: string, name: string) {
    const line = await this.linesRepo.findOne({ where: { companyId, id } });
    if (!line) {
      throw new NotFoundException('Line not found');
    }

    const normalizedCode = code.trim().toUpperCase();
    const existing = await this.linesRepo.findOne({ where: { companyId, code: normalizedCode } });
    if (existing && existing.id !== id) {
      throw new ConflictException('Line code already exists for this company');
    }

    line.unitId = unitId;
    line.code = normalizedCode;
    line.name = name.trim();
    const saved = await this.linesRepo.save(line);
    return {
      id: saved.id,
      companyId: saved.companyId,
      unitId: saved.unitId,
      code: saved.code,
      name: saved.name,
    };
  }

  async deleteLine(companyId: number, id: number) {
    const line = await this.linesRepo.findOne({ where: { companyId, id } });
    if (!line) {
      throw new NotFoundException('Line not found');
    }

    // Check for dependent line plans
    const planCount = await this.dataSource.query(
      'SELECT COUNT(*) as count FROM line_plans WHERE company_id = $1 AND production_line_id = $2',
      [companyId, id],
    );
    if (planCount[0].count > 0) {
      throw new ConflictException(
        `Cannot delete production line "${line.code}" because it's used in ${planCount[0].count} production plan(s)`,
      );
    }

    await this.linesRepo.remove(line);
    return { success: true };
  }

  async listByCompany(companyId: number) {
    const lines = await this.linesRepo.find({
      where: { companyId },
      relations: { unit: true },
      order: { code: 'ASC' },
    });

    return lines.map((line) => ({
      id: line.id,
      unitId: line.unitId,
      unitCode: line.unit?.code || '',
      unitName: line.unit?.name || '',
      code: line.code,
      name: line.name,
    }));
  }
}
