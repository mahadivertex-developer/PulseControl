import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { Unit } from '../../units/entities/unit.entity';

@Entity({ name: 'production_lines' })
export class ProductionLine {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'company_id' })
  companyId!: number;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @Column({ name: 'unit_id' })
  unitId!: number;

  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'unit_id' })
  unit!: Unit;

  @Column()
  code!: string;

  @Column()
  name!: string;
}
