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

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'company_id', type: 'int', nullable: true })
  companyId!: number | null;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company!: Company | null;

  @Column({ name: 'created_by', type: 'int' })
  createdBy!: number;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status!: 'draft' | 'review';

  @Column({ name: 'order_info', type: 'jsonb' })
  orderInfo!: Record<string, unknown>;

  @Column({ name: 'master_target', type: 'jsonb' })
  masterTarget!: Record<string, number>;

  @Column({ type: 'jsonb' })
  deliveries!: unknown[];

  @Column({ name: 'target_total', type: 'int', default: 0 })
  targetTotal!: number;

  @Column({ name: 'actual_total', type: 'int', default: 0 })
  actualTotal!: number;

  @Column({ name: 'total_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalAmount!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
