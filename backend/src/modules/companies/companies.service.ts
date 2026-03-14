import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { isSystemRole } from '../auth/permissions/role-permissions';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company) private readonly companiesRepository: Repository<Company>,
  ) {}

  async createCompany(code: string, name: string) {
    const normalizedCode = code.trim().toUpperCase();
    const normalizedName = name.trim();

    const existing = await this.companiesRepository.findOne({ where: { code: normalizedCode } });
    if (existing) {
      throw new ConflictException('Company with this code already exists');
    }

    const company = this.companiesRepository.create({
      code: normalizedCode,
      name: normalizedName,
      isActive: true,
    });

    const savedCompany = await this.companiesRepository.save(company);
    return {
      id: savedCompany.id,
      code: savedCompany.code,
      name: savedCompany.name,
      isActive: savedCompany.isActive,
      createdAt: savedCompany.createdAt,
      updatedAt: savedCompany.updatedAt,
    };
  }

  async listCompanies(options?: {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    actorRole?: string;
    actorCompanyId?: number | null;
  }) {
    const search = (options?.search || '').trim();
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(100, Math.max(1, options?.limit || 10));
    const sortBy = (options?.sortBy || 'id').toLowerCase();
    const sortOrder = (options?.sortOrder || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const actorRole = options?.actorRole || 'admin';
    const actorCompanyId = options?.actorCompanyId ?? null;

    const sortableColumns: Record<string, string> = {
      id: 'company.id',
      code: 'company.code',
      name: 'company.name',
      status: 'company.isActive',
      createdat: 'company.createdAt',
    };

    const orderColumn = sortableColumns[sortBy] || 'company.id';

    const queryBuilder = this.companiesRepository
      .createQueryBuilder('company')
      .orderBy(orderColumn, sortOrder)
      .addOrderBy('company.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (!isSystemRole(actorRole) && actorCompanyId) {
      queryBuilder.andWhere('company.id = :actorCompanyId', { actorCompanyId });
    }

    if (search) {
      queryBuilder.where(
        'LOWER(company.code) LIKE LOWER(:search) OR LOWER(company.name) LIKE LOWER(:search)',
        { search: `%${search}%` },
      );
    }

    const [companies, total] = await queryBuilder.getManyAndCount();

    return {
      items: companies.map((company) => ({
        id: company.id,
        code: company.code,
        name: company.name,
        isActive: company.isActive,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      })),
      total,
      page,
      limit,
      sortBy,
      sortOrder: sortOrder.toLowerCase(),
    };
  }

  async setCompanyActive(id: number, isActive: boolean) {
    const company = await this.companiesRepository.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    company.isActive = isActive;
    const savedCompany = await this.companiesRepository.save(company);
    return {
      id: savedCompany.id,
      code: savedCompany.code,
      name: savedCompany.name,
      isActive: savedCompany.isActive,
      createdAt: savedCompany.createdAt,
      updatedAt: savedCompany.updatedAt,
    };
  }

  async updateCompany(id: number, payload: { code?: string; name?: string }) {
    const company = await this.companiesRepository.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (payload.code) {
      const normalizedCode = payload.code.trim().toUpperCase();
      const existing = await this.companiesRepository.findOne({ where: { code: normalizedCode } });
      if (existing && existing.id !== company.id) {
        throw new ConflictException('Company with this code already exists');
      }
      company.code = normalizedCode;
    }

    if (payload.name) {
      company.name = payload.name.trim();
    }

    const savedCompany = await this.companiesRepository.save(company);
    return {
      id: savedCompany.id,
      code: savedCompany.code,
      name: savedCompany.name,
      isActive: savedCompany.isActive,
      createdAt: savedCompany.createdAt,
      updatedAt: savedCompany.updatedAt,
    };
  }
}
