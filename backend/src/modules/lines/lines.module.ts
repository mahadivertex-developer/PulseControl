import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionLine } from './entities/production-line.entity';
import { LinesController } from './lines.controller';
import { LinesService } from './lines.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductionLine])],
  controllers: [LinesController],
  providers: [LinesService],
  exports: [TypeOrmModule, LinesService],
})
export class LinesModule {}
