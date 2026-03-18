import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

@Entity({ name: 'buyers' })
export class Buyer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'company_id' })
  companyId!: number;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @Column()
  code!: string;

  @Column()
  name!: string;
}
