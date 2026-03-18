import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar', name: 'username', nullable: true, unique: true })
  userId!: string | null;

  @Column({ type: 'varchar', name: 'full_name', nullable: true })
  fullName!: string | null;

  @Column({ type: 'varchar', name: 'phone_number', nullable: true })
  phoneNumber!: string | null;

  @Column({ type: 'varchar', name: 'user_category', nullable: true, default: 'general' })
  userCategory!: string | null;

  @Column({ type: 'varchar', name: 'general_category', nullable: true })
  generalCategory!: string | null;

  @Column({ type: 'varchar', name: 'user_type', nullable: true, default: 'executive' })
  userType!: string | null;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ default: 'admin' })
  role!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ name: 'company_id', type: 'int', nullable: true })
  companyId!: number | null;

  @Column({ name: 'module_access', type: 'simple-array', nullable: true })
  moduleAccess!: string[];

  @ManyToOne(() => Company, (company) => company.users, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company!: Company | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
