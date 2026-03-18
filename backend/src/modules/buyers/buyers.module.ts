import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Buyer } from './entities/buyer.entity';
import { BuyersController } from './buyers.controller';
import { BuyersService } from './buyers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Buyer])],
  controllers: [BuyersController],
  providers: [BuyersService],
  exports: [TypeOrmModule, BuyersService],
})
export class BuyersModule {}
