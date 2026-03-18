import {
  ConflictException,
  Injectable,
  BadRequestException,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import { User } from '../users/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { getPermissionsForRole, isSystemRole } from './permissions/role-permissions';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Company) private readonly companiesRepository: Repository<Company>,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const defaultEmail =
      process.env.NODE_ENV === 'test'
        ? process.env.TEST_LOGIN_EMAIL || process.env.DEV_LOGIN_EMAIL || 'admin@example.com'
        : process.env.DEV_LOGIN_EMAIL || 'admin@example.com';
    const defaultPassword =
      process.env.NODE_ENV === 'test'
        ? process.env.TEST_LOGIN_PASSWORD || process.env.DEV_LOGIN_PASSWORD || 'password123'
        : process.env.DEV_LOGIN_PASSWORD || 'password123';

    const existing = await this.usersRepository.findOne({ where: { email: defaultEmail } });
    if (existing) {
      return;
    }

    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const user = this.usersRepository.create({
      email: defaultEmail,
      passwordHash,
      role: 'admin',
      isActive: true,
    });

    await this.usersRepository.save(user);
  }

  async login(email: string, password: string) {
    const identifier = email.trim();
    const user = await this.usersRepository.findOne({
      where: [{ email: identifier }, { userId: identifier }],
      relations: ['company'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const permissions = getPermissionsForRole(user.role);
    const moduleAccess = user.moduleAccess ?? [];

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      permissions,
      moduleAccess,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company?.name ?? null,
        permissions,
        moduleAccess,
      },
    };
  }

  async checkUserIdAvailability(userId?: string) {
    const normalizedUserId = userId?.trim().toUpperCase();

    if (!normalizedUserId || normalizedUserId.length < 3) {
      throw new BadRequestException('User ID must be at least 3 characters');
    }

    const existingByUserId = await this.usersRepository.findOne({
      where: { userId: normalizedUserId },
      select: { id: true },
    });

    return {
      userId: normalizedUserId,
      available: !existingByUserId,
    };
  }

  private async generateUserId(companyCode?: string | null): Promise<string> {
    const prefix = (companyCode || 'USR').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6) || 'USR';

    while (true) {
      const candidate = `${prefix}-${randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`;
      const existing = await this.usersRepository.findOne({ where: { userId: candidate } });
      if (!existing) {
        return candidate;
      }
    }
  }

  async createUser(payload: CreateUserDto, actorRole = 'admin', actorCompanyId?: number | null) {
    const normalizedRole = (payload.role || 'user').trim().toLowerCase();
    const isSystemAdmin = normalizedRole === 'system_admin' || normalizedRole === 'admin';
    const actorIsSystemRole = isSystemRole(actorRole);

    const derivedRole = payload.userType === 'management' && normalizedRole === 'user' ? 'manager' : normalizedRole;
    const effectiveCompanyId = actorIsSystemRole ? payload.companyId : (actorCompanyId ?? undefined);

    if (!actorIsSystemRole && (isSystemRole(derivedRole) || derivedRole === 'company_admin')) {
      throw new BadRequestException('Company admin can only create company employee users');
    }

    if (!isSystemAdmin && !effectiveCompanyId) {
      throw new BadRequestException('Company is required for non-system users');
    }

    let company: Company | null = null;
    if (effectiveCompanyId) {
      company = await this.companiesRepository.findOne({ where: { id: effectiveCompanyId } });
      if (!company) {
        throw new NotFoundException('Company not found');
      }
    }

    const normalizedUserId = payload.userId?.trim().toUpperCase() || (await this.generateUserId(company?.code));
    const generatedEmail = payload.email?.trim().toLowerCase() || `${normalizedUserId.toLowerCase()}@local.pulsecontrol`;

    const existingByEmail = await this.usersRepository.findOne({ where: { email: generatedEmail } });
    if (existingByEmail) {
      throw new ConflictException('User with this email already exists');
    }

    const existingByUserId = await this.usersRepository.findOne({ where: { userId: normalizedUserId } });
    if (existingByUserId) {
      throw new ConflictException('User with this user ID already exists');
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = this.usersRepository.create({
      email: generatedEmail,
      userId: normalizedUserId,
      fullName: payload.fullName?.trim() || null,
      phoneNumber: payload.phoneNumber?.trim() || null,
      userCategory: payload.userCategory || 'general',
      generalCategory: payload.generalCategory?.trim() || null,
      userType: payload.userType || (derivedRole === 'manager' ? 'management' : 'executive'),
      passwordHash,
      role: derivedRole,
      isActive: true,
      companyId: isSystemAdmin ? null : (company?.id ?? null),
      company: isSystemAdmin ? null : company,
      moduleAccess: payload.moduleAccess ?? [],
    });

    const savedUser = await this.usersRepository.save(user);
    return {
      id: savedUser.id,
      email: savedUser.email,
      userId: savedUser.userId,
      fullName: savedUser.fullName,
      phoneNumber: savedUser.phoneNumber,
      userCategory: savedUser.userCategory,
      generalCategory: savedUser.generalCategory,
      userType: savedUser.userType,
      role: savedUser.role,
      isActive: savedUser.isActive,
      companyId: savedUser.companyId,
      companyName: company?.name ?? null,
      moduleAccess: savedUser.moduleAccess ?? [],
    };
  }

  async listUsers(options?: {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    companyId?: number;
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
    const requestedCompanyId = options?.companyId;
    const effectiveCompanyId = isSystemRole(actorRole) ? requestedCompanyId : actorCompanyId;

    const sortableColumns: Record<string, string> = {
      id: 'user.id',
      email: 'user.email',
      role: 'user.role',
      status: 'user.isActive',
      company: 'company.name',
      createdat: 'user.createdAt',
    };
    const orderColumn = sortableColumns[sortBy] || 'user.id';

    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.company', 'company')
      .orderBy(orderColumn, sortOrder)
      .addOrderBy('user.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (effectiveCompanyId === 0) {
      queryBuilder.andWhere('user.companyId IS NULL');
    } else if (effectiveCompanyId) {
      queryBuilder.andWhere('user.companyId = :companyId', { companyId: effectiveCompanyId });
    }

    if (search) {
      queryBuilder.andWhere(
        'LOWER(user.email) LIKE LOWER(:search) OR LOWER(user.role) LIKE LOWER(:search) OR LOWER(COALESCE(company.name, \'\')) LIKE LOWER(:search)',
        {
          search: `%${search}%`,
        },
      );
    }

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      items: users.map((user) => ({
        id: user.id,
        email: user.email,
        userId: user.userId,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        userCategory: user.userCategory,
        generalCategory: user.generalCategory,
        userType: user.userType,
        role: user.role,
        isActive: user.isActive,
        companyId: user.companyId,
        companyName: user.company?.name ?? null,
        moduleAccess: user.moduleAccess ?? [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      total,
      page,
      limit,
      sortBy,
      sortOrder: sortOrder.toLowerCase(),
    };
  }

  async setUserActive(
    id: number,
    isActive: boolean,
    actorEmail?: string,
    actorRole = 'admin',
    actorCompanyId?: number | null,
  ) {
    const user = await this.usersRepository.findOne({ where: { id }, relations: ['company'] });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const actorIsSystemRole = isSystemRole(actorRole);
    if (!actorIsSystemRole && actorCompanyId && user.companyId !== actorCompanyId) {
      throw new UnauthorizedException('You can only manage users in your own company');
    }

    if (!actorIsSystemRole && user.role.toLowerCase() === 'company_admin') {
      throw new BadRequestException('Company admin can only manage company employee users');
    }

    if (!isActive && actorEmail && actorEmail.toLowerCase() === user.email.toLowerCase()) {
      throw new ConflictException('You cannot deactivate your own account');
    }

    user.isActive = isActive;
    const savedUser = await this.usersRepository.save(user);
    return {
      id: savedUser.id,
      email: savedUser.email,
      userId: savedUser.userId,
      fullName: savedUser.fullName,
      phoneNumber: savedUser.phoneNumber,
      userCategory: savedUser.userCategory,
      generalCategory: savedUser.generalCategory,
      userType: savedUser.userType,
      role: savedUser.role,
      isActive: savedUser.isActive,
      companyId: savedUser.companyId,
      companyName: savedUser.company?.name ?? null,
      moduleAccess: savedUser.moduleAccess ?? [],
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
    };
  }

  async resetUserPassword(
    id: number,
    newPassword: string,
    actorRole = 'admin',
    actorCompanyId?: number | null,
  ) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const actorIsSystemRole = isSystemRole(actorRole);
    if (!actorIsSystemRole && actorCompanyId && user.companyId !== actorCompanyId) {
      throw new UnauthorizedException('You can only reset passwords for users in your own company');
    }

    if (!actorIsSystemRole && user.role.toLowerCase() === 'company_admin') {
      throw new BadRequestException('Company admin can only reset passwords for company employee users');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    const savedUser = await this.usersRepository.save(user);

    return {
      id: savedUser.id,
      email: savedUser.email,
      userId: savedUser.userId,
      fullName: savedUser.fullName,
      phoneNumber: savedUser.phoneNumber,
      userCategory: savedUser.userCategory,
      generalCategory: savedUser.generalCategory,
      userType: savedUser.userType,
      role: savedUser.role,
      companyId: savedUser.companyId,
      passwordReset: true,
      updatedAt: savedUser.updatedAt,
    };
  }

  async updateUser(id: number, payload: UpdateUserDto, actorRole = 'admin', actorCompanyId?: number | null) {
    const user = await this.usersRepository.findOne({ where: { id }, relations: ['company'] });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!isSystemRole(actorRole) && actorCompanyId && user.companyId !== actorCompanyId) {
      throw new UnauthorizedException('You can only update users in your own company');
    }

    if (payload.email && payload.email !== user.email) {
      const existing = await this.usersRepository.findOne({ where: { email: payload.email } });
      if (existing && existing.id !== user.id) {
        throw new ConflictException('User with this email already exists');
      }
      user.email = payload.email;
    }

    const targetRole = payload.role ? payload.role.trim().toLowerCase() : user.role;
    const actorIsSystemRole = isSystemRole(actorRole);

    if (!actorIsSystemRole && (isSystemRole(targetRole) || targetRole === 'company_admin')) {
      throw new BadRequestException('Company admin can only assign employee roles');
    }

    const companyIdProvided = Object.prototype.hasOwnProperty.call(payload, 'companyId');
    const requestedCompanyId = actorIsSystemRole
      ? (companyIdProvided ? payload.companyId : user.companyId)
      : (actorCompanyId ?? user.companyId);
    const resolvedCompanyId = requestedCompanyId ?? null;

    if (!isSystemRole(targetRole) && !resolvedCompanyId) {
      throw new BadRequestException('Company is required for non-system users');
    }

    let company: Company | null = null;
    if (resolvedCompanyId) {
      company = await this.companiesRepository.findOne({ where: { id: resolvedCompanyId } });
      if (!company) {
        throw new NotFoundException('Company not found');
      }
    }

    if (payload.password) {
      user.passwordHash = await bcrypt.hash(payload.password, 10);
    }

    user.role = targetRole;
    user.companyId = resolvedCompanyId;
    user.company = company;
    if (Object.prototype.hasOwnProperty.call(payload, 'moduleAccess')) {
      user.moduleAccess = payload.moduleAccess ?? [];
    }

    const savedUser = await this.usersRepository.save(user);
    return {
      id: savedUser.id,
      email: savedUser.email,
      userId: savedUser.userId,
      fullName: savedUser.fullName,
      phoneNumber: savedUser.phoneNumber,
      userCategory: savedUser.userCategory,
      generalCategory: savedUser.generalCategory,
      userType: savedUser.userType,
      role: savedUser.role,
      isActive: savedUser.isActive,
      companyId: savedUser.companyId,
      companyName: savedUser.company?.name ?? null,
      moduleAccess: savedUser.moduleAccess ?? [],
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
    };
  }
}
